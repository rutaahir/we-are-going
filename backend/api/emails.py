import logging
import os
from django.core.mail import EmailMultiAlternatives
from django.template import Template, Context
from django.utils.html import strip_tags
from .models import EmailTemplate, EmailLog

logger = logging.getLogger(__name__)

# Master layout that wraps all email content for branding and responsiveness
MASTER_HTML_LAYOUT = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ subject }}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F9FAFB; margin: 0; padding: 0; color: #1F2937; -webkit-font-smoothing: antialiased; }
    .email-container { max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); border: 1px solid #E5E7EB; }
    .email-header { background: linear-gradient(135deg, #1B4FD8 0%, #C9860A 100%); padding: 32px; text-align: center; color: white; }
    .email-header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.025em; text-transform: uppercase; }
    .email-body { padding: 40px 32px; line-height: 1.6; }
    .email-body p { margin-top: 0; margin-bottom: 16px; font-size: 16px; color: #374151; }
    .email-footer { background-color: #F3F4F6; padding: 24px 32px; text-align: center; font-size: 13px; color: #6B7280; border-top: 1px solid #E5E7EB; }
    .button { display: inline-block; padding: 12px 28px; background-color: #1B4FD8; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 8px; font-size: 14px; text-align: center; box-shadow: 0 2px 4px rgba(27,79,216,0.2); }
    .highlight-box { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .highlight-box table { width: 100%; border-collapse: collapse; }
    .highlight-box td { padding: 8px 0; font-size: 14px; border-bottom: 1px solid #F3F4F6; }
    .highlight-box tr:last-child td { border-bottom: none; }
    .highlight-box td.label { font-weight: 600; color: #4B5563; width: 40%; vertical-align: top; }
    .highlight-box td.value { color: #1F2937; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>We Are Going</h1>
    </div>
    <div class="email-body">
      {{ body_content|safe }}
    </div>
    <div class="email-footer">
      <p>This email was sent to {{ recipient }}.</p>
      <p>&copy; 2026 We Are Going. All rights reserved.</p>
      <p>Support: <a href="mailto:support@wearegoing.in" style="color: #1B4FD8; text-decoration: none; font-weight: 500;">support@wearegoing.in</a></p>
    </div>
  </div>
</body>
</html>
"""

# Default template configurations
DEFAULT_TEMPLATES = {
    'community_registration_submitted': {
        'subject': 'Community Registration Submitted Successfully',
        'html_content': """<p>Hello,</p>
<p>Your community registration has been submitted successfully and is currently under review.</p>
<div class="highlight-box">
  <table>
    <tr><td class="label">Community Name:</td><td class="value">{{ community_name }}</td></tr>
    <tr><td class="label">Registration Type:</td><td class="value">{{ community_type }}</td></tr>
    <tr><td class="label">Current Status:</td><td class="value">Pending Super Admin Approval</td></tr>
  </table>
</div>
<p>You will receive further updates via email.</p>"""
    },
    'super_admin_new_approval_request': {
        'subject': 'New Community Approval Request',
        'html_content': """<p>Hello Super Admin,</p>
<p>A new community registration requires your review and approval.</p>
<div class="highlight-box">
  <table>
    <tr><td class="label">Community Name:</td><td class="value">{{ community_name }}</td></tr>
    <tr><td class="label">Community Type:</td><td class="value">{{ community_type }}</td></tr>
    <tr><td class="label">Registration Date:</td><td class="value">{{ registration_date }}</td></tr>
    <tr><td class="label">Admin Name:</td><td class="value">{{ admin_name }}</td></tr>
    <tr><td class="label">Admin Email:</td><td class="value">{{ admin_email }}</td></tr>
  </table>
</div>
<p><a href="http://localhost:8080/superadmin/approvals" class="button">Review Approval Request</a></p>"""
    },
    'super_community_approved': {
        'subject': 'Community Registration Approved',
        'html_content': """<p>Congratulations!</p>
<p>Your community has been approved.</p>
<p>You can now login using the email and password provided during registration.</p>
<div class="highlight-box">
  <table>
    <tr><td class="label">Community:</td><td class="value">{{ community_name }}</td></tr>
    <tr><td class="label">Status:</td><td class="value">Active</td></tr>
  </table>
</div>
<p><a href="http://localhost:8080/login" class="button">Login to Dashboard</a></p>"""
    },
    'super_community_rejected': {
        'subject': 'Community Registration Rejected',
        'html_content': """<p>Hello,</p>
<p>We regret to inform you that your community registration has been declined.</p>
<div class="highlight-box">
  <table>
    <tr><td class="label">Community Name:</td><td class="value">{{ community_name }}</td></tr>
    <tr><td class="label">Rejection Reason:</td><td class="value">{{ rejection_reason }}</td></tr>
  </table>
</div>
<p>If you have any questions, please contact our support team.</p>"""
    },
    'super_admin_approved_subsidiary': {
        'subject': 'Community Registration Approved (Stage 1)',
        'html_content': """<p>Hello,</p>
<p>Your application has passed the first approval stage and is awaiting Parent Community approval.</p>
<div class="highlight-box">
  <table>
    <tr><td class="label">Community Name:</td><td class="value">{{ community_name }}</td></tr>
    <tr><td class="label">Status:</td><td class="value">Awaiting Parent Approval</td></tr>
  </table>
</div>"""
    },
    'parent_community_approval_request': {
        'subject': 'Subsidiary Community Approval Required',
        'html_content': """<p>Hello Parent Community Admin,</p>
<p>A new Subsidiary Community requires your review and approval.</p>
<div class="highlight-box">
  <table>
    <tr><td class="label">Community Details:</td><td class="value">{{ community_name }}</td></tr>
    <tr><td class="label">Admin Details:</td><td class="value">{{ admin_name }} ({{ admin_email }})</td></tr>
    <tr><td class="label">Registration Date:</td><td class="value">{{ registration_date }}</td></tr>
  </table>
</div>
<p><a href="http://localhost:8080/community-admin/families" class="button">Review Request</a></p>"""
    },
    'subsidiary_community_approved': {
        'subject': 'Community Registration Fully Approved',
        'html_content': """<p>Congratulations!</p>
<p>Your subsidiary community is now active.</p>
<p>You may now login using your registration credentials.</p>
<p><a href="http://localhost:8080/login" class="button">Login to Dashboard</a></p>"""
    },
    'subsidiary_community_rejected': {
        'subject': 'Community Registration Rejected',
        'html_content': """<p>Hello,</p>
<p>We regret to inform you that your subsidiary community registration has been declined.</p>
<div class="highlight-box">
  <table>
    <tr><td class="label">Community Name:</td><td class="value">{{ community_name }}</td></tr>
    <tr><td class="label">Parent Community Name:</td><td class="value">{{ parent_name }}</td></tr>
    <tr><td class="label">Rejection Reason:</td><td class="value">{{ rejection_reason }}</td></tr>
  </table>
</div>"""
    },
    'first_successful_login': {
        'subject': 'Welcome to We Are Going',
        'html_content': """<p>Welcome to We Are Going!</p>
<p>You have successfully logged in to your dashboard for the first time.</p>
<div class="highlight-box">
  <table>
    <tr><td class="label">Community Name:</td><td class="value">{{ community_name }}</td></tr>
    <tr><td class="label">Dashboard Link:</td><td class="value"><a href="http://localhost:8080/dashboard">Go to Dashboard</a></td></tr>
    <tr><td class="label">Support Contact:</td><td class="value">support@wearegoing.in</td></tr>
  </table>
</div>"""
    },
    'matrimony_interest_received': {
        'subject': 'You Have Received a Matrimony Interest',
        'html_content': """<p>Hello,</p>
<p>Exciting news! You have received a new matrimony interest.</p>
<div class="highlight-box">
  <table>
    <tr><td class="label">Sender Name:</td><td class="value">{{ sender_name }}</td></tr>
    <tr><td class="label">Age:</td><td class="value">{{ sender_age }}</td></tr>
    <tr><td class="label">City:</td><td class="value">{{ sender_city }}</td></tr>
  </table>
</div>
<p><a href="http://localhost:8080/dashboard/matrimony" class="button">View Interest</a></p>"""
    },
    'matrimony_interest_accepted': {
        'subject': 'Your Matrimony Interest Was Accepted',
        'html_content': """<p>Hello,</p>
<p>Great news! The matrimony interest you sent has been accepted.</p>
<p>You can now view their contact details and preferences in your dashboard.</p>
<p><a href="http://localhost:8080/dashboard/matrimony" class="button">Go to Matrimony Dashboard</a></p>"""
    },
    'matrimony_interest_rejected': {
        'subject': 'Your Matrimony Interest Was Declined',
        'html_content': """<p>Hello,</p>
<p>The matrimony interest you sent has been declined.</p>
<p>Keep exploring! There are many other potential matches waiting for you.</p>
<p><a href="http://localhost:8080/dashboard/matrimony" class="button">Search Matches</a></p>"""
    },
    'job_application_submitted': {
        'subject': 'Job Application Submitted Successfully',
        'html_content': """<p>Hello,</p>
<p>Your application for the job <strong>{{ job_role }}</strong> at <strong>{{ company_name }}</strong> has been submitted successfully.</p>
<p>The employer will review your profile and contact you if you are shortlisted.</p>"""
    },
    'new_application_received': {
        'subject': 'New Job Application Received',
        'html_content': """<p>Hello Employer,</p>
<p>You have received a new job application for your posting: <strong>{{ job_role }}</strong>.</p>
<div class="highlight-box">
  <table>
    <tr><td class="label">Applicant Name:</td><td class="value">{{ applicant_name }}</td></tr>
    <tr><td class="label">Applicant Email:</td><td class="value">{{ applicant_email }}</td></tr>
  </table>
</div>
<p><a href="http://localhost:8080/dashboard/jobs" class="button">View Applications</a></p>"""
    },
    'event_registration_confirmation': {
        'subject': 'Event Registration Confirmed',
        'html_content': """<p>Hello {{ member_name }},</p>
<p>Your registration for the event <strong>{{ event_title }}</strong> is confirmed!</p>
<div class="highlight-box">
  <table>
    <tr><td class="label">Date:</td><td class="value">{{ event_date }}</td></tr>
    <tr><td class="label">Venue:</td><td class="value">{{ event_venue }}</td></tr>
    <tr><td class="label">Attendees:</td><td class="value">{{ attendees }}</td></tr>
  </table>
</div>"""
    },
    'event_reminder': {
        'subject': 'Reminder: Upcoming Event Tomorrow',
        'html_content': """<p>Hello {{ member_name }},</p>
<p>This is a reminder that the event <strong>{{ event_title }}</strong> starts in 24 hours.</p>
<div class="highlight-box">
  <table>
    <tr><td class="label">Date:</td><td class="value">{{ event_date }}</td></tr>
    <tr><td class="label">Venue:</td><td class="value">{{ event_venue }}</td></tr>
  </table>
</div>
<p>We look forward to seeing you there!</p>"""
    },
    'donation_success': {
        'subject': 'Donation Received - Thank You',
        'html_content': """<p>Dear Donor,</p>
<p>Thank you so much for your generous support!</p>
<p>We have successfully received your donation details.</p>
<div class="highlight-box">
  <table>
    <tr><td class="label">Amount:</td><td class="value">INR {{ amount }}</td></tr>
    <tr><td class="label">Transaction ID:</td><td class="value">{{ tx_id }}</td></tr>
    <tr><td class="label">Receipt Number:</td><td class="value">{{ receipt_no }}</td></tr>
  </table>
</div>
<p>Your contribution directly supports our community campaigns.</p>"""
    },
    'forgot_password_otp': {
        'subject': 'Reset Password OTP Verification Code',
        'html_content': """<p>Hello,</p>
<p>We received a request to reset your account password. Use the verification OTP code below to proceed:</p>
<div style="font-size: 28px; font-weight: 700; color: #1B4FD8; letter-spacing: 4px; text-align: center; margin: 24px 0;">
  {{ otp_code }}
</div>
<p>This code will expire in 10 minutes. If you did not make this request, you can safely ignore this email.</p>"""
    },
    'password_changed_successfully': {
        'subject': 'Password Changed Successfully',
        'html_content': """<p>Hello,</p>
<p>The password for your We Are Going account was changed successfully.</p>
<p>If you did not make this change, please contact support immediately.</p>"""
    },
    'account_suspended': {
        'subject': 'Account Suspended Notice',
        'html_content': """<p>Hello,</p>
<p>Your account has been suspended by the administrator.</p>
<p>You will not be able to access the portal until it is reactivated.</p>
<p>For more information or to appeal this decision, please contact support.</p>"""
    },
    'account_reactivated': {
        'subject': 'Account Reactivated Notice',
        'html_content': """<p>Hello,</p>
<p>Great news! Your account has been reactivated by the administrator.</p>
<p>You can now log in and access all the features as usual.</p>
<p><a href="http://localhost:8080/login" class="button">Login Now</a></p>"""
    }
}

def get_or_create_template(template_name):
    """
    Get template from database or create default one if it doesn't exist
    """
    try:
        db_template = EmailTemplate.objects.get(name=template_name)
        return db_template
    except EmailTemplate.DoesNotExist:
        config = DEFAULT_TEMPLATES.get(template_name)
        if not config:
            raise ValueError(f"Unknown email template name: {template_name}")
        
        # Create template in DB
        db_template = EmailTemplate.objects.create(
            name=template_name,
            subject=config['subject'],
            html_content=config['html_content'],
            status='Active'
        )
        return db_template

def send_project_email(recipient, template_name, context, trigger_event=None):
    """
    Centralized function to send HTML emails, log results to DB and print to console.
    """
    if not trigger_event:
        trigger_event = template_name.replace('_', ' ').title()

    subject = ""
    status = "Pending"
    error_msg = None

    try:
        # 1. Fetch template
        db_template = get_or_create_template(template_name)
        
        if db_template.status != 'Active':
            raise ValueError(f"Email template '{template_name}' is inactive.")

        # 2. Render Template Content
        subject_t = Template(db_template.subject)
        body_t = Template(db_template.html_content)
        
        django_context = Context(context)
        
        rendered_subject = subject_t.render(django_context)
        rendered_body = body_t.render(django_context)
        subject = rendered_subject

        # 3. Render Master Layout Wrapper
        layout_t = Template(MASTER_HTML_LAYOUT)
        layout_context = Context({
            'subject': rendered_subject,
            'body_content': rendered_body,
            'recipient': recipient
        })
        final_html = layout_t.render(layout_context)
        text_content = strip_tags(rendered_body)

        # 4. Send Email
        from_email = os.environ.get('EMAIL_HOST_USER', 'socialbuzz31@gmail.com')
        
        msg = EmailMultiAlternatives(
            subject=rendered_subject,
            body=text_content,
            from_email=from_email,
            to=[recipient]
        )
        msg.attach_alternative(final_html, "text/html")
        msg.send()

        status = "Sent Successfully"

        # 5. Print success to console
        print("\n" + "="*50)
        print(f"[EMAIL] {trigger_event}")
        print(f"[EMAIL] To: {recipient}")
        print(f"[EMAIL] Subject: {rendered_subject}")
        print(f"[EMAIL] Status: {status}")
        print("="*50 + "\n")

    except Exception as e:
        status = "Failed"
        error_msg = str(e)
        
        # Print error to console
        print("\n" + "!"*50)
        print("[EMAIL ERROR]")
        print(f"Recipient: {recipient}")
        print(f"Trigger Event: {trigger_event}")
        print(f"Subject: {subject or template_name}")
        print(f"Reason: {error_msg}")
        print("!"*50 + "\n")
        logger.exception("Failed to send project email")

    # 6. Save log entry in DB
    try:
        EmailLog.objects.create(
            recipient=recipient,
            subject=subject or template_name,
            trigger_event=trigger_event,
            status=status,
            error_message=error_msg
        )
    except Exception as log_err:
        logger.error(f"Failed to write email log: {log_err}")

    return status == "Sent Successfully"
