from skills_db import ALL_SKILLS, SKILLS

def extract_skills(text):
    text_lower = text.lower()
    detected = []

    for skill in ALL_SKILLS:
        # Match whole word only — avoids "C" matching "CI/CD"
        skill_lower = skill.lower()
        if skill_lower in text_lower:
            # Extra check: avoid partial matches for short skills
            idx = text_lower.find(skill_lower)
            before = text_lower[idx - 1] if idx > 0 else " "
            after = text_lower[idx + len(skill_lower)] if idx + len(skill_lower) < len(text_lower) else " "

            if not before.isalpha() and not after.isalpha():
                detected.append(skill)

    return list(set(detected))  # deduplicate

def extract_skills_by_category(text):
    text_lower = text.lower()
    result = {}

    for category, skills in SKILLS.items():
        found = []
        for skill in skills:
            skill_lower = skill.lower()
            if skill_lower in text_lower:
                idx = text_lower.find(skill_lower)
                before = text_lower[idx - 1] if idx > 0 else " "
                after = text_lower[idx + len(skill_lower)] if idx + len(skill_lower) < len(text_lower) else " "
                if not before.isalpha() and not after.isalpha():
                    found.append(skill)
        if found:
            result[category] = found

    return result

def find_missing_skills(resume_text, job_description):
    resume_skills = set(s.lower() for s in extract_skills(resume_text))
    jd_skills = set(s.lower() for s in extract_skills(job_description))
    missing = jd_skills - resume_skills
    # Return in original casing
    return [s for s in extract_skills(job_description) if s.lower() in missing]