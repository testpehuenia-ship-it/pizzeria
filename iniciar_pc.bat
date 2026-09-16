@echo off
chcp 65001 >nul
title 0600Boston - Iniciador de Proyecto
echo ========================================================
echo        🍕 0600BOSTON - INICIADOR PARA OTRA PC
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no está instalado en este equipo.
    echo Por favor descarga e instala Node.js LTS desde: https://nodejs.org/
    echo.
    pause
    exit /b
)

echo [1/4] Verificando archivo de variables de entorno...
if not exist ".env.local" (
    if exist ".env.example" (
        echo Creando archivo .env.local a partir de .env.example...
        copy .env.example .env.local >nul
        echo [AVISO] Se creó .env.local. Por favor verifica tus credenciales si deseas cambiarlas.
    ) else (
        echo [AVISO] No se encontró .env.example. Asegúrate de tener .env.local configurado.
    )
) else (
    echo [OK] Archivo .env.local detectado.
)
echo.

echo [2/4] Verificando dependencias (node_modules)...
if not exist "node_modules\" (
    echo Instalando librerías y dependencias (npm install)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Ocurrió un fallo al instalar dependencias.
        pause
        exit /b
    )
) else (
    echo [OK] Dependencias listas.
)
echo.

echo ========================================================
echo Selecciona el modo de inicio:
echo [1] Modo Desarrollo (npm run dev) - Para modificar código y ver cambios en vivo
echo [2] Modo Producción (npm run build ^& npm run start) - Máxima velocidad
echo ========================================================
set /p opcion="Ingresa 1 o 2 (por defecto 1): "

if "%opcion%"=="2" (
    echo.
    echo [3/4] Compilando proyecto para producción...
    call npm run build
    echo.
    echo [4/4] Iniciando servidor de producción en http://localhost:3000...
    call npm run start
) else (
    echo.
    echo [3/4] Iniciando servidor de desarrollo en http://localhost:3000...
    call npm run dev
)

pause
