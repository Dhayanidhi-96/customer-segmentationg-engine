# SegmentIQ Customer Segmentation Engine

SegmentIQ is a full-stack analytics platform for customer segmentation, explainability, AI-assisted analysis, and campaign activation.

## Overview

This project provides:

- Customer segmentation using unsupervised ML (GMM, KMeans, DBSCAN support)
- Segment explainability via SHAP
- AI analyst chat (Groq-enabled with local fallback)
- Campaign email generation, sending, and dispatch status tracking
- React dashboard for customer, segment, campaign, and model operations

## Tech Stack

- Backend: FastAPI, SQLAlchemy, Pydantic, scikit-learn, pandas, numpy, shap
- Frontend: React, Vite, Tailwind CSS, Chart.js
- Database: SQLite (default)
- Deployment: Docker + Docker Compose

## Repository Layout

```text
customer-segmentation-engine/
  backend/
    app/
      api/v1/routes/
      core/
      ml/
      models/
      schemas/
      services/
    data/synthetic/
    scripts/
    tests/
    models/saved/
    requirements.txt
  frontend/
    src/
      pages/
      components/
      services/
    package.json
  docker-compose.yml
  README.md
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

## Quick Start (Local)

### 1. Backend setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
APP_NAME=Customer Segmentation Engine
APP_VERSION=1.0.0
ENVIRONMENT=development
DEBUG=True
API_V1_PREFIX=/api/v1
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
DATABASE_URL=sqlite:///./segmentation.db
MODEL_STORAGE_PATH=models/saved
GROQ_API_KEY=

# Optional SMTP (required for real email sending)
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_USE_TLS=True
SMTP_FROM_EMAIL=noreply@segmentiq.local
```

### 2. Data and database initialization

Run from `backend`:

```powershell
.\venv\Scripts\Activate
python scripts\generate_synthetic_data.py
python scripts\init_db.py
python scripts\load_data_to_db.py
```

### 3. Start backend API

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API docs:

- Swagger: http://127.0.0.1:8000/api/docs
- ReDoc: http://127.0.0.1:8000/api/redoc

### 4. Create/deploy the active segmentation model (required)

Current prediction endpoints load a GMM model from `MODEL_STORAGE_PATH/gmm_model.pkl`.

After the API is running and data is loaded, trigger retraining once:

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/api/v1/segmentation/retrain
```

This trains and saves the active model, then updates customer segment assignments.

### 5. Frontend setup

In a new terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL: http://localhost:3000

## Docker Setup

From repository root:

```powershell
docker compose up --build
```

This starts backend and frontend services defined in `docker-compose.yml`.

## API Summary

Base path: `/api/v1`

- Customers: list, retrieve, create, update, delete, stats
- Segmentation: predict, batch predict, model info, segment profiles, explainability, retrain, compare models
- AI/Campaigns: AI chat, generate email, send discount campaigns, query campaign status

## Verification

```powershell
cd backend
python verify_backend.py
```

## Notes

- `scripts\train_kmeans.py` is available for KMeans experimentation.
- Production prediction endpoints currently load a GMM artifact (`gmm_model.pkl`).

## Git Hygiene

- Do not commit `node_modules`, virtual environments, `.env`, databases, or model binaries.
- The repository `.gitignore` should exclude these generated artifacts.

## License

For educational and internal demonstration use unless your organization defines a separate license.
