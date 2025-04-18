# Astrellect API

A FastAPI-powered backend API created by Team Astrellect.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
  - [Ubuntu Setup](#ubuntu-setup)
  - [Windows Setup](#windows-setup)
- [Database Management](#database-management)
  - [Database Initialization](#database-initialization)
  - [Verifying Database Structure](#verifying-database-structure)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Development Workflows](#development-workflows)
  - [Adding New Models](#adding-new-models)
  - [Adding New Routes](#adding-new-routes)
  - [Updating Existing Models](#updating-existing-models)
  - [Database Reset](#database-reset)
- [API Resources](#api-resources)
  - [Users/Employees API](#usersemployees-api)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)

## Prerequisites

- Python 3.8+
- pip (Python package installer)
- Git (optional, for cloning the repository)

## Setup Instructions

### Ubuntu Setup

1. **Clone the repository** (if using Git):

   ```bash
   git clone https://github.com/ASTRELLECT/SynVotra.git
   cd SynVotra
   ```

2. **Create and activate a virtual environment**:

   ```bash
   python3 -m venv ast_env
   source ast_env/bin/activate
   ```

3. **Install dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

   If requirements.txt is missing, install these packages:

   ```bash
   pip install fastapi uvicorn sqlalchemy passlib bcrypt python-jose pydantic python-multipart jinja2
   ```

4. **Create database directory**:

   ```bash
   mkdir -p database
   ```

5. **Initialize the database**:

   ```bash
   # Create database and tables
   python src/database/init_db.py
   ```

### Windows Setup

1. **Clone the repository** (if using Git):

   ```cmd
   git clone https://github.com/ASTRELLECT/SynVotra.git
   cd SynVotra
   ```

2. **Create and activate a virtual environment**:

   ```cmd
   python -m venv ast_env
   ast_env\Scripts\activate
   ```

3. **Install dependencies**:

   ```cmd
   pip install -r requirements.txt
   ```

   If requirements.txt is missing, install these packages:

   ```cmd
   pip install fastapi uvicorn sqlalchemy passlib bcrypt python-jose pydantic python-multipart jinja2
   ```

4. **Create database directory**:

   ```cmd
   mkdir database
   ```

5. **Initialize the database**:

   ```cmd
   python src\database\init_db.py
   ```

## Database Management

The application uses SQLAlchemy ORM with SQLite database. The database schema is managed directly through SQLAlchemy model definitions.

### Database Initialization

The database is automatically initialized when the application starts. The initialization process:

1. Creates all tables defined in the models
2. Creates an admin user if one doesn't exist

You can manually initialize the database by running:

#### Ubuntu

```bash
python src/database/init_db.py
```

#### Windows

```cmd
python src\database\init_db.py
```
## Running the Application

### Ubuntu

```bash
uvicorn src.main:_get_app --host 0.0.0.0 --port 8000 --reload
```

### Windows

```cmd
uvicorn src.main:_get_app --reload
```

The API will be available at http://localhost:8000

## API Documentation

Once the server is running, you can access:

- Swagger UI documentation: http://localhost:8000/docs
- ReDoc documentation: http://localhost:8000/redoc

## Project Structure

```
SynVotra/
│
│
├── database/                # Database directory
│   └── astrellect.db        # SQLite database file
│
├── requirements.txt         # Python dependencies
│
├── src/                     # Application source code
│   ├── database/            # Database related modules
│   │   ├── __init__.py      # Database connection setup
│   │   ├── base.py          # SQLAlchemy Base
│   │   ├── crud.py          # CRUD operations
│   │   ├── init_db.py       # Database initialization
│   │   ├── models.py        # SQLAlchemy models
│   │   └── utils.py         # Database utilities
│   │
│   ├── main.py              # Main application entry point
│   │
│   ├── pydantic_model/      # Pydantic schemas
│   │   ├── users.py         # User schemas
│   │   └── [other_schemas].py # Other schema files
│   │
│   ├── resources/           # Resources and constants
│   │   └── constants.py     # Application constants
│   │
│   └── routes/              # API routes
│       ├── __init__.py      # Routes registration
│       ├── users.py         # Users endpoints
│       └── [other_routes].py # Other route files
│
├── static/                  # Static files
│
└── templates/               # Jinja2 templates
```

## Development Workflows

### Adding New Models

When adding new models to your application:

1. **Define the model** in `src/database/models.py`
2. **Create Pydantic schemas** for API requests/responses in `src/pydantic_model/`
3. **Update the database initialization script** if needed
4. **Run the initialization script** to recreate the database schema:
   ```bash
   python src/database/init_db.py
   ```
5. **Create API routes** in the appropriate files
6. **Register the routes** in `src/