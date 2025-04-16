# Astrellect API

A FastAPI-powered backend API created by Team Astrellect.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
  - [Ubuntu Setup](#ubuntu-setup)
  - [Windows Setup](#windows-setup)
- [Database Management](#database-management)
  - [Setting Up Alembic](#setting-up-alembic)
  - [Creating Migrations](#creating-migrations)
  - [Running Migrations](#running-migrations)
  - [Verifying Database Structure](#verifying-database-structure)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Development Workflows](#development-workflows)
  - [Adding New Models](#adding-new-models)
  - [Updating Existing Models](#updating-existing-models)
  - [Database Reset](#database-reset)

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
   pip install fastapi uvicorn sqlalchemy passlib bcrypt python-jose pydantic alembic python-multipart jinja2
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
   pip install fastapi uvicorn sqlalchemy passlib bcrypt python-jose pydantic alembic python-multipart jinja2
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

### Setting Up Alembic

Alembic is used for database migrations. Here's how to set it up:

#### Ubuntu

```bash
# Install Alembic if not already installed
pip install alembic

# Initialize Alembic in your project
alembic init alembic
```

#### Windows

```cmd
pip install alembic
alembic init alembic
```

After initialization, you'll need to edit the `alembic.ini` file:

1. Update the `sqlalchemy.url` to point to your database:
   ```
   sqlalchemy.url = sqlite:///./database/astrellect.db
   ```

2. Edit the `env.py` file in the alembic directory to import your models:
   ```python
   # Add these lines near the top of the file
   import sys
   import os
   sys.path.append(os.path.abspath(os.path.dirname(os.path.dirname(__file__))))
   
   # Import your models and Base
   from src.database import Base
   from src.database.models import User, Role, Session, PasswordResetToken, AttendanceRecord
   
   # Update target_metadata
   target_metadata = Base.metadata
   ```

### Creating Migrations

When you make changes to your models, create a new migration:

#### Ubuntu

```bash
# Create an initial migration
alembic revision --autogenerate -m "Initial migration"

# Create migration after model changes
alembic revision --autogenerate -m "Description of changes"
```

#### Windows

```cmd
alembic revision --autogenerate -m "Initial migration"
alembic revision --autogenerate -m "Description of changes"
```

### Running Migrations

To apply all pending migrations:

#### Ubuntu

```bash
alembic upgrade head
```

#### Windows

```cmd
alembic upgrade head
```

To apply a specific migration (replace `revision_id` with your migration ID):

```bash
alembic upgrade revision_id
```

To downgrade to a previous migration:

```bash
alembic downgrade -1  # Go back one migration
```

To see migration history:

```bash
alembic history
```

To see current revision:

```bash
alembic current
```

### Verifying Database Structure

You can check your database structure using the provided check_database.py script:

#### Ubuntu

```bash
python check_database.py
```

#### Windows

```cmd
python check_database.py
```

This will show all tables in your database along with their columns, helping you verify that everything is set up correctly.

## Running the Application

### Ubuntu

```bash
# With Uvicorn directly
uvicorn src.main:_get_app --reload

# Or with a host and port specified
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
├── alembic/                 # Alembic migrations directory
│   ├── versions/            # Migration versions
│   └── env.py               # Alembic environment configuration
│
├── alembic.ini              # Alembic configuration file
│
├── check_database.py        # Script to verify database structure
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
│   │   ├── schemas.py       # Pydantic schemas
│   │   └── utils.py         # Database utilities
│   │
│   ├── main.py              # Main application entry point
│   │
│   ├── pydantic_model/      # Pydantic schemas
│   │   ├── pages.py         # Page schemas
│   │   └── users.py         # User schemas
│   │
│   ├── resources/           # Resources and constants
│   │   └── constants.py     # Application constants
│   │
│   └── routes/              # API routes
│       ├── __init__.py      # Routes registration
│       ├── pages.py         # Pages endpoints
│       └── users.py         # Users endpoints
│
├── static/                  # Static files
│
└── templates/               # Jinja2 templates
```

## Development Workflows

### Adding New Models

When adding new models to your application:

1. **Define the model** in `src/database/models.py`
2. **Create Pydantic schemas** for API requests/responses
3. **Create a migration**:
   ```bash
   alembic revision --autogenerate -m "Add new model"
   ```
4. **Apply the migration**:
   ```bash
   alembic upgrade head
   ```
5. **Create API routes** in the appropriate files
6. **Register the routes** in `src/routes/__init__.py`

### Updating Existing Models

When modifying existing models:

1. **Update the model definition** in `src/database/models.py`
2. **Update any affected Pydantic schemas**
3. **Create a migration for the changes**:
   ```bash
   alembic revision --autogenerate -m "Update model"
   ```
4. **Apply the migration**:
   ```bash
   alembic upgrade head
   ```
5. **Update any affected API handlers**

### Database Reset

If you need to reset your database during development:

#### Ubuntu

```bash
# Remove the existing database
rm -f database/astrellect.db

# Initialize the database
python src/database/init_db.py

# Apply migrations
alembic upgrade head
```

#### Windows

```cmd
del database\astrellect.db
python src\database\init_db.py
alembic upgrade head
```

## Troubleshooting

### Common Issues

**1. bcrypt version error:**

If you see an error message about bcrypt version:

```
(trapped) error reading bcrypt version
```

Try upgrading both bcrypt and passlib:

```bash
pip install --upgrade bcrypt passlib
```

**2. SQLite database does not exist:**

Make sure the database directory exists:

```bash
# Ubuntu
mkdir -p database

# Windows
mkdir database
```

**3. Tables not creating properly:**

Run the check_database.py script to verify the database state:

```bash
python check_database.py
```

**4. Alembic can't find models:**

Make sure your models are properly imported in the Alembic env.py file and that your project structure is correctly configured in the Python path.

**5. Alembic migration fails with "Can't locate revision":**

You might need to create a base migration first:

```bash
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

**6. Missing dependencies:**

If you get import errors, make sure you've installed all required packages:

```bash
pip install -r requirements.txt
```