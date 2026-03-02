<p align="center">
  <h1 align="center">🎯 Customer Segmentation Engine</h1>
  <p align="center">
    <strong>An advanced machine learning-powered customer segmentation platform with RESTful APIs and interactive dashboards</strong>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white" alt="Python">
    <img src="https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi&logoColor=white" alt="FastAPI">
    <img src="https://img.shields.io/badge/scikit--learn-1.3-F7931E?logo=scikit-learn&logoColor=white" alt="scikit-learn">
    <img src="https://img.shields.io/badge/SQLAlchemy-2.0-red?logo=python&logoColor=white" alt="SQLAlchemy">
    <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React">
    <img src="https://img.shields.io/badge/Status-Backend%20Complete-brightgreen" alt="Status">
  </p>
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Machine Learning](#-machine-learning)
- [Database Schema](#-database-schema)
- [Data Generation](#-data-generation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

The **Customer Segmentation Engine** is a full-stack application that uses unsupervised machine learning (K-Means clustering) to segment e-commerce customers based on their purchasing behavior. It analyzes **RFM (Recency, Frequency, Monetary)** metrics alongside engagement data to group customers into actionable segments, enabling targeted marketing strategies.

### What It Does

1. **Ingests customer data** — Loads transactional and behavioral data into a structured database
2. **Trains ML models** — Uses K-Means clustering with automatic optimal-K selection via silhouette analysis
3. **Segments customers** — Classifies customers into distinct behavioral groups in real-time
4. **Exposes REST APIs** — Provides 14 endpoints for CRUD operations, predictions, and analytics
5. **Visualizes insights** — Dashboard with interactive charts for segment exploration *(frontend — in progress)*

### Why It Matters

Customer segmentation enables businesses to:
- **Personalize marketing** — Tailor campaigns to each customer group
- **Reduce churn** — Identify at-risk customers before they leave
- **Maximize revenue** — Focus resources on the most valuable segments
- **Improve retention** — Develop targeted loyalty programs

---

## ✨ Features

### Backend (Complete ✅)
- 🔌 **RESTful API** — 14 endpoints with FastAPI, automatic OpenAPI docs
- 🤖 **ML Pipeline** — K-Means clustering with StandardScaler preprocessing
- 📊 **RFM Analysis** — Recency, Frequency, Monetary value feature engineering
- 🔍 **Real-time Predictions** — Single and batch customer segmentation
- 💾 **Database** — SQLAlchemy ORM with SQLite (dev) / PostgreSQL (prod)
- 📈 **Model Metrics** — Silhouette score, Davies-Bouldin index, Calinski-Harabasz index
- 🔒 **CORS** — Pre-configured for frontend integration
- 📄 **Auto-generated Docs** — Swagger UI & ReDoc

### Frontend (In Progress 🚧)
- 📊 Interactive dashboard with Chart.js visualizations
- 👥 Customer list with search, filter, and pagination
- 🔮 Real-time prediction tool
- 📱 Responsive design with TailwindCSS

---

## 🛠 Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Backend** | Python | 3.10+ | Core language |
| **API** | FastAPI | 0.104.1 | REST API framework |
| **ORM** | SQLAlchemy | 2.0.23 | Database abstraction |
| **Validation** | Pydantic | 2.5.0 | Request/response schemas |
| **ML** | scikit-learn | 1.3.2 | K-Means clustering |
| **Data** | Pandas / NumPy | 2.1.3 / 1.26.2 | Data processing |
| **Database** | SQLite / PostgreSQL | — | Data persistence |
| **Server** | Uvicorn | 0.24.0 | ASGI server |
| **Serialization** | Joblib | 1.3.2 | Model persistence |
| **Data Gen** | Faker | 20.1.0 | Synthetic data generation |
| **Frontend** | React | 18 | UI framework |
| **Styling** | TailwindCSS | 3.3.6 | CSS framework |
| **Charts** | Chart.js | 4.4.0 | Data visualization |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│                   React + TailwindCSS + Chart.js                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP (JSON)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FASTAPI APPLICATION                          │
│  ┌────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  Customer API   │  │ Segmentation API  │  │  Health/Root   │  │
│  │  (7 endpoints)  │  │  (4 endpoints)    │  │  (3 endpoints) │  │
│  └───────┬────────┘  └────────┬─────────┘  └────────────────┘  │
│          │                    │                                   │
│  ┌───────▼────────────────────▼─────────┐                       │
│  │          SERVICE LAYER                │                       │
│  │   SegmentationService (singleton)     │                       │
│  └───────┬────────────────────┬─────────┘                       │
│          │                    │                                   │
│  ┌───────▼────────┐  ┌───────▼──────────┐                      │
│  │   SQLAlchemy    │  │   ML Pipeline     │                      │
│  │   ORM Models    │  │   KMeansSegmenter │                      │
│  └───────┬────────┘  └───────┬──────────┘                      │
│          │                    │                                   │
│  ┌───────▼────────┐  ┌───────▼──────────┐                      │
│  │    SQLite /     │  │   Trained Model   │                      │
│  │   PostgreSQL    │  │   (.pkl file)     │                      │
│  └────────────────┘  └──────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
customer-segmentation-engine/
│
├── backend/                          # Backend application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI app entry point
│   │   ├── config.py                 # Configuration (pydantic-settings)
│   │   │
│   │   ├── api/v1/routes/            # API route handlers
│   │   │   ├── customers.py          # Customer CRUD endpoints
│   │   │   └── segmentation.py       # ML prediction endpoints
│   │   │
│   │   ├── models/                   # SQLAlchemy ORM models
│   │   │   └── customer.py           # Customer table definition
│   │   │
│   │   ├── schemas/                  # Pydantic validation schemas
│   │   │   ├── customer.py           # Customer request/response schemas
│   │   │   └── segmentation.py       # Prediction request/response schemas
│   │   │
│   │   ├── services/                 # Business logic
│   │   │   └── segmentation_service.py  # ML prediction orchestration
│   │   │
│   │   ├── ml/                       # Machine learning module
│   │   │   ├── models/
│   │   │   │   ├── base_model.py     # Abstract base clustering class
│   │   │   │   └── kmeans_model.py   # K-Means implementation
│   │   │   ├── evaluation/           # Model evaluation (planned)
│   │   │   ├── explainability/       # SHAP integration (planned)
│   │   │   └── preprocessing/        # Feature engineering (planned)
│   │   │
│   │   ├── core/                     # Core infrastructure
│   │   │   └── database.py           # DB engine, session, dependency
│   │   │
│   │   └── utils/                    # Utilities (planned)
│   │
│   ├── scripts/                      # CLI scripts
│   │   ├── init_db.py                # Database initialization
│   │   ├── generate_synthetic_data.py # Synthetic data generator
│   │   ├── load_data_to_db.py        # CSV → database loader
│   │   └── train_kmeans.py           # Model training script
│   │
│   ├── data/synthetic/               # Generated datasets
│   │   ├── customers_full.csv        # 5000 customers (with labels)
│   │   ├── customers_train.csv       # 5000 customers (no labels)
│   │   └── customers_sample.csv      # 1000 customer sample
│   │
│   ├── tests/                        # Test suite (planned)
│   ├── alembic/                      # DB migrations
│   ├── .env                          # Environment variables
│   ├── .gitignore                    # Git ignore rules
│   ├── requirements.txt              # Python dependencies
│   ├── segmentation.db               # SQLite database
│   └── verify_backend.py             # Backend verification script
│
├── models/saved/                     # Trained ML models
│   └── kmeans_model.pkl              # Serialized K-Means model
│
├── frontend/                         # React frontend (in progress)
│   ├── public/
│   └── src/
│       ├── components/
│       ├── services/
│       ├── store/
│       └── utils/
│
├── docs/                             # Documentation (planned)
├── notebooks/                        # Jupyter notebooks (planned)
├── PROJECT_HANDOVER.md               # Handover document
├── ROADMAP.md                        # Development roadmap
└── README.md                         # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+** — [Download](https://www.python.org/downloads/)
- **Node.js 18+** — [Download](https://nodejs.org/) (for frontend)
- **Git** — [Download](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/customer-segmentation-engine.git
cd customer-segmentation-engine
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Initialize Database & Load Data

```bash
# Create database tables
python scripts/init_db.py

# Generate synthetic customer data (5000 records)
python scripts/generate_synthetic_data.py

# Load data into database
python scripts/load_data_to_db.py
```

### 4. Train the ML Model

```bash
# Train K-Means model (auto-selects optimal clusters)
python scripts/train_kmeans.py
```

### 5. Start the Backend Server

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 6. Verify Everything Works

```bash
# In a separate terminal (with venv activated)
python verify_backend.py
```

Expected output: **24/24 tests passed** ✅

### 7. Explore the API

Open your browser and navigate to:
- **Swagger UI**: http://127.0.0.1:8000/api/docs
- **ReDoc**: http://127.0.0.1:8000/api/redoc
- **Health Check**: http://127.0.0.1:8000/health

---

## 📡 API Reference

**Base URL**: `http://127.0.0.1:8000`

### Health & Info

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API information |
| `GET` | `/health` | Health check |
| `GET` | `/api/docs` | Swagger UI documentation |
| `GET` | `/api/redoc` | ReDoc documentation |

### Customer Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/customers/` | List customers (paginated) |
| `GET` | `/api/v1/customers/{customer_id}` | Get customer by ID string |
| `GET` | `/api/v1/customers/id/{id}` | Get customer by database ID |
| `POST` | `/api/v1/customers/` | Create a new customer |
| `PUT` | `/api/v1/customers/{customer_id}` | Update a customer |
| `DELETE` | `/api/v1/customers/{customer_id}` | Soft delete a customer |
| `GET` | `/api/v1/customers/stats/overview` | Aggregate statistics |

### Segmentation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/segmentation/predict` | Predict segment for one customer |
| `POST` | `/api/v1/segmentation/predict-batch` | Predict segments for all customers |
| `GET` | `/api/v1/segmentation/model-info` | Get model metadata |
| `GET` | `/api/v1/segmentation/segment-profiles` | Get segment statistics |

### Example Requests

#### List Customers (with pagination)
```bash
curl "http://127.0.0.1:8000/api/v1/customers/?skip=0&limit=10"
```

#### Get Customer Statistics
```bash
curl "http://127.0.0.1:8000/api/v1/customers/stats/overview"
```

**Response:**
```json
{
  "total_customers": 5000,
  "avg_recency_days": 147.52,
  "avg_frequency": 8.13,
  "avg_monetary_value": 987.64,
  "total_revenue": 4938200.50
}
```

#### Predict Customer Segment
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/segmentation/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "recency_days": 15.0,
    "frequency": 12,
    "monetary_value": 2500.0,
    "avg_order_value": 208.33,
    "total_items_purchased": 35,
    "account_age_days": 730,
    "email_open_rate": 0.65,
    "email_click_rate": 0.22
  }'
```

**Response:**
```json
{
  "segment_id": 0,
  "segment_name": "Segment 0",
  "confidence": 0.394
}
```

#### Get Segment Profiles
```bash
curl "http://127.0.0.1:8000/api/v1/segmentation/segment-profiles"
```

---

## 🤖 Machine Learning

### Algorithm: K-Means Clustering

The engine uses **K-Means** clustering — an unsupervised learning algorithm that partitions customers into K distinct groups based on feature similarity.

### Features Used (8 dimensions)

| Feature | Description | Type |
|---------|-------------|------|
| `recency_days` | Days since last purchase | Float |
| `frequency` | Number of purchases | Integer |
| `monetary_value` | Total spend ($) | Float |
| `avg_order_value` | Average order amount ($) | Float |
| `total_items_purchased` | Total items bought | Integer |
| `account_age_days` | Days since account creation | Integer |
| `email_open_rate` | Email open rate (0-1) | Float |
| `email_click_rate` | Email click rate (0-1) | Float |

### Pipeline

```
Raw Features → StandardScaler → K-Means → Labels + Distances → Confidence Score
```

1. **Preprocessing** — Missing values filled with median, features standardized (zero mean, unit variance)
2. **Optimal K Selection** — Silhouette score evaluated for K=2 to K=8
3. **Training** — K-Means fitted with `n_init=10`, `max_iter=300`
4. **Prediction** — New data scaled with the same scaler, distances converted to confidence scores

### Model Persistence

The trained model is serialized with `joblib` and includes:
- Fitted `KMeans` estimator
- Fitted `StandardScaler`
- Feature names list
- Training metadata

**Model file**: `models/saved/kmeans_model.pkl`

### Class Hierarchy

```
BaseClusteringModel (ABC)
├── train()        # Abstract
├── predict()      # Abstract
├── get_model_name()  # Abstract
├── save()         # Serialize with joblib
└── load()         # Deserialize with joblib
    │
    └── KMeansSegmenter
        ├── find_optimal_clusters()  # Silhouette analysis
        ├── preprocess()             # Scale features
        ├── train()                  # Fit K-Means
        ├── predict()                # Labels + distances
        ├── _calculate_metrics()     # Evaluation metrics
        └── _create_segment_profiles()  # Cluster statistics
```

---

## 🗃 Database Schema

### Customer Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK, Index | Auto-increment ID |
| `customer_id` | String | Unique, Index | Business identifier (e.g., `CUST_000001`) |
| `name` | String | Nullable | Full name |
| `email` | String | Index, Nullable | Email address |
| `phone` | String | Nullable | Phone number |
| `age` | Integer | Nullable | Age in years |
| `gender` | String | Nullable | Male / Female / Other |
| `city` | String | Nullable | City |
| `country` | String | Nullable | Country |
| `recency_days` | Float | Nullable | Days since last purchase |
| `frequency` | Integer | Nullable | Purchase count |
| `monetary_value` | Float | Nullable | Total spend |
| `avg_order_value` | Float | Nullable | Average order value |
| `total_orders` | Integer | Nullable | Total order count |
| `total_items_purchased` | Integer | Nullable | Items bought |
| `account_age_days` | Integer | Nullable | Account age |
| `email_open_rate` | Float | Nullable | Open rate (0-1) |
| `email_click_rate` | Float | Nullable | Click rate (0-1) |
| `segment_id` | Integer | Index, Nullable | Assigned segment |
| `segment_name` | String | Nullable | Segment label |
| `segment_confidence` | Float | Nullable | Prediction confidence |
| `is_active` | Boolean | Default: True | Soft delete flag |
| `created_at` | DateTime | Auto | Record creation time |
| `updated_at` | DateTime | Auto | Last update time |

---

## 📊 Data Generation

The project includes a synthetic data generator that creates realistic e-commerce customer profiles using the [Faker](https://faker.readthedocs.io/) library.

### Customer Segments (Ground Truth)

| Segment | Probability | Recency (days) | Frequency | Monetary ($) |
|---------|-------------|----------------|-----------|--------------|
| Champions | 15% | 0–30 | 10–50 | 1,000–5,000 |
| Loyal | 20% | 0–60 | 5–15 | 500–2,000 |
| Potential | 15% | 30–90 | 3–8 | 300–1,000 |
| At Risk | 20% | 90–180 | 5–15 | 500–2,000 |
| Hibernating | 20% | 180–365 | 2–5 | 100–500 |
| Lost | 10% | 365–730 | 1–3 | 50–200 |

### Generated Files

| File | Records | Description |
|------|---------|-------------|
| `customers_full.csv` | 5,000 | All features + ground truth segment label |
| `customers_train.csv` | 5,000 | All features (no labels — for unsupervised learning) |
| `customers_sample.csv` | 1,000 | Random sample for quick testing |

---

## 🧪 Testing

### Backend Verification

A comprehensive verification script checks all components:

```bash
cd backend
.\venv\Scripts\Activate
python verify_backend.py
```

This tests:
- **15 file checks** — All source files, database, model, and datasets
- **8 API endpoint checks** — All routes responding correctly
- **1 prediction test** — Live ML prediction with sample data

### Running Unit Tests *(planned)*

```bash
cd backend
pytest tests/ -v
```

---

## 🚢 Deployment

### Planned Architecture

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Vercel | `https://your-app.vercel.app` |
| Backend | Render.com | `https://your-api.onrender.com` |
| Database | Railway | PostgreSQL connection string |

### Environment Variables (Production)

```env
ENVIRONMENT=production
DEBUG=False
DATABASE_URL=postgresql://user:pass@host:5432/dbname
BACKEND_CORS_ORIGINS=["https://your-app.vercel.app"]
SECRET_KEY=your-production-secret-key
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is developed as a final-year academic project. All rights reserved.

---

## 📬 Contact

For questions about this project, please refer to the [PROJECT_HANDOVER.md](./PROJECT_HANDOVER.md) document for detailed technical context.

---

<p align="center">
  <strong>Built with ❤️ using Python, FastAPI, and scikit-learn</strong>
</p>
