import sharp, { OutputInfo } from "sharp";

export interface ImageProcessingOptions {
  maxDimension?: number;
  tolerance?: number;
  removeBg?: boolean;
}

/**
 * Optimiza y elimina el fondo de una imagen dejando transparencia limpia (PNG con canal Alfa).
 */
export async function removeBackgroundAndOptimize(
  inputBuffer: Buffer,
  options: ImageProcessingOptions = {}
): Promise<{ buffer: Buffer; info: OutputInfo }> {
  const { maxDimension = 800, tolerance = 42, removeBg = false } = options;

  // Si no se requiere quitar el fondo (caso habitual para pizzas completas en caja o plato):
  // Optimizamos directamente con Sharp: auto-rotación EXIF, redimensionado limpio y formato WebP/PNG
  if (!removeBg) {
    const { data: outputBuffer, info: outputInfo } = await sharp(inputBuffer)
      .rotate() // Auto-orienta según orientación de la cámara de celular
      .resize(maxDimension, maxDimension, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 88 })
      .toBuffer({ resolveWithObject: true });

    return { buffer: outputBuffer, info: outputInfo };
  }

  let imgInstance = sharp(inputBuffer).rotate();
  const meta = await imgInstance.metadata();

  // Aseguramos que tenga canal alfa (RGBA) para el recorte de fondo
  const { data, info } = await imgInstance
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;

  if (removeBg) {
    // Muestreamos las 4 esquinas para detectar el color de fondo
    const corners = [
      [0, 0],
      [width - 1, 0],
      [0, height - 1],
      [width - 1, height - 1],
      [Math.floor(width / 2), 0], // borde superior centro
      [0, Math.floor(height / 2)], // borde izquierdo centro
    ];

    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let totalA = 0;

    for (const [cx, cy] of corners) {
      const idx = (cy * width + cx) * 4;
      totalR += data[idx];
      totalG += data[idx + 1];
      totalB += data[idx + 2];
      totalA += data[idx + 3];
    }

    const count = corners.length;
    const avgA = totalA / count;
    const avgR = totalR / count;
    const avgG = totalG / count;
    const avgB = totalB / count;

    // Si las esquinas no son ya transparentes, aplicamos chroma key / tolerancia de color
    if (avgA > 30) {
      const isNearWhite = avgR > 220 && avgG > 220 && avgB > 220;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const dist = Math.sqrt(
          (r - avgR) ** 2 + (g - avgG) ** 2 + (b - avgB) ** 2
        );

        // Si es blanco o está muy cerca del color de fondo detectado
        if (dist < tolerance || (isNearWhite && r > 235 && g > 235 && b > 235)) {
          data[i + 3] = 0; // Transparente total
        } else if (dist < tolerance * 1.6) {
          // Suavizado anti-alias en los bordes
          const factor = (dist - tolerance) / (tolerance * 0.6);
          data[i + 3] = Math.round(data[i + 3] * Math.max(0, Math.min(1, factor)));
        }
      }
    }
  }

  // Reconstruimos con Sharp, aplicamos trim para quitar márgenes vacíos y redimensionamos
  let pipeline = sharp(data, {
    raw: { width, height, channels: 4 },
  });

  try {
    pipeline = pipeline.trim();
  } catch (err) {
    // Si la imagen es completamente plana, trim puede dar advertencia; la dejamos tal cual
  }

  const { data: outputBuffer, info: outputInfo } = await pipeline
    .resize(maxDimension, maxDimension, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({ quality: 90, compressionLevel: 9, effort: 7 })
    .toBuffer({ resolveWithObject: true });

  return { buffer: outputBuffer, info: outputInfo };
}
