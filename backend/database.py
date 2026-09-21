import sqlite3
import os
from datetime import datetime

DB_PATH = "resume_analyzer.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # returns dict-like rows
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            name          TEXT NOT NULL,
            email         TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            is_verified       INTEGER DEFAULT 0,
            created_at    TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS uploads (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER,
            filename    TEXT NOT NULL,
            upload_time TEXT NOT NULL,
            skill_count INTEGER DEFAULT 0,
            skills      TEXT DEFAULT '',
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analyses (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            upload_id        INTEGER,
            name             TEXT DEFAULT '',
            job_role         TEXT DEFAULT '',
            job_description  TEXT,
            similarity_score REAL,
            ats_score        REAL,
            ats_label        TEXT,
            missing_count    INTEGER DEFAULT 0,
            common_keywords  TEXT DEFAULT '',
            resume_text      TEXT DEFAULT '',
            analysis_time    TEXT NOT NULL,
            FOREIGN KEY (upload_id) REFERENCES uploads(id)
        )
    """)

    conn.commit()
    conn.close()

def save_upload(filename, skill_count, skills, user_id=None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO uploads (user_id, filename, upload_time, skill_count, skills)
        VALUES (?, ?, ?, ?, ?)
    """, (
        user_id,
        filename,
        datetime.now().isoformat(),
        skill_count,
        ", ".join(skills)
    ))
    conn.commit()
    upload_id = cursor.lastrowid
    conn.close()
    return upload_id

def save_analysis(upload_id, job_description, similarity_score,
                  ats_score, ats_label, missing_count,
                  common_keywords, name="", job_role="", resume_text=""):
    conn = get_connection()
    cursor = conn.cursor()

    # Auto-generate name if not provided: Analysis 01, Analysis 02 etc
    if not name:
        count = cursor.execute(
            "SELECT COUNT(*) FROM analyses WHERE upload_id IN "
            "(SELECT id FROM uploads WHERE user_id = "
            "(SELECT user_id FROM uploads WHERE id = ?))",
            (upload_id,)
        ).fetchone()[0]
        name = f"Analysis {str(count + 1).zfill(2)}"

    cursor.execute("""
        INSERT INTO analyses (
            upload_id, name, job_role, job_description,
            similarity_score, ats_score, ats_label,
            missing_count, common_keywords, resume_text, analysis_time
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        upload_id,
        name,
        job_role,
        job_description[:500],
        similarity_score,
        ats_score,
        ats_label,
        missing_count,
        ", ".join(common_keywords) if isinstance(common_keywords, list) else common_keywords,
        resume_text[:3000],  # store enough for rematching
        datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()

def rename_analysis(analysis_id, new_name):
    conn = get_connection()
    conn.execute(
        "UPDATE analyses SET name = ? WHERE id = ?",
        (new_name.strip(), analysis_id)
    )
    conn.commit()
    conn.close()

def get_analysis_by_id(analysis_id):
    conn = get_connection()
    cursor = conn.cursor()
    row = cursor.execute(
        "SELECT * FROM analyses WHERE id = ?", (analysis_id,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None

def get_history(user_id, limit=20):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            a.id,
            a.name,
            a.job_role,
            a.job_description,
            a.similarity_score,
            a.ats_score,
            a.ats_label,
            a.missing_count,
            a.common_keywords,
            a.resume_text,
            a.analysis_time,
            u.filename,
            u.skill_count,
            u.skills
        FROM analyses a
        JOIN uploads u ON a.upload_id = u.id
        WHERE u.user_id = ?
        ORDER BY a.analysis_time DESC
        LIMIT ?
    """, (user_id, limit))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def delete_analysis(analysis_id):
    conn = get_connection()
    cursor = conn.cursor()

    # Get the upload_id before deleting
    row = cursor.execute(
        "SELECT upload_id FROM analyses WHERE id = ?", (analysis_id,)
    ).fetchone()

    # Delete the analysis
    cursor.execute("DELETE FROM analyses WHERE id = ?", (analysis_id,))

    # Only delete the upload if no other analyses reference it
    if row:
        remaining = cursor.execute(
            "SELECT COUNT(*) FROM analyses WHERE upload_id = ?",
            (row["upload_id"],)
        ).fetchone()[0]

        if remaining == 0:
            cursor.execute(
                "DELETE FROM uploads WHERE id = ?", (row["upload_id"],)
            )

    conn.commit()
    conn.close()

def delete_all_history():
    conn = get_connection()
    cursor = conn.cursor()

    # Delete analyses first (child table)
    cursor.execute("DELETE FROM analyses")

    # Then delete all uploads (parent table)
    cursor.execute("DELETE FROM uploads")

    # Reset auto-increment counters
    cursor.execute("DELETE FROM sqlite_sequence WHERE name='analyses'")
    cursor.execute("DELETE FROM sqlite_sequence WHERE name='uploads'")

    conn.commit()
    conn.close()

def create_user(name, email, password_hash):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO users (name, email, password_hash, created_at)
            VALUES (?, ?, ?, ?)
        """, (name, email, password_hash, datetime.now().isoformat()))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return user_id
    except Exception as e:
        conn.close()
        return None

def get_user_by_email(email):
    conn = get_connection()
    cursor = conn.cursor()
    user = cursor.execute(
        "SELECT * FROM users WHERE email = ?", (email,)
    ).fetchone()
    conn.close()
    return dict(user) if user else None

def get_user_by_id(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    user = cursor.execute(
        "SELECT * FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    conn.close()
    return dict(user) if user else None

def set_user_verified(user_id):
    conn = get_connection()
    conn.execute(
        "UPDATE users SET is_verified = 1 WHERE id = ?", (user_id,)
    )
    conn.commit()
    conn.close()

def update_user_password(user_id, new_password_hash):
    conn = get_connection()
    conn.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        (new_password_hash, user_id)
    )
    conn.commit()
    conn.close()