# Lab Management System (LMS)

This is a standalone Lab Management System extracted from the main 240Kw project.

## Features

- Dashboard with analytics and statistics
- Customer management
- RFQ (Request for Quotation) management
- Project management
- Test Plans, Test Executions, and Test Results
- Sample management
- TRF (Test Request Form) management
- Document management
- Reports generation
- Audits and NCRs (Non-Conformance Reports)
- Certification management

## Installation

## Frontend

1. Navigate to Project Directory:
```bash
cd src
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Backend

1. Navigate to project directory
```bash
cd backend
```

2. Create virtual environment
```bash
py -3.12 -m venv .venv
```

3. Activate virtual environment
```bash
.venv/Scripts/activate
```

4. Install dependencies
```bash
pip install -r requirements.txt
```

5. Run the backend server
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

## Build for production:
```bash
npm run build
```

## Project Structure

```
LMS/
├── src/
│   ├── components/
│   │   └── labManagement/     # Lab management UI components
│   ├── contexts/              # React contexts (Auth, Data)
│   ├── layouts/               # Layout components
│   ├── pages/
│   │   └── lab/
│   │       └── management/    # Lab management pages
│   ├── services/              # API services
│   ├── assets/                # Static assets
│   ├── App.jsx                # Main app component
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Technologies Used

- React 18
- React Router DOM
- Vite
- Tailwind CSS
- Framer Motion
- Axios
- Recharts
- Lucide React Icons

## Notes

- This is a standalone application extracted from the main 240Kw project
- The original 240Kw project remains unchanged
- All lab management functionality is self-contained in this folder
