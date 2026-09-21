import re
from datetime import datetime
from skill_extractor import extract_skills
from bert_matcher import model
from sklearn.metrics.pairwise import cosine_similarity
from nlp_utils import clean_text

CURRENT_YEAR = datetime.now().year

# ── Action verbs ─────────────────────────────────────────
ACTION_VERBS = {
    "developed", "implemented", "built", "designed", "engineered",
    "optimized", "created", "led", "managed", "delivered", "architected",
    "automated", "improved", "reduced", "increased", "launched",
    "maintained", "integrated", "migrated", "scaled", "mentored",
    "collaborated", "deployed", "tested", "monitored", "documented"
}

# ── Section groups ────────────────────────────────────────
SECTION_GROUPS = {
    "education":       ["education", "academic background", "qualifications"],
    "experience":      ["experience", "employment", "work history",
                        "professional experience", "work experience",
                        "career history"],
    "skills":          ["skills", "technical skills", "core competencies",
                        "technologies", "expertise"],
    "projects":        ["projects", "academic projects", "personal projects",
                        "portfolio", "key projects"],
    "certifications":  ["certifications", "certificates", "accreditations",
                        "licenses"]
}

# ── Contact patterns ──────────────────────────────────────
CONTACT_PATTERNS = {
    "email":    r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
    "phone":    r"(\+?\d[\d\s\-().]{7,}\d)",
    "linkedin": r"linkedin\.com\/in\/[a-zA-Z0-9\-]+",
    "github":   r"github\.com\/[a-zA-Z0-9\-]+"
}

# ── 1. Skills score ───────────────────────────────────────
def score_skills(resume_text, job_description):
    resume_skills = set(s.lower() for s in extract_skills(resume_text))
    jd_skills     = set(s.lower() for s in extract_skills(job_description))

    if not jd_skills:
        return 100.0, [], []

    matched = resume_skills.intersection(jd_skills)
    missing = jd_skills - resume_skills

    score = (len(matched) / len(jd_skills)) * 100

    return round(score, 1), list(matched), list(missing)

# ── 2. Experience score ───────────────────────────────────
def score_experience(resume_text):
    text = resume_text.lower()

    years = []

    # Explicit mentions: "3 years", "5+ years experience"
    explicit_patterns = [
        r"(\d+)\+?\s*years?\s*of\s*experience",
        r"(\d+)\+?\s*years?\s*experience",
        r"experience\s*of\s*(\d+)\+?\s*years?",
    ]
    for pattern in explicit_patterns:
        matches = re.findall(pattern, text)
        years.extend([int(m) for m in matches])

    # Date ranges: "July 2022 - May 2024", "2021 - Present"
    date_range_pattern = r"(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)?\s*(20\d\d)\s*[-–—to]+\s*(20\d\d|present|current|now)"
    date_matches = re.findall(date_range_pattern, text)

    total_from_dates = 0
    for match in date_matches:
        _, start, end = match
        start_year = int(start)
        end_year   = CURRENT_YEAR if end.strip() in ("present", "current", "now") else int(end)
        if end_year >= start_year:
            total_from_dates += end_year - start_year

    if total_from_dates > 0:
        years.append(total_from_dates)

    max_years = max(years) if years else 0

    if max_years >= 5:   return 100.0
    elif max_years >= 3: return 75.0
    elif max_years >= 1: return 50.0
    else:                return 25.0

# ── 3. Education score ────────────────────────────────────
def score_education(resume_text, job_description=""):
    text     = resume_text.lower()
    jd_lower = job_description.lower()

    # Detect resume education level
    if any(w in text for w in ["phd", "ph.d", "doctorate", "doctor of"]):
        resume_level = 4
    elif any(w in text for w in ["master", "m.tech", "m.sc", "mba", "m.s.", "m.e."]):
        resume_level = 3
    elif any(w in text for w in ["bachelor", "b.tech", "b.sc", "b.e.", "b.s.", "undergraduate", "degree"]):
        resume_level = 2
    elif any(w in text for w in ["diploma", "associate", "higher secondary"]):
        resume_level = 1
    else:
        resume_level = 0

    # Detect JD required education level
    if any(w in jd_lower for w in ["phd", "doctorate", "ph.d"]):
        required_level = 4
    elif any(w in jd_lower for w in ["master", "mba", "m.tech"]):
        required_level = 3
    elif any(w in jd_lower for w in ["bachelor", "degree", "b.tech", "undergraduate"]):
        required_level = 2
    elif any(w in jd_lower for w in ["diploma", "associate"]):
        required_level = 1
    else:
        required_level = 2  # default assume bachelor required

    # Compare resume vs JD requirement
    if required_level == 0:
        return 100.0

    if resume_level >= required_level:
        return 100.0
    elif resume_level == required_level - 1:
        return 60.0
    else:
        return 30.0

# ── 4. Keyword score (BERT semantic) ─────────────────────
def score_keywords(resume_text, job_description):
    cleaned_resume = clean_text(resume_text)
    cleaned_jd     = clean_text(job_description)

    if not cleaned_resume or not cleaned_jd:
        return 0.0

    embeddings = model.encode([cleaned_resume, cleaned_jd])
    score      = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]

    return round(float(score) * 100, 1)

# ── 5. Structure score ────────────────────────────────────
def score_structure(resume_text):
    text_lower = resume_text.lower()
    found      = 0

    for section, aliases in SECTION_GROUPS.items():
        if any(alias in text_lower for alias in aliases):
            found += 1

    score = (found / len(SECTION_GROUPS)) * 100
    return round(score, 1)

# ── 6. Action verb score ──────────────────────────────────
def score_action_verbs(resume_text):
    text_lower  = resume_text.lower()
    words       = set(re.findall(r"\b\w+\b", text_lower))
    found_verbs = ACTION_VERBS.intersection(words)

    if len(found_verbs) >= 6:   return 100.0
    elif len(found_verbs) >= 4: return 80.0
    elif len(found_verbs) >= 2: return 60.0
    elif len(found_verbs) >= 1: return 40.0
    else:                       return 0.0

# ── 7. Contact info score ─────────────────────────────────
def score_contact_info(resume_text):
    found = 0
    for field, pattern in CONTACT_PATTERNS.items():
        if re.search(pattern, resume_text, re.IGNORECASE):
            found += 1

    score = (found / len(CONTACT_PATTERNS)) * 100
    return round(score, 1)

# ── Master ATS scorer ─────────────────────────────────────
def compute_ats_score(resume_text, job_description):
    skills_score, matched_skills, missing_skills = score_skills(resume_text, job_description)
    experience_score  = score_experience(resume_text)
    education_score   = score_education(resume_text, job_description)
    keywords_score    = score_keywords(resume_text, job_description)
    structure_score   = score_structure(resume_text)
    action_verb_score = score_action_verbs(resume_text)
    contact_score     = score_contact_info(resume_text)

    # Weighted total
    ats_score = (
        skills_score      * 0.30 +
        keywords_score    * 0.40 +
        experience_score  * 0.15 +
        education_score   * 0.10 +
        structure_score   * 0.03 +
        action_verb_score * 0.01 +
        contact_score     * 0.01
    )

    ats_score = round(ats_score, 1)

    if ats_score >= 80:   label = "Excellent"
    elif ats_score >= 60: label = "Good"
    elif ats_score >= 40: label = "Fair"
    else:                 label = "Needs work"

    return {
        "ats_score": ats_score,
        "label":     label,
        "breakdown": {
            "skills": {
                "score":          skills_score,
                "weight":         30,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills
            },
            "keywords": {
                "score":  keywords_score,
                "weight": 40
            },
            "experience": {
                "score":  experience_score,
                "weight": 15
            },
            "education": {
                "score":  education_score,
                "weight": 10
            },
            "structure": {
                "score":  structure_score,
                "weight": 3
            },
            "action_verbs": {
                "score":  action_verb_score,
                "weight": 1
            },
            "contact_info": {
                "score":  contact_score,
                "weight": 1
            }
        },
        "insights": {
            "matched_skills":  matched_skills,
            "missing_skills":  missing_skills,
            "found_verbs":     list(ACTION_VERBS.intersection(
                                set(re.findall(r"\b\w+\b", resume_text.lower()))
                               )),
            "contact_present": {
                field: bool(re.search(pattern, resume_text, re.IGNORECASE))
                for field, pattern in CONTACT_PATTERNS.items()
            }
        }
    }