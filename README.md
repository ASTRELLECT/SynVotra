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
- [Authentication](#authentication)
  - [JWT Authentication Setup](#jwt-authentication-setup)
  - [Securing Endpoints](#securing-endpoints)
  - [Using JWT Tokens](#using-jwt-tokens)
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
  - [Authentication API](#authentication-api)
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
   pip install fastapi uvicorn sqlalchemy passlib bcrypt python-jose[cryptography] pydantic python-multipart jinja2 python-dotenv
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
   pip install fastapi uvicorn sqlalchemy passlib bcrypt python-jose[cryptography] pydantic python-multipart jinja2 python-dotenv
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

## Authentication

The API uses JWT (JSON Web Token) authentication to secure endpoints and manage user sessions.

### JWT Authentication Setup

To set up JWT authentication in your application, follow these steps:

1. **Install required packages**:
   - `python-jose[cryptography]`: For JWT token generation and validation
   - `passlib`: For password hashing
   - `python-dotenv`: For managing environment variables

2. **Create necessary directories and files**:
   - Create `src/auth/` directory with `__init__.py` and `auth.py` files
   - Create `src/resources/secret.py` file for security configuration
   - Create `src/routes/auth.py` file for authentication endpoints

3. **Set up JWT configuration**:
   - Define a secret key (preferably in environment variables)
   - Set JWT algorithm (typically HS256)
   - Set token expiration time

4. **Implement core authentication functions**:
   - Token generation function
   - User authentication function
   - Token validation middleware
   - Role-based access control helpers

5. **Create authentication endpoints**:
   - Login endpoint to generate tokens
   - Password change endpoint
   - Register the auth router in `src/routes/__init__.py`

### Securing Endpoints

To secure your API endpoints with JWT authentication:

1. **Import authentication dependencies** in your route files:
   - Import `get_current_user` and `get_admin_user` from the auth module

2. **Add the dependencies to your endpoint functions**:
   - For user authentication: `current_user: User = Depends(get_current_user)`
   - For admin-only endpoints: `current_user: User = Depends(get_admin_user)`

3. **Implement role-based access control**:
   - Regular users should only access their own data
   - Admin users can access all data
   - Check user permissions in your endpoint handlers

### Using JWT Tokens

To use JWT authentication with your API:

1. **Get an access token** by sending a POST request to the login endpoint:
   - Endpoint: `POST /astrellect/v1/auth/token`
   - Form data: `username` (email) and `password`
   - Response will include `access_token` and `token_type`

2. **Include the token in API requests**:
   - Add an `Authorization` header with the value `Bearer YOUR_TOKEN`
   - The token will be automatically validated by the authentication middleware

3. **Handle token expiration**:
   - When a token expires, the API will return a 401 Unauthorized error
   - The client should redirect to the login page to get a new token

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
├── database/                # Database directory
│   └── astrellect.db        # SQLite database file
│
├── requirements.txt         # Python dependencies
│
├── src/                     # Application source code
│   ├── auth/                # Authentication related modules
│   │   ├── __init__.py      
│   │   └── auth.py          # JWT authentication logic
│   │
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
│   │   ├── constants.py     # Application constants
│   │   └── secret.py        # Security configuration
│   │
│   └── routes/              # API routes
│       ├── __init__.py      # Routes registration
│       ├── auth.py          # Authentication endpoints
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
6. **Register the routes** in `src/routes/__init__.py`

### Adding New Routes

To add new secured endpoints to your application:

1. **Create a new router file** in the `src/routes/` directory
2. **Import the authentication dependencies** from the auth module
3. **Add security to your endpoints** using the Depends() function with the appropriate security dependency
4. **Implement role-based access control** in your endpoint handlers
5. **Register the router** in `src/routes/__init__.py`

### Updating Existing Models

When modifying existing models:

1. **Update the model definition** in `src/database/models.py`
2. **Update any affected Pydantic schemas**
3. **Update the database initialization script** if needed
4. **Reset the database** to apply changes:
   ```bash
   # First, make a backup of any important data
   # Then reset the database
   python src/database/init_db.py
   ```
5. **Update any affected API handlers**

### Database Reset

If you need to reset your database during development:

#### Ubuntu

```bash
# Remove the existing database
rm -f database/astrellect.db
```

#### Windows

```cmd
del database\astrellect.db
```

## API Resources

### Users/Employees API

- `GET /astrellect/v1/employees/getall` - Get all users (admin only)
- `GET /astrellect/v1/employees/{user_id}` - Get user by ID (admin or own record)
- `POST /astrellect/v1/employees/create` - Create a new user (admin only)
- `PUT /astrellect/v1/employees/update/{user_id}` - Update user (admin or own record)
- `DELETE /astrellect/v1/employees/delete/{user_id}` - Delete user (admin only)

### Authentication API

- `POST /astrellect/v1/auth/token` - Get JWT token
- `POST /astrellect/v1/auth/change-password` - Change password (for authenticated user)

## Troubleshooting

### Common Issues

1. **"Could not validate credentials"** - JWT token is missing, invalid or expired
   - Solution: Get a new token by logging in again

2. **"Not enough permissions"** - User doesn't have required admin privileges
   - Solution: Use an admin account to access the endpoint

3. **bcrypt version error:**
   - Solution: Upgrade both bcrypt and passlib:
     ```bash
     pip install --upgrade bcrypt passlib
     ```

4. **Database tables not appearing:**
   - Solution: Make sure your models are properly defined and imported in the init_db.py file and that Base.metadata.create_all() is being called.

5. **Missing dependencies:**
   - Solution: Ensure all required packages are installed:
     ```bash
     pip install fastapi uvicorn sqlalchemy passlib bcrypt python-jose[cryptography] pydantic python-multipart jinja2 python-dotenv
     ```

6. **JWT related errors:**
   - Solution: Check that your SECRET_KEY is set correctly and that python-jose is installed with the cryptography extra.