#!/bin/bash

# 🐳 Instalación con Docker - Sistema de Caja Registradora v2.0

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}🐳 Instalación con Docker v2.0${NC}"
echo -e "${PURPLE}Sistema completo con WhatsApp y Cámaras IP${NC}"

# Crear Dockerfile optimizado
cat > Dockerfile << 'EOF'
# Etapa de construcción
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Construir aplicación
RUN npm run build

# Etapa de producción
FROM nginx:alpine

# Instalar curl para health checks
RUN apk add --no-cache curl

# Copiar archivos construidos
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de Nginx
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Crear directorio para logs
RUN mkdir -p /var/log/nginx

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"]
EOF

# Crear docker-compose.yml completo
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Aplicación principal
  app:
    build: .
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    restart: unless-stopped
    depends_on:
      - postgres
    networks:
      - caja-network

  # Base de datos PostgreSQL
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: caja_registradora
      POSTGRES_USER: caja_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-secure_password_123}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - caja-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U caja_user -d caja_registradora"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis para cache y sesiones
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - caja-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Servidor de cámaras (opcional)
  camera-server:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./camera-streams:/usr/share/nginx/html:ro
    restart: unless-stopped
    networks:
      - caja-network
    profiles:
      - cameras

volumes:
  postgres_data:
  redis_data:

networks:
  caja-network:
    driver: bridge
EOF

# Crear configuración de Nginx optimizada
mkdir -p docker
cat > docker/nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Configuración para SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy (para futuras extensiones)
    location /api/ {
        proxy_pass http://backend:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket para chat en tiempo real
    location /ws {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
    
    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
    }
    
    # Compresión
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        application/xml
        image/svg+xml;
    
    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # CORS para cámaras IP
    location /camera-stream/ {
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept";
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
        
        proxy_pass http://camera-server:80/;
    }
}
EOF

# Crear archivo de inicialización de base de datos
cat > init.sql << 'EOF'
-- Inicialización de base de datos para Docker
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Función para timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de solicitudes
CREATE TABLE IF NOT EXISTS print_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by VARCHAR(100),
    notes TEXT
);

-- Tabla de configuración
CREATE TABLE IF NOT EXISTS app_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT
);

-- Insertar usuarios por defecto
INSERT INTO users (username, password, full_name, email, role) VALUES
    ('admin', 'admin123', 'Administrador Sistema', 'admin@empresa.com', 'admin'),
    ('usuario1', 'user123', 'Juan Pérez', 'juan@empresa.com', 'user')
ON CONFLICT (username) DO NOTHING;

-- Insertar configuración inicial
INSERT INTO app_settings (setting_key, setting_value) VALUES
    ('company_name', 'Sistema de Caja Registradora'),
    ('whatsapp_enabled', 'false'),
    ('camera_monitoring_enabled', 'false'),
    ('version', '2.0.0')
ON CONFLICT (setting_key) DO NOTHING;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_print_requests_user_id ON print_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_print_requests_status ON print_requests(status);
CREATE INDEX IF NOT EXISTS idx_print_requests_created_at ON print_requests(created_at);
EOF

# Crear archivo de variables de entorno para Docker
cat > .env.docker << 'EOF'
# PostgreSQL
POSTGRES_PASSWORD=secure_password_123
POSTGRES_USER=caja_user
POSTGRES_DB=caja_registradora

# App Configuration
VITE_APP_URL=http://localhost:3000
VITE_APP_NAME=Sistema de Caja Registradora
VITE_APP_VERSION=2.0.0

# WhatsApp (Configurar en producción)
VITE_WHATSAPP_ACCESS_TOKEN=
VITE_WHATSAPP_PHONE_NUMBER_ID=

# Cameras
VITE_CAMERA_MONITORING_ENABLED=true
EOF

# Crear scripts de Docker
cat > docker-start.sh << 'EOF'
#!/bin/bash
echo "🐳 Iniciando Sistema de Caja Registradora con Docker..."
echo ""
echo "📦 Construyendo contenedores..."
docker-compose build

echo "🚀 Iniciando servicios..."
docker-compose up -d

echo "⏳ Esperando que los servicios estén listos..."
sleep 10

echo "✅ Sistema iniciado!"
echo ""
echo "🌐 Acceso:"
echo "• Aplicación: http://localhost:3000"
echo "• Base de datos: localhost:5432"
echo "• Cache Redis: localhost:6379"
echo ""
echo "🔧 Comandos útiles:"
echo "• Ver logs: docker-compose logs -f"
echo "• Detener: docker-compose down"
echo "• Reiniciar: docker-compose restart"
EOF

cat > docker-stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Deteniendo Sistema de Caja Registradora..."
docker-compose down
echo "✅ Sistema detenido"
EOF

chmod +x docker-start.sh docker-stop.sh

echo -e "${GREEN}✅ Archivos Docker creados${NC}"
echo ""
echo -e "${YELLOW}📋 Para usar Docker:${NC}"
echo "1. ./docker-start.sh    - Iniciar con Docker"
echo "2. ./docker-stop.sh     - Detener contenedores"
echo "3. Accede a http://localhost:3000"
echo ""
echo -e "${BLUE}🔧 Configuración adicional:${NC}"
echo "• Edita .env.docker para configuración"
echo "• Configura WhatsApp desde el panel admin"
echo "• Agrega cámaras IP desde el panel admin"
echo ""
echo -e "${GREEN}🐳 ¡Docker configurado exitosamente!${NC}"