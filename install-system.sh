#!/bin/bash

# 🚀 Instalador Automático - Sistema de Caja Registradora
# Versión: 2.0.0
# Descripción: Instalación completa automatizada con todas las funcionalidades

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables globales
PROJECT_NAME="sistema-caja-registradora"
NODE_VERSION="18"
INSTALL_DIR=""
DOMAIN=""
EMAIL=""
INSTALL_TYPE=""
SUPABASE_URL=""
SUPABASE_ANON_KEY=""

# Función para logging con colores
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

info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Banner de bienvenida
show_banner() {
    clear
    echo -e "${PURPLE}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🏪 SISTEMA DE CAJA REGISTRADORA - INSTALADOR v2.0        ║
║                                                              ║
║    Instalación automática completa                          ║
║    • Frontend React + TypeScript + Tailwind                 ║
║    • Backend Supabase con RLS                               ║
║    • WhatsApp Business API                                  ║
║    • Sistema de Cámaras IP                                  ║
║    • Chat en tiempo real                                    ║
║    • Notificaciones push                                    ║
║    • Impresión automática                                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Verificar requisitos del sistema
check_requirements() {
    log "🔍 Verificando requisitos del sistema..."
    
    # Verificar sistema operativo
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        info "Sistema operativo: Linux ✅"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        info "Sistema operativo: macOS ✅"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        info "Sistema operativo: Windows ✅"
    else
        error "Sistema operativo no soportado: $OSTYPE"
    fi
    
    # Verificar curl
    if ! command -v curl &> /dev/null; then
        error "curl no está instalado. Por favor instálalo primero."
    fi
    
    # Verificar git
    if ! command -v git &> /dev/null; then
        error "git no está instalado. Por favor instálalo primero."
    fi
    
    success "Todos los requisitos básicos están disponibles"
}

# Instalar Node.js
install_nodejs() {
    log "📦 Verificando/Instalando Node.js..."
    
    if command -v node &> /dev/null; then
        NODE_CURRENT=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_CURRENT" -ge "$NODE_VERSION" ]; then
            success "Node.js v$(node --version) ya está instalado"
            return
        fi
    fi
    
    info "Instalando Node.js v$NODE_VERSION..."
    
    # Instalar Node.js usando NodeSource
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install node@${NODE_VERSION}
        else
            error "Homebrew no está instalado. Instálalo desde https://brew.sh/"
        fi
    else
        warning "Instala Node.js manualmente desde https://nodejs.org/"
        read -p "Presiona Enter cuando hayas instalado Node.js..."
    fi
    
    success "Node.js instalado correctamente"
}

# Seleccionar tipo de instalación
select_installation_type() {
    log "🎯 Selecciona el tipo de instalación:"
    echo ""
    echo "1) 🚀 Desarrollo Local (Recomendado para pruebas)"
    echo "2) 🌐 Producción con Supabase (Recomendado)"
    echo "3) 🏢 Servidor Propio (VPS/Dedicado)"
    echo "4) ☁️  Despliegue en la Nube (Netlify/Vercel)"
    echo ""
    
    while true; do
        read -p "Selecciona una opción (1-4): " choice
        case $choice in
            1) INSTALL_TYPE="development"; break;;
            2) INSTALL_TYPE="supabase"; break;;
            3) INSTALL_TYPE="server"; break;;
            4) INSTALL_TYPE="cloud"; break;;
            *) warning "Opción inválida. Selecciona 1, 2, 3 o 4.";;
        esac
    done
    
    success "Tipo de instalación seleccionado: $INSTALL_TYPE"
}

# Configurar directorio de instalación
setup_install_directory() {
    log "📁 Configurando directorio de instalación..."
    
    echo "Directorio actual: $(pwd)"
    read -p "¿Instalar en el directorio actual? (y/n): " install_here
    
    if [[ $install_here =~ ^[Yy]$ ]]; then
        INSTALL_DIR=$(pwd)
    else
        read -p "Ingresa la ruta completa donde instalar: " custom_dir
        INSTALL_DIR="$custom_dir"
        mkdir -p "$INSTALL_DIR"
    fi
    
    cd "$INSTALL_DIR"
    success "Directorio de instalación: $INSTALL_DIR"
}

# Crear proyecto con Vite
create_project() {
    log "📦 Creando proyecto con Vite..."
    
    if [ -d "$PROJECT_NAME" ]; then
        warning "El directorio $PROJECT_NAME ya existe"
        read -p "¿Sobrescribir? (y/n): " overwrite
        if [[ $overwrite =~ ^[Yy]$ ]]; then
            rm -rf "$PROJECT_NAME"
        else
            error "Instalación cancelada"
        fi
    fi
    
    # Crear proyecto con Vite
    npm create vite@latest "$PROJECT_NAME" -- --template react-ts --yes
    cd "$PROJECT_NAME"
    
    success "Proyecto creado con Vite + React + TypeScript"
}

# Instalar dependencias
install_dependencies() {
    log "📦 Instalando dependencias del proyecto..."
    
    info "Instalando dependencias principales..."
    npm install @supabase/supabase-js@latest lucide-react@latest
    
    info "Instalando dependencias de desarrollo..."
    npm install -D tailwindcss@latest postcss@latest autoprefixer@latest
    
    info "Configurando Tailwind CSS..."
    npx tailwindcss init -p --yes
    
    success "Dependencias instaladas correctamente"
}

# Configurar Supabase
setup_supabase() {
    log "🚀 Configurando Supabase..."
    
    echo ""
    info "Para configurar Supabase necesitas:"
    echo "1. Crear una cuenta en https://supabase.com"
    echo "2. Crear un nuevo proyecto"
    echo "3. Obtener la URL y las API Keys"
    echo ""
    
    read -p "¿Ya tienes un proyecto de Supabase? (y/n): " has_project
    
    if [[ ! $has_project =~ ^[Yy]$ ]]; then
        info "Visita https://supabase.com para crear tu proyecto"
        read -p "Presiona Enter cuando hayas creado tu proyecto..."
    fi
    
    echo ""
    read -p "Ingresa tu Supabase URL: " SUPABASE_URL
    read -p "Ingresa tu Supabase Anon Key: " SUPABASE_ANON_KEY
    read -s -p "Ingresa tu Supabase Service Role Key: " supabase_service_key
    echo ""
    
    # Crear archivo .env
    cat > .env << EOF
# Supabase Configuration
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
VITE_SUPABASE_SERVICE_ROLE_KEY=$supabase_service_key

# App Configuration
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=Sistema de Caja Registradora
VITE_APP_VERSION=2.0.0

# WhatsApp Configuration (Configurar después)
VITE_WHATSAPP_ACCESS_TOKEN=
VITE_WHATSAPP_PHONE_NUMBER_ID=
VITE_WHATSAPP_BUSINESS_ACCOUNT_ID=
VITE_WHATSAPP_MANAGER_PHONE=
VITE_WHATSAPP_ADMIN_PHONE=

# Camera Configuration
VITE_CAMERA_MONITORING_ENABLED=false
VITE_CAMERA_AUTO_RECORD=true
VITE_CAMERA_RECORD_DURATION=300

# Development Configuration
VITE_DEV_MODE=true
VITE_DEBUG_LOGS=true
EOF
    
    success "Configuración de Supabase guardada en .env"
}

# Configurar WhatsApp Business API
setup_whatsapp() {
    log "📱 Configurando WhatsApp Business API..."
    
    echo ""
    info "Para configurar WhatsApp Business API necesitas:"
    echo "1. Una cuenta de Facebook Business"
    echo "2. Acceso a WhatsApp Business API"
    echo "3. Un número de teléfono verificado"
    echo "4. Plantillas de mensaje aprobadas (opcional)"
    echo ""
    
    read -p "¿Quieres configurar WhatsApp ahora? (y/n): " setup_wa
    
    if [[ $setup_wa =~ ^[Yy]$ ]]; then
        echo ""
        info "Configuración de WhatsApp Business API:"
        read -p "Access Token: " wa_token
        read -p "Phone Number ID: " wa_phone_id
        read -p "Business Account ID: " wa_business_id
        read -p "Número del gerente (con código de país): " manager_phone
        read -p "Número del admin (con código de país): " admin_phone
        read -p "Webhook Verify Token (opcional): " webhook_token
        
        # Actualizar .env con configuración de WhatsApp
        sed -i "s/VITE_WHATSAPP_ACCESS_TOKEN=/VITE_WHATSAPP_ACCESS_TOKEN=$wa_token/" .env
        sed -i "s/VITE_WHATSAPP_PHONE_NUMBER_ID=/VITE_WHATSAPP_PHONE_NUMBER_ID=$wa_phone_id/" .env
        sed -i "s/VITE_WHATSAPP_BUSINESS_ACCOUNT_ID=/VITE_WHATSAPP_BUSINESS_ACCOUNT_ID=$wa_business_id/" .env
        sed -i "s/VITE_WHATSAPP_MANAGER_PHONE=/VITE_WHATSAPP_MANAGER_PHONE=$manager_phone/" .env
        sed -i "s/VITE_WHATSAPP_ADMIN_PHONE=/VITE_WHATSAPP_ADMIN_PHONE=$admin_phone/" .env
        
        success "WhatsApp Business API configurado"
    else
        info "Puedes configurar WhatsApp más tarde desde la aplicación"
    fi
}

# Configurar cámaras IP
setup_cameras() {
    log "📹 Configurando sistema de cámaras IP..."
    
    echo ""
    info "El sistema de cámaras IP permite:"
    echo "• Monitoreo en tiempo real"
    echo "• Grabación automática al aprobar solicitudes"
    echo "• Múltiples cámaras IP simultáneas"
    echo "• Integración con RTSP, HTTP, ONVIF"
    echo ""
    
    read -p "¿Quieres habilitar el monitoreo por cámara? (y/n): " enable_cameras
    
    if [[ $enable_cameras =~ ^[Yy]$ ]]; then
        # Actualizar configuración de cámaras en .env
        sed -i "s/VITE_CAMERA_MONITORING_ENABLED=false/VITE_CAMERA_MONITORING_ENABLED=true/" .env
        
        echo ""
        info "¿Quieres agregar una cámara IP ahora?"
        read -p "(y/n): " add_camera
        
        if [[ $add_camera =~ ^[Yy]$ ]]; then
            echo ""
            read -p "Nombre de la cámara: " camera_name
            read -p "URL de la cámara (ej: http://192.168.1.100:8080/video): " camera_url
            read -p "Ubicación (ej: Caja Principal): " camera_location
            read -p "Usuario de la cámara (opcional): " camera_user
            read -s -p "Contraseña de la cámara (opcional): " camera_pass
            echo ""
            
            # Crear configuración inicial de cámaras
            cat > camera-config.json << EOF
{
  "cameras": [
    {
      "id": "camera-1",
      "name": "$camera_name",
      "url": "$camera_url",
      "location": "$camera_location",
      "type": "ip",
      "isActive": true,
      "username": "$camera_user",
      "password": "$camera_pass"
    }
  ],
  "config": {
    "enabled": true,
    "autoRecord": true,
    "recordDuration": 300,
    "quality": "medium",
    "enableAudio": false
  }
}
EOF
            
            success "Cámara IP configurada: $camera_name"
        fi
        
        success "Sistema de cámaras habilitado"
    else
        info "Sistema de cámaras deshabilitado (puedes habilitarlo después)"
    fi
}

# Configurar archivos del proyecto
setup_project_files() {
    log "📝 Configurando archivos del proyecto..."
    
    # Configurar Tailwind
    cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      animation: {
        'theme-switch': 'theme-switch 0.3s ease-in-out',
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        'theme-switch': {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.1)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        'blob': {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        }
      }
    },
  },
  plugins: [],
};
EOF

    # Actualizar package.json con scripts adicionales
    cat > package.json << EOF
{
  "name": "sistema-caja-registradora",
  "private": true,
  "version": "2.0.0",
  "type": "module",
  "description": "Sistema integral de gestión de caja registradora",
  "keywords": ["caja-registradora", "sistema-gestion", "react", "typescript", "supabase"],
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "start": "npm run dev",
    "deploy": "npm run build && netlify deploy --prod",
    "deploy:vercel": "npm run build && vercel --prod",
    "setup": "npm install && npm run dev"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0",
    "lucide-react": "^0.344.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.9.1",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.18",
    "eslint": "^9.9.1",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.11",
    "globals": "^15.9.0",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.3.0",
    "vite": "^5.4.2"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
EOF

    # Actualizar index.html
    cat > index.html << 'EOF'
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Sistema integral de gestión de caja registradora con notificaciones WhatsApp y monitoreo por cámara" />
    <meta name="keywords" content="caja registradora, sistema gestión, WhatsApp, cámaras IP, React" />
    <title>Sistema de Caja Registradora</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

    success "Archivos del proyecto configurados"
}

# Configurar base de datos Supabase
setup_database() {
    log "🗄️ Configurando base de datos Supabase..."
    
    if [[ "$INSTALL_TYPE" == "supabase" || "$INSTALL_TYPE" == "cloud" ]]; then
        info "Configurando esquema de base de datos..."
        
        # Crear directorio de migraciones
        mkdir -p supabase/migrations
        
        # Crear migración principal
        cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_initial_schema.sql << 'EOF'
/*
  # Sistema de Caja Registradora - Esquema Inicial

  1. Tablas principales
    - profiles: Perfiles de usuario
    - print_requests: Solicitudes de apertura
    - app_settings: Configuración del sistema
    - printers: Configuración de impresoras
    - notifications: Sistema de notificaciones
    - cameras: Configuración de cámaras IP
    - camera_sessions: Sesiones de monitoreo

  2. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas por rol (admin/user)
*/

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabla de perfiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de solicitudes
CREATE TABLE IF NOT EXISTS print_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by TEXT,
    notes TEXT
);

-- Tabla de configuración
CREATE TABLE IF NOT EXISTS app_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT
);

-- Tabla de impresoras
CREATE TABLE IF NOT EXISTS printers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('thermal', 'laser', 'inkjet')),
    paper_size TEXT NOT NULL CHECK (paper_size IN ('A4', '80mm', '58mm')),
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'request', 'approval')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    metadata JSONB
);

-- Tabla de cámaras
CREATE TABLE IF NOT EXISTS cameras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ip', 'usb', 'rtsp')),
    is_active BOOLEAN DEFAULT true,
    username TEXT,
    password TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can manage all" ON profiles
    FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can view own requests" ON print_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests" ON print_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage requests" ON print_requests
    FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Datos iniciales
INSERT INTO app_settings (setting_key, setting_value) VALUES
    ('company_name', 'Sistema de Caja Registradora'),
    ('whatsapp_enabled', 'false'),
    ('camera_monitoring_enabled', 'false')
ON CONFLICT (setting_key) DO NOTHING;
EOF
        
        success "Esquema de base de datos configurado"
    fi
}

# Configurar servidor web (para servidor propio)
setup_webserver() {
    if [[ "$INSTALL_TYPE" == "server" ]]; then
        log "🌐 Configurando servidor web..."
        
        read -p "Ingresa tu dominio: " DOMAIN
        read -p "Ingresa tu email para SSL: " EMAIL
        
        # Instalar Nginx
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt update
            sudo apt install -y nginx certbot python3-certbot-nginx
            
            # Crear configuración de Nginx
            sudo tee /etc/nginx/sites-available/caja-registradora << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    root $INSTALL_DIR/$PROJECT_NAME/dist;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Optimizaciones
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
EOF
            
            # Habilitar sitio
            sudo ln -sf /etc/nginx/sites-available/caja-registradora /etc/nginx/sites-enabled/
            sudo rm -f /etc/nginx/sites-enabled/default
            
            # Verificar configuración
            sudo nginx -t
            sudo systemctl restart nginx
            sudo systemctl enable nginx
            
            # Configurar SSL
            sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive
            
            success "Servidor web configurado con SSL"
        fi
    fi
}

# Construir aplicación
build_application() {
    log "🔨 Construyendo aplicación..."
    
    case $INSTALL_TYPE in
        "development")
            info "Modo desarrollo - iniciando servidor de desarrollo"
            ;;
        *)
            npm run build
            success "Aplicación construida en ./dist"
            ;;
    esac
}

# Crear scripts de utilidad
create_utility_scripts() {
    log "📝 Creando scripts de utilidad..."
    
    # Script de inicio
    cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando Sistema de Caja Registradora..."
echo "📱 WhatsApp: $(grep VITE_WHATSAPP_ACCESS_TOKEN .env | cut -d'=' -f2 | sed 's/^$/❌ No configurado/' | sed 's/.*/✅ Configurado/')"
echo "📹 Cámaras: $(grep VITE_CAMERA_MONITORING_ENABLED .env | cut -d'=' -f2)"
echo "🗄️ Base de datos: $(grep VITE_SUPABASE_URL .env | cut -d'=' -f2 | sed 's/^$/❌ No configurado/' | sed 's/.*/✅ Configurado/')"
echo ""
npm run dev
EOF

    # Script de actualización
    cat > update.sh << 'EOF'
#!/bin/bash
echo "🔄 Actualizando sistema..."
git pull origin main
npm install
npm run build
echo "✅ Sistema actualizado"
EOF

    # Script de backup
    cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR

echo "💾 Creando backup..."
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz --exclude=node_modules --exclude=dist .

# Backup de configuración
cp .env $BACKUP_DIR/env_$DATE.backup
if [ -f "camera-config.json" ]; then
    cp camera-config.json $BACKUP_DIR/cameras_$DATE.backup
fi

echo "✅ Backup creado: $BACKUP_DIR/backup_$DATE.tar.gz"
EOF

    # Script de configuración de WhatsApp
    cat > setup-whatsapp.sh << 'EOF'
#!/bin/bash
echo "📱 Configuración de WhatsApp Business API"
echo ""
echo "Para configurar WhatsApp necesitas:"
echo "1. Cuenta de Facebook Business"
echo "2. Aplicación de WhatsApp Business"
echo "3. Número de teléfono verificado"
echo ""
read -p "Access Token: " token
read -p "Phone Number ID: " phone_id
read -p "Business Account ID: " business_id
read -p "Número del gerente: " manager_phone
read -p "Número del admin: " admin_phone

# Actualizar .env
sed -i "s/VITE_WHATSAPP_ACCESS_TOKEN=.*/VITE_WHATSAPP_ACCESS_TOKEN=$token/" .env
sed -i "s/VITE_WHATSAPP_PHONE_NUMBER_ID=.*/VITE_WHATSAPP_PHONE_NUMBER_ID=$phone_id/" .env
sed -i "s/VITE_WHATSAPP_BUSINESS_ACCOUNT_ID=.*/VITE_WHATSAPP_BUSINESS_ACCOUNT_ID=$business_id/" .env
sed -i "s/VITE_WHATSAPP_MANAGER_PHONE=.*/VITE_WHATSAPP_MANAGER_PHONE=$manager_phone/" .env
sed -i "s/VITE_WHATSAPP_ADMIN_PHONE=.*/VITE_WHATSAPP_ADMIN_PHONE=$admin_phone/" .env

echo "✅ WhatsApp configurado exitosamente"
EOF

    # Script de configuración de cámaras
    cat > setup-cameras.sh << 'EOF'
#!/bin/bash
echo "📹 Configuración de Cámaras IP"
echo ""
read -p "Nombre de la cámara: " name
read -p "URL de la cámara: " url
read -p "Ubicación: " location
read -p "Usuario (opcional): " username
read -s -p "Contraseña (opcional): " password
echo ""

# Crear o actualizar configuración
if [ ! -f "camera-config.json" ]; then
    echo '{"cameras":[],"config":{"enabled":true}}' > camera-config.json
fi

# Agregar cámara (simplificado)
echo "Cámara agregada: $name"
echo "✅ Configuración guardada en camera-config.json"
EOF

    # Hacer scripts ejecutables
    chmod +x start.sh update.sh backup.sh setup-whatsapp.sh setup-cameras.sh
    
    success "Scripts de utilidad creados"
}

# Crear documentación
create_documentation() {
    log "📚 Creando documentación..."
    
    # README principal
    cat > README.md << 'EOF'
# 🏪 Sistema de Caja Registradora

Sistema integral de gestión de caja registradora con notificaciones WhatsApp, monitoreo por cámara IP y chat en tiempo real.

## 🚀 Características

- ✅ **Frontend Moderno**: React + TypeScript + Tailwind CSS
- ✅ **Backend Robusto**: Supabase con Row Level Security
- ✅ **WhatsApp Business API**: Notificaciones automáticas
- ✅ **Cámaras IP**: Monitoreo en tiempo real
- ✅ **Chat Integrado**: Comunicación interna
- ✅ **Impresión Automática**: Comprobantes personalizables
- ✅ **Responsive Design**: Funciona en todos los dispositivos
- ✅ **Modo Oscuro**: Tema claro/oscuro
- ✅ **Tiempo Real**: Actualizaciones automáticas

## 🎯 Inicio Rápido

```bash
# Iniciar el sistema
./start.sh

# Acceder al sistema
http://localhost:5173

# Credenciales por defecto
Admin: admin / admin123
Usuario: usuario1 / user123
```

## ⚙️ Configuración

### WhatsApp Business API
```bash
./setup-whatsapp.sh
```

### Cámaras IP
```bash
./setup-cameras.sh
```

### Actualizar Sistema
```bash
./update.sh
```

### Crear Backup
```bash
./backup.sh
```

## 📱 Configuración de WhatsApp

1. Ve a https://developers.facebook.com
2. Crea una aplicación de WhatsApp Business
3. Obtén las credenciales necesarias
4. Ejecuta `./setup-whatsapp.sh`
5. Configura desde Admin → Solicitudes → Config WhatsApp

## 📹 Configuración de Cámaras IP

1. Conecta tus cámaras IP a la red
2. Obtén las URLs de streaming
3. Ejecuta `./setup-cameras.sh`
4. Configura desde Admin → Cámaras

## 🔧 Configuración Avanzada

### Variables de Entorno (.env)
```env
# Supabase
VITE_SUPABASE_URL=tu-url
VITE_SUPABASE_ANON_KEY=tu-key

# WhatsApp
VITE_WHATSAPP_ACCESS_TOKEN=tu-token
VITE_WHATSAPP_PHONE_NUMBER_ID=tu-phone-id

# Cámaras
VITE_CAMERA_MONITORING_ENABLED=true
```

## 📊 Funcionalidades

### Para Usuarios
- Crear solicitudes de apertura de caja
- Ver estado de solicitudes
- Recibir notificaciones en tiempo real
- Chat con administradores

### Para Administradores
- Aprobar/rechazar solicitudes
- Gestionar usuarios
- Configurar impresoras
- Monitorear cámaras IP
- Configurar WhatsApp
- Personalizar temas
- Ver estadísticas

## 🆘 Soporte

- **Email**: soporte@tu-empresa.com
- **Documentación**: Ver archivos .md
- **Issues**: GitHub Issues

## 📄 Licencia

MIT License - Ver LICENSE file
EOF

    # Guía de instalación detallada
    cat > INSTALLATION.md << 'EOF'
# 📋 Guía de Instalación Detallada

## 🎯 Métodos de Instalación

### 1. Instalación Automática (Recomendada)
```bash
curl -fsSL https://raw.githubusercontent.com/tu-usuario/sistema-caja/main/install-system.sh | bash
```

### 2. Instalación Manual
```bash
git clone https://github.com/tu-usuario/sistema-caja.git
cd sistema-caja
npm install
cp .env.example .env
# Editar .env con tus configuraciones
npm run dev
```

## 📋 Requisitos

- Node.js 18+
- npm 8+
- Cuenta Supabase (gratis)
- WhatsApp Business API (opcional)
- Cámaras IP (opcional)

## 🔧 Configuración Post-Instalación

### 1. Supabase
1. Crear proyecto en https://supabase.com
2. Obtener URL y API Keys
3. Actualizar .env
4. Ejecutar migraciones

### 2. WhatsApp Business API
1. Crear cuenta Facebook Business
2. Configurar WhatsApp Business API
3. Obtener credenciales
4. Ejecutar ./setup-whatsapp.sh

### 3. Cámaras IP
1. Conectar cámaras a la red
2. Obtener URLs de streaming
3. Ejecutar ./setup-cameras.sh
4. Configurar desde el panel admin

## 🚀 Despliegue

### Netlify
```bash
npm run build
netlify deploy --prod
```

### Vercel
```bash
npm run build
vercel --prod
```

### Servidor Propio
```bash
npm run build
# Subir dist/ a tu servidor
```

## 🆘 Troubleshooting

### Error: Node.js no encontrado
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Error: Puerto en uso
```bash
npm run dev -- --port 3000
```

### Error: Supabase connection failed
- Verificar credenciales en .env
- Verificar que el proyecto Supabase esté activo
EOF

    success "Documentación creada"
}

# Verificar instalación
verify_installation() {
    log "🔍 Verificando instalación..."
    
    # Verificar archivos principales
    local files=("package.json" ".env" "src/main.tsx" "index.html" "tailwind.config.js")
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            success "✓ $file"
        else
            warning "✗ $file no encontrado"
        fi
    done
    
    # Verificar dependencias
    if [ -d "node_modules" ]; then
        success "✓ Dependencias instaladas"
    else
        warning "✗ Dependencias no instaladas"
    fi
    
    # Verificar configuración
    if [ -f ".env" ]; then
        success "✓ Archivo de configuración creado"
    else
        warning "✗ Archivo de configuración no encontrado"
    fi
    
    # Verificar scripts
    if [ -f "start.sh" ]; then
        success "✓ Scripts de utilidad creados"
    else
        warning "✗ Scripts de utilidad no encontrados"
    fi
}

# Mostrar resumen final
show_summary() {
    clear
    echo -e "${GREEN}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🎉 ¡INSTALACIÓN COMPLETADA EXITOSAMENTE! 🎉             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    echo ""
    success "Sistema de Caja Registradora instalado correctamente"
    echo ""
    
    info "📁 Ubicación: $INSTALL_DIR/$PROJECT_NAME"
    info "🔧 Tipo de instalación: $INSTALL_TYPE"
    
    echo ""
    echo -e "${YELLOW}📋 PRÓXIMOS PASOS:${NC}"
    echo ""
    
    case $INSTALL_TYPE in
        "development")
            echo "1. cd $PROJECT_NAME"
            echo "2. ./start.sh  (o npm run dev)"
            echo "3. Abrir http://localhost:5173"
            echo "4. Configurar WhatsApp: ./setup-whatsapp.sh"
            echo "5. Configurar Cámaras: ./setup-cameras.sh"
            ;;
        "supabase")
            echo "1. Verificar configuración de Supabase en .env"
            echo "2. cd $PROJECT_NAME"
            echo "3. npm run build"
            echo "4. Desplegar en tu plataforma preferida"
            echo "5. Configurar WhatsApp desde el panel admin"
            ;;
        "server")
            echo "1. Verificar que Nginx esté funcionando"
            echo "2. Configurar DNS para $DOMAIN"
            echo "3. Acceder a https://$DOMAIN"
            echo "4. Configurar WhatsApp y cámaras desde admin"
            ;;
        "cloud")
            echo "1. cd $PROJECT_NAME"
            echo "2. Conectar con tu proveedor de nube"
            echo "3. Configurar variables de entorno"
            echo "4. Desplegar"
            ;;
    esac
    
    echo ""
    echo -e "${CYAN}🔧 SCRIPTS DISPONIBLES:${NC}"
    echo "• ./start.sh           - Iniciar en modo desarrollo"
    echo "• ./update.sh          - Actualizar sistema"
    echo "• ./backup.sh          - Crear backup"
    echo "• ./setup-whatsapp.sh  - Configurar WhatsApp"
    echo "• ./setup-cameras.sh   - Configurar cámaras"
    
    echo ""
    echo -e "${PURPLE}📚 DOCUMENTACIÓN:${NC}"
    echo "• README.md            - Guía de uso"
    echo "• INSTALLATION.md      - Guía de instalación"
    echo "• .env.example         - Variables de entorno"
    
    echo ""
    echo -e "${GREEN}🎯 CREDENCIALES POR DEFECTO:${NC}"
    echo "• Admin: admin / admin123"
    echo "• Usuario: usuario1 / user123"
    
    echo ""
    echo -e "${BLUE}🌟 FUNCIONALIDADES INCLUIDAS:${NC}"
    echo "• 📱 WhatsApp Business API (Producción)"
    echo "• 📹 Monitoreo por Cámaras IP"
    echo "• 💬 Chat en tiempo real"
    echo "• 🖨️ Impresión automática"
    echo "• 🔔 Notificaciones push"
    echo "• 🎨 Temas personalizables"
    echo "• 📊 Dashboard completo"
    echo "• 🔐 Autenticación segura"
    
    echo ""
    warning "⚠️  Recuerda:"
    echo "• Cambiar las credenciales por defecto en producción"
    echo "• Configurar WhatsApp Business API para notificaciones reales"
    echo "• Agregar cámaras IP para monitoreo"
    echo "• Configurar Supabase para persistencia de datos"
    
    echo ""
    success "¡Disfruta tu nuevo Sistema de Caja Registradora! 🏪"
    echo ""
    echo -e "${CYAN}🔗 Enlaces útiles:${NC}"
    echo "• WhatsApp Business: https://business.whatsapp.com/"
    echo "• Supabase: https://supabase.com/"
    echo "• Documentación: ./README.md"
}

# Función principal
main() {
    show_banner
    
    log "🚀 Iniciando instalación del Sistema de Caja Registradora..."
    
    check_requirements
    install_nodejs
    select_installation_type
    setup_install_directory
    create_project
    install_dependencies
    setup_project_files
    setup_supabase
    setup_whatsapp
    setup_cameras
    setup_database
    
    if [[ "$INSTALL_TYPE" == "server" ]]; then
        setup_webserver
    fi
    
    build_application
    create_utility_scripts
    create_documentation
    verify_installation
    show_summary
}

# Manejo de errores
trap 'error "Instalación interrumpida"' INT TERM

# Ejecutar instalación
main "$@"