# Quick Start Guide

## ✅ Step 1: Install Dependencies (DONE)
You've already completed this step!

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

---

## 📝 Step 2: Configure Environment Variables

Create a `.env` file in the `backend` folder:

```bash
# Copy the example file
copy .env.example .env
```

Then edit `.env` with your Neon database credentials:

```env
# Database - REPLACE WITH YOUR NEON DATABASE URL
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/lms?sslmode=require

# Application
APP_NAME=LMS Backend
APP_VERSION=1.0.0
DEBUG=True
SECRET_KEY=your-secret-key-change-in-production

# Server
HOST=0.0.0.0
PORT=8000

# CORS - Add your frontend URL
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=2097152
MAX_IMAGE_SIZE=1048576
```

---

## 🗄️ Step 3: Set Up Database

### Option A: Auto-create tables (Quick for Development)

Uncomment this line in `app/main.py` (around line 25):

```python
# Base.metadata.create_all(bind=engine)
```

### Option B: Use Alembic Migrations (Recommended for Production)

```bash
# Initialize Alembic
alembic init app/migrations

# Create initial migration
alembic revision --autogenerate -m "Initial tables"

# Apply migration
alembic upgrade head
```

---

## 🚀 Step 4: Run the Server

### Method 1: Using Python directly
```bash
python app/main.py
```

### Method 2: Using Uvicorn (Recommended)
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The `--reload` flag enables auto-reload on code changes (great for development).

---

## 🌐 Step 5: Access the API

Once the server is running, you can access:

- **API Base URL**: http://localhost:8000
- **Interactive API Docs (Swagger)**: http://localhost:8000/api/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/api/redoc
- **Health Check**: http://localhost:8000/health

---

## 🧪 Step 6: Test the API

### Using Swagger UI (Easiest)
1. Go to http://localhost:8000/api/docs
2. Click on any endpoint
3. Click "Try it out"
4. Fill in the parameters
5. Click "Execute"

### Using curl
```bash
# Create a new organization
curl -X POST "http://localhost:8000/api/v1/organizations" \
  -H "Content-Type: application/json" \
  -d '{
    "lab_name": "Test Laboratory",
    "lab_address": "123 Main Street",
    "lab_state": "Maharashtra",
    "lab_district": "Mumbai",
    "lab_city": "Mumbai",
    "lab_pin_code": "400001"
  }'
```

### Using Postman
Import the OpenAPI spec from http://localhost:8000/api/openapi.json

---

## 🔗 Connect to Frontend

Update your frontend API configuration to point to:
```javascript
const API_BASE_URL = "http://localhost:8000/api/v1";
```

---

## ⚠️ Troubleshooting

### Issue: "ModuleNotFoundError"
**Solution**: Make sure virtual environment is activated
```bash
.venv\Scripts\activate
```

### Issue: "Database connection error"
**Solution**: Check your `.env` file has correct Neon database URL

### Issue: "Port already in use"
**Solution**: Change port in `.env` or kill the process using port 8000
```bash
# Find process
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Issue: "CORS error in frontend"
**Solution**: Add your frontend URL to `CORS_ORIGINS` in `.env`

---

## 📚 Next Steps

1. ✅ Install dependencies
2. ⏳ Configure `.env` file
3. ⏳ Set up database
4. ⏳ Run the server
5. ⏳ Test API endpoints
6. ⏳ Connect frontend

---

## 🎯 Quick Commands Reference

```bash
# Activate virtual environment
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server (development)
python app/main.py

# Run server with uvicorn
uvicorn app.main:app --reload

# Run on different port
uvicorn app.main:app --reload --port 8001

# Create database migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```
