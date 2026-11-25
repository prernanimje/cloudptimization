# Cloud Cost Optimization Dashboard

A comprehensive system for monitoring cloud resources and automatically suggesting cost optimization strategies.

![Status](https://img.shields.io/badge/Status-Active%20Development-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## 🎯 Overview

This Dashboard helps you:
- **Monitor** cloud server metrics (CPU, RAM, Storage, Uptime)
- **Analyze** resource utilization and identify wasted costs
- **Optimize** via AI-powered recommendations (resize, terminate, move region, schedule shutdowns)
- **Alert** via email when servers go down
- **Track** costs by region and instance

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.11+ (if running locally)
- Node.js 18+ (if running frontend locally)
- PostgreSQL 15+

### Option 1: Docker (Recommended for All Users)

```bash
# Clone/extract the project
cd cloudoptimization

# Build and run all services
docker-compose up

# Wait 30 seconds for services to start

# Open browser
Frontend: http://localhost:3000 (or next available port if 3000 is occupied)
Backend API: http://localhost:8000/docs
Database: localhost:5432
```

### Option 2: Local Development

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your API keys

# Run database migrations (first time)
export PYTHONPATH=app
python -c "from database import init_db; init_db()"

# Start backend
uvicorn app.main:app --reload
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server (using Vite)
npm run dev
```


## 📊 Features

### Real-time Monitoring
- **CPU Usage**: Line chart showing CPU usage trends (0-100%)
- **RAM Usage**: Line chart showing memory usage (0-100%)
- **Storage**:  Bar chart + Windows disk-style visualization
- **Uptime**: Pie chart + availability percentage
- **Status**: Color-coded health indicator (healthy/warning/critical)
- **Region**: Instance location display
- **Cost**: Monthly cost in USD

### AI-Powered Analysis
- Detects underutilized servers (CPU < 30%)
- Identifies over-provisioned servers
- Calculates wasted resources percentage
- Generates recommendations:
  - 📉 **Resize**: Downsize instance, save up to 40%
  - 🗑️ **Terminate**: Remove unused instances
  - 🌍 **Move Region**: Cheaper AWS region
  - 🕐 **Schedule Shutdown**: Auto-shutdown during off-hours
  - 🧹 **Cleanup**: Free up storage space

### Alerts & Notifications
- ⚠️ High CPU/RAM/Storage warnings
- 🚨 Critical failures
- 📧 Email notifications (via SendGrid)
- Health dashboard showing server status

### Dashboard
- Filter by one server at a time
- Dropdown selector to change servers
- Real-time metrics display
- Recommendations sorted by savings potential
- Cost breakdown by region

## 📁 Project Structure

```
cloudoptimization/
├── backend/                      # FastAPI application
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── models.py            # SQLAlchemy models (Instance, Metric, Alert)
│   │   ├── schemas.py           # Pydantic validation schemas
│   │   ├── config.py            # Configuration & environment variables
│   │   ├── database.py          # Database connection & session
│   │   ├── routes/              # API endpoints
│   │   │   ├── instances.py     # GET/POST/PUT/DELETE instances
│   │   │   ├── upload.py        # CSV file upload
│   │   │   ├── analysis.py      # Analysis & recommendations
│   │   │   ├── health.py        # Health checks & alerts
│   │   │   └── metrics.py       # Historical metrics
│   │   ├── services/            # Business logic
│   │   │   ├── optimizer.py     # Cost analysis & recommendations
│   │   │   └── email_service.py # Email notifications
│   │   └── utils/               # Utilities
│   │       ├── cost_calculator.py
│   │       └── validators.py
│   ├── Dockerfile.prod          # Production container
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Environment template
│
├── frontend/                     # React application
│   ├── public/
│   ├── src/
│   │   ├── index.jsx            # Entry point
│   │   ├── App.jsx              # Main router
│   │   ├── App.css              # Styles
│   │   ├── api.js               # API client
│   │   ├── components/
│   │   │   ├── CPUChart.jsx     # CPU line chart
│   │   │   ├── RAMChart.jsx     # RAM line chart
│   │   │   ├── StorageChart.jsx # Storage bar + disk visual
│   │   │   ├── UptimeChart.jsx  # Uptime pie chart
│   │   │   ├── InfoCards.jsx    # Region, Cost, Status cards
│   │   │   ├── ServerSelector.jsx # Server dropdown
│   │   │   └── RecommendationsCard.jsx # AI suggestions
│   │   └── pages/
│   │       ├── Dashboard.jsx    # Main dashboard
│   │       └── Upload.jsx       # CSV upload page
│   ├── Dockerfile               # Container
│   ├── package.json             # Dependencies
│   ├── index.html               # HTML template
│   └── .env.example             # Environment template
│
├── docker-compose.yml           # Multi-container orchestration
├── README.md                    # This file
└── IMPLEMENTATION_GUIDE.md      # Detailed implementation guide
```

## 🔧 API Endpoints

### Instances
```
GET    /api/instances              # List all instances
POST   /api/instances              # Create instance
GET    /api/instances/{id}         # Get instance details
PUT    /api/instances/{id}         # Update instance
DELETE /api/instances/{id}         # Delete instance
```

### Upload
```
POST   /api/upload                 # Upload CSV file
GET    /api/upload/example         # Get example CSV format
```

### Analysis
```
POST   /api/analyze/{id}           # Analyze instance
POST   /api/recommendations        # Get all recommendations
GET    /api/analyze/instance/{name} # Analyze by name
```

### Health
```
POST   /api/health/check/{id}      # Check instance health
GET    /api/health/check           # Check all health
GET    /api/alerts/{id}            # Get instance alerts
GET    /api/alerts                 # Get all alerts
```

### Metrics
```
POST   /api/metrics/{id}           # Record metric
GET    /api/metrics/{id}           # Get metrics (last 24h)
GET    /api/metrics/{id}/latest    # Get latest metric
GET    /api/metrics-summary/{id}   # Get metrics summary
```

## 📤 CSV Upload Format

Create a CSV file with the following columns:

```csv
name,cpu_usage,ram_usage,storage_usage,storage_capacity,uptime_hours,downtime_hours,region,monthly_cost,status
web-server-1,45,60,70,50,720,0,us-east-1,150.00,healthy
web-server-2,15,20,80,100,700,20,us-west-2,120.00,healthy
db-server-1,85,92,90,500,650,70,eu-west-1,300.00,healthy
```

### Column Descriptions

| Column | Type | Range | Example |
|--------|------|-------|---------|
| `name` | String | - | web-server-1 |
| `cpu_usage` | Float | 0-100 | 45 |
| `ram_usage` | Float | 0-100 | 60 |
| `storage_usage` | Float | 0-100 | 70 |
| `storage_capacity` | Float | > 0 | 50 (GB) |
| `uptime_hours` | Integer | ≥ 0 | 720 |
| `downtime_hours` | Integer | ≥ 0 | 0 |
| `region` | String | AWS region | us-east-1 |
| `monthly_cost` | Float | ≥ 0 | 150.00 |
| `status` | String | healthy/warning/critical | healthy |

## ⚙️ Configuration

### Environment Variables (Backend)

```env
DATABASE_URL=postgresql://admin:admin@db:5432/cloud_db
OPENAI_API_KEY=sk-xxxxx           # Optional: For AI summaries
SENDGRID_API_KEY=SG-xxxxx         # Optional: For email alerts
EMAIL_FROM=alerts@example.com
ADMIN_EMAIL=admin@example.com
FRONTEND_URL=http://localhost:3000
DEBUG=True
```

### Environment Variables (Frontend)

```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_ENABLE_EMAIL_ALERTS=true
REACT_APP_ENABLE_AI_ANALYSIS=true
```

## 🔐 Optional: Enable AI & Email

### OpenAI API (For Smart Summaries)
1. Sign up at [openai.com](https://openai.com)
2. Get your API key
3. Add to `.env`: `OPENAI_API_KEY=sk-xxxxx`

### SendGrid (For Email Alerts)
1. Create account at [sendgrid.com](https://sendgrid.com)
2. Get API key
3. Verify sender email
4. Add to `.env`: `SENDGRID_API_KEY=SG-xxxxx`

## 📊 Data Models

### Instance
```python
{
    "id": 1,
    "name": "web-server-1",
    "cpu_usage": 45.5,           # %
    "ram_usage": 60.2,           # %
    "storage_usage": 70.1,       # %
    "region": "us-east-1",
    "monthly_cost": 150.00,       # $
    "status": "healthy",
    "uptime_hours": 720,
    "downtime_hours": 0,
    "created_at": "2024-01-01T00:00:00"
}
```

### Analysis Result
```python
{
    "instance_id": 1,
    "instance_name": "web-server-1",
    "utilization_score": 58.5,    # 0-100
    "waste_percentage": 41.5,      # %
    "monthly_waste": 62.25,        # $
    "recommendations": [
        {
            "type": "resize",
            "action": "Downsize Instance",
            "savings": 60.00,
            "confidence": 85.0,
            "reason": "CPU usage only 45%. Can use smaller instance."
        }
    ],
    "ai_summary": "This server is underutilized..."
}
```

## 🐛 Troubleshooting

### PostgreSQL Connection Error
```
Error: could not connect to server: Connection refused
```
**Solution**: Ensure PostgreSQL is running: `docker-compose up db`

### Port Already in Use
```
Error: Bind for 0.0.0.0:8000 failed
```
**Solution**: Change port in docker-compose or kill existing process:
```bash
# Find process on port 8000
lsof -i :8000

# Kill it
kill -9 <PID>
```

### CSV Upload Fails
- Ensure CSV has correct headers (case-sensitive)
- Values must be valid (CPU 0-100, cost > 0)
- Instance names must be unique

### Charts Not Showing
- Ensure metrics are recorded: `/api/metrics/{id}`
- Wait at least 2 data points for charts
- Check browser console for errors

## 📈 Performance Tips

1. **For Large Datasets**:
   - Upload servers in batches (50-100 at a time)
   - Archive old metrics regularly

2. **Database Optimization**:
   - Add indexes on frequently queried columns
   - Implement data retention policy

3. **Frontend Optimization**:
   - Lazy load charts
   - Implement virtual scrolling for large lists

## 🔄 Maintenance

### Backup Database
```bash
docker-compose exec db pg_dump -U admin cloud_db > backup.sql
```

### Restore Database
```bash
docker-compose exec -T db psql -U admin cloud_db < backup.sql
```

### Clean Up Docker
```bash
docker-compose down -v  # Remove volumes
docker system prune     # Clean unused resources
```

## 📝 License

MIT License © 2024

## 🤝 Support

Having issues? Check the [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for detailed setup steps.

## 🎓 Learning Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Recharts Documentation](https://recharts.org/)

## 🚀 Deployment

### AWS Deployment
1. Create EC2 instance
2. Install Docker & Docker Compose
3. Clone repository
4. Configure RDS for PostgreSQL
5. Update DATABASE_URL in .env
6. Run: `docker-compose -f docker-compose.prod.yml up`

### Heroku Deployment
```bash
# Create app
heroku create cloudoptimization

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Push code
git push heroku main

# View logs
heroku logs --tail
```

## 📞 Contact & Feedback

Have questions or suggestions? Feel free to open an issue or contribute!

---

**Happy optimizing! 🚀☁️**
