/**
 * Utilidad de cliente para pre-comprimir imágenes en el navegador antes de enviarlas al servidor.
 * Evita el límite de tamaño de Vercel/Next.js (HTTP 413 Request Entity Too Large)
 * y reduce fotos pesadas de celulares (5MB-15MB) a archivos livianos (~200KB-400KB)
 * en alta calidad y en cuestión de milisegundos.
 */

export async function comprimirImagenEnNavegador(
  file: File,
  maxDimension = 1400,
  quality = 0.85
): Promise<File> {
  // Si no es imagen o si ya es muy liviana (< 300 KB) y no es gigante, se deja tal cual
  if (!file.type.startsWith("image/") && !file.name.match(/\.(jpe?g|png|webp|avif|heic|jfif)$/i)) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            let { width, height } = img;

            // Redimensionar proporcionalmente si supera la dimensión máxima
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              resolve(file);
              return;
            }

            // Dibujar en el canvas redimensionado
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  resolve(file);
                  return;
                }

                // Generar nuevo archivo WebP o JPEG liviano
                const extension = file.type === "image/png" ? ".png" : ".webp";
                const mimeType = file.type === "image/png" ? "image/png" : "image/webp";
                const baseName = file.name.replace(/\.[^/.]+$/, "");
                const compressedFile = new File([blob], `${baseName}${extension}`, {
                  type: mimeType,
                  lastModified: Date.now(),
                });

                resolve(compressedFile);
              },
              file.type === "image/png" ? "image/png" : "image/webp",
              quality
            );
          } catch (canvasErr) {
            console.warn("Fallo al procesar canvas, usando archivo original:", canvasErr);
            resolve(file);
          }
        };

        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };

      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn("Fallo en compresión de navegador:", err);
      resolve(file);
    }
  });
}

/**
 * Realiza la subida segura a /api/upload manejando compresión previa y parseo robusto de respuestas.
 */
export async function subirImagenAlServidor(
  file: File,
  options: { removeBg?: boolean; maxDimension?: number } = {}
): Promise<{ url: string; success: boolean }> {
  // 1. Pre-comprimir en el cliente para que pese menos de 1 MB
  const archivoOptimizado = await comprimirImagenEnNavegador(
    file,
    options.maxDimension || 1400,
    0.85
  );

  const formData = new FormData();
  formData.append("file", archivoOptimizado);
  formData.append("removeBg", options.removeBg ? "true" : "false");

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const rawText = await res.text();
  let data: any = {};

  try {
    data = JSON.parse(rawText);
  } catch {
    // Si la respuesta no es JSON (ej. error 413 o 500 de Vercel/proxy)
    if (res.status === 413 || rawText.toLowerCase().includes("too large")) {
      throw new Error("El archivo es demasiado grande para el servidor. Intentá con otra foto.");
    }
    if (res.status === 504 || rawText.toLowerCase().includes("timed out")) {
      throw new Error("Tiempo de espera agotado al procesar la imagen en el servidor.");
    }
    throw new Error(`Error en el servidor (${res.status}): ${rawText.slice(0, 120)}`);
  }

  if (!res.ok) {
    throw new Error(data.error || "No se pudo procesar la imagen en el servidor.");
  }

  return data;
}
