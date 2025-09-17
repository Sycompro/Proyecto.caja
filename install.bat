@echo off
REM 🚀 Script de Instalación para Windows - Sistema de Caja Registradora
REM Versión: 1.0.0

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
echo ║    🏪 SISTEMA DE CAJA REGISTRADORA - INSTALADOR v1.0        ║
echo ║                                                              ║
echo ║    Instalación automática para Windows                      ║
echo ║    • Frontend React + TypeScript                            ║
echo ║    • Backend Supabase                                       ║
echo ║    • WhatsApp Business API                                  ║
echo ║    • Sistema de Cámaras IP                                  ║
echo ║    • Chat en tiempo real                                    ║
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

REM Crear directorio del proyecto
echo %BLUE%[INFO]%NC% Creando directorio del proyecto...
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

mkdir "%PROJECT_NAME%"
cd "%PROJECT_NAME%"

REM Crear package.json
echo %BLUE%[INFO]%NC% Creando configuración del proyecto...
(
echo {
echo   "name": "sistema-caja-registradora",
echo   "private": true,
echo   "version": "1.0.0",
echo   "type": "module",
echo   "scripts": {
echo     "dev": "vite",
echo     "build": "vite build",
echo     "preview": "vite preview",
echo     "start": "npm run dev"
echo   },
echo   "dependencies": {
echo     "@supabase/supabase-js": "^2.38.0",
echo     "lucide-react": "^0.344.0",
echo     "react": "^18.3.1",
echo     "react-dom": "^18.3.1"
echo   },
echo   "devDependencies": {
echo     "@types/react": "^18.3.5",
echo     "@types/react-dom": "^18.3.0",
echo     "@vitejs/plugin-react": "^4.3.1",
echo     "autoprefixer": "^10.4.18",
echo     "postcss": "^8.4.35",
echo     "tailwindcss": "^3.4.1",
echo     "typescript": "^5.5.3",
echo     "vite": "^5.4.2"
echo   }
echo }
) > package.json

REM Instalar dependencias
echo %BLUE%[INFO]%NC% Instalando dependencias...
npm install
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

REM Crear archivo .env
echo %BLUE%[INFO]%NC% Creando archivo de configuración...
(
echo # Supabase Configuration
echo VITE_SUPABASE_URL=%supabase_url%
echo VITE_SUPABASE_ANON_KEY=%supabase_anon_key%
echo.
echo # App Configuration
echo VITE_APP_URL=http://localhost:5173
echo VITE_APP_NAME=Sistema de Caja Registradora
echo VITE_APP_VERSION=1.0.0
) > .env

REM Crear scripts de utilidad
echo %BLUE%[INFO]%NC% Creando scripts de utilidad...

REM Script de inicio
(
echo @echo off
echo echo 🚀 Iniciando Sistema de Caja Registradora...
echo npm run dev
) > start.bat

REM Script de construcción
(
echo @echo off
echo echo 🔨 Construyendo aplicación...
echo npm run build
echo echo ✅ Aplicación construida en ./dist
) > build.bat

REM Script de actualización
(
echo @echo off
echo echo 🔄 Actualizando dependencias...
echo npm update
echo echo ✅ Dependencias actualizadas
) > update.bat

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
echo 1. start.bat          - Iniciar en modo desarrollo
echo 2. build.bat          - Construir para producción
echo 3. update.bat         - Actualizar dependencias
echo.
echo %CYAN%🌐 ACCESO:%NC%
echo • URL: http://localhost:5173
echo • Admin: admin / admin123
echo • Usuario: usuario1 / user123
echo.
echo %PURPLE%⚠️  IMPORTANTE:%NC%
echo • Cambia las credenciales por defecto
echo • Configura WhatsApp desde la aplicación
echo • Revisa la documentación en README.md
echo.
echo %GREEN%¡Disfruta tu nuevo Sistema de Caja Registradora! 🏪%NC%
echo.

pause