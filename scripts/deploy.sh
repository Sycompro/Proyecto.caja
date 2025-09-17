#!/bin/bash

# Script de despliegue automatizado
# Uso: ./scripts/deploy.sh [production|staging]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
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

# Verificar argumentos
ENVIRONMENT=${1:-production}

if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
    error "Ambiente inválido. Usa: production o staging"
fi

log "🚀 Iniciando despliegue para ambiente: $ENVIRONMENT"

# Verificar que estamos en la rama correcta
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$ENVIRONMENT" == "production" && "$CURRENT_BRANCH" != "main" ]]; then
    error "Para producción debes estar en la rama 'main'"
fi

# Verificar que no hay cambios sin commitear
if [[ -n $(git status --porcelain) ]]; then
    error "Hay cambios sin commitear. Haz commit antes de desplegar."
fi

# Instalar dependencias
log "📦 Instalando dependencias..."
npm ci

# Ejecutar tests (si existen)
if [[ -f "package.json" ]] && grep -q '"test"' package.json; then
    log "🧪 Ejecutando tests..."
    npm test
fi

# Linting
log "🔍 Verificando código..."
npm run lint

# Construir aplicación
log "🔨 Construyendo aplicación..."
if [[ "$ENVIRONMENT" == "production" ]]; then
    npm run build
else
    npm run build:staging
fi

# Desplegar según la plataforma
case "$ENVIRONMENT" in
    "production")
        log "🌐 Desplegando a producción..."
        
        # Opción 1: Netlify
        if command -v netlify &> /dev/null; then
            netlify deploy --prod --dir=dist
        # Opción 2: Vercel
        elif command -v vercel &> /dev/null; then
            vercel --prod
        # Opción 3: Servidor propio
        else
            log "📤 Subiendo archivos al servidor..."
            rsync -avz --delete dist/ user@tu-servidor.com:/var/www/caja-registradora/
            ssh user@tu-servidor.com "sudo systemctl reload nginx"
        fi
        ;;
    "staging")
        log "🧪 Desplegando a staging..."
        netlify deploy --dir=dist
        ;;
esac

# Verificar despliegue
log "🔍 Verificando despliegue..."
if [[ "$ENVIRONMENT" == "production" ]]; then
    URL="https://tu-dominio.com"
else
    URL="https://staging--tu-proyecto.netlify.app"
fi

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
if [[ "$HTTP_STATUS" == "200" ]]; then
    success "Despliegue exitoso! Sitio disponible en: $URL"
else
    error "Error en el despliegue. HTTP Status: $HTTP_STATUS"
fi

# Notificar en Slack/Discord (opcional)
if [[ -n "$WEBHOOK_URL" ]]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚀 Despliegue exitoso en $ENVIRONMENT: $URL\"}" \
        "$WEBHOOK_URL"
fi

success "¡Despliegue completado!"