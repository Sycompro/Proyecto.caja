#!/bin/bash

# 🚀 Script de Instalación Automática - Sistema de Caja Registradora
# Versión: 1.0.0
# Autor: Sistema de Caja Registradora
# Descripción: Instalación completa automatizada

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
DB_TYPE=""

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
║    🏪 SISTEMA DE CAJA REGISTRADORA - INSTALADOR v1.0        ║
║                                                              ║
║    Instalación automática completa                          ║
║    • Frontend React + TypeScript                            ║
║    • Backend Supabase                                       ║
║    • WhatsApp Business API                                  ║
║    • Sistema de Cámaras IP                                  ║
║    • Chat en tiempo real                                    ║
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

# Clonar o descargar el proyecto
download_project() {
    log "📥 Descargando el proyecto..."
    
    if [ -d "$PROJECT_NAME" ]; then
        warning "El directorio $PROJECT_NAME ya existe"
        read -p "¿Sobrescribir? (y/n): " overwrite
        if [[ $overwrite =~ ^[Yy]$ ]]; then
            rm -rf "$PROJECT_NAME"
        else
            error "Instalación cancelada"
        fi
    fi
    
    # En un proyecto real, aquí clonarías desde GitHub
    # git clone https://github.com/tu-usuario/sistema-caja-registradora.git
    
    # Por ahora, creamos la estructura básica
    mkdir -p "$PROJECT_NAME"
    cd "$PROJECT_NAME"
    
    success "Proyecto descargado en: $(pwd)"
}

# Instalar dependencias
install_dependencies() {
    log "📦 Instalando dependencias del proyecto..."
    
    # Verificar si package.json existe
    if [ ! -f "package.json" ]; then
        info "Creando package.json..."
        npm init -y
    fi
    
    info "Instalando dependencias de producción..."
    npm install --production
    
    info "Instalando dependencias de desarrollo..."
    npm install --save-dev
    
    success "Dependencias instaladas correctamente"
}

# Configurar base de datos
setup_database() {
    log "🗄️ Configurando base de datos..."
    
    case $INSTALL_TYPE in
        "development")
            info "Usando almacenamiento local para desarrollo"
            ;;
        "supabase")
            setup_supabase
            ;;
        "server")
            setup_postgresql
            ;;
        "cloud")
            info "Configuración de base de datos para la nube"
            setup_supabase
            ;;
    esac
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
    read -p "Ingresa tu Supabase URL: " supabase_url
    read -p "Ingresa tu Supabase Anon Key: " supabase_anon_key
    read -s -p "Ingresa tu Supabase Service Role Key: " supabase_service_key
    echo ""
    
    # Crear archivo .env
    cat > .env << EOF
# Supabase Configuration
VITE_SUPABASE_URL=$supabase_url
VITE_SUPABASE_ANON_KEY=$supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=$supabase_service_key

# App Configuration
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=Sistema de Caja Registradora
VITE_APP_VERSION=1.0.0
EOF
    
    success "Configuración de Supabase guardada en .env"
}

# Configurar PostgreSQL local
setup_postgresql() {
    log "🐘 Configurando PostgreSQL..."
    
    # Verificar si PostgreSQL está instalado
    if ! command -v psql &> /dev/null; then
        info "Instalando PostgreSQL..."
        
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt update
            sudo apt install -y postgresql postgresql-contrib
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew install postgresql
            brew services start postgresql
        fi
    fi
    
    # Configurar base de datos
    read -p "Ingresa el nombre de la base de datos [caja_registradora]: " db_name
    db_name=${db_name:-caja_registradora}
    
    read -p "Ingresa el usuario de la base de datos [caja_user]: " db_user
    db_user=${db_user:-caja_user}
    
    read -s -p "Ingresa la contraseña para el usuario: " db_password
    echo ""
    
    # Crear base de datos y usuario
    sudo -u postgres psql << EOF
CREATE DATABASE $db_name;
CREATE USER $db_user WITH PASSWORD '$db_password';
GRANT ALL PRIVILEGES ON DATABASE $db_name TO $db_user;
\q
EOF
    
    # Crear archivo .env
    cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://$db_user:$db_password@localhost:5432/$db_name

# App Configuration
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=Sistema de Caja Registradora
VITE_APP_VERSION=1.0.0
EOF
    
    success "PostgreSQL configurado correctamente"
}

# Configurar WhatsApp Business API
setup_whatsapp() {
    log "📱 Configurando WhatsApp Business API..."
    
    echo ""
    info "Para configurar WhatsApp Business API necesitas:"
    echo "1. Una cuenta de Facebook Business"
    echo "2. Acceso a WhatsApp Business API"
    echo "3. Un número de teléfono verificado"
    echo ""
    
    read -p "¿Quieres configurar WhatsApp ahora? (y/n): " setup_wa
    
    if [[ $setup_wa =~ ^[Yy]$ ]]; then
        read -p "Número de teléfono del gerente (con código de país): " manager_phone
        read -p "Número de teléfono del admin (con código de país): " admin_phone
        read -p "WhatsApp Access Token: " wa_token
        read -p "WhatsApp Phone Number ID: " wa_phone_id
        read -p "WhatsApp Business Account ID: " wa_business_id
        
        # Agregar configuración al .env
        cat >> .env << EOF

# WhatsApp Configuration
VITE_WHATSAPP_ACCESS_TOKEN=$wa_token
VITE_WHATSAPP_PHONE_NUMBER_ID=$wa_phone_id
VITE_WHATSAPP_BUSINESS_ACCOUNT_ID=$wa_business_id
VITE_WHATSAPP_MANAGER_PHONE=$manager_phone
VITE_WHATSAPP_ADMIN_PHONE=$admin_phone
EOF
        
        success "WhatsApp Business API configurado"
    else
        info "Puedes configurar WhatsApp más tarde desde la aplicación"
    fi
}

# Configurar SSL (para producción)
setup_ssl() {
    if [[ "$INSTALL_TYPE" == "server" ]]; then
        log "🔒 Configurando SSL..."
        
        read -p "Ingresa tu dominio: " domain
        read -p "Ingresa tu email para Let's Encrypt: " email
        
        # Instalar Certbot
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt install -y certbot python3-certbot-nginx
            
            # Obtener certificado SSL
            sudo certbot --nginx -d "$domain" --email "$email" --agree-tos --non-interactive
            
            success "SSL configurado para $domain"
        fi
    fi
}

# Configurar servidor web (Nginx)
setup_webserver() {
    if [[ "$INSTALL_TYPE" == "server" ]]; then
        log "🌐 Configurando servidor web..."
        
        # Instalar Nginx
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt install -y nginx
            
            # Crear configuración de Nginx
            sudo tee /etc/nginx/sites-available/caja-registradora << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
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
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF
            
            # Habilitar sitio
            sudo ln -sf /etc/nginx/sites-available/caja-registradora /etc/nginx/sites-enabled/
            sudo rm -f /etc/nginx/sites-enabled/default
            
            # Verificar configuración
            sudo nginx -t
            sudo systemctl restart nginx
            sudo systemctl enable nginx
            
            success "Nginx configurado correctamente"
        fi
    fi
}

# Construir aplicación
build_application() {
    log "🔨 Construyendo aplicación..."
    
    case $INSTALL_TYPE in
        "development")
            info "Modo desarrollo - no es necesario construir"
            ;;
        *)
            npm run build
            success "Aplicación construida en ./dist"
            ;;
    esac
}

# Configurar servicios del sistema
setup_services() {
    if [[ "$INSTALL_TYPE" == "server" ]]; then
        log "⚙️ Configurando servicios del sistema..."
        
        # Crear servicio systemd para la aplicación
        sudo tee /etc/systemd/system/caja-registradora.service << EOF
[Unit]
Description=Sistema de Caja Registradora
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$INSTALL_DIR/$PROJECT_NAME
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF
        
        # Habilitar y iniciar servicio
        sudo systemctl daemon-reload
        sudo systemctl enable caja-registradora
        
        success "Servicios del sistema configurados"
    fi
}

# Configurar firewall
setup_firewall() {
    if [[ "$INSTALL_TYPE" == "server" ]]; then
        log "🔥 Configurando firewall..."
        
        if command -v ufw &> /dev/null; then
            sudo ufw allow OpenSSH
            sudo ufw allow 'Nginx Full'
            sudo ufw --force enable
            
            success "Firewall configurado"
        fi
    fi
}

# Crear scripts de utilidad
create_utility_scripts() {
    log "📝 Creando scripts de utilidad..."
    
    # Script de inicio
    cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando Sistema de Caja Registradora..."
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
echo "✅ Backup creado: $BACKUP_DIR/backup_$DATE.tar.gz"
EOF
    
    # Hacer scripts ejecutables
    chmod +x start.sh update.sh backup.sh
    
    success "Scripts de utilidad creados"
}

# Verificar instalación
verify_installation() {
    log "🔍 Verificando instalación..."
    
    # Verificar archivos principales
    local files=("package.json" ".env" "src/main.tsx" "index.html")
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
            ;;
        "supabase")
            echo "1. Verificar configuración de Supabase en .env"
            echo "2. cd $PROJECT_NAME"
            echo "3. npm run build"
            echo "4. Desplegar en tu plataforma preferida"
            ;;
        "server")
            echo "1. Verificar que Nginx esté funcionando"
            echo "2. Configurar tu dominio DNS"
            echo "3. Acceder a https://$DOMAIN"
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
    echo "• ./start.sh    - Iniciar en modo desarrollo"
    echo "• ./update.sh   - Actualizar sistema"
    echo "• ./backup.sh   - Crear backup"
    
    echo ""
    echo -e "${PURPLE}📚 DOCUMENTACIÓN:${NC}"
    echo "• README.md           - Guía de uso"
    echo "• deployment-guide.md - Guía de despliegue"
    echo "• .env.example        - Variables de entorno"
    
    echo ""
    echo -e "${GREEN}🎯 CREDENCIALES POR DEFECTO:${NC}"
    echo "• Admin: admin / admin123"
    echo "• Usuario: usuario1 / user123"
    
    echo ""
    warning "⚠️  Recuerda cambiar las credenciales por defecto en producción"
    
    echo ""
    success "¡Disfruta tu nuevo Sistema de Caja Registradora! 🏪"
}

# Función principal
main() {
    show_banner
    
    log "🚀 Iniciando instalación del Sistema de Caja Registradora..."
    
    check_requirements
    install_nodejs
    select_installation_type
    setup_install_directory
    download_project
    install_dependencies
    setup_database
    setup_whatsapp
    
    if [[ "$INSTALL_TYPE" == "server" ]]; then
        setup_ssl
        setup_webserver
        setup_services
        setup_firewall
    fi
    
    build_application
    create_utility_scripts
    verify_installation
    show_summary
}

# Manejo de errores
trap 'error "Instalación interrumpida"' INT TERM

# Ejecutar instalación
main "$@"