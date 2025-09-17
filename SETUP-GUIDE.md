# 🚀 Guía Completa de Configuración - Sistema de Caja Registradora v2.0

## 📋 Índice
1. [Instalación Automática](#instalación-automática)
2. [Configuración de Supabase](#configuración-de-supabase)
3. [WhatsApp Business API](#whatsapp-business-api)
4. [Sistema de Cámaras IP](#sistema-de-cámaras-ip)
5. [Despliegue en Producción](#despliegue-en-producción)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Instalación Automática

### Opción 1: Instalación Completa (Recomendada)
```bash
curl -fsSL https://raw.githubusercontent.com/tu-usuario/sistema-caja/main/install-system.sh | bash
```

### Opción 2: Instalación Rápida
```bash
curl -fsSL https://raw.githubusercontent.com/tu-usuario/sistema-caja/main/quick-setup.sh | bash
```

### Opción 3: Docker
```bash
curl -fsSL https://raw.githubusercontent.com/tu-usuario/sistema-caja/main/docker-setup.sh | bash
```

### Opción 4: Windows
```cmd
# Descargar y ejecutar
install-windows.bat
```

---

## 🗄️ Configuración de Supabase

### 1. Crear Proyecto
1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Anota la URL y las API Keys

### 2. Configurar Variables de Entorno
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 3. Ejecutar Migraciones
Las migraciones se ejecutan automáticamente al conectar con Supabase.

---

## 📱 WhatsApp Business API

### 1. Requisitos Previos
- Cuenta de Facebook Business
- Número de teléfono empresarial
- Verificación de WhatsApp Business

### 2. Configuración en Facebook
1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Crea una nueva aplicación
3. Agrega el producto "WhatsApp"
4. Configura el número de teléfono
5. Obtén las credenciales:
   - Access Token
   - Phone Number ID
   - Business Account ID

### 3. Configuración en el Sistema
```bash
# Opción 1: Script automático
./setup-whatsapp.sh

# Opción 2: Manual desde el panel admin
# Admin → Solicitudes → Config WhatsApp
```

### 4. Variables de Entorno
```env
VITE_WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxx
VITE_WHATSAPP_PHONE_NUMBER_ID=123456789012345
VITE_WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
VITE_WHATSAPP_MANAGER_PHONE=+1234567890
VITE_WHATSAPP_ADMIN_PHONE=+1234567890
```

### 5. Plantillas de Mensaje (Opcional)
Para mayor deliverabilidad, crea plantillas aprobadas:

#### Plantilla: Nueva Solicitud
```
🔔 *{{1}}*
*NUEVA SOLICITUD DE CAJA*

📋 *Detalles:*
• ID: #{{2}}
• Solicitante: {{3}}
• Monto: ${{4}}
• Motivo: {{5}}

🕐 *Fecha:* {{6}}
⏳ *Estado:* Pendiente de aprobación
```

#### Plantilla: Solicitud Aprobada
```
✅ *{{1}}*
*SOLICITUD APROBADA*

📋 *Detalles:*
• ID: #{{2}}
• Solicitante: {{3}}
• Monto: ${{4}}
• Autorizado por: {{5}}

✅ La caja registradora ha sido abierta exitosamente.
```

---

## 📹 Sistema de Cámaras IP

### 1. Tipos de Cámaras Soportadas
- **Cámaras IP** - HTTP/HTTPS streaming
- **Cámaras RTSP** - Protocolo RTSP
- **Cámaras ONVIF** - Estándar ONVIF
- **Webcams USB** - Conectadas localmente

### 2. Configuración de Cámaras IP

#### Configuración Manual
```bash
./setup-cameras.sh
```

#### Configuración desde Panel Admin
```
Admin → Cámaras → Agregar Nueva Cámara
```

### 3. Formatos de URL Soportados

#### Cámaras IP Genéricas
```
http://192.168.1.100:8080/video
https://camara.empresa.com/stream
```

#### Cámaras RTSP
```
rtsp://192.168.1.100:554/stream1
rtsp://usuario:password@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0
```

#### Cámaras con Autenticación
```
http://usuario:password@192.168.1.100:8080/video
```

### 4. Marcas Compatibles

#### Hikvision
```
http://IP:80/ISAPI/Streaming/channels/101/picture
rtsp://IP:554/Streaming/Channels/101
```

#### Dahua
```
http://IP:80/cgi-bin/snapshot.cgi
rtsp://IP:554/cam/realmonitor?channel=1&subtype=0
```

#### Axis
```
http://IP/axis-cgi/mjpg/video.cgi
rtsp://IP/axis-media/media.amp
```

#### Foscam
```
http://IP:88/cgi-bin/CGIStream.cgi?cmd=GetMJStream
rtsp://IP:88/videoMain
```

### 5. Configuración Avanzada
```json
{
  "cameras": [
    {
      "id": "camera-1",
      "name": "Caja Principal",
      "url": "http://192.168.1.100:8080/video",
      "location": "Área de Cajas",
      "type": "ip",
      "isActive": true,
      "username": "admin",
      "password": "password123",
      "settings": {
        "quality": "medium",
        "fps": 15,
        "resolution": "720p"
      }
    }
  ],
  "config": {
    "enabled": true,
    "autoRecord": true,
    "recordDuration": 300,
    "showOnApproval": true,
    "enableAudio": false,
    "quality": "medium"
  }
}
```

---

## 🌐 Despliegue en Producción

### 1. Netlify (Recomendado - Gratis)
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Construir y desplegar
npm run build
netlify deploy --prod
```

### 2. Vercel
```bash
# Instalar Vercel CLI
npm install -g vercel

# Desplegar
vercel --prod
```

### 3. Servidor Propio (VPS)
```bash
# El instalador configura automáticamente:
# - Nginx
# - SSL con Let's Encrypt
# - PM2 para gestión de procesos
# - Firewall UFW
```

### 4. Docker en Producción
```bash
# Iniciar con Docker Compose
./docker-start.sh

# Acceder a http://tu-servidor:3000
```

---

## 🔧 Configuración de Variables de Entorno

### Desarrollo (.env)
```env
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# App
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=Sistema de Caja Registradora
VITE_APP_VERSION=2.0.0

# WhatsApp Business API
VITE_WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxx
VITE_WHATSAPP_PHONE_NUMBER_ID=123456789012345
VITE_WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
VITE_WHATSAPP_MANAGER_PHONE=+1234567890
VITE_WHATSAPP_ADMIN_PHONE=+1234567890

# Cámaras IP
VITE_CAMERA_MONITORING_ENABLED=true
VITE_CAMERA_AUTO_RECORD=true
VITE_CAMERA_RECORD_DURATION=300

# Desarrollo
VITE_DEV_MODE=true
VITE_DEBUG_LOGS=true
```

### Producción (.env.production)
```env
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# App
VITE_APP_URL=https://tu-dominio.com
VITE_APP_NAME=Sistema de Caja Registradora

# WhatsApp (Producción)
VITE_WHATSAPP_ACCESS_TOKEN=tu-token-produccion
VITE_WHATSAPP_PHONE_NUMBER_ID=tu-phone-id-produccion

# Cámaras
VITE_CAMERA_MONITORING_ENABLED=true

# Producción
VITE_DEV_MODE=false
VITE_DEBUG_LOGS=false
```

---

## 🆘 Troubleshooting

### Problemas Comunes

#### 1. Error: Node.js no encontrado
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node@18

# Windows
# Descargar desde https://nodejs.org/
```

#### 2. Error: Puerto 5173 en uso
```bash
# Cambiar puerto
npm run dev -- --port 3000

# O matar proceso
lsof -ti:5173 | xargs kill -9
```

#### 3. Error: Supabase connection failed
```bash
# Verificar credenciales
cat .env | grep SUPABASE

# Verificar conectividad
curl -I https://tu-proyecto.supabase.co
```

#### 4. Error: WhatsApp API failed
```bash
# Verificar token
curl -H "Authorization: Bearer TU_TOKEN" \
     "https://graph.facebook.com/v18.0/TU_PHONE_ID"

# Verificar formato de número
# Debe ser: +1234567890 (con código de país)
```

#### 5. Error: Cámara IP no conecta
```bash
# Verificar URL
curl -I http://192.168.1.100:8080/video

# Verificar red
ping 192.168.1.100

# Verificar autenticación
curl -u usuario:password http://192.168.1.100:8080/video
```

### Logs y Debugging

#### Ver logs del sistema
```bash
# Logs de desarrollo
npm run dev

# Logs de producción
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

#### Debug de WhatsApp
```javascript
// En el navegador (F12 → Console)
localStorage.getItem('whatsappLogs')
```

#### Debug de Cámaras
```javascript
// En el navegador (F12 → Console)
localStorage.getItem('cameras')
localStorage.getItem('activeCameraSessions')
```

---

## 📊 Monitoreo y Mantenimiento

### 1. Backup Automático
```bash
# Crear backup
./backup.sh

# Programar backup diario (crontab)
0 2 * * * /ruta/al/proyecto/backup.sh
```

### 2. Actualizaciones
```bash
# Actualizar sistema
./update.sh

# Verificar versión
grep version package.json
```

### 3. Monitoreo de Servicios
```bash
# Estado de servicios
systemctl status nginx
systemctl status postgresql

# Uso de recursos
htop
df -h
```

---

## 💰 Costos Estimados

### Opción Gratuita
- **Frontend**: Netlify (Gratis)
- **Backend**: Supabase (Gratis hasta 500MB)
- **WhatsApp**: Meta Business (Gratis hasta 1000 mensajes/mes)
- **Total**: $0/mes

### Opción Básica
- **Frontend**: Netlify Pro ($19/mes)
- **Backend**: Supabase Pro ($25/mes)
- **WhatsApp**: Meta Business ($0.005/mensaje)
- **Total**: ~$45/mes

### Opción Empresarial
- **Servidor**: VPS ($20-50/mes)
- **Base de datos**: Supabase Team ($599/mes)
- **WhatsApp**: Volumen empresarial
- **Total**: $650+/mes

---

## 🔐 Seguridad

### 1. Configuración de Seguridad
```bash
# Cambiar credenciales por defecto
# Admin → Usuarios → Editar admin

# Configurar HTTPS
sudo certbot --nginx -d tu-dominio.com

# Configurar firewall
sudo ufw enable
sudo ufw allow 'Nginx Full'
```

### 2. Variables Sensibles
```bash
# Nunca commitear .env
echo ".env" >> .gitignore

# Usar variables de entorno en producción
export VITE_SUPABASE_URL="https://..."
```

### 3. Backup de Seguridad
```bash
# Backup automático cada 6 horas
0 */6 * * * /ruta/al/proyecto/backup.sh
```

---

## 📞 Soporte y Contacto

### Canales de Soporte
- **Email**: soporte@tu-empresa.com
- **GitHub**: [Issues](https://github.com/tu-usuario/sistema-caja/issues)
- **Documentación**: [Wiki](https://github.com/tu-usuario/sistema-caja/wiki)

### Antes de Reportar un Problema
1. ✅ Verifica que tienes la última versión
2. ✅ Revisa esta documentación
3. ✅ Busca en issues existentes
4. ✅ Incluye logs y detalles del error

---

## 🎉 ¡Listo para Producción!

Tu Sistema de Caja Registradora está completamente configurado con:

- ✅ **WhatsApp Business API** - Notificaciones reales
- ✅ **Cámaras IP** - Monitoreo en tiempo real
- ✅ **Base de datos robusta** - Supabase con RLS
- ✅ **Chat integrado** - Comunicación interna
- ✅ **Impresión automática** - Comprobantes personalizables
- ✅ **Dashboard completo** - Gestión total del sistema

**¡Comienza a usar tu sistema profesional ahora! 🚀**