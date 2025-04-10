Here is a complete `README.md` file template for your FastAPI project with Alembic and SQLite for database management:

---

# FastAPI Project with Alembic and SQLite

This is a FastAPI project that uses Alembic for database migrations and SQLite as the database engine. The guide below covers how to set up, configure, and manage your database, including creating tables, adding new columns, and running migrations.

---

## Table of Contents

- [Project Setup](#project-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Database Management with Alembic](#database-management-with-alembic)
  - [1. Create New Tables/Columns](#1-create-new-tablescolumns)
  - [2. Generate Migrations](#2-generate-migrations)
  - [3. Apply Migrations](#3-apply-migrations)
  - [4. Database Initialization Script](#4-database-initialization-script)
- [Testing the Application](#testing-the-application)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Project Setup

### 1. Clone the repository:

```bash
git clone https://github.com/yourusername/yourproject.git
cd yourproject
```

### 2. Set up a virtual environment:

For Python 3.10 or higher:

```bash
python3 -m venv ast_env
source ast_env/bin/activate  # On Windows use: ast_env\Scripts\activate
```

### 3. Install the dependencies:

```bash
pip install -r requirements.txt
```

---

## Database Setup

The project uses SQLite by default for simplicity, but you can configure it to use any database supported by SQLAlchemy.

### 1. Install SQLite (if not installed):

SQLite comes pre-installed with Python. If you're using a different database (e.g., PostgreSQL or MySQL), install the required drivers:

```bash
pip install psycopg2  # For PostgreSQL
pip install mysqlclient  # For MySQL
```

### 2. Set up Alembic:

Alembic is a database migration tool for SQLAlchemy. To set it up:

```bash
alembic init alembic
```

This will create an `alembic/` folder and an `alembic.ini` file. The `alembic.ini` file contains the configuration settings for your database connection.

---

## Running the Application

### 1. Set up the database URL:

In the `alembic.ini` file, set the `sqlalchemy.url` to point to your SQLite database (or any other supported database).

For SQLite:

```ini
sqlalchemy.url = sqlite:///./test.db
```

### 2. Create your database tables:

FastAPI uses SQLAlchemy for database interactions. The tables are defined in `src/models.py`. Ensure the models are properly set up before applying migrations.

### 3. Run the FastAPI app:

To run the application:

```bash
uvicorn src.main:app --reload
```

Your application will be running at `http://localhost:8000`.

---

## Database Management with Alembic

Alembic is used to handle schema changes (like adding new columns or tables). Follow the steps below to manage database migrations:

### 1. Create New Tables/Columns

To add new tables or columns, edit the SQLAlchemy models in `src/models.py`. For example, to add a new `date_of_birth` column to the `User` table:

```python
from sqlalchemy import Column, Integer, String, Boolean
from src.database import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)
    date_of_birth = Column(String, nullable=True)  # New column
```

### 2. Generate Migrations

After modifying your models, generate a new Alembic migration to reflect the changes in the database:

```bash
alembic revision --autogenerate -m "Added date_of_birth column to users table"
```

Alembic will compare the current database schema with the models and generate a migration file in the `alembic/versions/` folder.

### 3. Apply Migrations

To apply the migration and update the database schema, run:

```bash
alembic upgrade head
```

This command will apply all pending migrations, updating the database schema accordingly.

### 4. Database Initialization Script

If you need to populate the database with initial data (like creating an admin user), use a script like `init_db.py`.

Here’s an example of how to create an admin user:

```python
from sqlalchemy.orm import Session
from src.database import SessionLocal, engine
from src.models import User

def init():
    db = SessionLocal()
    admin_user = db.query(User).filter(User.email == "admin@astrellect.com").first()
    
    if not admin_user:
        admin_user = User(
            name="Admin",
            email="admin@astrellect.com",
            hashed_password="Amit@123#",  # Hash this password using a proper method in production
            is_admin=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print("✅ Admin user created")
    else:
        print("Admin user already exists.")

if __name__ == "__main__":
    init()
```

To run the script:

```bash
python src/database/init_db.py
```

This will ensure that the required initial data (like the admin user) is added to your database.

---

## Testing the Application

### 1. Run Tests

You can use FastAPI's test client to test your API. For example:

```python
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_create_user():
    response = client.post(
        "/users/",
        json={"name": "John", "email": "john@example.com", "password": "securepassword", "date_of_birth": "1990-01-01"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "john@example.com"
```

Run the tests using:

```bash
pytest
```

### 2. Database Testing

Ensure that the database updates are reflected in your tests. You can use a test database to run your migrations and test cases.

---

## Deployment

### 1. Prepare for Production

Before deploying to production, ensure that all database migrations are applied. Run the following in your production environment:

```bash
alembic upgrade head
```

### 2. Run the Application

To run the application in production, use the `uvicorn` command:

```bash
uvicorn src.main:_get_app
---

## Troubleshooting

### 1. Error: `sqlite3.OperationalError: no such table: users`

This error occurs when the database schema is outdated. Make sure that migrations have been applied:

```bash
alembic upgrade head
```

### 2. Error: `trapped error reading bcrypt version`

This error indicates an issue with the `bcrypt` library. Ensure it's installed properly:

```bash
pip install bcrypt
```

Also, check for version compatibility between `passlib` and `bcrypt`.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

This `README.md` file serves as a guide for setting up, managing, and deploying a FastAPI project with Alembic and SQLite. It covers everything from installing dependencies to applying database migrations and deploying your application to production.