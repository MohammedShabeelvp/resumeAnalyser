import re
from skill_extractor import extract_skills
from matcher import compute_tfidf_similarity

def score_skills(resume_text, job_description):
    resume_skills = set(s.lower() for s in extract_skills(resume_text))
    jd_skills = set(s.lower() for s in extract_skills(job_description))

    if not jd_skills:
        return 100.0  # no skills in JD — full marks

    matched = resume_skills.intersection(jd_skills)
    score = (len(matched) / len(jd_skills)) * 100
    return round(score, 1)

def score_experience(resume_text):
    text = resume_text.lower()

    # Look for explicit year mentions: "5 years", "3+ years"
    patterns = [
        r"(\d+)\+?\s*years?\s*of\s*experience",
        r"(\d+)\+?\s*years?\s*experience",
        r"experience\s*of\s*(\d+)\+?\s*years?",
    ]

    years = []
    for pattern in patterns:
        matches = re.findall(pattern, text)
        years.extend([int(m) for m in matches])

    if years:
        max_years = max(years)
    else:
        # Estimate from date ranges: "2019 - 2023"
        date_ranges = re.findall(r"(20\d\d)\s*[-–]\s*(20\d\d|present|current)", text)
        if date_ranges:
            total = 0
            for start, end in date_ranges:
                end_year = 2024 if end in ("present", "current") else int(end)
                total += end_year - int(start)
            max_years = total
        else:
            max_years = 0

    # Score out of 100
    if max_years >= 5:
        return 100.0
    elif max_years >= 3:
        return 75.0
    elif max_years >= 1:
        return 50.0
    else:
        return 25.0  # fresher / no clear experience found

def score_education(resume_text):
    text = resume_text.lower()

    if any(word in text for word in ["phd", "ph.d", "doctorate", "doctor of"]):
        return 100.0
    elif any(word in text for word in ["master", "m.tech", "m.sc", "mba", "m.s."]):
        return 90.0
    elif any(word in text for word in ["bachelor", "b.tech", "b.sc", "b.e.", "b.s.", "undergraduate", "degree"]):
        return 75.0
    elif any(word in text for word in ["diploma", "associate", "higher secondary"]):
        return 50.0
    else:
        return 25.0

def score_keywords(resume_text, job_description):
    return compute_tfidf_similarity(resume_text, job_description)

def score_structure(resume_text):
    text = resume_text.lower()

    sections = [
        "education",
        "experience",
        "skills",
        "projects",
        "certifications"
    ]

    found = sum(1 for section in sections if section in text)

    return round((found / len(sections)) * 100, 1)

def compute_ats_score(resume_text, job_description):
    # Individual scores
    skills_score      = score_skills(resume_text, job_description)
    experience_score  = score_experience(resume_text)
    education_score   = score_education(resume_text)
    keywords_score    = score_keywords(resume_text, job_description)
    structure_score = score_structure(resume_text)

    # Weighted total
    ats_score = (
        skills_score     * 0.30 +
        experience_score * 0.15 +
        education_score  * 0.10 +
        keywords_score   * 0.40 +
        structure_score   * 0.05
    )

    ats_score = round(ats_score, 1)

    # Label
    if ats_score >= 80:
        label = "Excellent"
    elif ats_score >= 60:
        label = "Good"
    elif ats_score >= 40:
        label = "Fair"
    else:
        label = "Needs work"

    return {
        "ats_score": ats_score,
        "label": label,
        "breakdown": {
            "keywords":   {"score": keywords_score,   "weight": 40},
            "skills":     {"score": skills_score,     "weight": 30},
            "experience": {"score": experience_score, "weight": 15},
            "education":  {"score": education_score,  "weight": 10},
            "structure":   {"score": structure_score,   "weight": 5},
        }
    }