from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from nlp_utils import clean_text

# Load model once at module level — not on every request
model = SentenceTransformer('all-MiniLM-L6-v2')

def compute_bert_similarity(resume_text, job_description):
    # Clean both texts first
    cleaned_resume = clean_text(resume_text)
    cleaned_jd     = clean_text(job_description)

    if not cleaned_resume or not cleaned_jd:
        return 0.0

    # Generate embeddings
    embeddings = model.encode([cleaned_resume, cleaned_jd])

    # Cosine similarity between the two vectors
    score = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]

    return round(float(score) * 100, 1)

def compute_section_similarity(resume_sections, job_description):
    if not resume_sections or not job_description:
        return {}

    cleaned_jd = clean_text(job_description)
    jd_embedding = model.encode([cleaned_jd])[0]

    results = {}
    for section_name, section_text in resume_sections.items():
        if not section_text.strip():
            continue
        cleaned = clean_text(section_text)
        section_embedding = model.encode([cleaned])[0]
        score = cosine_similarity([section_embedding], [jd_embedding])[0][0]
        results[section_name] = round(float(score) * 100, 1)

    return results

def get_combined_score(tfidf_score, bert_score):
    # Weighted combination — BERT carries more weight
    combined = (tfidf_score * 0.35) + (bert_score * 0.65)
    return round(combined, 1)