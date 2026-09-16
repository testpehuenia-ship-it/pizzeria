import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { removeBackgroundAndOptimize } from "@/lib/image-processor";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const removeBgParam = formData.get("removeBg");
    const removeBg = removeBgParam === "true"; // Por defecto false (preserva foto completa de la pizza)

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    // Validación de seguridad: Comprobar tipo MIME y extensión de archivo
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/pjpeg",
      "image/jfif",
      "image/png",
      "image/x-png",
      "image/webp",
      "image/avif",
      "image/heic",
      "image/heif",
    ];
    const nombreArchivo = file.name || "";
    const ext = nombreArchivo.split(".").pop()?.toLowerCase() || "";
    const validExtensions = ["jpg", "jpeg", "png", "webp", "avif", "heic", "heif"];
    const fileMime = (file.type || "").toLowerCase();

    const esMimeValido =
      allowedMimeTypes.includes(fileMime) ||
      fileMime.startsWith("image/") ||
      fileMime === "application/octet-stream" ||
      !fileMime;
    const esExtValida = validExtensions.includes(ext);

    if (!esMimeValido && !esExtValida) {
      return NextResponse.json(
        { error: `Formato de imagen no soportado (${fileMime || ext}). Solo se admiten archivos JPG, PNG, WebP o AVIF.` },
        { status: 415 }
      );
    }

    // Validación de seguridad: Límite máximo de 10 MB por imagen
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "El archivo excede el tamaño máximo permitido (10 MB)." },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);

    // Optimizar imagen y remover fondo transparente automáticamente
    let processedBuffer = rawBuffer;
    let width = 0;
    let height = 0;
    try {
      const { buffer, info } = await removeBackgroundAndOptimize(rawBuffer, {
        maxDimension: 800,
        removeBg,
      });
      processedBuffer = Buffer.from(buffer);
      width = info.width;
      height = info.height;
    } catch (procErr: any) {
      console.warn("Advertencia en procesamiento de imagen, usando original:", procErr.message);
    }

    // 1. Si Cloudinary está configurado en variables de entorno, subimos la imagen optimizada transparente
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      try {
        const secureUrl = await uploadToCloudinary(processedBuffer, "0600boston/productos");
        return NextResponse.json({
          success: true,
          url: secureUrl,
          provider: "cloudinary",
          width,
          height,
          sizeBytes: processedBuffer.length,
          fondoTransparente: removeBg,
        });
      } catch (cloudErr: any) {
        console.warn("Fallo subida a Cloudinary, usando almacenamiento local:", cloudErr.message);
      }
    }

    // 2. Fallback de desarrollo local
    const uploadsDir = path.join(process.cwd(), "public", "images", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.png`;
    const filePath = path.join(uploadsDir, fileName);

    await writeFile(filePath, processedBuffer);
    const localUrl = `/images/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      url: localUrl,
      provider: "local",
      width,
      height,
      sizeBytes: processedBuffer.length,
      fondoTransparente: removeBg,
      nota: "Imagen optimizada con fondo transparente guardada con éxito.",
    });
  } catch (error: any) {
    console.error("Error en endpoint /api/upload:", error);
    return NextResponse.json({ error: error.message || "Error al procesar la imagen" }, { status: 500 });
  }
}

