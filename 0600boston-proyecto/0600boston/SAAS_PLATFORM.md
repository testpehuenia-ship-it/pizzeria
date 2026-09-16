# 🍕 0600Boston | Plataforma Web SaaS & PWA Gastronómica

> **Derechos 0600Boston 2026**  
> **Producido by [ADNQN.ar](https://adnqn.ar/)** — *Desarrollo de Software, Transformación Digital y Soluciones Tecnológicas de Alta Gama.*

---

## 🌟 1. Visión General del Producto (SaaS)

**0600Boston** es una plataforma SaaS (Software as a Service) y aplicación web progresiva (**PWA**) especializada en gastronomía de alta gama para pizzerías artesanales. Su modelo de negocio se basa en el **comercio directo al consumidor (D2C)**, eliminando las altas comisiones de plataformas de terceros (como PedidosYa o Rappi) y canalizando las conversiones directamente hacia la atención automatizada por **WhatsApp Business**.

### Propuesta de Valor
- **Experiencia Inmersiva 3D**: Carrusel interactivo continuo donde la pizza gira y responde a gestos táctiles en celulares y clics/arrastre con el mouse en PC.
- **Armador Interactivo de Recetas**: Bandeja táctil para que el comensal agregue o quite toppings (albahaca, tomates, aceitunas, jamón) viendo la pizza en tiempo real.
- **Combos Inteligentes con Fotos Reales**: Creación dinámica de promociones combinando especialidades con bebidas y aderezos, utilizando fotografías gastronómicas del menú o imágenes subidas por el comercio.
- **Gestión de Stock en 1 Clic**: Pausa inmediata de productos o ingredientes por falta de insumos, ocultándolos automáticamente de la vista del cliente.
- **Fidelización Push PWA**: Centro de notificaciones push para navegadores de escritorio y dispositivos móviles con historial y biblioteca de plantillas.
- **Cumplimiento Legal y Privacidad**: Adaptado a los estándares internacionales **RGPD** (Unión Europea), **LGPD** (Brasil/Latinoamérica) y Ley 25.326.

---

## 🏗️ 2. Arquitectura Tecnológica

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Framework Web** | Next.js 15 (App Router) | Renderizado híbrido SSR/SSG, optimización de fuentes y rutas API edge |
| **Lenguaje** | TypeScript 5 | Tipado estricto de catálogo, pedidos y clientes |
| **Estilos & UI** | TailwindCSS + Vanilla CSS | Diseño responsivo moderno, paleta esmeralda / pizarra y animaciones fluidas |
| **Procesamiento Gráfico** | Sharp + Cloudinary SDK | Remoción automática de fondos y generación de WebP/PNG optimizados |
| **Persistencia** | Turso SQLite + JSON Catalog DB | Base de datos relacional ligera y almacenamiento de catálogo dinámico |
| **PWA & Offline** | Service Worker (`public/sw.js`) | Instalabilidad en pantalla de inicio, caché de assets y Web Push API |
| **Seguridad HTTP** | Headers de seguridad en `next.config.ts` | Mitigación de XSS, clickjacking, MIME-sniffing y forzado de HTTPS con HSTS |
| **SEO & Geo** | Schema.org JSON-LD + Sitemap / Robots | Posicionamiento en Google Local Pack, Rich Snippets y meta tags geográficas |

---

## 📱 3. Módulos de la Aplicación

### A. Experiencia del Cliente (Front-Office)
1. **Portada Inmersiva (`/`)**:
   - Video de fondo gastronómico en bucle optimizado (WebM y MP4).
   - Acceso rápido para clientes registrados o nuevo registro con almacenamiento seguro.
   - Enlace directo al catálogo completo.
2. **Menú de Pizzas & Combos (`/menu`)**:
   - Carrusel de pizzas con efecto de rueda continua.
   - Selector táctil de porciones (4 porciones / 8 porciones).
   - Bandeja táctil de toppings e ingredientes decorativos.
   - Pestaña de **Combos Especiales** con fotografías de la pizza y bebida asociada.
   - Filtrado automático de ítems pausados por stock (`oculto: true`).
3. **Carta de Bebidas (`/bebidas`)**:
   - Filtro por categoría: Gaseosas, Cervezas heladas y Aguas minerales.
   - Control de cantidades y botón flotante de pedido.
4. **Checkout y Enrutamiento a WhatsApp (`/pedido`)**:
   - Selección de modalidad: **Envío a Domicilio (Delivery)** o **Retiro en Sucursal (Take Away)**.
   - Métodos de pago configurables (Efectivo, Transferencia bancaria, Mercado Pago).
   - Generador automático de mensaje de WhatsApp con detalle pormenorizado y total calculado.
   - Botón de salida que finaliza sesión y limpia datos locales (`/cerrado`).

### B. Panel de Control del Comercio (`/admin/dashboard`)
1. **Especialidades (Pizzas)**: Alta, baja, modificación de precios (4p y 8p) y botón de conmutación rápida `🟢 Publicado` / `🔴 Oculto (Sin Stock)`.
2. **Bebidas**: Carga de fotografías con remoción de fondo automática y control de publicación.
3. **Banco Global de Ingredientes**: Asignación a pizzas específicas o estado "Libre / Ninguno" para recetas futuras.
4. **Armador de Combos**: Selección de especialidad, tamaño, segundo producto, aderezos y subida de imágenes personalizadas.
5. **Centro de Notificaciones Push**:
   - Envío masivo con emojis e iconos.
   - Historial persistente con las **últimas 3 notificaciones** enviadas y botón de reutilización `✏️ Editar / Usar nuevamente`.
   - Botón `💾 Guardar como Plantilla` con biblioteca interactiva reutilizable.
6. **Directorio de Clientes**: Búsqueda por nombre, teléfono o barrio para control de fidelización.

---

## 🔒 4. Seguridad y Cumplimiento Normativo

### A. Endurecimiento de Seguridad
- **Encabezados HTTP estrictos**:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: SAMEORIGIN` (prevención de Clickjacking).
  - `X-Content-Type-Options: nosniff` (prevención de ataques de confusión MIME).
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`.
- **Validación de Archivos en `/api/upload`**:
  - Lista blanca estricta de tipos MIME (`image/png`, `image/jpeg`, `image/webp`, `image/avif`).
  - Límite estricto de 10 MB para prevenir ataques de denegación de servicio (DoS por saturación de memoria).
  - Sanitización de rutas para evitar vulnerabilidades de *Path Traversal*.

### B. RGPD (UE) y LGPD (LatAm)
- **Banner de Cookies & Almacenamiento Local (`CookieConsent.tsx`)**:
  - Clasificación de cookies (Técnicas esenciales, Notificaciones push y Analíticas anónimas).
  - Opciones de aceptación total, rechazo de no esenciales o configuración granular.
- **Página de Privacidad (`/privacidad`)**:
  - Cumplimiento de los artículos 13 y 14 del RGPD y artículo 9 de la LGPD.
  - Explicación transparente de datos recabados y finalidades.
  - Botón interactivo de **Derecho al Olvido / Supresión** para que el usuario limpie inmediatamente sus datos locales del navegador.

---

## 📍 5. Optimización SEO y GEO Local

1. **Meta Tags Geográficas**:
   - `geo.region: AR-B`
   - `geo.placename: Buenos Aires, Argentina`
   - `geo.position: -34.6037;-58.3816`
   - `ICBM: -34.6037, -58.3816`
2. **Schema.org JSON-LD**:
   - Entidad `FastFoodRestaurant` y `Restaurant` para Google Local Pack y Google Maps.
   - Datos estructurados de menú, cocina (`servesCuisine`), rango de precios (`$$`) y horarios de atención.
3. **Indexación y Rastreo**:
   - `sitemap.xml` dinámico generado en `src/app/sitemap.ts`.
   - `robots.txt` generado en `src/app/robots.ts`, permitiendo indexación de rutas comerciales y protegiendo `/admin` y `/api`.

---

## 🚀 6. Despliegue y Mantenimiento

- **Control de Versiones**: Repositorio en GitHub ([`testpehuenia-ship-it/pizza`](https://github.com/testpehuenia-ship-it/pizza)).
- **Integración Continua**: Despliegues automáticos a la red Edge de **Vercel** en cada push a la rama `main`.
- **Verificación de Calidad**: Cero errores en compilación de producción mediante `npm run build`.

---

## 📜 7. Créditos y Propiedad Intelectual

```text
© Derechos 0600Boston 2026 - Todos los derechos reservados.
Producido y Desarrollado by ADNQN.ar
Sitio Web Oficial: https://adnqn.ar/
Contacto y Soporte: contacto@adnqn.ar
```
