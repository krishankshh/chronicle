"""Study material management endpoints."""
import io
import os
import uuid
import zipfile

from flask import request, current_app, send_file
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt
from werkzeug.datastructures import FileStorage

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

from app.db import get_db
from app.models.material import StudyMaterialHelper
from app.utils.decorators import staff_required
from app.utils.file_handler import FileHandler
from app.utils.email import send_study_material_email
from app.utils.notification_helpers import (
    resolve_course_name,
    resolve_subject_name,
    get_student_recipients,
)

api = Namespace('materials', description='Study material operations')


attachment_model = api.model('MaterialAttachment', {
    'id': fields.String(description='Attachment ID'),
    'name': fields.String(description='Stored file name'),
    'original_name': fields.String(description='Original upload name'),
    'path': fields.String(description='Relative file path'),
    'file_url': fields.String(description='Accessible download URL'),
    'content_type': fields.String(description='MIME type'),
    'file_size': fields.Integer(description='File size in bytes'),
    'download_count': fields.Integer(description='Number of downloads'),
    'uploaded_at': fields.String(description='Upload timestamp (ISO8601)'),
})

material_model = api.model('StudyMaterial', {
    'id': fields.String(description='Material ID'),
    'title': fields.String(description='Title'),
    'description': fields.String(description='Rich text description'),
    'course_id': fields.String(description='Related course ID'),
    'subject_id': fields.String(description='Related subject ID'),
    'semester': fields.Integer(description='Semester number'),
    'tags': fields.List(fields.String, description='Tags'),
    'attachments': fields.List(fields.Nested(attachment_model)),
    'download_count': fields.Integer(description='Total downloads'),
    'created_at': fields.String(description='Created timestamp'),
    'updated_at': fields.String(description='Updated timestamp'),
    'created_by': fields.String(description='Created by user'),
    'updated_by': fields.String(description='Last updated by user'),
})

material_list_model = api.model('MaterialList', {
    'success': fields.Boolean(),
    'page': fields.Integer(),
    'limit': fields.Integer(),
    'total': fields.Integer(),
    'materials': fields.List(fields.Nested(material_model)),
})

material_create_model = api.model('MaterialCreate', {
    'title': fields.String(required=True, description='Material title'),
    'description': fields.String(description='Rich text description'),
    'course_id': fields.String(description='Course association ID'),
    'subject_id': fields.String(description='Subject association ID'),
    'semester': fields.Integer(description='Semester number'),
    'tags': fields.List(fields.String, description='Tags/keywords'),
})

material_update_model = api.clone('MaterialUpdate', material_create_model)

file_upload_parser = api.parser()
file_upload_parser.add_argument(
    'files',
    location='files',
    type=FileStorage,
    action='append',
    required=True,
    help='One or more document files (PDF, DOCX, RTF, etc.)'
)

ALLOWED_DOCUMENT_TYPES = FileHandler.ALLOWED_DOCUMENT_EXTENSIONS
MAX_FILE_SIZE_MB = 20


def _scan_file(file_bytes):
    """Placeholder virus scan - integrate with actual scanner as needed."""
    # In production, integrate with a security scanner (e.g., ClamAV, VirusTotal API).
    return True


def _validate_file(file_storage):
    if not file_storage or not file_storage.filename:
        return False, 'File is required.'

    if not FileHandler.allowed_file(file_storage.filename, file_type='document'):
        return False, 'Unsupported file type. Allowed: pdf, doc, docx, rtf.'

    file_storage.stream.seek(0, os.SEEK_END)
    size_mb = file_storage.tell() / (1024 * 1024)
    file_storage.stream.seek(0)
    if size_mb > MAX_FILE_SIZE_MB:
        return False, f'File size exceeds {MAX_FILE_SIZE_MB}MB limit.'

    return True, None


def _material_to_dict(material):
    return StudyMaterialHelper.to_dict(material)


def _notify_material_upload(db, material):
    if not material:
        return

    course_name = resolve_course_name(db, material.get('course_id'))
    subject_name = resolve_subject_name(db, material.get('subject_id'))
    semester = material.get('semester')

    recipients = get_student_recipients(
        db,
        course_name=course_name,
        semester=semester,
        fallback_to_all=True,
    )
    if not recipients:
        current_app.logger.info(
            'No recipients found for study material notification "%s".',
            material.get('title'),
        )
        return

    subject_label = subject_name or course_name or 'your course'
    title = material.get('title', 'Study Material')
    for recipient in recipients:
        send_study_material_email(
            recipient['email'],
            recipient.get('name', 'Student'),
            title,
            subject_label,
        )


@api.route('')
@api.route('/')
class MaterialList(Resource):
    """List or create study materials."""

    @api.doc('list_materials', params={
        'page': 'Page number (default 1)',
        'limit': 'Items per page (default 20)',
        'course_id': 'Filter by course ID',
        'subject_id': 'Filter by subject ID',
        'semester': 'Filter by semester number',
        'search': 'Search in title or description',
    })
    @api.marshal_with(material_list_model)
    def get(self):
        """Retrieve materials with optional filtering."""
        db = get_db()
        args = request.args

        try:
            page = max(int(args.get('page', 1)), 1)
        except (TypeError, ValueError):
            page = 1

        try:
            limit = min(max(int(args.get('limit', 20)), 1), 100)
        except (TypeError, ValueError):
            limit = 20

        filters = {}
        course_id = args.get('course_id')
        subject_id = args.get('subject_id')
        semester = args.get('semester')
        search = args.get('search')

        if course_id:
            filters['course_id'] = StudyMaterialHelper._to_object_id(course_id)
        if subject_id:
            filters['subject_id'] = StudyMaterialHelper._to_object_id(subject_id)
        if semester:
            try:
                filters['semester'] = int(semester)
            except ValueError:
                api.abort(400, 'semester must be an integer.')

        filters = {k: v for k, v in filters.items() if v is not None}

        total, items = StudyMaterialHelper.list_materials(
            db,
            filters=filters,
            page=page,
            limit=limit,
            sort=[('created_at', -1)],
            search=search
        )

        return {
            'success': True,
            'page': page,
            'limit': limit,
            'total': total,
            'materials': [_material_to_dict(item) for item in items],
        }

    @api.expect(material_create_model)
    @api.marshal_with(material_model)
    @jwt_required()
    @staff_required
    def post(self):
        """Create a new study material."""
        data = request.get_json() or {}
        title = (data.get('title') or '').strip()

        if not title:
            api.abort(400, 'Title is required.')

        if data.get('semester') is not None:
            try:
                semester_value = int(data['semester'])
                if semester_value < 1:
                    raise ValueError
            except ValueError:
                api.abort(400, 'Semester must be a positive integer.')
        else:
            semester_value = None

        claims = get_jwt()
        created_by = claims.get('user_id')

        db = get_db()
        material = StudyMaterialHelper.create_material(
            db,
            title=title,
            description=data.get('description'),
            course_id=data.get('course_id'),
            subject_id=data.get('subject_id'),
            semester=semester_value,
            tags=data.get('tags') or [],
            created_by=created_by
        )

        _notify_material_upload(db, material)

        return _material_to_dict(material), 201


@api.route('/<string:material_id>')
class MaterialDetail(Resource):
    """Retrieve, update, or delete a study material."""

    @api.marshal_with(material_model)
    def get(self, material_id):
        material = StudyMaterialHelper.find_by_id(get_db(), material_id)
        if not material:
            api.abort(404, 'Material not found.')
        return _material_to_dict(material)

    @api.expect(material_update_model)
    @api.marshal_with(material_model)
    @jwt_required()
    @staff_required
    def put(self, material_id):
        db = get_db()
        material = StudyMaterialHelper.find_by_id(db, material_id)
        if not material:
            api.abort(404, 'Material not found.')

        data = request.get_json() or {}
        update_data = {}

        if 'title' in data:
            title = (data.get('title') or '').strip()
            if not title:
                api.abort(400, 'Title cannot be empty.')
            update_data['title'] = title

        if 'description' in data:
            update_data['description'] = data.get('description')

        if 'course_id' in data:
            update_data['course_id'] = StudyMaterialHelper._to_object_id(data.get('course_id'))

        if 'subject_id' in data:
            update_data['subject_id'] = StudyMaterialHelper._to_object_id(data.get('subject_id'))

        if 'semester' in data:
            if data['semester'] is None or data['semester'] == '':
                update_data['semester'] = None
            else:
                try:
                    semester_value = int(data['semester'])
                    if semester_value < 1:
                        raise ValueError
                    update_data['semester'] = semester_value
                except ValueError:
                    api.abort(400, 'Semester must be a positive integer.')

        if 'tags' in data:
            update_data['tags'] = data.get('tags') or []

        claims = get_jwt()
        updated_by = claims.get('user_id')

        updated = StudyMaterialHelper.update_material(db, material_id, update_data, updated_by=updated_by)
        if not updated:
            api.abort(404, 'Material not found.')

        return _material_to_dict(updated)

    @jwt_required()
    @staff_required
    def delete(self, material_id):
        db = get_db()
        material = StudyMaterialHelper.find_by_id(db, material_id)
        if not material:
            api.abort(404, 'Material not found.')

        # Delete attachment files from storage
        for attachment in material.get('attachments', []):
            path = attachment.get('path')
            if path and path.startswith('/uploads/'):
                file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], path.replace('/uploads/', ''))
                FileHandler.delete_file(file_path)

        success = StudyMaterialHelper.delete_material(db, material_id)
        if not success:
            api.abort(404, 'Material not found.')

        return {'success': True, 'message': 'Material deleted successfully.'}, 200


@api.route('/<string:material_id>/files')
class MaterialAttachments(Resource):
    """Manage material attachments."""

    @api.expect(file_upload_parser)
    @api.marshal_with(material_model)
    @jwt_required()
    @staff_required
    def post(self, material_id):
        """Upload one or more document attachments."""
        db = get_db()
        material = StudyMaterialHelper.find_by_id(db, material_id)
        if not material:
            api.abort(404, 'Material not found.')

        files = request.files.getlist('files')
        if not files:
            api.abort(400, 'At least one file is required.')

        upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'materials')
        os.makedirs(upload_folder, exist_ok=True)

        attachments = []
        for file_storage in files:
            is_valid, error = _validate_file(file_storage)
            if not is_valid:
                api.abort(400, error)

            # Read file for scanning
            file_bytes = file_storage.read()
            if not _scan_file(file_bytes):
                api.abort(400, f'{file_storage.filename} failed security scan.')

            file_storage.stream = io.BytesIO(file_bytes)
            filename = FileHandler.generate_filename(file_storage.filename)
            saved_name = FileHandler.save_local_file(file_storage, upload_folder, filename=filename)

            attachment_id = str(uuid.uuid4())
            attachments.append({
                'id': attachment_id,
                'name': saved_name,
                'original_name': file_storage.filename,
                'path': f"/uploads/materials/{saved_name}",
                'content_type': file_storage.mimetype,
                'file_size': len(file_bytes),
            })

        updated = StudyMaterialHelper.add_attachments(db, material_id, attachments)
        if not updated:
            api.abort(404, 'Material not found.')

        return _material_to_dict(updated), 201


@api.route('/<string:material_id>/files/<string:attachment_id>')
class MaterialAttachmentDetail(Resource):
    """Download or delete a single attachment."""

    def get(self, material_id, attachment_id):
        """Download attachment file."""
        db = get_db()
        material = StudyMaterialHelper.find_by_id(db, material_id)
        if not material:
            api.abort(404, 'Material not found.')

        attachment = next((a for a in material.get('attachments', []) if a.get('id') == attachment_id), None)
        if not attachment:
            api.abort(404, 'Attachment not found.')

        path = attachment.get('path')
        if not path:
            api.abort(404, 'Attachment path missing.')

        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], path.replace('/uploads/', ''))
        if not os.path.exists(file_path):
            api.abort(404, 'Attachment file missing on server.')

        StudyMaterialHelper.increment_download_count(db, material_id, attachment_id=attachment_id)

        return send_file(
            file_path,
            as_attachment=True,
            download_name=attachment.get('original_name') or os.path.basename(file_path),
            mimetype=attachment.get('content_type') or 'application/octet-stream'
        )

    @jwt_required()
    @staff_required
    def delete(self, material_id, attachment_id):
        """Remove an attachment from material."""
        db = get_db()
        material = StudyMaterialHelper.find_by_id(db, material_id)
        if not material:
            api.abort(404, 'Material not found.')

        attachment = next((a for a in material.get('attachments', []) if a.get('id') == attachment_id), None)
        if not attachment:
            api.abort(404, 'Attachment not found.')

        path = attachment.get('path')
        if path and path.startswith('/uploads/'):
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], path.replace('/uploads/', ''))
            FileHandler.delete_file(file_path)

        updated = StudyMaterialHelper.remove_attachment(db, material_id, attachment_id)
        if not updated:
            api.abort(404, 'Material not found.')

        return _material_to_dict(updated)


@api.route('/<string:material_id>/download')
class MaterialDownload(Resource):
    """Download attachments bundle or PDF export."""

    @api.doc(params={'format': "Download format ('files' or 'pdf'). Default is 'files'."})
    def get(self, material_id):
        db = get_db()
        material = StudyMaterialHelper.find_by_id(db, material_id)
        if not material:
            api.abort(404, 'Material not found.')

        download_format = request.args.get('format', 'files').lower()

        if download_format == 'pdf':
            return self._export_pdf(material_id, material)

        attachments = material.get('attachments', [])
        if not attachments:
            api.abort(404, 'No attachments available to download.')

        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zip_buffer:
            for attachment in attachments:
                path = attachment.get('path')
                if not path:
                    continue
                file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], path.replace('/uploads/', ''))
                if not os.path.exists(file_path):
                    continue
                arcname = attachment.get('original_name') or os.path.basename(file_path)
                zip_buffer.write(file_path, arcname=arcname)

        buffer.seek(0)
        StudyMaterialHelper.increment_download_count(db, material_id)

        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"{material.get('title', 'study-material')}.zip",
            mimetype='application/zip'
        )

    def _export_pdf(self, material_id, material):
        """Export material summary as PDF."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, title=material.get('title', 'Study Material'))
        styles = getSampleStyleSheet()
        story = []

        story.append(Paragraph(material.get('title', 'Study Material'), styles['Title']))
        story.append(Spacer(1, 12))

        metadata_rows = []
        if material.get('semester'):
            metadata_rows.append(['Semester', str(material['semester'])])
        if material.get('course_id'):
            metadata_rows.append(['Course ID', str(material['course_id'])])
        if material.get('subject_id'):
            metadata_rows.append(['Subject ID', str(material['subject_id'])])
        if metadata_rows:
            table = Table(metadata_rows, hAlign='LEFT')
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.grey),
                ('BOX', (0, 0), (-1, -1), 0.25, colors.grey),
            ]))
            story.append(table)
            story.append(Spacer(1, 12))

        description = material.get('description')
        if description:
            story.append(Paragraph('Description', styles['Heading2']))
            story.append(Spacer(1, 6))
            story.append(Paragraph(description, styles['BodyText']))
            story.append(Spacer(1, 12))

        attachments = material.get('attachments', [])
        if attachments:
            story.append(Paragraph('Attachments', styles['Heading2']))
            story.append(Spacer(1, 6))
            attachment_rows = [['File name', 'Size (KB)', 'Downloads']]
            for attachment in attachments:
                size_kb = round((attachment.get('file_size', 0) or 0) / 1024, 2)
                attachment_rows.append([
                    attachment.get('original_name') or attachment.get('name'),
                    str(size_kb),
                    str(attachment.get('download_count', 0)),
                ])
            table = Table(attachment_rows, hAlign='LEFT')
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.grey),
                ('BOX', (0, 0), (-1, -1), 0.25, colors.grey),
            ]))
            story.append(table)

        doc.build(story)
        buffer.seek(0)

        StudyMaterialHelper.increment_download_count(get_db(), material_id)

        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"{material.get('title', 'study-material')}.pdf",
            mimetype='application/pdf'
        )
