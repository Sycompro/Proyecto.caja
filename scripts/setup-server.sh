#!/bin/bash

# Script para configurar servidor Ubuntu 22.04
# Ejecutar como root: curl -sSL https://raw.githubusercontent.com/tu-usuario/repo/main/scripts/setup-server.sh | bash

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Verificar que se ejecuta como root
if [[ $EUID -ne 0 ]]; then
   error "Este script debe ejecutarse como root"
fi

log "🚀 Configurando servidor para Sistema de Caja Registradora..."

# Actualizar sistema
log "📦 Actualizando sistema..."
apt update && apt upgrade -y

# Instalar dependencias básicas
log "🔧 Instalando dependencias básicas..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Instalar Node.js 18
log "📦 Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verificar instalación de Node.js
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
success "Node.js $NODE_VERSION y npm $NPM_VERSION instalados"

# Instalar PM2
log "🔧 Instalando PM2..."
npm install -g pm2

# Instalar Nginx
log "🌐 Instalando Nginx..."
apt install -y nginx

# Configurar firewall
log "🔒 Configurando firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Instalar Certbot para SSL
log "🔐 Instalando Certbot..."
apt install -y certbot python3-certbot-nginx

# Instalar PostgreSQL (opcional)
read -p "¿Instalar PostgreSQL? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "🗄️ Instalando PostgreSQL..."
    apt install -y postgresql postgresql-contrib
    
    # Configurar PostgreSQL
    sudo -u postgres psql -c "CREATE DATABASE caja_registradora;"
    sudo -u postgres psql -c "CREATE USER caja_user WITH PASSWORD 'cambiar_password';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE caja_registradora TO caja_user;"
    
    success "PostgreSQL instalado. Recuerda cambiar la contraseña!"
fi

# Crear usuario para la aplicación
log "👤 Creando usuario 'deploy'..."
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy

# Crear directorio para la aplicación
log "📁 Creando directorio de aplicación..."
mkdir -p /var/www/caja-registradora
chown deploy:deploy /var/www/caja-registradora

# Configurar Nginx básico
log "⚙️ Configurando Nginx..."
cat > /etc/nginx/sites-available/caja-registradora << 'EOF'
server {
    listen 80;
    server_name _;
    
    root /var/www/caja-registradora/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

# Habilitar sitio
ln -sf /etc/nginx/sites-available/caja-registradora /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Verificar configuración de Nginx
nginx -t

# Reiniciar servicios
log "🔄 Reiniciando servicios..."
systemctl restart nginx
systemctl enable nginx

# Instalar Docker (opcional)
read -p "¿Instalar Docker? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "🐳 Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker deploy
    rm get-docker.sh
    success "Docker instalado"
fi

# Configurar backups automáticos
log "💾 Configurando backups..."
mkdir -p /backups
chown deploy:deploy /backups

# Crear script de backup
cat > /usr/local/bin/backup-caja.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Backup de archivos
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/caja-registradora

# Backup de base de datos (si existe)
if command -v pg_dump &> /dev/null; then
    pg_dump -h localhost -U caja_user caja_registradora > $BACKUP_DIR/db_$DATE.sql
fi

# Limpiar backups antiguos (más de 7 días)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup completado: $DATE"
EOF

chmod +x /usr/local/bin/backup-caja.sh

# Configurar cron para backups diarios
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-caja.sh") | crontab -

# Instalar fail2ban para seguridad
log "🔒 Instalando Fail2Ban..."
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Configurar actualizaciones automáticas
log "🔄 Configurando actualizaciones automáticas..."
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Mostrar información del sistema
log "📊 Información del sistema:"
echo "=================================="
echo "OS: $(lsb_release -d | cut -f2)"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Nginx: $(nginx -v 2>&1)"
echo "PostgreSQL: $(psql --version 2>/dev/null || echo 'No instalado')"
echo "Docker: $(docker --version 2>/dev/null || echo 'No instalado')"
echo "=================================="

success "🎉 ¡Servidor configurado exitosamente!"

echo ""
echo "📋 Próximos pasos:"
echo "1. Configurar tu dominio para apuntar a esta IP"
echo "2. Ejecutar: sudo certbot --nginx -d tu-dominio.com"
echo "3. Clonar tu repositorio en /var/www/caja-registradora"
echo "4. Configurar variables de entorno"
echo "5. Ejecutar npm install && npm run build"
echo ""
echo "🔐 Información importante:"
echo "- Usuario de aplicación: deploy"
echo "- Directorio de aplicación: /var/www/caja-registradora"
echo "- Configuración de Nginx: /etc/nginx/sites-available/caja-registradora"
echo "- Backups: /backups (diarios a las 2:00 AM)"
echo ""
echo "⚠️  Recuerda:"
echo "- Cambiar contraseñas por defecto"
echo "- Configurar SSH con llaves"
echo "- Revisar configuración de firewall"