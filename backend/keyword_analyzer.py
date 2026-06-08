import re
from keywords_db import ACTION_VERBS, SOFT_SKILLS, DOMAIN_TERMS
from skill_extractor import extract_skills

def find_keywords_in_text(text, keyword_list):
    text_lower = text.lower()
    found = []
    for kw in keyword_list:
        kw_lower = kw.lower()
        if kw_lower in text_lower:
            idx = text_lower.find(kw_lower)
            before = text_lower[idx - 1] if idx > 0 else " "
            after  = text_lower[idx + len(kw_lower)] if idx + len(kw_lower) < len(text_lower) else " "
            if not before.isalpha() and not after.isalpha():
                found.append(kw)
    return found

def analyze_gaps(resume_text, job_description):
    # --- Skills gap ---
    resume_skills = set(s.lower() for s in extract_skills(resume_text))
    jd_skills     = set(s.lower() for s in extract_skills(job_description))
    missing_skills = [
        s for s in extract_skills(job_description)
        if s.lower() not in resume_skills
    ]

    # --- Action verbs gap ---
    jd_verbs      = find_keywords_in_text(job_description, ACTION_VERBS)
    resume_verbs  = find_keywords_in_text(resume_text, ACTION_VERBS)
    missing_verbs = [v for v in jd_verbs if v not in resume_verbs]

    # --- Soft skills gap ---
    jd_soft      = find_keywords_in_text(job_description, SOFT_SKILLS)
    resume_soft  = find_keywords_in_text(resume_text, SOFT_SKILLS)
    missing_soft = [s for s in jd_soft if s not in resume_soft]

    # --- Domain terms gap ---
    jd_domain      = find_keywords_in_text(job_description, DOMAIN_TERMS)
    resume_domain  = find_keywords_in_text(resume_text, DOMAIN_TERMS)
    missing_domain = [d for d in jd_domain if d not in resume_domain]

    # --- Priority: skills + domain terms matter most ---
    priority = (missing_skills + missing_domain)[:5]

    total_missing = (
        len(missing_skills) +
        len(missing_verbs) +
        len(missing_soft) +
        len(missing_domain)
    )

    return {
        "missing": {
            "skills":       missing_skills,
            "action_verbs": missing_verbs,
            "soft_skills":  missing_soft,
            "domain_terms": missing_domain
        },
        "total_missing": total_missing,
        "priority":      priority
    }