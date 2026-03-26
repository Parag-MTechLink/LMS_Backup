# LMS Architecture Overview

The Lab Management System (LMS) is a standalone application composed of a FastAPI backend and a React (Vite) frontend.

## 🏗️ Backend Architecture (FastAPI)

The backend is organized into functional modules under `backend/app/modules`.

### Core Technologies
- **Framework**: FastAPI
- **ORM**: SQLAlchemy (configured for Neon/serverless compatibility)
- **Migrations**: Alembic
- **Validation**: Pydantic
- **Authentication**: JWT-based for sessions; MFA via email; Stateful tokens for Password Reset.
- **Security Standards**: Enforced complexity (Uppercase, Lowercase, Number, Symbol), Rate limiting, and MFA.
- **Database**: PostgreSQL (pgvector enabled for AI features).

### Module Structure
Each module (e.g., `test_management`, `inventory`) follows a consistent pattern:
- `models.py`: SQLAlchemy database models.
- `schemas.py`: Pydantic models for request/response validation.
- `crud.py`: Database abstraction layer.
- `routes.py`: API endpoints.

### Key Backend Services
- **Auth**: Custom JWT implementation, Multi-Factor Authentication (MFA), and stateful reset token handling.
- **Email**: SMTP-based utility with console-logging fallback for development.
- **FAQ/Chatbot**: RAG-based system using pgvector and LangChain patterns.
- **Lab Recommendation Engine**: Native service for matching labs to requirements.

## 🎨 Frontend Architecture (React)

The frontend is a modern SPA built with Vite and React 18.

### Core Technologies
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Vanilla CSS
- **Animations**: Framer Motion
- **Routing**: React Router DOM (v6)
- **Icons**: Lucide React
- **Charts**: Recharts

### Project Structure
- `src/components`: Reusable UI components.
- `src/pages`: Functional pages, grouped by feature (e.g., `lab/management/*`).
- `src/contexts`: Global state (Auth, Lab Data).
- `src/services`: API abstraction layer using `axios` with interceptors for JWT injection.
- `src/layouts`: Component wrappers like `LabManagementLayout`.

### Performance
- Lazy loading for all major routes using `React.lazy` and `Suspense`.
- Perceived performance optimization using `RouteSkeleton`.

## 🔄 Data Flow
1. **User Request**: React components interact with `api.js` or specialized services in `src/services`.
2. **API Interaction**: Axios interceptors inject the JWT token from `localStorage`.
3. **Backend Processing**: FastAPI routes validate input via Pydantic, interact with SQLAlchemy models via CRUD functions, and return JSON.
4. **State Management**: Data is stored and shared via React Contexts where needed.
