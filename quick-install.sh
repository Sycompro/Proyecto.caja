#!/bin/bash

# 🚀 Instalación Rápida - Sistema de Caja Registradora
# Para usuarios que quieren una instalación express

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Instalación Rápida - Sistema de Caja Registradora${NC}"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js no encontrado. Instalando...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Crear proyecto
echo -e "${BLUE}📦 Creando proyecto...${NC}"
npx create-vite@latest sistema-caja-registradora --template react-ts --yes
cd sistema-caja-registradora

# Instalar dependencias adicionales
echo -e "${BLUE}📦 Instalando dependencias...${NC}"
npm install @supabase/supabase-js lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Configurar Tailwind
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# Crear .env básico
cat > .env << 'EOF'
# Supabase Configuration (Configura estos valores)
VITE_SUPABASE_URL=tu-supabase-url
VITE_SUPABASE_ANON_KEY=tu-supabase-anon-key

# App Configuration
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=Sistema de Caja Registradora
EOF

echo -e "${GREEN}✅ Instalación rápida completada!${NC}"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura Supabase en el archivo .env"
echo "2. npm run dev"
echo "3. Abre http://localhost:5173"
echo ""
echo "🔗 Documentación completa: ./install.sh"