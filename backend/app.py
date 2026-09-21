import os
import bcrypt
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
from werkzeug.utils import secure_filename
from datetime import timedelta

import pdfplumber
from nlp_utils        import clean_and_tokenise
from skill_extractor  import extract_skills, extract_skills_by_category
from matcher          import compute_tfidf_similarity, get_common_keywords
from ats_scorer       import compute_ats_score
from keyword_analyzer import analyze_gaps
from bert_matcher     import compute_bert_similarity, get_combined_score
from recommender      import get_job_recommendations
from suggestion_engine import generate_suggestions
from recommender import get_job_recommendations

from dotenv import load_dotenv
load_dotenv()

from email_utils import (
    init_mail, generate_verification_token, verify_email_token,
    generate_reset_token, verify_reset_token,
    send_verification_email, send_reset_email
)
from database import (
    init_db, save_upload, save_analysis,
    get_history, delete_analysis, delete_all_history,
    create_user, get_user_by_email, get_user_by_id,
    rename_analysis, get_analysis_by_id,
    set_user_verified, update_user_password
)

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Config
app.config["UPLOAD_FOLDER"]      = "uploads"
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024
app.config["JWT_SECRET_KEY"]     = "your-secret-key-change-this-in-production"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

jwt = JWTManager(app)

init_mail(app)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "fallback-secret")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "fallback-jwt-secret")

ALLOWED_EXTENSIONS = {"pdf"}

init_db()

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(filepath):
    text = ""
    with pdfplumber.open(filepath) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()

# ── Auth routes ──────────────────────────────────────────

@app.route("/register", methods=["POST"])
def register():
    data     = request.get_json()
    name     = data.get("name", "").strip()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if get_user_by_email(email):
        return jsonify({"error": "An account with this email already exists"}), 409

    password_hash = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    user_id = create_user(name, email, password_hash)

    if not user_id:
        return jsonify({"error": "Registration failed — please try again"}), 500

    # Send verification email
    try:
        token = generate_verification_token(email)
        send_verification_email(email, name, token)
    except Exception as e:
        print(f"Email send failed: {e}")
        # Don't block registration if email fails

    return jsonify({
        "message": "Account created. Please check your email to verify your account.",
        "requires_verification": True
    }), 201

@app.route("/login", methods=["POST"])
def login():
    data     = request.get_json()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = get_user_by_email(email)

    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    password_match = bcrypt.checkpw(
        password.encode("utf-8"),
        user["password_hash"].encode("utf-8")
    )

    if not password_match:
        return jsonify({"error": "Invalid email or password"}), 401

    # Block unverified users
    if not user["is_verified"]:
        return jsonify({
            "error": "Please verify your email before logging in.",
            "requires_verification": True,
            "email": email
        }), 403

    token = create_access_token(identity=str(user["id"]))

    return jsonify({
        "message": "Login successful",
        "token":   token,
        "user":    {"id": user["id"], "name": user["name"], "email": user["email"]}
    }), 200

@app.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())
    user    = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "id":    user["id"],
        "name":  user["name"],
        "email": user["email"]
    }), 200

# ── Resume routes ────────────────────────────────────────

@app.route("/")
def index():
    return jsonify({"message": "Resume Analyzer API is running"})

@app.route("/upload", methods=["POST"])
def upload_resume():
    user_id = None
    try:
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity:
            user_id = int(identity)
    except:
        pass

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Only PDF files are allowed"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    text            = extract_text_from_pdf(filepath)
    cleaned         = clean_and_tokenise(text)
    detected_skills = extract_skills(text)
    skills_by_cat   = extract_skills_by_category(text)

    # Only save to DB if user is logged in
    upload_id = None
    if user_id:
        upload_id = save_upload(
            filename    = filename,
            skill_count = len(detected_skills),
            skills      = detected_skills,
            user_id     = user_id
        )

    return jsonify({
        "message":   "File uploaded successfully",
        "filename":  filename,
        "upload_id": upload_id,  # None for guests
        "text":      text,
        "cleaned":   cleaned,
        "skills": {
            "detected":    detected_skills,
            "count":       len(detected_skills),
            "by_category": skills_by_cat
        }
    }), 200

@app.route("/match", methods=["POST"])
def match_resume():
    # Optional auth — save to history only if logged in
    user_id = None
    try:
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity:
            user_id = int(identity)
    except:
        pass

    data            = request.get_json()
    resume_text     = data.get("resume_text", "")
    job_description = data.get("job_description", "")
    upload_id       = data.get("upload_id")

    if not resume_text or not job_description:
        return jsonify({"error": "Both resume text and job description are required"}), 400

    tfidf_score     = compute_tfidf_similarity(resume_text, job_description)
    common_keywords = get_common_keywords(resume_text, job_description)
    bert_score      = compute_bert_similarity(resume_text, job_description)
    combined_score  = get_combined_score(tfidf_score, bert_score)
    ats             = compute_ats_score(resume_text, job_description)
    gaps            = analyze_gaps(resume_text, job_description)
    suggestions     = generate_suggestions(
        resume_text     = resume_text,
        job_description = job_description,
        ats_data        = ats,
        gaps_data       = gaps
    )

    # Only save to history if user is logged in
    # Detect top job role from JD
    jd_recommendations = get_job_recommendations(job_description, top_n=1)
    job_role = jd_recommendations[0]["role"] if jd_recommendations else ""

    if user_id and upload_id:
        save_analysis(
            upload_id        = upload_id,
            job_description  = job_description,
            similarity_score = combined_score,
            ats_score        = ats["ats_score"],
            ats_label        = ats["label"],
            missing_count    = gaps["total_missing"],
            common_keywords  = common_keywords,
            job_role         = job_role,
            resume_text      = resume_text
        )

    def score_label(score):
        if score >= 75: return "Strong match"
        if score >= 50: return "Good match"
        if score >= 30: return "Partial match"
        return "Low match"

    return jsonify({
        "tfidf_score":      tfidf_score,
        "bert_score":       bert_score,
        "combined_score":   combined_score,
        "similarity_score": combined_score,
        "label":            score_label(combined_score),
        "common_keywords":  common_keywords,
        "ats":              ats,
        "gaps":             gaps,
        "suggestions":      suggestions,
        "job_role":         job_role,
        "saved_to_history": user_id is not None
    }), 200

@app.route("/recommend", methods=["POST"])
def recommend_jobs():
    data        = request.get_json()
    resume_text = data.get("resume_text", "")

    if not resume_text:
        return jsonify({"error": "No resume text provided"}), 400

    recommendations = get_job_recommendations(resume_text, top_n=12)
    return jsonify({
        "recommendations":     recommendations,
        "total_roles_checked": 12
    }), 200

# History routes stay protected
@app.route("/history", methods=["GET"])
@jwt_required()
def get_analysis_history():
    user_id = int(get_jwt_identity())
    history = get_history(user_id)
    return jsonify({"history": history}), 200

@app.route("/history/<int:analysis_id>", methods=["DELETE"])
@jwt_required()
def delete_single_analysis(analysis_id):
    delete_analysis(analysis_id)
    return jsonify({"message": "Analysis deleted"}), 200

@app.route("/history", methods=["DELETE"])
@jwt_required()
def clear_all_history():
    user_id = int(get_jwt_identity())
    delete_all_history(user_id)
    return jsonify({"message": "All history cleared"}), 200

@app.route("/save-pending", methods=["POST"])
@jwt_required()
def save_pending_analysis():
    user_id = int(get_jwt_identity())
    data    = request.get_json()

    filename        = data.get("filename", "resume.pdf")
    skills          = data.get("skills", [])
    resume_text     = data.get("resume_text", "")
    job_description = data.get("job_description", "")
    match_data      = data.get("match_data", {})

    if not resume_text or not job_description:
        return jsonify({"error": "Missing data"}), 400

    # Save upload
    upload_id = save_upload(
        filename    = secure_filename(filename),
        skill_count = len(skills),
        skills      = skills,
        user_id     = user_id
    )

    # Save analysis
    save_analysis(
        upload_id        = upload_id,
        job_description  = job_description,
        similarity_score = match_data.get("combined_score", 0),
        ats_score        = match_data.get("ats", {}).get("ats_score", 0),
        ats_label        = match_data.get("ats", {}).get("label", ""),
        missing_count    = match_data.get("gaps", {}).get("total_missing", 0),
        common_keywords  = match_data.get("common_keywords", [])
    )

    return jsonify({"message": "Analysis saved to history"}), 200

@app.route("/history/<int:analysis_id>/rename", methods=["PATCH"])
@jwt_required()
def rename_analysis_route(analysis_id):
    data     = request.get_json()
    new_name = data.get("name", "").strip()

    if not new_name:
        return jsonify({"error": "Name cannot be empty"}), 400

    if len(new_name) > 50:
        return jsonify({"error": "Name too long — max 50 characters"}), 400

    rename_analysis(analysis_id, new_name)
    return jsonify({"message": "Renamed successfully", "name": new_name}), 200

@app.route("/history/<int:analysis_id>/rematch", methods=["POST"])
@jwt_required()
def rematch_analysis(analysis_id):
    analysis = get_analysis_by_id(analysis_id)

    if not analysis:
        return jsonify({"error": "Analysis not found"}), 404

    data            = request.get_json()
    job_description = data.get("job_description", analysis["job_description"])
    resume_text     = analysis["resume_text"]

    if not resume_text:
        return jsonify({"error": "No resume text stored for this analysis"}), 400

    tfidf_score     = compute_tfidf_similarity(resume_text, job_description)
    common_keywords = get_common_keywords(resume_text, job_description)
    bert_score      = compute_bert_similarity(resume_text, job_description)
    combined_score  = get_combined_score(tfidf_score, bert_score)
    ats             = compute_ats_score(resume_text, job_description)
    gaps            = analyze_gaps(resume_text, job_description)
    suggestions     = generate_suggestions(
        resume_text     = resume_text,
        job_description = job_description,
        ats_data        = ats,
        gaps_data       = gaps
    )

    def score_label(score):
        if score >= 75: return "Strong match"
        if score >= 50: return "Good match"
        if score >= 30: return "Partial match"
        return "Low match"

    return jsonify({
        "tfidf_score":      tfidf_score,
        "bert_score":       bert_score,
        "combined_score":   combined_score,
        "similarity_score": combined_score,
        "label":            score_label(combined_score),
        "common_keywords":  common_keywords,
        "ats":              ats,
        "gaps":             gaps,
        "suggestions":      suggestions,
        "resume_text":      resume_text,
        "saved_to_history": False
    }), 200

@app.route("/verify-email/<token>", methods=["GET"])
def verify_email(token):
    email = verify_email_token(token)

    if not email:
        return jsonify({
            "error": "Verification link is invalid or has expired."
        }), 400

    user = get_user_by_email(email)

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user["is_verified"]:
        return jsonify({"message": "Email already verified"}), 200

    set_user_verified(user["id"])

    return jsonify({
        "message": "Email verified successfully. You can now log in."
    }), 200

@app.route("/resend-verification", methods=["POST"])
def resend_verification():
    data  = request.get_json()
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = get_user_by_email(email)

    if not user:
        # Don't reveal whether email exists
        return jsonify({"message": "If that email exists, a verification link has been sent."}), 200

    if user["is_verified"]:
        return jsonify({"message": "Email is already verified"}), 200

    try:
        token = generate_verification_token(email)
        send_verification_email(email, user["name"], token)
    except Exception as e:
        print(f"Email send failed: {e}")
        return jsonify({"error": "Failed to send email. Please try again."}), 500

    return jsonify({
        "message": "Verification email sent. Please check your inbox."
    }), 200

@app.route("/forgot-password", methods=["POST"])
def forgot_password():
    data  = request.get_json()
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = get_user_by_email(email)

    # Always return success to prevent email enumeration
    if not user:
        return jsonify({
            "message": "If that email exists, a reset link has been sent."
        }), 200

    try:
        token = generate_reset_token(email)
        send_reset_email(email, user["name"], token)
    except Exception as e:
        print(f"Email send failed: {e}")
        return jsonify({"error": "Failed to send email. Please try again."}), 500

    return jsonify({
        "message": "Password reset email sent. Please check your inbox."
    }), 200

@app.route("/reset-password", methods=["POST"])
def reset_password():
    data     = request.get_json()
    token    = data.get("token", "")
    password = data.get("password", "")

    if not token or not password:
        return jsonify({"error": "Token and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    email = verify_reset_token(token)

    if not email:
        return jsonify({
            "error": "Reset link is invalid or has expired."
        }), 400

    user = get_user_by_email(email)

    if not user:
        return jsonify({"error": "User not found"}), 404

    new_hash = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    update_user_password(user["id"], new_hash)

    return jsonify({
        "message": "Password reset successfully. You can now log in."
    }), 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)