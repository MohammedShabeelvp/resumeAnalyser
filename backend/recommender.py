from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from nlp_utils import clean_text
from job_roles import JOB_ROLES
from skill_extractor import extract_skills

# Load model — shared with bert_matcher if already loaded
from bert_matcher import model

# Pre-compute role embeddings at startup — not on every request
role_descriptions = [role["description"] for role in JOB_ROLES]
role_embeddings   = model.encode(role_descriptions)

def get_job_recommendations(resume_text, top_n=12):
    cleaned_resume   = clean_text(resume_text)
    resume_embedding = model.encode([cleaned_resume])[0]

    scores = cosine_similarity([resume_embedding], role_embeddings)[0]

    # Pair each role with its score
    ranked = sorted(
        zip(JOB_ROLES, scores),
        key=lambda x: x[1],
        reverse=True
    )

    resume_skills = extract_skills(resume_text)

    recommendations = []
    for role, score in ranked[:top_n]:
        # Generate a reason based on matching skills
        reason = generate_reason(resume_skills, role)
        recommendations.append({
            "role":   role["role"],
            "score":  round(float(score) * 100, 1),
            "reason": reason
        })

    return recommendations

def generate_reason(resume_skills, role):
    if not resume_skills:
        return f"Your profile aligns with {role['role']} responsibilities"

    # Find skills mentioned in the role description
    role_desc_lower  = role["description"].lower()
    matching_skills  = [
        skill for skill in resume_skills
        if skill.lower() in role_desc_lower
    ]

    if matching_skills:
        skills_str = ", ".join(matching_skills[:3])
        return f"Strong match due to {skills_str} experience"
    else:
        return f"Your profile aligns with {role['role']} responsibilities"