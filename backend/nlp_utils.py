import re
import nltk
import spacy

# Download required NLTK data (only runs once)
nltk.download("stopwords", quiet=True)
nltk.download("punkt", quiet=True)

from nltk.corpus import stopwords

# Load spaCy model
nlp = spacy.load("en_core_web_sm")

STOPWORDS = set(stopwords.words("english"))

def clean_text(text):
    # Lowercase
    text = text.lower()

    # Remove emails and URLs
    text = re.sub(r"\S+@\S+", "", text)
    text = re.sub(r"http\S+|www\S+", "", text)

    # Remove special characters and digits
    text = re.sub(r"[^a-z\s]", " ", text)

    # Collapse multiple spaces
    text = re.sub(r"\s+", " ", text).strip()

    return text

def tokenise(text):
    # Use spaCy for tokenisation and lemmatisation
    doc = nlp(text)

    tokens = [
        token.lemma_
        for token in doc
        if not token.is_stop
        and not token.is_punct
        and not token.is_space
        and len(token.lemma_) > 2
    ]

    return tokens

def clean_and_tokenise(text):
    cleaned = clean_text(text)
    tokens = tokenise(cleaned)
    return {
        "cleaned_text": cleaned,
        "tokens": tokens,
        "token_count": len(tokens),
        "unique_tokens": list(set(tokens))
    }