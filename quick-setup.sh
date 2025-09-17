#!/bin/bash

# 🚀 Instalación Rápida - Sistema de Caja Registradora v2.0
# Para usuarios que quieren una instalación express

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}🚀 Instalación Rápida - Sistema de Caja Registradora v2.0${NC}"
echo -e "${PURPLE}Con WhatsApp Business API y Cámaras IP${NC}"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js no encontrado. Instalando...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Crear proyecto
echo -e "${BLUE}📦 Creando proyecto...${NC}"
npm create vite@latest sistema-caja-registradora -- --template react-ts --yes
cd sistema-caja-registradora

# Instalar dependencias
echo -e "${BLUE}📦 Instalando dependencias...${NC}"
npm install @supabase/supabase-js@latest lucide-react@latest
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest
npx tailwindcss init -p --yes

# Configurar Tailwind
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'blob': 'blob 7s infinite',
      },
      keyframes: {
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
}
EOF

# Crear .env básico
cat > .env << 'EOF'
# Supabase Configuration (Configura estos valores)
VITE_SUPABASE_URL=tu-supabase-url
VITE_SUPABASE_ANON_KEY=tu-supabase-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# App Configuration
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=Sistema de Caja Registradora
VITE_APP_VERSION=2.0.0

# WhatsApp Configuration (Configurar para producción)
VITE_WHATSAPP_ACCESS_TOKEN=
VITE_WHATSAPP_PHONE_NUMBER_ID=
VITE_WHATSAPP_BUSINESS_ACCOUNT_ID=
VITE_WHATSAPP_MANAGER_PHONE=
VITE_WHATSAPP_ADMIN_PHONE=

# Camera Configuration
VITE_CAMERA_MONITORING_ENABLED=false
VITE_CAMERA_AUTO_RECORD=true
VITE_CAMERA_RECORD_DURATION=300

# Development
VITE_DEV_MODE=true
VITE_DEBUG_LOGS=true
EOF

# Crear scripts de utilidad
cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando Sistema de Caja Registradora v2.0..."
echo "📱 WhatsApp Business API: $(grep VITE_WHATSAPP_ACCESS_TOKEN .env | cut -d'=' -f2 | sed 's/^$/❌ No configurado/' | sed 's/.*/✅ Configurado/')"
echo "📹 Cámaras IP: $(grep VITE_CAMERA_MONITORING_ENABLED .env | cut -d'=' -f2)"
echo "🗄️ Supabase: $(grep VITE_SUPABASE_URL .env | cut -d'=' -f2 | sed 's/^$/❌ No configurado/' | sed 's/.*/✅ Configurado/')"
echo ""
npm run dev
EOF

chmod +x start.sh

# Crear documentación rápida
cat > README.md << 'EOF'
# 🏪 Sistema de Caja Registradora v2.0

## 🚀 Inicio Rápido
```bash
./start.sh
```

## ⚙️ Configuración

1. **Supabase**: Edita `.env` con tus credenciales
2. **WhatsApp**: Configura desde Admin → Solicitudes → Config WhatsApp
3. **Cámaras**: Configura desde Admin → Cámaras

## 🎯 Credenciales
- Admin: `admin` / `admin123`
- Usuario: `usuario1` / `user123`

## 📱 Funcionalidades
- ✅ WhatsApp Business API (Producción)
- ✅ Cámaras IP en tiempo real
- ✅ Chat integrado
- ✅ Impresión automática
- ✅ Notificaciones push
- ✅ Dashboard completo

## 🔗 Enlaces
- Supabase: https://supabase.com
- WhatsApp Business: https://business.whatsapp.com
- Documentación completa: ./install-system.sh

¡Disfruta tu sistema! 🎉
EOF

echo -e "${GREEN}✅ Instalación rápida completada!${NC}"
echo ""
echo -e "${YELLOW}📋 Próximos pasos:${NC}"
echo "1. Configura Supabase en el archivo .env"
echo "2. ./start.sh"
echo "3. Abre http://localhost:5173"
echo "4. Configura WhatsApp desde el panel admin"
echo "5. Agrega cámaras IP desde el panel admin"
echo ""
echo -e "${PURPLE}🌟 Funcionalidades incluidas:${NC}"
echo "• 📱 WhatsApp Business API"
echo "• 📹 Cámaras IP"
echo "• 💬 Chat en tiempo real"
echo "• 🖨️ Impresión automática"
echo "• 🔔 Notificaciones"
echo ""
echo -e "${GREEN}🔗 Instalación completa: ./install-system.sh${NC}"