from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from nlp_utils import clean_text

def compute_tfidf_similarity(resume_text, job_description):
    # Clean both texts first
    cleaned_resume = clean_text(resume_text)
    cleaned_jd = clean_text(job_description)

    if not cleaned_resume or not cleaned_jd:
        return 0.0

    # Build TF-IDF matrix from both documents
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform([cleaned_resume, cleaned_jd])

    # Cosine similarity between resume (row 0) and JD (row 1)
    score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])

    # Convert to percentage rounded to 1 decimal
    return round(float(score[0][0]) * 100, 1)

def get_common_keywords(resume_text, job_description, top_n=10):
    cleaned_resume = clean_text(resume_text)
    cleaned_jd = clean_text(job_description)

    vectorizer = TfidfVectorizer(max_features=50)
    vectorizer.fit([cleaned_resume, cleaned_jd])

    resume_words = set(cleaned_resume.split())
    jd_words = set(cleaned_jd.split())

    # Words that appear in both
    common = resume_words.intersection(jd_words)

    # Filter to only meaningful words (length > 3)
    common = [w for w in common if len(w) > 3]

    return common[:top_n]