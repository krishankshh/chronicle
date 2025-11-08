"""Email helper utilities."""
from __future__ import annotations

import re
from typing import List, Sequence, Union

from flask import current_app
from flask_mail import Message

from app.extensions import mail

RecipientList = Union[str, Sequence[str]]


def _normalize_recipients(recipients: RecipientList | None) -> List[str]:
    if not recipients:
        return []
    if isinstance(recipients, str):
        values = [recipients]
    else:
        values = list(recipients)
    return [value.strip() for value in values if value and value.strip()]


def _render_template(template: str, **context) -> str:
    if not context:
        return template
    try:
        return template.format(**context)
    except KeyError as exc:  # pragma: no cover - defensive
        current_app.logger.error('Missing placeholder %s in email template.', exc)
        return template


def _strip_html(html: str) -> str:
    return re.sub(r'<[^>]+>', '', html)


def send_email(to: RecipientList, subject: str, template: str, **context) -> bool:
    """Send an HTML email using Flask-Mail."""
    recipients = _normalize_recipients(to)
    if not recipients:
        current_app.logger.warning('Email not sent because no recipients were supplied for "%s".', subject)
        return False

    if not current_app:
        return False

    body = _render_template(template, **context)
    msg = Message(
        subject=subject,
        recipients=recipients,
        sender=current_app.config.get('MAIL_DEFAULT_SENDER'),
    )
    msg.html = body
    msg.body = _strip_html(body)

    try:
        mail.send(msg)
        current_app.logger.info('Sent email "%s" to %s recipients.', subject, len(recipients))
        return True
    except Exception as exc:  # pragma: no cover - logging only
        current_app.logger.error('Failed to send email "%s": %s', subject, exc)
        return False


def send_welcome_email(student_email: str, student_name: str) -> bool:
    template = """
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Welcome to Chronicle College Social Network!</h2>
            <p>Dear {name},</p>
            <p>Your account has been successfully created. You can now login and access all features.</p>
            <p>Please keep your login credentials secure.</p>
            <br>
            <p>Best regards,<br>Chronicle College Administration</p>
        </body>
    </html>
    """
    return send_email(
        student_email,
        'Welcome to Chronicle College',
        template,
        name=student_name,
    )


def send_password_reset_email(email: str, reset_token: str, student_name: str) -> bool:
    template = """
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Password Reset Request</h2>
            <p>Dear {name},</p>
            <p>You have requested to reset your password. Use the following code to reset your password:</p>
            <h3 style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px;">
                {token}
            </h3>
            <p>This code will expire in 15 minutes.</p>
            <p>If you did not request this reset, please ignore this email.</p>
            <br>
            <p>Best regards,<br>Chronicle College Administration</p>
        </body>
    </html>
    """
    return send_email(
        email,
        'Password Reset Request - Chronicle College',
        template,
        name=student_name,
        token=reset_token,
    )


def send_certificate_issued_email(email: str, student_name: str, certificate_type: str) -> bool:
    template = """
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Certificate Issued</h2>
            <p>Dear {name},</p>
            <p>A <strong>{cert_type}</strong> has been issued to you.</p>
            <p>You can download your certificate by logging into your account and visiting the "My Certificates" section.</p>
            <br>
            <p>Best regards,<br>Chronicle College Administration</p>
        </body>
    </html>
    """
    return send_email(
        email,
        f'{certificate_type} Issued - Chronicle College',
        template,
        name=student_name,
        cert_type=certificate_type,
    )


def send_quiz_published_email(email: str, student_name: str, quiz_title: str, subject_name: str) -> bool:
    template = """
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>New Quiz Available</h2>
            <p>Dear {name},</p>
            <p>A new quiz "<strong>{quiz}</strong>" has been published for <strong>{subject}</strong>.</p>
            <p>Login to your account to attempt the quiz.</p>
            <br>
            <p>Best regards,<br>Chronicle College Administration</p>
        </body>
    </html>
    """
    return send_email(
        email,
        f'New Quiz: {quiz_title}',
        template,
        name=student_name,
        quiz=quiz_title,
        subject=subject_name,
    )


def send_notice_email(email: RecipientList, student_name: str, notice_title: str, notice_type: str) -> bool:
    template = """
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>New {type}: {title}</h2>
            <p>Dear {name},</p>
            <p>A new {type} has been posted on Chronicle College Social Network.</p>
            <p>Please login to view the complete details.</p>
            <br>
            <p>Best regards,<br>Chronicle College Administration</p>
        </body>
    </html>
    """
    return send_email(
        email,
        f'New {notice_type}: {notice_title}',
        template,
        name=student_name,
        title=notice_title,
        type=notice_type,
    )


def send_study_material_email(email: str, student_name: str, material_title: str, subject_name: str) -> bool:
    template = """
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>New Study Material Available</h2>
            <p>Dear {name},</p>
            <p>New study material "<strong>{material}</strong>" has been uploaded for <strong>{subject}</strong>.</p>
            <p>Login to download and access the material.</p>
            <br>
            <p>Best regards,<br>Chronicle College Administration</p>
        </body>
    </html>
    """
    return send_email(
        email,
        f'New Study Material: {material_title}',
        template,
        name=student_name,
        material=material_title,
        subject=subject_name,
    )


def send_discussion_reply_email(email: str, recipient_name: str, discussion_title: str, replier_name: str) -> bool:
    template = """
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>New Reply to Your Discussion</h2>
            <p>Dear {name},</p>
            <p><strong>{replier}</strong> just replied to your discussion "<strong>{title}</strong>".</p>
            <p>Login to Chronicle College to read the full response and continue the conversation.</p>
            <br>
            <p>Best regards,<br>Chronicle College Administration</p>
        </body>
    </html>
    """
    return send_email(
        email,
        f'New Reply: {discussion_title}',
        template,
        name=recipient_name,
        replier=replier_name,
        title=discussion_title,
    )
