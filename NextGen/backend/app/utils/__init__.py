"""Utility modules."""
from app.utils.decorators import student_required, staff_required, admin_required
from app.utils.file_handler import FileHandler
from app.utils.email import (
    send_email,
    send_welcome_email,
    send_password_reset_email,
    send_certificate_issued_email,
    send_quiz_published_email,
    send_notice_email,
    send_study_material_email,
    send_discussion_reply_email,
)
from app.utils.notification_helpers import (
    resolve_course_name,
    resolve_subject_name,
    get_student_recipients,
    get_staff_recipients,
    get_account_contact,
    combine_recipients,
)
from app.utils.pdf_generator import (
    CertificatePDF,
    generate_student_report_pdf,
    generate_study_material_pdf,
)

__all__ = [
    'student_required',
    'staff_required',
    'admin_required',
    'FileHandler',
    'send_email',
    'send_welcome_email',
    'send_password_reset_email',
    'send_certificate_issued_email',
    'send_quiz_published_email',
    'send_notice_email',
    'send_study_material_email',
    'send_discussion_reply_email',
    'resolve_course_name',
    'resolve_subject_name',
    'get_student_recipients',
    'get_staff_recipients',
    'get_account_contact',
    'combine_recipients',
    'CertificatePDF',
    'generate_student_report_pdf',
    'generate_study_material_pdf',
]
