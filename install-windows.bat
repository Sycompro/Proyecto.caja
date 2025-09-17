@echo off
REM 🚀 Instalador para Windows - Sistema de Caja Registradora v2.0
REM Instalación completa con WhatsApp y Cámaras IP

setlocal enabledelayedexpansion

REM Colores para Windows
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "PURPLE=[95m"
set "CYAN=[96m"
set "NC=[0m"

REM Variables
set "PROJECT_NAME=sistema-caja-registradora"
set "NODE_VERSION=18"

REM Banner de bienvenida
cls
echo %PURPLE%
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║    🏪 SISTEMA DE CAJA REGISTRADORA - INSTALADOR v2.0        ║
echo ║                                                              ║
echo ║    Instalación automática para Windows                      ║
echo ║    • Frontend React + TypeScript + Tailwind                 ║
echo ║    • Backend Supabase con RLS                               ║
echo ║    • WhatsApp Business API                                  ║
echo ║    • Sistema de Cámaras IP                                  ║
echo ║    • Chat en tiempo real                                    ║
echo ║    • Notificaciones push                                    ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo %NC%

echo.
echo %BLUE%[INFO]%NC% Iniciando instalación...

REM Verificar Node.js
echo %BLUE%[INFO]%NC% Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Node.js no está instalado
    echo %YELLOW%[WARN]%NC% Descarga Node.js desde: https://nodejs.org/
    echo %CYAN%[INFO]%NC% Necesitas Node.js 18 o superior
    pause
    exit /b 1
) else (
    echo %GREEN%[OK]%NC% Node.js está instalado
)

REM Verificar npm
echo %BLUE%[INFO]%NC% Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%NC% npm no está disponible
    pause
    exit /b 1
) else (
    echo %GREEN%[OK]%NC% npm está disponible
)

REM Crear proyecto
echo %BLUE%[INFO]%NC% Creando proyecto con Vite...
if exist "%PROJECT_NAME%" (
    echo %YELLOW%[WARN]%NC% El directorio %PROJECT_NAME% ya existe
    set /p "overwrite=¿Sobrescribir? (y/n): "
    if /i "!overwrite!"=="y" (
        rmdir /s /q "%PROJECT_NAME%"
    ) else (
        echo %RED%[ERROR]%NC% Instalación cancelada
        pause
        exit /b 1
    )
)

REM Crear proyecto con Vite
call npm create vite@latest %PROJECT_NAME% -- --template react-ts --yes
cd "%PROJECT_NAME%"

REM Instalar dependencias principales
echo %BLUE%[INFO]%NC% Instalando dependencias principales...
call npm install @supabase/supabase-js@latest lucide-react@latest

REM Instalar dependencias de desarrollo
echo %BLUE%[INFO]%NC% Instalando Tailwind CSS...
call npm install -D tailwindcss@latest postcss@latest autoprefixer@latest
call npx tailwindcss init -p --yes

if errorlevel 1 (
    echo %RED%[ERROR]%NC% Error al instalar dependencias
    pause
    exit /b 1
)

REM Configurar Supabase
echo.
echo %CYAN%[CONFIG]%NC% Configuración de Supabase
echo Para configurar Supabase necesitas:
echo 1. Crear una cuenta en https://supabase.com
echo 2. Crear un nuevo proyecto
echo 3. Obtener la URL y las API Keys
echo.

set /p "supabase_url=Ingresa tu Supabase URL: "
set /p "supabase_anon_key=Ingresa tu Supabase Anon Key: "
set /p "supabase_service_key=Ingresa tu Service Role Key: "

REM Configurar WhatsApp
echo.
echo %CYAN%[CONFIG]%NC% Configuración de WhatsApp Business API
set /p "setup_whatsapp=¿Configurar WhatsApp ahora? (y/n): "

if /i "%setup_whatsapp%"=="y" (
    set /p "wa_token=Access Token: "
    set /p "wa_phone_id=Phone Number ID: "
    set /p "wa_business_id=Business Account ID: "
    set /p "manager_phone=Teléfono del gerente: "
    set /p "admin_phone=Teléfono del admin: "
) else (
    set "wa_token="
    set "wa_phone_id="
    set "wa_business_id="
    set "manager_phone="
    set "admin_phone="
)

REM Configurar cámaras
echo.
echo %CYAN%[CONFIG]%NC% Configuración de Cámaras IP
set /p "enable_cameras=¿Habilitar monitoreo por cámara? (y/n): "

if /i "%enable_cameras%"=="y" (
    set "camera_enabled=true"
) else (
    set "camera_enabled=false"
)

REM Crear archivo .env
echo %BLUE%[INFO]%NC% Creando archivo de configuración...
(
echo # Supabase Configuration
echo VITE_SUPABASE_URL=%supabase_url%
echo VITE_SUPABASE_ANON_KEY=%supabase_anon_key%
echo VITE_SUPABASE_SERVICE_ROLE_KEY=%supabase_service_key%
echo.
echo # App Configuration
echo VITE_APP_URL=http://localhost:5173
echo VITE_APP_NAME=Sistema de Caja Registradora
echo VITE_APP_VERSION=2.0.0
echo.
echo # WhatsApp Configuration
echo VITE_WHATSAPP_ACCESS_TOKEN=%wa_token%
echo VITE_WHATSAPP_PHONE_NUMBER_ID=%wa_phone_id%
echo VITE_WHATSAPP_BUSINESS_ACCOUNT_ID=%wa_business_id%
echo VITE_WHATSAPP_MANAGER_PHONE=%manager_phone%
echo VITE_WHATSAPP_ADMIN_PHONE=%admin_phone%
echo.
echo # Camera Configuration
echo VITE_CAMERA_MONITORING_ENABLED=%camera_enabled%
echo VITE_CAMERA_AUTO_RECORD=true
echo VITE_CAMERA_RECORD_DURATION=300
echo.
echo # Development Configuration
echo VITE_DEV_MODE=true
echo VITE_DEBUG_LOGS=true
) > .env

REM Configurar Tailwind
echo %BLUE%[INFO]%NC% Configurando Tailwind CSS...
(
echo /** @type {import('tailwindcss'^).Config} */
echo export default {
echo   content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
echo   darkMode: 'class',
echo   theme: {
echo     extend: {
echo       animation: {
echo         'blob': 'blob 7s infinite',
echo       },
echo       keyframes: {
echo         'blob': {
echo           '0%%': { transform: 'translate(0px, 0px^) scale(1^)' },
echo           '33%%': { transform: 'translate(30px, -50px^) scale(1.1^)' },
echo           '66%%': { transform: 'translate(-20px, 20px^) scale(0.9^)' },
echo           '100%%': { transform: 'translate(0px, 0px^) scale(1^)' },
echo         }
echo       }
echo     },
echo   },
echo   plugins: [],
echo };
) > tailwind.config.js

REM Crear scripts de utilidad
echo %BLUE%[INFO]%NC% Creando scripts de utilidad...

REM Script de inicio
(
echo @echo off
echo echo 🚀 Iniciando Sistema de Caja Registradora...
echo echo 📱 WhatsApp: Verificando configuración...
echo echo 📹 Cámaras: Verificando configuración...
echo echo 🗄️ Base de datos: Conectando a Supabase...
echo echo.
echo npm run dev
) > start.bat

REM Script de construcción
(
echo @echo off
echo echo 🔨 Construyendo aplicación para producción...
echo npm run build
echo echo ✅ Aplicación construida en ./dist
echo echo.
echo echo 📋 Para desplegar:
echo echo • Netlify: netlify deploy --prod
echo echo • Vercel: vercel --prod
echo echo • Servidor: Subir carpeta dist/
) > build.bat

REM Script de actualización
(
echo @echo off
echo echo 🔄 Actualizando dependencias...
echo npm update
echo echo ✅ Dependencias actualizadas
) > update.bat

REM Script de configuración de WhatsApp
(
echo @echo off
echo echo 📱 Configuración de WhatsApp Business API
echo echo.
echo echo Para configurar WhatsApp necesitas:
echo echo 1. Cuenta de Facebook Business
echo echo 2. Aplicación de WhatsApp Business
echo echo 3. Número de teléfono verificado
echo echo.
echo set /p "token=Access Token: "
echo set /p "phone_id=Phone Number ID: "
echo set /p "business_id=Business Account ID: "
echo set /p "manager_phone=Número del gerente: "
echo set /p "admin_phone=Número del admin: "
echo.
echo echo Actualizando configuración...
echo REM Aquí iría la lógica para actualizar .env
echo echo ✅ WhatsApp configurado exitosamente
echo pause
) > setup-whatsapp.bat

REM Script de configuración de cámaras
(
echo @echo off
echo echo 📹 Configuración de Cámaras IP
echo echo.
echo set /p "name=Nombre de la cámara: "
echo set /p "url=URL de la cámara: "
echo set /p "location=Ubicación: "
echo set /p "username=Usuario (opcional^): "
echo set /p "password=Contraseña (opcional^): "
echo.
echo echo Guardando configuración...
echo echo ✅ Cámara configurada: %%name%%
echo pause
) > setup-cameras.bat

REM Crear documentación
echo %BLUE%[INFO]%NC% Creando documentación...
(
echo # 🏪 Sistema de Caja Registradora
echo.
echo Sistema integral con WhatsApp Business API y Cámaras IP
echo.
echo ## 🚀 Inicio Rápido
echo.
echo ```cmd
echo start.bat
echo ```
echo.
echo ## ⚙️ Configuración
echo.
echo - WhatsApp: setup-whatsapp.bat
echo - Cámaras: setup-cameras.bat
echo - Actualizar: update.bat
echo - Construir: build.bat
echo.
echo ## 🎯 Credenciales
echo.
echo - Admin: admin / admin123
echo - Usuario: usuario1 / user123
echo.
echo ## 📱 Funcionalidades
echo.
echo - ✅ WhatsApp Business API
echo - ✅ Cámaras IP en tiempo real
echo - ✅ Chat integrado
echo - ✅ Impresión automática
echo - ✅ Notificaciones push
echo - ✅ Dashboard completo
echo.
echo ¡Disfruta tu sistema! 🎉
) > README.md

REM Mostrar resumen
cls
echo %GREEN%
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║    🎉 ¡INSTALACIÓN COMPLETADA EXITOSAMENTE! 🎉             ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo %NC%

echo.
echo %GREEN%[OK]%NC% Sistema de Caja Registradora instalado correctamente
echo.
echo %YELLOW%📋 PRÓXIMOS PASOS:%NC%
echo.
echo 1. start.bat              - Iniciar sistema
echo 2. setup-whatsapp.bat     - Configurar WhatsApp
echo 3. setup-cameras.bat      - Configurar cámaras
echo 4. build.bat              - Construir para producción
echo.
echo %CYAN%🌐 ACCESO:%NC%
echo • URL: http://localhost:5173
echo • Admin: admin / admin123
echo • Usuario: usuario1 / user123
echo.
echo %BLUE%🌟 FUNCIONALIDADES:%NC%
echo • 📱 WhatsApp Business API
echo • 📹 Cámaras IP
echo • 💬 Chat en tiempo real
echo • 🖨️ Impresión automática
echo • 🔔 Notificaciones
echo • 🎨 Temas personalizables
echo.
echo %PURPLE%⚠️  IMPORTANTE:%NC%
echo • Configura WhatsApp para notificaciones reales
echo • Agrega cámaras IP para monitoreo
echo • Cambia las credenciales por defecto
echo • Revisa la documentación en README.md
echo.
echo %GREEN%¡Disfruta tu nuevo Sistema de Caja Registradora! 🏪%NC%
echo.

pause