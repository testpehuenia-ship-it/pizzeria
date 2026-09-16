#!/usr/bin/env bash
# ------------------------------------------------------------------
# 🍕 0600Boston - Script de Despliegue e Inicio para Servidor Linux / VPS
# ------------------------------------------------------------------

set -e

echo "========================================================"
echo "       🍕 0600BOSTON - DESPLIEGUE EN SERVIDOR LINUX"
echo "========================================================"
echo ""

# 1. Comprobar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Instalalo antes de continuar (ej: sudo apt install nodejs npm)."
    exit 1
fi

echo "✅ Node.js versión: $(node -v)"
echo "✅ NPM versión: $(npm -v)"
echo ""

# 2. Comprobar .env.local
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        echo "⚠️ Creando .env.local a partir de .env.example..."
        cp .env.example .env.local
        echo "💡 Recordá revisar y editar .env.local con nano o vim según corresponda."
    fi
fi

# 3. Instalar dependencias
echo "📦 Instalando dependencias de producción..."
npm install

# 4. Compilar Next.js
echo "⚙️ Compilando aplicación Next.js para producción..."
npm run build

# 5. Iniciar con PM2 si está disponible, o con npm start
if command -v pm2 &> /dev/null; then
    echo "🚀 Iniciando con PM2 en segundo plano (cluster)..."
    pm2 start ecosystem.config.js
    pm2 save
    echo "✅ Aplicación corriendo con PM2. Ver estado con: pm2 status"
else
    echo "🚀 Iniciando servidor de producción en el puerto 3000..."
    echo "💡 Tip: Podés instalar PM2 con 'npm install -g pm2' para correr en segundo plano permanente."
    npm run start
fi
