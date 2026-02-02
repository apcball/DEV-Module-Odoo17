# 🐳 Monitor Website - Docker Deployment Guide

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- (Optional) Telegram Bot Token for notifications

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/apcball/AI-DEV-.git
cd AI-DEV-/squad
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Deploy with Docker Compose

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Access Application

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js Dashboard |
| Backend | 3001 | Node.js API |
| PostgreSQL | 5432 | Database |

## Environment Variables

### Required
- `DB_PASSWORD` - PostgreSQL password

### Optional
- `TELEGRAM_BOT_TOKEN` - Telegram bot token for notifications
- `TELEGRAM_CHAT_ID` - Default chat ID for notifications
- `CHECK_INTERVAL_MINUTES` - Check interval (default: 60)

## Docker Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop and remove
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Update images
docker-compose pull
docker-compose up -d

# Check status
docker-compose ps
```

## Health Checks

All services include health checks:
- Database: `pg_isready`
- Backend: HTTP GET /health
- Frontend: HTTP GET /

## Troubleshooting

### Database Connection Error
```bash
# Check database logs
docker-compose logs postgres

# Restart services
docker-compose restart
```

### Build Errors
```bash
# Clean build
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### View Container Shell
```bash
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec postgres psql -U monitor -d monitor_website
```

## Production Deployment

### 1. Use Strong Passwords
Edit `.env`:
```
DB_PASSWORD=your_very_secure_password
TELEGRAM_BOT_TOKEN=your_bot_token
```

### 2. Use HTTPS
Configure reverse proxy (nginx/traefik) with SSL certificates.

### 3. Update Environment
```bash
# Production API URL
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### 4. Deploy
```bash
docker-compose -f docker-compose.yml up -d
```

## Backup & Restore

### Backup Database
```bash
docker-compose exec postgres pg_dump -U monitor monitor_website > backup.sql
```

### Restore Database
```bash
docker-compose exec -T postgres psql -U monitor -d monitor_website < backup.sql
```

## Monitoring

### Container Resources
```bash
docker stats
```

### Service Health
```bash
# Check all services
docker-compose ps

# Check specific service
docker-compose exec backend wget -qO- http://localhost:3001/health
```

## Updates

### Update to Latest Version
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build
```

## Support

For issues or questions, contact the development team:
- 🔮 Oracle (System Analyst)
- 🤖 Atlas (Backend)
- 🎨 Pixel (Frontend)
- 🔍 Sherlock (QA)

---

**Built with ❤️ by The Squad**
