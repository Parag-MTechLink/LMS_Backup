# LMS Backend

FastAPI backend for Laboratory Management System with Neon PostgreSQL database.

## Features

- ✅ **11-Step Organization Registration** - Complete laboratory registration workflow
- ✅ **File Upload Management** - Handle logos and PDF documents
- ✅ **RESTful API** - Clean API design with OpenAPI documentation
- ✅ **Database Models** - 17 PostgreSQL tables with relationships
- ✅ **Validation** - Pydantic schemas with custom validators
- ✅ **Neon PostgreSQL** - Serverless PostgreSQL database

## Project Structure

```
backend/
├── app/
│   ├── core/               # Core configuration
│   │   ├── config.py       # Settings & environment
│   │   ├── database.py     # Database connection
│   │   ├── security.py     # JWT & password hashing
│   │   └── dependencies.py # Common dependencies
│   │
│   ├── modules/            # Feature modules
│   │   ├── organization/   # Organization management
│   │   │   ├── models.py   # SQLAlchemy models
│   │   │   ├── schemas.py  # Pydantic schemas
│   │   │   ├── routes.py   # API endpoints
│   │   │   └── services.py # Business logic
│   │   │
│   │   └── files/          # File upload
│   │       ├── routes.py
│   │       └── storage.py
│   │
│   ├── utils/              # Utilities
│   │   ├── exceptions.py   # Custom exceptions
│   │   ├── validators.py   # Custom validators
│   │   └── helpers.py      # Helper functions
│   │
│   └── main.py             # FastAPI app entry point
│
├── uploads/                # File storage
├── .env                    # Environment variables
├── requirements.txt        # Python dependencies
└── README.md
```

## Setup Instructions

### 1. Prerequisites

- Python 3.9+
- PostgreSQL (Neon account)
- pip or poetry

### 2. Installation

```bash
# Clone the repository
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/lms?sslmode=require

# Application
APP_NAME=LMS Backend
DEBUG=True
SECRET_KEY=your-secret-key-here

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=2097152
MAX_IMAGE_SIZE=1048576
```

### 4. Database Setup

```bash
# Create database tables using Alembic
alembic upgrade head

# Or for development, you can use:
# Uncomment Base.metadata.create_all(bind=engine) in main.py
```

### 5. Run the Server

```bash
# Development mode with auto-reload
python app/main.py

# Or using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## API Endpoints

### Organizations

- `POST /api/v1/organizations` - Create new organization
- `GET /api/v1/organizations/{id}` - Get organization
- `GET /api/v1/organizations` - List organizations
- `DELETE /api/v1/organizations/{id}` - Delete organization

### Step-wise Updates

- `PUT /api/v1/organizations/{id}/laboratory-details` - Step 1
- `PUT /api/v1/organizations/{id}/registered-office` - Step 2
- `PUT /api/v1/organizations/{id}/parent-organization` - Step 3
- `PUT /api/v1/organizations/{id}/bank-details` - Step 3
- `PUT /api/v1/organizations/{id}/working-schedule` - Step 4
- `PUT /api/v1/organizations/{id}/compliance-documents` - Step 5
- `PUT /api/v1/organizations/{id}/policy-documents` - Step 6
- `PUT /api/v1/organizations/{id}/infrastructure` - Step 7
- `PUT /api/v1/organizations/{id}/accreditation` - Step 8
- `PUT /api/v1/organizations/{id}/other-details` - Step 8
- `PUT /api/v1/organizations/{id}/quality-manual` - Step 9
- `PUT /api/v1/organizations/{id}/quality-formats` - Step 10

### Validation & Submission

- `GET /api/v1/organizations/{id}/checklist` - Get validation checklist
- `POST /api/v1/organizations/{id}/submit` - Submit for approval

### File Upload

- `POST /api/v1/files/upload/logo` - Upload logo
- `POST /api/v1/files/upload/document` - Upload document
- `POST /api/v1/files/upload/multiple` - Upload multiple files
- `DELETE /api/v1/files/delete` - Delete file

## Database Schema

17 PostgreSQL tables:
1. organizations
2. registered_offices
3. top_management
4. parent_organizations
5. bank_details
6. working_schedules
7. shift_timings
8. compliance_documents
9. policy_documents
10. infrastructure_details
11. accreditation_documents
12. other_lab_details
13. quality_manuals
14. sops
15. quality_formats
16. quality_procedures
17. files (optional)

## Development

### Running Tests

```bash
pytest
```

### Code Formatting

```bash
black app/
flake8 app/
```

### Type Checking

```bash
mypy app/
```

## Deployment

### Using Docker (Optional)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables for Production

Make sure to set these in production:
- `DEBUG=False`
- Strong `SECRET_KEY`
- Proper `DATABASE_URL` with SSL
- Restricted `CORS_ORIGINS`

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT License
