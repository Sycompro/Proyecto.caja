# 🚀 Guía de Instalación - Sistema de Caja Registradora

## 📋 Métodos de Instalación Disponibles

### 🎯 1. Instalación Automática (Recomendada)

La forma más fácil y completa de instalar el sistema:

```bash
# Descargar y ejecutar instalador
curl -fsSL https://raw.githubusercontent.com/tu-usuario/sistema-caja-registradora/main/install.sh | bash

# O descargar primero y revisar
wget https://raw.githubusercontent.com/tu-usuario/sistema-caja-registradora/main/install.sh
chmod +x install.sh
./install.sh
```

**Para Windows:**
```cmd
# Descargar install.bat y ejecutar
install.bat
```

### ⚡ 2. Instalación Rápida

Para desarrolladores que quieren empezar inmediatamente:

```bash
curl -fsSL https://raw.githubusercontent.com/tu-usuario/sistema-caja-registradora/main/quick-install.sh | bash
```

### 🐳 3. Instalación con Docker

Para entornos containerizados:

```bash
# Descargar configuración Docker
curl -fsSL https://raw.githubusercontent.com/tu-usuario/sistema-caja-registradora/main/docker-install.sh | bash

# Ejecutar contenedores
docker-compose up -d
```

### 🔧 4. Instalación Manual

Para usuarios avanzados que prefieren control total:

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/sistema-caja-registradora.git
cd sistema-caja-registradora

# Instalar dependencias
npm install

# Configurar entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar en desarrollo
npm run dev
```

---

## 🎯 Tipos de Instalación

### 🏠 Desarrollo Local
- **Ideal para:** Pruebas, desarrollo, demos
- **Requisitos:** Node.js 18+
- **Base de datos:** LocalStorage
- **Tiempo:** 5 minutos

### 🚀 Producción con Supabase
- **Ideal para:** Aplicaciones reales, equipos pequeños
- **Requisitos:** Cuenta Supabase
- **Base de datos:** PostgreSQL en la nube
- **Tiempo:** 10 minutos

### 🏢 Servidor Propio
- **Ideal para:** Empresas, control total
- **Requisitos:** VPS/Servidor dedicado
- **Base de datos:** PostgreSQL local
- **Tiempo:** 30 minutos

### ☁️ Despliegue en la Nube
- **Ideal para:** Escalabilidad, CDN global
- **Requisitos:** Cuenta Netlify/Vercel
- **Base de datos:** Supabase
- **Tiempo:** 15 minutos

---

## 📋 Requisitos del Sistema

### Mínimos
- **Node.js:** 18.0.0 o superior
- **npm:** 8.0.0 o superior
- **RAM:** 2GB
- **Almacenamiento:** 1GB libre

### Recomendados
- **Node.js:** 20.0.0 o superior
- **npm:** 10.0.0 o superior
- **RAM:** 4GB
- **Almacenamiento:** 5GB libre
- **SO:** Ubuntu 22.04, macOS 12+, Windows 10+

### Para Servidor Propio
- **RAM:** 8GB
- **CPU:** 2 cores
- **Almacenamiento:** 20GB SSD
- **Ancho de banda:** 100 Mbps
- **PostgreSQL:** 15+
- **Nginx:** 1.18+

---

## 🔧 Configuración Post-Instalación

### 1. Configurar Supabase

```bash
# Crear proyecto en https://supabase.com
# Obtener credenciales y actualizar .env

VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### 2. Configurar WhatsApp Business API

```bash
# Obtener credenciales de Facebook Business
# Actualizar configuración en la aplicación

VITE_WHATSAPP_ACCESS_TOKEN=tu-token
VITE_WHATSAPP_PHONE_NUMBER_ID=tu-phone-id
```

### 3. Configurar Cámaras IP

```bash
# Agregar cámaras desde el panel de administración
# Configurar URLs y credenciales de acceso
```

---

## 🚀 Scripts de Utilidad

Después de la instalación tendrás acceso a estos scripts:

```bash
# Iniciar en desarrollo
./start.sh          # Linux/macOS
start.bat           # Windows

# Construir para producción
./build.sh          # Linux/macOS
build.bat           # Windows

# Actualizar sistema
./update.sh         # Linux/macOS
update.bat          # Windows

# Crear backup
./backup.sh         # Linux/macOS
backup.bat          # Windows
```

---

## 🔐 Credenciales por Defecto

**⚠️ IMPORTANTE: Cambia estas credenciales inmediatamente en producción**

### Administrador
- **Usuario:** admin
- **Contraseña:** admin123

### Usuario de Prueba
- **Usuario:** usuario1
- **Contraseña:** user123

---

## 🌐 Acceso al Sistema

### Desarrollo
- **URL:** http://localhost:5173
- **Panel Admin:** http://localhost:5173 (login como admin)

### Producción
- **URL:** https://tu-dominio.com
- **Panel Admin:** https://tu-dominio.com (login como admin)

---

## 🆘 Solución de Problemas

### Error: "Node.js no encontrado"
```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Error: "Puerto 5173 en uso"
```bash
# Cambiar puerto
npm run dev -- --port 3000
```

### Error: "Supabase connection failed"
```bash
# Verificar credenciales en .env
# Verificar que el proyecto Supabase esté activo
```

### Error: "Permission denied"
```bash
# Dar permisos a scripts
chmod +x *.sh
```

---

## 📚 Documentación Adicional

- **[Guía de Despliegue](deployment-guide.md)** - Despliegue en producción
- **[Configuración de WhatsApp](whatsapp-setup.md)** - API de WhatsApp
- **[Configuración de Cámaras](camera-setup.md)** - Sistema de cámaras IP
- **[API Reference](api-docs.md)** - Documentación de la API

---

## 🤝 Soporte

### Canales de Soporte
- **Email:** soporte@tu-dominio.com
- **GitHub Issues:** [Reportar problema](https://github.com/tu-usuario/sistema-caja-registradora/issues)
- **Documentación:** [Wiki del proyecto](https://github.com/tu-usuario/sistema-caja-registradora/wiki)

### Antes de Reportar un Problema
1. Verifica que tienes la última versión
2. Revisa la documentación
3. Busca en issues existentes
4. Incluye logs y detalles del error

---

## 🔄 Actualizaciones

### Automáticas
```bash
./update.sh
```

### Manuales
```bash
git pull origin main
npm install
npm run build
```

### Verificar Versión
```bash
npm run version
```

---

## 🎉 ¡Listo!

Tu Sistema de Caja Registradora está instalado y listo para usar. 

**Próximos pasos:**
1. Cambiar credenciales por defecto
2. Configurar Supabase
3. Configurar WhatsApp (opcional)
4. Agregar usuarios y configurar permisos
5. ¡Empezar a usar el sistema!

---

*¿Necesitas ayuda? Consulta nuestra [documentación completa](README.md) o contacta al soporte.*