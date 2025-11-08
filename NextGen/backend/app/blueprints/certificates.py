"""Certificate management endpoints."""
import os
from datetime import datetime

from flask import current_app, request, send_file
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import get_jwt, jwt_required
from bson import ObjectId
from bson.errors import InvalidId

from app.db import get_db
from app.models.certificate import CertificateHelper, CertificateTypeHelper
from app.utils.decorators import admin_required, staff_required, student_required
from app.utils.pdf_generator import CertificatePDF
from app.utils.email import send_certificate_issued_email

api = Namespace('certificates', description='Certificate management operations')


certificate_type_model = api.model('CertificateType', {
    'id': fields.String(description='Certificate type ID'),
    'certificate_type': fields.String(required=True, description='Display name'),
    'description': fields.String(description='Description'),
    'status': fields.String(description='Active/Inactive'),
    'created_at': fields.String(description='Created timestamp'),
    'updated_at': fields.String(description='Updated timestamp'),
})

certificate_model = api.model('Certificate', {
    'id': fields.String(description='Certificate ID'),
    'student_id': fields.String(description='Student ID'),
    'certificate_type_id': fields.String(description='Certificate type ID'),
    'issue_date': fields.String(description='Issue date (ISO string)'),
    'certificate_file': fields.String(description='Certificate file path'),
    'remarks': fields.String(description='Remarks'),
    'status': fields.String(description='Certificate status'),
    'student_name': fields.String(description='Student display name'),
    'roll_no': fields.String(description='Student roll number'),
    'course': fields.String(description='Course name'),
    'certificate_type_name': fields.String(description='Certificate type display name'),
    'created_at': fields.String(description='Created timestamp'),
    'updated_at': fields.String(description='Updated timestamp'),
})


def _parse_object_id(value, field_name):
    if not value:
        return None
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        api.abort(400, f'Invalid {field_name}')


def _parse_issue_date(value):
    if isinstance(value, datetime):
        return value
    if not value:
        return None
    if isinstance(value, str):
        cleaned = value.strip()
        if not cleaned:
            return None
        try:
            parsed = datetime.fromisoformat(cleaned)
        except ValueError:
            try:
                parsed = datetime.strptime(cleaned, '%Y-%m-%d')
            except ValueError:
                api.abort(400, 'issue_date must be a valid ISO date (YYYY-MM-DD)')
        if parsed.tzinfo:
            parsed = parsed.replace(tzinfo=None)
        return parsed
    api.abort(400, 'issue_date must be a valid ISO date (YYYY-MM-DD)')


def _populate_certificates(db, certificates):
    """Attach student and certificate type information."""
    if not certificates:
        return []

    student_ids = {cert.get('student_id') for cert in certificates if cert.get('student_id')}
    type_ids = {cert.get('certificate_type_id') for cert in certificates if cert.get('certificate_type_id')}

    students = {}
    if student_ids:
        for doc in db.students.find({'_id': {'$in': list(student_ids)}}):
            students[doc['_id']] = doc

    cert_types = {}
    if type_ids:
        for doc in db.certificate_types.find({'_id': {'$in': list(type_ids)}}):
            cert_types[doc['_id']] = doc

    return [
        CertificateHelper.to_dict(
            certificate,
            student=students.get(certificate.get('student_id')),
            certificate_type=cert_types.get(certificate.get('certificate_type_id')),
        )
        for certificate in certificates
    ]


@api.route('/types')
class CertificateTypeList(Resource):
    """Certificate type collection operations."""

    @api.doc('list_certificate_types', params={'status': 'Filter by status'})
    @jwt_required()
    def get(self):
        """List certificate types."""
        status = request.args.get('status')
        db = get_db()
        items = CertificateTypeHelper.find_all(db, status=status)
        serialized = [CertificateTypeHelper.to_dict(item) for item in items]
        return {
            'success': True,
            'count': len(serialized),
            'certificate_types': serialized,
        }, 200

    @api.doc('create_certificate_type')
    @api.expect(certificate_type_model, validate=False)
    @jwt_required()
    @admin_required
    def post(self):
        """Create a new certificate type."""
        data = request.get_json() or {}
        certificate_type = (data.get('certificate_type') or '').strip()
        description = data.get('description', '').strip()

        if not certificate_type:
            return {'success': False, 'message': 'certificate_type is required'}, 400

        db = get_db()
        existing = db.certificate_types.find_one({'certificate_type': certificate_type})
        if existing:
            return {'success': False, 'message': 'Certificate type already exists'}, 400

        created = CertificateTypeHelper.create_certificate_type(
            db,
            certificate_type=certificate_type,
            description=description,
            status=data.get('status', 'Active')
        )

        return {
            'success': True,
            'message': 'Certificate type created',
            'certificate_type': CertificateTypeHelper.to_dict(created),
        }, 201


@api.route('/types/<string:type_id>')
class CertificateTypeDetail(Resource):
    """Single certificate type operations."""

    @api.doc('update_certificate_type')
    @api.expect(certificate_type_model, validate=False)
    @jwt_required()
    @admin_required
    def put(self, type_id):
        """Update certificate type."""
        db = get_db()
        certificate_type = CertificateTypeHelper.find_by_id(db, type_id)
        if not certificate_type:
            return {'success': False, 'message': 'Certificate type not found'}, 404

        data = request.get_json() or {}
        updates = {}

        if 'certificate_type' in data:
            name = (data.get('certificate_type') or '').strip()
            if not name:
                return {'success': False, 'message': 'certificate_type cannot be empty'}, 400
            existing = db.certificate_types.find_one({
                'certificate_type': name,
                '_id': {'$ne': ObjectId(type_id)}
            })
            if existing:
                return {'success': False, 'message': 'Certificate type already exists'}, 400
            updates['certificate_type'] = name

        if 'description' in data:
            updates['description'] = data.get('description', '').strip()

        if 'status' in data and data['status']:
            updates['status'] = data['status']

        if not updates:
            return {'success': False, 'message': 'No valid fields to update'}, 400

        updated = CertificateTypeHelper.update_certificate_type(db, type_id, updates)
        return {
            'success': True,
            'message': 'Certificate type updated',
            'certificate_type': CertificateTypeHelper.to_dict(updated),
        }, 200

    @api.doc('delete_certificate_type')
    @jwt_required()
    @admin_required
    def delete(self, type_id):
        """Delete certificate type if unused."""
        db = get_db()
        certificate_type = CertificateTypeHelper.find_by_id(db, type_id)
        if not certificate_type:
            return {'success': False, 'message': 'Certificate type not found'}, 404

        cert_count = db.certificates.count_documents({'certificate_type_id': certificate_type['_id']})
        if cert_count > 0:
            return {
                'success': False,
                'message': f'Cannot delete. {cert_count} certificates use this type'
            }, 400

        CertificateTypeHelper.delete_certificate_type(db, type_id)
        return {'success': True, 'message': 'Certificate type deleted'}, 200


@api.route('')
class CertificateList(Resource):
    """Certificate collection operations."""

    @api.doc('list_certificates', params={
        'student_id': 'Filter by student ID',
        'certificate_type_id': 'Filter by certificate type ID',
        'status': 'Filter by status',
    })
    @jwt_required()
    @staff_required
    def get(self):
        """List certificates (staff/admin only)."""
        db = get_db()
        query = {}

        student_id = request.args.get('student_id')
        if student_id:
            query['student_id'] = _parse_object_id(student_id, 'student_id')

        certificate_type_id = request.args.get('certificate_type_id')
        if certificate_type_id:
            query['certificate_type_id'] = _parse_object_id(certificate_type_id, 'certificate_type_id')

        status = request.args.get('status')
        if status:
            query['status'] = status

        certificates = CertificateHelper.list_certificates(
            db,
            filters=query,
            sort=[('issue_date', -1), ('created_at', -1)]
        )
        serialized = _populate_certificates(db, certificates)
        return {
            'success': True,
            'count': len(serialized),
            'certificates': serialized,
        }, 200

    @api.doc('create_certificate')
    @api.expect(certificate_model, validate=False)
    @jwt_required()
    @staff_required
    def post(self):
        """Issue a certificate."""
        data = request.get_json() or {}
        student_id = data.get('student_id')
        certificate_type_id = data.get('certificate_type_id')
        issue_date_raw = data.get('issue_date')

        if not student_id or not certificate_type_id or not issue_date_raw:
            return {'success': False, 'message': 'student_id, certificate_type_id, and issue_date are required'}, 400

        db = get_db()
        try:
            student_oid = ObjectId(student_id)
        except (InvalidId, TypeError):
            return {'success': False, 'message': 'Invalid student_id'}, 400

        try:
            certificate_type_oid = ObjectId(certificate_type_id)
        except (InvalidId, TypeError):
            return {'success': False, 'message': 'Invalid certificate_type_id'}, 400

        student = db.students.find_one({'_id': student_oid})
        if not student:
            return {'success': False, 'message': 'Student not found'}, 404

        certificate_type = db.certificate_types.find_one({'_id': certificate_type_oid})
        if not certificate_type:
            return {'success': False, 'message': 'Certificate type not found'}, 404

        issue_date = _parse_issue_date(issue_date_raw)
        if not issue_date:
            return {'success': False, 'message': 'issue_date is required'}, 400

        certificate = CertificateHelper.create_certificate(
            db,
            student_id=student_oid,
            certificate_type_id=certificate_type_oid,
            issue_date=issue_date,
            certificate_file=data.get('certificate_file'),
            remarks=data.get('remarks'),
            status=data.get('status', 'Active')
        )

        serialized = CertificateHelper.to_dict(
            certificate,
            student=student,
            certificate_type=certificate_type
        )

        if student.get('email'):
            send_certificate_issued_email(
                student['email'],
                student.get('name', 'Student'),
                certificate_type.get('certificate_type', 'Certificate')
            )

        return {
            'success': True,
            'message': 'Certificate issued successfully',
            'certificate': serialized,
        }, 201


@api.route('/<string:certificate_id>')
class CertificateDetail(Resource):
    """Certificate detail access."""

    @api.doc('get_certificate')
    @jwt_required()
    def get(self, certificate_id):
        """Get certificate data."""
        db = get_db()
        try:
            certificate = CertificateHelper.find_by_id(db, certificate_id)
        except (InvalidId, TypeError):
            certificate = None

        if not certificate:
            return {'success': False, 'message': 'Certificate not found'}, 404

        claims = get_jwt()
        role = claims.get('role')
        user_id = claims.get('user_id')

        if role == 'student' and str(certificate.get('student_id')) != user_id:
            return {'success': False, 'message': 'Access denied'}, 403

        student = db.students.find_one({'_id': certificate.get('student_id')})
        certificate_type = db.certificate_types.find_one({'_id': certificate.get('certificate_type_id')})

        return {
            'success': True,
            'certificate': CertificateHelper.to_dict(
                certificate,
                student=student,
                certificate_type=certificate_type
            )
        }, 200


@api.route('/<string:certificate_id>/download')
class CertificateDownload(Resource):
    """Generate and download certificate PDF."""

    @api.doc('download_certificate')
    @jwt_required()
    def get(self, certificate_id):
        db = get_db()
        certificate = CertificateHelper.find_by_id(db, certificate_id)
        if not certificate:
            return {'success': False, 'message': 'Certificate not found'}, 404

        claims = get_jwt()
        if claims.get('role') == 'student' and str(certificate.get('student_id')) != claims.get('user_id'):
            return {'success': False, 'message': 'Access denied'}, 403

        student = db.students.find_one({'_id': certificate.get('student_id')})
        cert_type = db.certificate_types.find_one({'_id': certificate.get('certificate_type_id')})
        if not student or not cert_type:
            return {'success': False, 'message': 'Invalid certificate data'}, 400

        upload_folder = current_app.config['UPLOAD_FOLDER']
        cert_dir = os.path.join(upload_folder, 'certificates')
        os.makedirs(cert_dir, exist_ok=True)

        pdf_filename = f"certificate_{certificate_id}.pdf"
        pdf_path = os.path.join(cert_dir, pdf_filename)

        certificate_pdf = CertificatePDF(pdf_path)
        certificate_pdf.generate(
            student.get('name', 'Student'),
            student.get('roll_no', '-'),
            student.get('course', '-'),
            cert_type.get('certificate_type', 'Certificate'),
            certificate.get('issue_date'),
            certificate_id,
        )

        db.certificates.update_one(
            {'_id': certificate['_id']},
            {'$set': {'certificate_file': f"/uploads/certificates/{pdf_filename}"}}
        )

        download_name = f"{student.get('roll_no', 'certificate')}_{cert_type.get('certificate_type', 'Certificate')}.pdf"
        return send_file(pdf_path, as_attachment=True, download_name=download_name)


@api.route('/student/my-certificates')
class StudentCertificates(Resource):
    """Certificates for the authenticated student."""

    @api.doc('get_my_certificates')
    @jwt_required()
    @student_required
    def get(self):
        """Return certificates for the logged-in student."""
        claims = get_jwt()
        student_id = claims.get('user_id')
        db = get_db()

        certificates = CertificateHelper.find_by_student(db, student_id)
        serialized = _populate_certificates(db, certificates)

        return {
            'success': True,
            'count': len(serialized),
            'certificates': serialized,
        }, 200
