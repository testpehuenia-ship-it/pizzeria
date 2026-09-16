# 🍕 0600Boston - Guía de Instalación y Despliegue

Este paquete contiene la aplicación completa de **0600Boston (PWA + Panel Admin + Notificaciones Push + Catálogo + Carrito)** lista para ser instalada y ejecutada en:
1. **Otra PC** (Windows / macOS / Linux para desarrollo o uso local).
2. **Un Servidor VPS o Servidor Local** (Ubuntu / Debian / Docker / PM2).

---

## 📋 Requisitos Previos

* **Node.js**: Versión 18.18 o superior (Recomendado: Node.js 20 LTS o 22 LTS). [Descargar Node.js](https://nodejs.org/)
* **NPM**: Incluido automáticamente con Node.js.

---

## 💻 OPCIÓN 1: Instalación en Otra PC (Windows o Mac)

### En Windows (1 solo clic):
1. Descomprime el archivo `.zip` en la carpeta que desees.
2. Asegúrate de tener tu archivo `.env.local` configurado (puedes duplicar `.env.example` y renombrarlo a `.env.local`).
3. Haz doble clic en el archivo **`iniciar_pc.bat`**.
   - El script verificará Node.js.
   - Instalará las dependencias automáticamente (`npm install`).
   - Te preguntará si deseas abrirlo en **Modo Desarrollo** (opción 1) o **Modo Producción** (opción 2).
4. Abre tu navegador en: [http://localhost:3000](http://localhost:3000).

### En Mac o Linux (Terminal):
1. Abre una terminal dentro de la carpeta del proyecto.
2. Si no tienes `.env.local`, copia el archivo de ejemplo:
   ```bash
   cp .env.example .env.local
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Inicia en modo desarrollo:
   ```bash
   npm run dev
   ```
   O compila e inicia en modo producción:
   ```bash
   npm run build
   npm run start
   ```

---

## 🌐 OPCIÓN 2: Despliegue en Servidor Linux (VPS / Ubuntu / Debian)

### Paso 1: Subir el proyecto al servidor
Copia la carpeta o el `.zip` a tu servidor (por ejemplo en `/var/www/0600boston`).

### Paso 2: Ejecutar el script automático
Dentro de la carpeta del proyecto en el servidor, ejecuta:
```bash
chmod +x iniciar_servidor.sh
./iniciar_servidor.sh
```

El script se encargará de instalar las dependencias, compilar Next.js y levantarlo con **PM2** en segundo plano.

### Paso 3: Comandos útiles de PM2 en el servidor
```bash
# Ver estado del servidor
pm2 status

# Ver logs en tiempo real
pm2 logs 0600boston

# Reiniciar la aplicación
pm2 restart 0600boston

# Hacer que inicie automáticamente al reiniciar el VPS
pm2 startup
pm2 save
```

### Paso 4 (Opcional): Configuración Nginx (Reverse Proxy con SSL)
Para vincular tu dominio (ej: `tu-dominio.com`) al puerto 3000 de Next.js con HTTPS:

```nginx
server {
    server_name tu-dominio.com www.tu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🐳 OPCIÓN 3: Despliegue con Docker (1 solo comando)

Si tienes **Docker** y **Docker Compose** instalados en tu servidor o PC:

1. Asegúrate de tener tu archivo `.env.local` configurado en la carpeta raíz.
2. Ejecuta:
   ```bash
   docker compose up -d --build
   ```
3. La aplicación se compilará en un contenedor optimizado de producción y estará disponible en el puerto 3000:
   [http://localhost:3000](http://localhost:3000)

Para detener el contenedor:
```bash
docker compose down
```

---

## 🔐 Variables de Entorno (`.env.local`)

Asegúrate de que tu archivo `.env.local` contenga las siguientes claves para el funcionamiento integral de la tienda:

```env
# 1. Base de Datos Turso
TURSO_DATABASE_URL=libsql://tu-db.turso.io
TURSO_AUTH_TOKEN=tu_token_turso

# 2. Cloudinary (Imágenes)
CLOUDINARY_CLOUD_NAME=tu_cloud
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# 3. WhatsApp de la Pizzería
NEXT_PUBLIC_WHATSAPP_NUMERO=5492942661000
NEXT_PUBLIC_WHATSAPP_LOCAL=02942661000

# 4. Notificaciones Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BN7tSmYOVn5xpS62Oh6BXj108jgjpm3_dqUTEtNroFd9M3ta4g7mvi8poYPuujFIvhHpT2F71A_yEFmqlWD5tAQ
VAPID_PRIVATE_KEY=L_lMB8AfbkHxRn-ACAqQJ9ilqH6SdsP6YxpUdx4BZjE
VAPID_SUBJECT=mailto:soporte@0600boston.com
```

---

## 🍕 Accesos y Rutas Clave

* **Menú y Tienda de Clientes:** `/` y `/menu`
* **Panel de Administración:** `/admin`
  - Gestión de Pedidos en Vivo
  - Catálogo de Pizzas, Empanadas y Bebidas
  - Clientes Registrados y Conectados
  - Emisión de Notificaciones Push VAPID en Tiempo Real
