SKILLS = {
    "programming_languages": [
        "Python", "JavaScript", "TypeScript", "Java", "C", "C++",
        "C#", "Go", "Rust", "Swift", "Kotlin", "PHP", "Ruby", "Scala"
    ],  
    "frontend": [
        "React", "Vue", "Angular", "HTML", "CSS", "Tailwind",
        "Next.js", "Redux", "jQuery", "Bootstrap", "Sass"
    ],
    "backend": [
        "Flask", "Django", "FastAPI", "Node.js", "Express",
        "Spring", "Laravel", "Rails"
    ],
    "databases": [
        "SQL", "MySQL", "PostgreSQL", "MongoDB", "SQLite",
        "Redis", "Firebase", "Oracle", "Cassandra"
    ],
    "ai_ml": [
        "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
        "TensorFlow", "PyTorch", "Keras", "scikit-learn", "Pandas",
        "NumPy", "Matplotlib", "BERT", "Transformers", "OpenCV"
    ],
    "devops_cloud": [
        "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD",
        "Jenkins", "Git", "GitHub", "Linux", "Terraform", "Nginx"
    ],
    "tools": [
        "REST API", "GraphQL", "Postman", "Jira", "Figma",
        "VS Code", "Jupyter", "Excel", "Power BI", "Tableau"
    ]
}

# Flat list for easy matching
ALL_SKILLS = [skill for category in SKILLS.values() for skill in category]