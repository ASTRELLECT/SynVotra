# Astrellect Project

A FastAPI-powered backend API created by Team Astrellect.

## Project Overview

SynVotra is a robust API solution designed for managing employees, authentication, and other administrative functionalities. It provides a structured and scalable platform for business processes.

---

## Abstract Introduction

The development team's cooperative efforts were crucial in using a methodical approach to solve computational difficulties. They designed and implemented a solution that demonstrated efficiency and scalability by applying their technical expertise and problem-solving abilities. From strategy and research to execution and testing, every team member was essential to the success of the finished product.

In addition to creating a workable system, the project helped the team gain a deeper comprehension of practical development techniques. They explored topics like parallel processing and collaborative coding environments by applying theoretical ideas in programming, system design, and performance optimization to a practical task. Despite running into technological issues, these challenges improved development tactics and bolstered teamwork. The project also provided an opportunity to experience the entire software development lifecycle in a team environment, preparing the team to take on challenging technical duties in the future.

---

## Table of Contents

- [Team Members](#team-members)
- [Branches](#branches)
- [Merged Pull Requests](#merged-pull-requests)
- [Setup Instructions](#setup-instructions)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## Team Members

Unfortunately, I couldn't fetch the complete details of team members. Please ensure collaborators are listed manually.

---

## Branches

Here are some active branches in the repository:

- `feat_CompanyPolicy`
- `feat-SynVotra-example`
- `feat-admin-get-employee-profiles`
- `feat-announcement-apis`
- `feat-companyPolicy`
- `feat-database-alembic`
- `feat-errorMessage`
- `feat-get-avatars-init`
- `feat-landingpage`
- `feat-login-jwt`

For more details, visit the [Branches Page](https://github.com/ASTRELLECT/SynVotra/branches).

---

## Merged Pull Requests

Here is a list of recently merged pull requests:

```list type="pr"
data:
- url: "https://github.com/ASTRELLECT/SynVotra/pull/136"
  state: "closed"
  title: "Frontend/testimonial"
  number: 136
  merged_at: "2025-05-06T14:10:31Z"
  author: "savanamd21"
- url: "https://github.com/ASTRELLECT/SynVotra/pull/135"
  state: "closed"
  title: "updated sidebar.html and added back button"
  number: 135
  merged_at: "2025-05-06T12:35:57Z"
  author: "A5H1Q"
- url: "https://github.com/ASTRELLECT/SynVotra/pull/106"
  state: "closed"
  title: "Add home page dashboard for user groups UI - Frontend - Backlog (Sprint - 1)"
  number: 106
  merged_at: "2025-04-28T10:14:36Z"
  author: "aiswaryark111"
- url: "https://github.com/ASTRELLECT/SynVotra/pull/133"
  state: "closed"
  title: "company-logo and show employee details on header bar"
  number: 133
  merged_at: "2025-05-06T10:41:22Z"
  author: "aiswaryark111"
- url: "https://github.com/ASTRELLECT/SynVotra/pull/59"
  state: "closed"
  title: "updated all employee profiles page"
  number: 59
  merged_at: "2025-04-23T22:48:59Z"
  author: "A5H1Q"
- url: "https://github.com/ASTRELLECT/SynVotra/pull/107"
  state: "closed"
  title: "redirection from login to home-page html, logout js file"
  number: 107
  merged_at: "2025-05-06T10:35:21Z"
  author: "Ramineni-7"
- url: "https://github.com/ASTRELLECT/SynVotra/pull/131"
  state: "closed"
  title: "Frontend/announcement system UI for admin and manager"
  number: 131
  merged_at: "2025-05-05T17:53:37Z"
  author: "amitpramodphadol"
- url: "https://github.com/ASTRELLECT/SynVotra/pull/61"
  state: "closed"
  title: "feat: change password button is integrated with backend."
  number: 61
  merged_at: "2025-05-05T16:17:06Z"
  author: "savanamd21"
- url: "https://github.com/ASTRELLECT/SynVotra/pull/108"
  state: "closed"
  title: "Frontend/admin view all employees page"
  number: 108
  merged_at: "2025-05-05T00:28:56Z"
  author: "A5H1Q"
- url: "https://github.com/ASTRELLECT/SynVotra/pull/104"
  state: "closed"
  title: "Backend: Initialize avatars into database and fetch the avatars using the GET API"
  number: 104
  merged_at: "2025-04-26T19:07:40Z"
  author: "ashrej09"
```

For a complete list, visit the [Pull Requests Page](https://github.com/ASTRELLECT/SynVotra/pulls?q=is:pr+is:merged+sort:updated-desc).

---

## Setup Instructions

Follow the instructions below to set up the project:

### Ubuntu Setup
```bash
git clone https://github.com/ASTRELLECT/SynVotra.git
cd SynVotra
python3 -m venv ast_env
source ast_env/bin/activate
pip install -r requirements.txt
mkdir -p database
python src/database/init_db.py
```

### Windows Setup
```cmd
git clone https://github.com/ASTRELLECT/SynVotra.git
cd SynVotra
python -m venv ast_env
ast_env\Scripts\activate
pip install -r requirements.txt
mkdir database
python src\database\init_db.py
```

---

## Running the Application

### Ubuntu
```bash
uvicorn src.main:_get_app --host 0.0.0.0 --port 8000 --reload
```

### Windows
```cmd
uvicorn src.main:_get_app --reload
```

Access the API at [http://localhost:8000](http://localhost:8000).

---

## API Documentation

Access the documentation:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Project Structure

```
SynVotra/
├── database/                # Database directory
├── requirements.txt         # Python dependencies
├── src/                     # Application source code
│   ├── auth/                # Authentication modules
│   ├── database/            # Database modules
│   ├── main.py              # Main application entry point
│   ├── pydantic_model/      # Pydantic schemas
│   ├── resources/           # Resources and constants
│   └── routes/              # API routes
├── static/                  # Static files
└── templates/               # Jinja2 templates
```

---

## Troubleshooting

1. **"Could not validate credentials"** - JWT token is missing or expired. Log in again.
2. **"Not enough permissions"** - Use an admin account to access the endpoint.
3. **Database tables not appearing** - Ensure models are properly defined and imported.

---

Feel free to add more details or refine as per the team’s requirements!
