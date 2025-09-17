# 🚀 Guía Completa de Despliegue - Sistema de Caja Registradora

## 📋 Índice
1. [Preparación del Proyecto](#preparación-del-proyecto)
2. [Configuración de Base de Datos](#configuración-de-base-de-datos)
3. [Despliegue del Frontend](#despliegue-del-frontend)
4. [Configuración del Servidor](#configuración-del-servidor)
5. [Configuración de Dominio](#configuración-de-dominio)
6. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)

---

## 🛠️ Preparación del Proyecto

### 1. Configurar Variables de Entorno
Crea un archivo `.env.production`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# WhatsApp Configuration (Opcional)
VITE_WHATSAPP_ACCESS_TOKEN=tu-whatsapp-token
VITE_WHATSAPP_PHONE_NUMBER_ID=tu-phone-number-id

# App Configuration
VITE_APP_URL=https://tu-dominio.com
VITE_APP_NAME=Sistema de Caja Registradora
```

### 2. Optimizar para Producción
```bash
# Instalar dependencias de producción
npm ci --only=production

# Construir para producción
npm run build

# Verificar build
npm run preview
```

---

## 🗄️ Configuración de Base de Datos

### Opción A: Supabase (Recomendado - Fácil)

#### 1. Crear Proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Anota la URL y las API Keys

#### 2. Configurar Esquema de Base de Datos
```sql
-- Crear tabla de usuarios
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de solicitudes
CREATE TABLE print_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by TEXT,
  notes TEXT
);

-- Crear tabla de configuración
CREATE TABLE app_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can see all profiles" ON profiles
  FOR SELECT USING (role = 'admin');

CREATE POLICY "Users can view own requests" ON print_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests" ON print_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage requests" ON print_requests
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can manage settings" ON app_settings
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
```

### Opción B: PostgreSQL en VPS

#### 1. Instalar PostgreSQL
```bash
# En Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Configurar PostgreSQL
sudo -u postgres psql
CREATE DATABASE caja_registradora;
CREATE USER caja_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE caja_registradora TO caja_user;
\q
```

---

## 🌐 Despliegue del Frontend

### Opción A: Netlify (Recomendado - Gratis)

#### 1. Preparar para Netlify
```bash
# Crear archivo netlify.toml
cat > netlify.toml << EOF
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  VITE_SUPABASE_URL = "https://tu-proyecto.supabase.co"
  VITE_SUPABASE_ANON_KEY = "tu-anon-key"
EOF
```

#### 2. Desplegar en Netlify
1. Ve a [netlify.com](https://netlify.com)
2. Conecta tu repositorio de GitHub
3. Configura las variables de entorno
4. Despliega automáticamente

### Opción B: Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel --prod
```

### Opción C: VPS con Nginx

#### 1. Configurar Servidor (Ubuntu 22.04)
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Nginx
sudo apt install nginx -y

# Instalar PM2 para gestión de procesos
sudo npm install -g pm2
```

#### 2. Configurar Nginx
```nginx
# /etc/nginx/sites-available/caja-registradora
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    
    root /var/www/caja-registradora/dist;
    index index.html;
    
    # Configuración para SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Optimizaciones
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Compresión
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### 3. Habilitar sitio
```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/caja-registradora /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 🔒 Configuración SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Verificar renovación automática
sudo certbot renew --dry-run
```

---

## 🖥️ Configuración del Servidor Virtual

### Opción A: DigitalOcean (Recomendado)

#### 1. Crear Droplet
- **OS:** Ubuntu 22.04 LTS
- **Plan:** Basic ($6/mes)
- **CPU:** 1 vCPU
- **RAM:** 1 GB
- **Storage:** 25 GB SSD

#### 2. Configuración Inicial
```bash
# Conectar por SSH
ssh root@tu-ip-servidor

# Crear usuario no-root
adduser deploy
usermod -aG sudo deploy
su - deploy

# Configurar firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Opción B: AWS EC2
```bash
# Instancia t2.micro (capa gratuita)
# AMI: Ubuntu Server 22.04 LTS
# Configurar Security Groups:
# - HTTP (80)
# - HTTPS (443)
# - SSH (22)
```

### Opción C: Google Cloud Platform
```bash
# Compute Engine
# Instancia e2-micro (capa gratuita)
# Imagen: Ubuntu 22.04 LTS
```

---

## 🔧 Script de Despliegue Automatizado

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Iniciando despliegue..."

# Variables
DOMAIN="tu-dominio.com"
APP_DIR="/var/www/caja-registradora"
REPO_URL="https://github.com/tu-usuario/caja-registradora.git"

# Actualizar código
echo "📥 Actualizando código..."
cd $APP_DIR
git pull origin main

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci --only=production

# Construir aplicación
echo "🔨 Construyendo aplicación..."
npm run build

# Reiniciar servicios
echo "🔄 Reiniciando servicios..."
sudo systemctl reload nginx

echo "✅ Despliegue completado!"
echo "🌐 Sitio disponible en: https://$DOMAIN"
```

---

## 📊 Monitoreo y Mantenimiento

### 1. Configurar Logs
```bash
# Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Configurar logrotate
sudo nano /etc/logrotate.d/caja-registradora
```

### 2. Backup Automático
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Backup de base de datos
pg_dump -h localhost -U caja_user caja_registradora > $BACKUP_DIR/db_$DATE.sql

# Backup de archivos
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/caja-registradora

# Limpiar backups antiguos (más de 7 días)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### 3. Monitoreo con Uptime Robot
1. Ve a [uptimerobot.com](https://uptimerobot.com)
2. Crea monitores para tu sitio
3. Configura alertas por email/SMS

---

## 🔐 Seguridad Adicional

### 1. Configurar Fail2Ban
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. Configurar Firewall Avanzado
```bash
# Configurar UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 3. Actualizaciones Automáticas
```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 📱 Configuración de WhatsApp Business API

### 1. Obtener Credenciales
1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Crea una aplicación de WhatsApp Business
3. Obtén el Access Token y Phone Number ID

### 2. Configurar Webhook (Opcional)
```javascript
// webhook.js para recibir respuestas
const express = require('express');
const app = express();

app.post('/webhook', (req, res) => {
  // Procesar mensajes entrantes
  console.log('Mensaje recibido:', req.body);
  res.sendStatus(200);
});

app.listen(3001);
```

---

## 🎯 Checklist Final

### Pre-Despliegue
- [ ] ✅ Código probado localmente
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Base de datos configurada
- [ ] ✅ SSL certificado instalado
- [ ] ✅ Dominio configurado

### Post-Despliegue
- [ ] ✅ Sitio accesible vía HTTPS
- [ ] ✅ Funcionalidades principales probadas
- [ ] ✅ Backup configurado
- [ ] ✅ Monitoreo activo
- [ ] ✅ Logs funcionando

### Mantenimiento
- [ ] ✅ Actualizaciones automáticas
- [ ] ✅ Monitoreo de rendimiento
- [ ] ✅ Backup regular
- [ ] ✅ Revisión de logs

---

## 💰 Costos Estimados

### Opción Económica (Recomendada)
- **Frontend:** Netlify (Gratis)
- **Base de Datos:** Supabase (Gratis hasta 500MB)
- **Dominio:** $10-15/año
- **Total:** ~$15/año

### Opción VPS
- **Servidor:** DigitalOcean ($6/mes)
- **Dominio:** $10-15/año
- **Total:** ~$85/año

### Opción Enterprise
- **Servidor:** AWS/GCP ($20-50/mes)
- **Base de Datos:** RDS ($15-30/mes)
- **CDN:** CloudFlare Pro ($20/mes)
- **Total:** ~$660-1200/año

---

## 🆘 Soporte y Troubleshooting

### Problemas Comunes

#### 1. Error 404 en rutas
```nginx
# Agregar a configuración de Nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

#### 2. Variables de entorno no funcionan
```bash
# Verificar archivo .env
cat .env.production

# Reconstruir aplicación
npm run build
```

#### 3. Base de datos no conecta
```bash
# Verificar conexión
psql -h localhost -U caja_user -d caja_registradora

# Verificar firewall
sudo ufw status
```

---

## 📞 Contacto y Soporte

Para soporte adicional:
- 📧 Email: soporte@tu-dominio.com
- 📱 WhatsApp: +1234567890
- 🌐 Documentación: https://docs.tu-dominio.com

---

**¡Tu sistema estará listo para producción siguiendo esta guía! 🚀**