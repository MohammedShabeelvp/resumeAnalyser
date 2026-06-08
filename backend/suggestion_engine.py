from ats_scorer import score_skills, score_experience, score_education
from skill_extractor import extract_skills
from keyword_analyzer import analyze_gaps
from matcher import compute_tfidf_similarity

def generate_suggestions(resume_text, job_description=None, ats_data=None, gaps_data=None):
    suggestions = []

    # Use provided data or compute fresh
    resume_skills = extract_skills(resume_text)

    if gaps_data:
        gaps = gaps_data
    elif job_description:
        gaps = analyze_gaps(resume_text, job_description)
    else:
        gaps = None

    if ats_data:
        breakdown = ats_data.get("breakdown", {})
    else:
        breakdown = {}

    # ── Skills suggestions ──────────────────────────────
    skills_score = breakdown.get("skills", {}).get("score", 0)

    if gaps and gaps["missing"]["skills"]:
        missing = gaps["missing"]["skills"]
        priority = "high" if len(missing) > 3 else "medium"
        skills_str = ", ".join(missing[:3])
        suffix = f" and {len(missing) - 3} more" if len(missing) > 3 else ""
        suggestions.append({
            "type":     "missing_skill",
            "priority": priority,
            "message":  f"Add {skills_str}{suffix} to your resume — these skills appear in the job description"
        })

    if len(resume_skills) < 5:
        suggestions.append({
            "type":     "missing_skill",
            "priority": "high",
            "message":  "Your resume has very few detected skills — add a dedicated skills section with your technical stack"
        })

    # ── Experience suggestions ───────────────────────────
    experience_score = breakdown.get("experience", {}).get("score", 0)

    if experience_score < 50:
        suggestions.append({
            "type":     "experience",
            "priority": "high",
            "message":  "No clear experience duration detected — add explicit dates (e.g. 'June 2021 – Present') to each role"
        })
    elif experience_score < 75:
        suggestions.append({
            "type":     "experience",
            "priority": "medium",
            "message":  "Quantify your achievements — add metrics like 'improved performance by 30%' or 'managed a team of 5'"
        })

    # Check for action verbs
    if gaps and gaps["missing"]["action_verbs"]:
        verbs = ", ".join(gaps["missing"]["action_verbs"][:3])
        suggestions.append({
            "type":     "experience",
            "priority": "medium",
            "message":  f"Use stronger action verbs — try words like {verbs} to describe your work"
        })

    # ── Education suggestions ────────────────────────────
    education_score = breakdown.get("education", {}).get("score", 0)

    if education_score < 50:
        suggestions.append({
            "type":     "education",
            "priority": "medium",
            "message":  "No clear education level detected — add your degree, institution, and graduation year"
        })
    elif education_score < 75:
        suggestions.append({
            "type":     "education",
            "priority": "low",
            "message":  "Consider adding relevant certifications (AWS, Google, Microsoft) to strengthen your profile"
        })

    # ── Keyword suggestions ──────────────────────────────
    keywords_score = breakdown.get("keywords", {}).get("score", 0)

    if gaps and gaps["missing"]["domain_terms"]:
        terms = ", ".join(gaps["missing"]["domain_terms"][:3])
        suggestions.append({
            "type":     "keywords",
            "priority": "high",
            "message":  f"Include industry terms like {terms} — these improve ATS keyword matching"
        })

    if gaps and gaps["missing"]["soft_skills"]:
        soft = ", ".join(gaps["missing"]["soft_skills"][:2])
        suggestions.append({
            "type":     "keywords",
            "priority": "low",
            "message":  f"Mention soft skills like {soft} — many ATS systems screen for these"
        })

    if keywords_score < 30:
        suggestions.append({
            "type":     "keywords",
            "priority": "high",
            "message":  "Your resume has low keyword overlap with the job description — tailor your resume language to mirror the JD"
        })

    # ── General suggestions ──────────────────────────────
    resume_length = len(resume_text.split())

    if resume_length < 200:
        suggestions.append({
            "type":     "general",
            "priority": "high",
            "message":  "Your resume seems short — aim for 400–600 words covering experience, skills, and education"
        })
    elif resume_length > 1000:
        suggestions.append({
            "type":     "general",
            "priority": "low",
            "message":  "Your resume may be too long — keep it to one page for early-career roles, two pages maximum"
        })

    # Sort by priority
    priority_order = {"high": 0, "medium": 1, "low": 2}
    suggestions.sort(key=lambda x: priority_order.get(x["priority"], 6))

    return suggestions[:6]  # cap at 6 suggestions