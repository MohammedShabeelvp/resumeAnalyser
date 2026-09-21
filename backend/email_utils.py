import os
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer
from flask import current_app

mail = Mail()

def init_mail(app):
    app.config["MAIL_SERVER"]        = "smtp.gmail.com"
    app.config["MAIL_PORT"]          = 587
    app.config["MAIL_USE_TLS"]       = True
    app.config["MAIL_USERNAME"]      = os.getenv("MAIL_USERNAME")
    app.config["MAIL_PASSWORD"]      = os.getenv("MAIL_PASSWORD")
    app.config["MAIL_DEFAULT_SENDER"] = os.getenv("MAIL_USERNAME")
    mail.init_app(app)

def get_serializer():
    return URLSafeTimedSerializer(os.getenv("SECRET_KEY", "fallback-secret"))

def generate_verification_token(email):
    s = get_serializer()
    return s.dumps(email, salt="email-verify")

def verify_email_token(token, expiry=3600):
    s = get_serializer()
    try:
        email = s.loads(token, salt="email-verify", max_age=expiry)
        return email
    except Exception:
        return None

def generate_reset_token(email):
    s = get_serializer()
    return s.dumps(email, salt="password-reset")

def verify_reset_token(token, expiry=1800):
    s = get_serializer()
    try:
        email = s.loads(token, salt="password-reset", max_age=expiry)
        return email
    except Exception:
        return None

def send_verification_email(email, name, token):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    link = f"{frontend_url}/verify-email/{token}"

    msg = Message(
        subject="Verify your Resume Analyzer account",
        recipients=[email]
    )
    msg.html = f"""
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; 
                max-width: 520px; margin: 0 auto; 
                background: #F7F6F3; padding: 40px 24px;">

        <h1 style="font-size: 24px; color: #1C1C1A; margin-bottom: 8px;">
            Verify your email
        </h1>
        <p style="color: #9B9790; font-size: 15px; margin-bottom: 32px;">
            Hi {name}, thanks for signing up for Resume Analyzer.
            Click below to verify your email address.
        </p>

        <a href="{link}"
           style="display: inline-block; background: #1A6B52; color: white;
                  padding: 14px 28px; border-radius: 10px; text-decoration: none;
                  font-size: 15px; font-weight: 500;">
            Verify email address
        </a>

        <p style="color: #9B9790; font-size: 13px; margin-top: 32px;">
            This link expires in 1 hour. If you didn't sign up, 
            you can safely ignore this email.
        </p>
        <p style="color: #C8C5BE; font-size: 12px; margin-top: 8px;">
            Or copy this link: {link}
        </p>
    </div>
    """
    mail.send(msg)

def send_reset_email(email, name, token):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    link = f"{frontend_url}/reset-password/{token}"

    msg = Message(
        subject="Reset your Resume Analyzer password",
        recipients=[email]
    )
    msg.html = f"""
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; 
                max-width: 520px; margin: 0 auto; 
                background: #F7F6F3; padding: 40px 24px;">

        <h1 style="font-size: 24px; color: #1C1C1A; margin-bottom: 8px;">
            Reset your password
        </h1>
        <p style="color: #9B9790; font-size: 15px; margin-bottom: 32px;">
            Hi {name}, we received a request to reset your password.
            Click below to set a new one.
        </p>

        <a href="{link}"
           style="display: inline-block; background: #1A6B52; color: white;
                  padding: 14px 28px; border-radius: 10px; text-decoration: none;
                  font-size: 15px; font-weight: 500;">
            Reset password
        </a>

        <p style="color: #9B9790; font-size: 13px; margin-top: 32px;">
            This link expires in 30 minutes. If you didn't request this,
            you can safely ignore this email.
        </p>
        <p style="color: #C8C5BE; font-size: 12px; margin-top: 8px;">
            Or copy this link: {link}
        </p>
    </div>
    """
    mail.send(msg)