# 🚀 Guía de Deployment

## Configuración para Producción

### Variables de Entorno de Producción

```env
# Aplicación
NODE_ENV=production
PORT=3000

# Base de Datos
DB_HOST=your-production-db-host
DB_PORT=5432
DB_USERNAME=your-production-user
DB_PASSWORD=your-secure-password
DB_DATABASE=nestjs_hexagonal_production

# JWT
JWT_SECRET=your-super-secure-production-jwt-secret
JWT_EXPIRES_IN=1h

# SSL/TLS
DB_SSL=true
FORCE_HTTPS=true

# CORS
FRONTEND_URL=https://your-frontend-domain.com
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://admin.your-domain.com
```

## Build para Producción

### 1. Compilación

```bash
# Instalar solo dependencias de producción
npm ci --only=production

# Compilar TypeScript
npm run build

# Verificar build
ls -la dist/
```

### 2. Optimización del Bundle

```json
// package.json
{
  "scripts": {
    "build": "nest build",
    "build:prod": "nest build --webpack",
    "start:prod": "node dist/main.js"
  }
}
```

## Deployment con Docker

### Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY src/ ./src/

# Compilar aplicación
RUN npm run build

# Imagen de producción
FROM node:18-alpine AS production

# Instalar dumb-init para manejo correcto de señales
RUN apk add --no-cache dumb-init

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar aplicación compilada
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Cambiar a usuario no-root
USER nestjs

# Exponer puerto
EXPOSE 3000

# Comando de inicio
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

### Docker Compose para Producción

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USERNAME=nestjs_user
      - DB_PASSWORD=secure_password
      - DB_DATABASE=nestjs_production
      - JWT_SECRET=super-secure-jwt-secret
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - app-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=nestjs_user
      - POSTGRES_PASSWORD=secure_password
      - POSTGRES_DB=nestjs_production
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

## Configuración de Nginx

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream nestjs_app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    server {
        listen 80;
        server_name your-domain.com;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/certificate.crt;
        ssl_certificate_key /etc/nginx/ssl/private.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self'" always;

        # API routes
        location /api {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://nestjs_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Health check
        location /health {
            proxy_pass http://nestjs_app;
            access_log off;
        }
    }
}
```

## Deployment en la Nube

### AWS ECS con Fargate

```json
// task-definition.json
{
  "family": "nestjs-hexagonal-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "nestjs-app",
      "image": "your-account.dkr.ecr.region.amazonaws.com/nestjs-hexagonal:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:prod/db/password"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:prod/jwt/secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/nestjs-hexagonal",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### Heroku

```yaml
# Procfile
web: node dist/main.js

# heroku.yml
build:
  docker:
    web: Dockerfile
```

```json
// package.json - scripts para Heroku
{
  "scripts": {
    "heroku-postbuild": "npm run build",
    "start": "node dist/main.js"
  }
}
```

### Google Cloud Run

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/nestjs-hexagonal:$COMMIT_SHA', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/nestjs-hexagonal:$COMMIT_SHA']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'nestjs-hexagonal-app'
      - '--image=gcr.io/$PROJECT_ID/nestjs-hexagonal:$COMMIT_SHA'
      - '--region=us-central1'
      - '--platform=managed'
      - '--allow-unauthenticated'
```

## Health Checks

### Endpoint de Health Check

```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      // Agregar más checks según necesidad
    ]);
  }

  @Get('live')
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

## Monitoreo y Logging

### Logging Estructurado

```typescript
// logger.config.ts
import * as winston from 'winston';

export const createLogger = () => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    defaultMeta: { service: 'nestjs-hexagonal' },
    transports: [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
  });
};

// En producción, usar CloudWatch, ELK, etc.
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Métricas con Prometheus

```typescript
// metrics.controller.ts
@Controller('metrics')
export class MetricsController {
  @Get()
  @Header('Content-Type', 'text/plain')
  async getMetrics() {
    return await register.metrics();
  }
}
```

## Scripts de Deployment

### Deploy Script

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Iniciando deployment..."

# Build
echo "📦 Building application..."
npm run build

# Tests
echo "🧪 Running tests..."
npm run test:e2e

# Docker build
echo "🐳 Building Docker image..."
docker build -t nestjs-hexagonal:latest .

# Deploy (ejemplo para Docker Swarm)
echo "🚢 Deploying to production..."
docker service update --image nestjs-hexagonal:latest nestjs-app

echo "✅ Deployment completed!"
```

### CI/CD con GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Aquí van los comandos de deployment
          echo "Deploying to production..."
```

## Backup y Restore

### Script de Backup

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup de base de datos
docker exec postgres pg_dump -U nestjs_user nestjs_production > \
  "$BACKUP_DIR/db_backup_$DATE.sql"

# Comprimir
gzip "$BACKUP_DIR/db_backup_$DATE.sql"

# Limpiar backups antiguos (mantener últimos 7 días)
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
```

## Rollback Strategy

### Blue-Green Deployment

```bash
# Scripts para blue-green deployment
./scripts/deploy-green.sh  # Deploy nueva versión
./scripts/test-green.sh    # Verificar nueva versión
./scripts/switch-traffic.sh # Cambiar tráfico a nueva versión
./scripts/cleanup-blue.sh  # Limpiar versión anterior
```
