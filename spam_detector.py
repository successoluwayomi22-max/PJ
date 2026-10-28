"""
NLP Application: Spam Detection System
Lab Work / Practical
CYB 305 / NLP Module

This script implements a complete spam detection pipeline using:
  - Text preprocessing (tokenization, stop-word removal)
  - Feature extraction (Bag of Words & TF-IDF)
  - Naive Bayes classifier
  - Accuracy evaluation
"""

import re
import string
from collections import Counter

# ─────────────────────────────────────────────
# STEP 1: SAMPLE DATASET (Spam & Ham)
# ─────────────────────────────────────────────

emails = [
    # SPAM
    ("Congratulations! You've WON a FREE iPhone. Click here to claim your prize NOW!", "spam"),
    ("URGENT: Your bank account has been suspended. Verify your details immediately.", "spam"),
    ("Get rich quick! Earn $5000 a day working from home. No experience needed!", "spam"),
    ("You are selected for a FREE vacation package. Call now to redeem!", "spam"),
    ("BUY cheap Viagra and Cialis online. No prescription required. 90% OFF!", "spam"),
    ("WINNER!! As a valued customer you have been selected to receive a prize.", "spam"),
    ("Click here to unsubscribe and claim your FREE gift card worth $500.", "spam"),
    ("Make money fast! Send this email to 10 people and get $100 in 24 hours.", "spam"),
    ("Your PayPal account has been compromised. Verify now or your account will close.", "spam"),
    ("Hot singles in your area are waiting to meet YOU! Sign up FREE today.", "spam"),
    ("FINAL NOTICE: Your subscription has expired. Act now to avoid charges.", "spam"),
    ("Lose 30 pounds in 30 days with this miracle pill doctors don't want you to know.", "spam"),

    # HAM (Non-Spam)
    ("Hi John, can we reschedule our meeting to Thursday afternoon?", "ham"),
    ("Please find attached the quarterly report for your review.", "ham"),
    ("Reminder: Team standup tomorrow at 9 AM in the main conference room.", "ham"),
    ("Thanks for submitting your assignment. I will review it and get back to you.", "ham"),
    ("Your order has been shipped and will arrive within 3-5 business days.", "ham"),
    ("Could you please send me the updated project timeline?", "ham"),
    ("Happy birthday! Hope you have a wonderful day.", "ham"),
    ("The lecture slides for Chapter 4 have been uploaded to the portal.", "ham"),
    ("Just checking in — are you available for a call tomorrow morning?", "ham"),
    ("Your appointment is confirmed for Friday at 2:00 PM. Please arrive 10 minutes early.", "ham"),
    ("I wanted to follow up on the proposal we discussed last week.", "ham"),
    ("Great work on the presentation today! The client was very impressed.", "ham"),
]

# ─────────────────────────────────────────────
# STEP 2A: TOKENIZATION
# ─────────────────────────────────────────────

def tokenize(text):
    """Convert text to lowercase tokens, removing punctuation."""
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    tokens = text.split()
    return tokens

# ─────────────────────────────────────────────
# STEP 2B: STOP-WORD REMOVAL
# ─────────────────────────────────────────────

STOP_WORDS = {
    "i", "me", "my", "we", "our", "you", "your", "he", "she", "they", "them",
    "it", "its", "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
    "for", "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "not", "no", "so", "if", "as", "up", "out", "about", "this", "that",
    "which", "who", "what", "when", "where", "how", "all", "more", "also", "just",
    "can", "may", "then", "than", "into", "over", "after", "here", "there"
}

def remove_stopwords(tokens):
    """Remove common stop words from token list."""
    return [t for t in tokens if t not in STOP_WORDS]

def preprocess(text):
    """Full preprocessing pipeline: tokenize + remove stop words."""
    return remove_stopwords(tokenize(text))

# ─────────────────────────────────────────────
# STEP 2C: FEATURE EXTRACTION
# ─────────────────────────────────────────────

class BagOfWords:
    """Bag of Words vectorizer (manual implementation)."""

    def __init__(self):
        self.vocabulary = []

    def fit(self, corpus):
        all_words = set()
        for tokens in corpus:
            all_words.update(tokens)
        self.vocabulary = sorted(list(all_words))

    def transform(self, corpus):
        vectors = []
        for tokens in corpus:
            count = Counter(tokens)
            vector = [count.get(word, 0) for word in self.vocabulary]
            vectors.append(vector)
        return vectors


class TFIDF:
    """TF-IDF vectorizer (manual implementation)."""

    def __init__(self):
        self.vocabulary = []
        self.idf = {}

    def fit(self, corpus):
        import math
        all_words = set()
        for tokens in corpus:
            all_words.update(tokens)
        self.vocabulary = sorted(list(all_words))

        N = len(corpus)
        for word in self.vocabulary:
            df = sum(1 for tokens in corpus if word in tokens)
            self.idf[word] = math.log((N + 1) / (df + 1)) + 1  # smoothed

    def transform(self, corpus):
        vectors = []
        for tokens in corpus:
            count = Counter(tokens)
            total = len(tokens) if tokens else 1
            vector = []
            for word in self.vocabulary:
                tf = count.get(word, 0) / total
                tfidf_val = tf * self.idf.get(word, 0)
                vector.append(tfidf_val)
            vectors.append(vector)
        return vectors

# ─────────────────────────────────────────────
# STEP 3: NAIVE BAYES CLASSIFIER
# ─────────────────────────────────────────────

class NaiveBayes:
    """Multinomial Naive Bayes classifier."""

    def __init__(self, alpha=1.0):
        self.alpha = alpha  # Laplace smoothing
        self.classes = []
        self.class_priors = {}
        self.feature_probs = {}

    def fit(self, X, y):
        import math
        self.classes = list(set(y))
        n_samples = len(y)
        n_features = len(X[0])

        for cls in self.classes:
            cls_indices = [i for i, label in enumerate(y) if label == cls]
            self.class_priors[cls] = math.log(len(cls_indices) / n_samples)

            cls_vectors = [X[i] for i in cls_indices]
            feature_sums = [sum(v[f] for v in cls_vectors) for f in range(n_features)]
            total = sum(feature_sums) + self.alpha * n_features

            self.feature_probs[cls] = [
                math.log((feature_sums[f] + self.alpha) / total)
                for f in range(n_features)
            ]

    def predict_one(self, x):
        scores = {}
        for cls in self.classes:
            score = self.class_priors[cls]
            for f, val in enumerate(x):
                if val > 0:
                    score += val * self.feature_probs[cls][f]
            scores[cls] = score
        return max(scores, key=scores.get)

    def predict(self, X):
        return [self.predict_one(x) for x in X]

# ─────────────────────────────────────────────
# STEP 4: TRAIN & TEST
# ─────────────────────────────────────────────

def train_test_split(data, test_ratio=0.25, seed=42):
    """Simple deterministic train/test split."""
    import random
    random.seed(seed)
    shuffled = data[:]
    random.shuffle(shuffled)
    split = int(len(shuffled) * (1 - test_ratio))
    return shuffled[:split], shuffled[split:]

def accuracy(y_true, y_pred):
    correct = sum(1 for t, p in zip(y_true, y_pred) if t == p)
    return correct / len(y_true) * 100

def run_pipeline(vectorizer_class, name):
    train_data, test_data = train_test_split(emails)

    train_texts = [e[0] for e in train_data]
    train_labels = [e[1] for e in train_data]
    test_texts  = [e[0] for e in test_data]
    test_labels  = [e[1] for e in test_data]

    # Preprocess
    train_tokens = [preprocess(t) for t in train_texts]
    test_tokens  = [preprocess(t) for t in test_texts]

    # Vectorize
    vec = vectorizer_class()
    vec.fit(train_tokens)
    X_train = vec.transform(train_tokens)
    X_test  = vec.transform(test_tokens)

    # Train
    model = NaiveBayes()
    model.fit(X_train, train_labels)

    # Predict & evaluate
    preds = model.predict(X_test)
    acc = accuracy(test_labels, preds)

    print(f"\n{'='*55}")
    print(f" Feature Method : {name}")
    print(f"{'='*55}")
    print(f" Training samples : {len(train_data)}")
    print(f" Testing  samples : {len(test_data)}")
    print(f" Accuracy         : {acc:.1f}%")
    print(f"\n {'Email Preview':<40} {'True':>6} {'Pred':>6}")
    print(f" {'-'*40} {'------':>6} {'------':>6}")
    for text, true, pred in zip(test_texts, test_labels, preds):
        status = "✓" if true == pred else "✗"
        print(f" {status} {text[:38]:<38} {true:>6} {pred:>6}")

    return acc, test_labels, preds

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

if __name__ == "__main__":
    print("\n" + "="*55)
    print("  NLP LAB: SPAM DETECTION SYSTEM")
    print("  Naive Bayes Classifier")
    print("="*55)

    # Demo tokenization
    sample = emails[0][0]
    print(f"\n[TOKENIZATION DEMO]")
    print(f"  Original  : {sample}")
    tokens = tokenize(sample)
    print(f"  Tokens    : {tokens}")
    clean = remove_stopwords(tokens)
    print(f"  No stops  : {clean}")

    # Run both methods
    bow_acc, _, _ = run_pipeline(BagOfWords, "Bag of Words (BoW)")
    tfidf_acc, _, _ = run_pipeline(TFIDF, "TF-IDF")

    print(f"\n{'='*55}")
    print(f"  SUMMARY")
    print(f"{'='*55}")
    print(f"  Bag of Words Accuracy : {bow_acc:.1f}%")
    print(f"  TF-IDF Accuracy       : {tfidf_acc:.1f}%")
    print(f"{'='*55}\n")
