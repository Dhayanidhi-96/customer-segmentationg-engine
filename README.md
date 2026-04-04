# SegmentIQ Customer Segmentation Engine

SegmentIQ is a full-stack analytics platform for customer segmentation, explainability, AI-assisted analysis, and campaign activation.

## What This Project Does

- Predicts customer segments using unsupervised ML models
- Supports multiple clustering approaches (KMeans, DBSCAN, GMM)
- Explains segment decisions with SHAP
- Provides an AI analyst chat endpoint (Groq-enabled with fallback)
- Generates and dispatches campaign emails with status logging
- Offers a React dashboard for operations, analysis, and model workflows

## Stack

- Backend: FastAPI, SQLAlchemy, Pydantic, scikit-learn, pandas, numpy, shap
- Frontend: React, Vite, Tailwind CSS, Chart.js
- Data store: SQLite by default
- Deployment: Docker and Docker Compose support

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
    scripts/
    tests/
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

## Local Development

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

### 1. Backend Setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
```

Create backend environment file at `backend/.env`:

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

Run backend:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Swagger: http://127.0.0.1:8000/api/docs
- ReDoc: http://127.0.0.1:8000/api/redoc

### 2. Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

- Frontend URL: http://localhost:3000

## Docker Setup

From repository root:

```powershell
docker compose up --build
```

This starts backend and frontend services as defined in `docker-compose.yml`.

## Data and Model Preparation

Run scripts from `backend` as needed:

```powershell
.\venv\Scripts\Activate
python scripts\generate_synthetic_data.py
python scripts\init_db.py
python scripts\load_data_to_db.py
python scripts\train_kmeans.py
```

## API Summary

Base path: `/api/v1`

- Customers: list, retrieve, create, update, delete, stats
- Segmentation: single prediction, batch prediction, model info, profiles, explainability, retraining, model comparison
- AI and Campaigns: AI chat, email generation, campaign send, dispatch status

## Verification

```powershell
cd backend
python verify_backend.py
```

## Git Hygiene

- Do not commit `node_modules`, virtual environments, `.env`, databases, or model binaries.
- The repository `.gitignore` is configured to keep these artifacts out of version control.

## License

For educational and internal demonstration use unless your organization defines a separate license.
