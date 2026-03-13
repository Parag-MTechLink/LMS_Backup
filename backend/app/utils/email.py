"""
Email utility for sending system notifications.
Falls back to logging if SMTP is not configured.
"""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, body: str, html_body: str = None):
    """
    Send an email notification.
    If SMTP_HOST is not set, it logs the email content instead.
    """
    if not settings.SMTP_HOST:
        logger.info("--- EMAIL LOG (SMTP NOT CONFIGURED) ---")
        logger.info(f"To: {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Body: {body}")
        logger.info("---------------------------------------")
        # Also print to console for easier development view
        print(f"\n[EMAIL LOG] To: {to_email} | Subject: {subject}\n[EMAIL LOG] {body}\n")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.MAIL_FROM or settings.SMTP_USER
        msg["To"] = to_email

        # Attach plain text version
        msg.attach(MIMEText(body, "plain"))
        
        # Attach HTML version if provided
        if html_body:
            msg.attach(MIMEText(html_body, "html"))

        # Connect and send
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_PORT == 587:
                server.starttls()
            
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            
            server.send_message(msg)
            
        logger.info(f"Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        # Fallback to logging so development isn't halted by SMTP errors
        logger.warning("Failing back to logging reset info due to SMTP error.")
        print(f"\n[EMAIL FALLBACK] To: {to_email} | Subject: {subject}\n[EMAIL FALLBACK] {body}\n")
        return False

def send_password_reset_email(to_email: str, token: str):
    """Send a password reset link to the user."""
    # Assuming frontend is on localhost:5173 for now, should ideally be from config
    reset_link = f"http://localhost:5173/reset-password?token={token}"
    
    subject = "Reset Your Password - LMS"
    body = f"Hello,\n\nYou requested a password reset for your LMS account. Please click the link below to set a new password:\n\n{reset_link}\n\nThis link will expire in {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes.\n\nIf you did not request this, please ignore this email."
    
    html_body = f"""
        <body>
            <h3>Password Reset Request</h3>
            <p>Hello,</p>
            <p>You requested a password reset for your LMS account. Please click the button below to set a new password:</p>
            <p>
                <a href="{reset_link}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Reset Password
                </a>
            </p>
            <p>Alternatively, copy and paste this link into your browser:</p>
            <p>{reset_link}</p>
            <p>This link will expire in {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        </body>
    </html>
    """
    
    return send_email(to_email, subject, body, html_body)
