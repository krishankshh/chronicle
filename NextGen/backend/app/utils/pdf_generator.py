"""PDF generation utilities for certificates, reports, and materials."""
from __future__ import annotations

import os
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


class CertificatePDF:
    """Generate branded certificates."""

    def __init__(self, output_path: str, page_size=A4):
        self.output_path = output_path
        self.page_size = page_size
        self.width, self.height = page_size

    def _draw_border(self, c):
        c.setStrokeColor(colors.HexColor('#1e40af'))
        c.setLineWidth(3)
        c.rect(0.5 * inch, 0.5 * inch, self.width - inch, self.height - inch)
        c.setLineWidth(1)
        c.rect(0.75 * inch, 0.75 * inch, self.width - 1.5 * inch, self.height - 1.5 * inch)

    def _draw_logo(self, c, logo_path='static/logo.png'):
        if os.path.exists(logo_path):
            c.drawImage(
                logo_path,
                self.width / 2 - 1 * inch,
                self.height - 2.5 * inch,
                width=2 * inch,
                height=1 * inch,
                preserveAspectRatio=True,
                mask='auto',
            )

    def generate(self, student_name, roll_no, course, certificate_type, issue_date, certificate_id):
        """Render the certificate PDF."""
        c = canvas.Canvas(self.output_path, pagesize=self.page_size)
        self._draw_border(c)
        self._draw_logo(c)

        c.setFont('Helvetica-Bold', 24)
        c.drawCentredString(self.width / 2, self.height - 3 * inch, 'CHRONICLE COLLEGE')

        c.setFont('Helvetica', 14)
        c.drawCentredString(self.width / 2, self.height - 3.5 * inch, 'College Social Network')

        c.setFont('Helvetica-Bold', 18)
        c.drawCentredString(self.width / 2, self.height - 4.5 * inch, certificate_type.upper())

        c.setStrokeColor(colors.HexColor('#1e40af'))
        c.setLineWidth(2)
        c.line(2 * inch, self.height - 4.75 * inch, self.width - 2 * inch, self.height - 4.75 * inch)

        c.setFont('Helvetica', 12)
        y = self.height - 5.5 * inch
        c.drawString(2 * inch, y, 'This is to certify that')
        c.setFont('Helvetica-Bold', 14)
        c.drawString(2 * inch, y - 0.5 * inch, f'Name: {student_name}')

        c.setFont('Helvetica', 12)
        c.drawString(2 * inch, y - 1 * inch, f'Roll Number: {roll_no}')
        c.drawString(2 * inch, y - 1.5 * inch, f'Course: {course}')

        c.drawString(2 * inch, y - 2.25 * inch, 'has been a student of this institution and has maintained good')
        c.drawString(2 * inch, y - 2.65 * inch, 'conduct and character during the period of study.')

        issue = issue_date
        if isinstance(issue_date, str):
            try:
                issue = datetime.fromisoformat(issue_date)
            except ValueError:
                issue = None
        formatted_date = issue.strftime('%B %d, %Y') if isinstance(issue, datetime) else str(issue_date)

        c.drawString(2 * inch, y - 3.5 * inch, f'Issue Date: {formatted_date}')
        c.setFont('Helvetica', 9)
        c.drawString(2 * inch, y - 4 * inch, f'Certificate ID: {certificate_id}')

        c.setFont('Helvetica', 11)
        c.drawString(self.width - 3.5 * inch, 2 * inch, 'Authorized Signature')
        c.line(self.width - 4 * inch, 2.25 * inch, self.width - 1.5 * inch, 2.25 * inch)
        c.setFont('Helvetica-Bold', 10)
        c.drawString(self.width - 3.75 * inch, 1.5 * inch, 'Principal')
        c.drawString(self.width - 4 * inch, 1.25 * inch, 'Chronicle College')

        c.setFont('Helvetica', 8)
        c.drawCentredString(
            self.width / 2,
            0.75 * inch,
            'This is a computer-generated certificate and does not require a signature.',
        )

        c.save()
        return self.output_path


def _build_table(data, header_bg='#1e40af'):
    table = Table(data, colWidths=[3 * inch, 1 * inch, 1.25 * inch, 1.25 * inch])
    table.setStyle(
        TableStyle(
            [
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(header_bg)),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )
    return table


def generate_student_report_pdf(student_data, quiz_results, attendance_data, output_path):
    """Build a comprehensive performance PDF."""
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e40af'),
        alignment=TA_CENTER,
        spaceAfter=20,
    )
    story.append(Paragraph('Chronicle College', title_style))
    story.append(Paragraph('Student Performance Report', styles['Heading2']))
    story.append(Spacer(1, 0.25 * inch))

    info_data = [
        ['Name:', student_data.get('name')],
        ['Roll Number:', student_data.get('roll_no')],
        ['Course:', student_data.get('course')],
        ['Semester:', str(student_data.get('semester'))],
        ['Batch:', student_data.get('batch', 'N/A')],
    ]
    info_table = Table(info_data, colWidths=[2 * inch, 4 * inch])
    info_table.setStyle(
        TableStyle(
            [
                ('FONT', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ]
        )
    )
    story.append(info_table)
    story.append(Spacer(1, 0.2 * inch))

    if quiz_results:
        story.append(Paragraph('Quiz Performance', styles['Heading3']))
        header = ['Quiz Title', 'Score', 'Percentage', 'Date']
        rows = [
            [
                result['quiz_title'],
                f"{result['score']}/{result['total_marks']}",
                f"{result['percentage']}%",
                result['date'],
            ]
            for result in quiz_results
        ]
        quiz_table = _build_table([header, *rows])
        story.append(quiz_table)
        story.append(Spacer(1, 0.2 * inch))
        avg = sum(result['percentage'] for result in quiz_results) / len(quiz_results)
        story.append(Paragraph(f'<b>Average Performance:</b> {avg:.2f}%', styles['Normal']))

    if attendance_data:
        story.append(Spacer(1, 0.2 * inch))
        story.append(Paragraph('Attendance Summary', styles['Heading3']))
        for item in attendance_data:
            story.append(Paragraph(f"- {item}", styles['Normal']))

    doc.build(story)
    return output_path


def generate_study_material_pdf(content, title, subject, course, output_path):
    """Convert study material text into a branded PDF."""
    doc = SimpleDocTemplate(output_path, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'MaterialTitle',
        parent=styles['Title'],
        fontSize=20,
        textColor=colors.HexColor('#1e40af'),
    )
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph(f'<b>Subject:</b> {subject}', styles['Normal']))
    story.append(Paragraph(f'<b>Course:</b> {course}', styles['Normal']))
    story.append(Spacer(1, 0.2 * inch))

    for paragraph in content.split('\n'):
        if paragraph.strip():
            story.append(Paragraph(paragraph.strip(), styles['BodyText']))
            story.append(Spacer(1, 0.1 * inch))

    doc.build(story)
    return output_path
