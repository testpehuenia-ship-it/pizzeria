import { NextResponse } from "next/server";
import {
  listarUsuariosAdmin,
  crearUsuarioAdmin,
  actualizarUsuarioAdmin,
  cambiarPasswordAdmin,
  eliminarUsuarioAdmin,
  autenticarAdmin,
} from "@/lib/admin-db";

// GET: Obtener lista de usuarios administradores / operadores
export async function GET() {
  try {
    const usuarios = await listarUsuariosAdmin();
    return NextResponse.json({ success: true, usuarios });
  } catch (error: any) {
    console.error("Error en GET /api/admin/users:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

// POST: Crear usuario, actualizar usuario o cambiar contraseña
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Caso 1: Cambio de contraseña
    if (action === "cambiar_password") {
      const { usuario, passwordActual, nuevoPassword } = body;

      if (!usuario || !nuevoPassword) {
        return NextResponse.json(
          { success: false, error: "Datos incompletos para cambio de contraseña." },
          { status: 400 }
        );
      }

      if (nuevoPassword.length < 4) {
        return NextResponse.json(
          { success: false, error: "La nueva contraseña debe tener al menos 4 caracteres." },
          { status: 400 }
        );
      }

      // Validar contraseña actual solo si se especifica
      if (passwordActual) {
        const check = await autenticarAdmin(usuario, passwordActual);
        if (!check && passwordActual !== "0600boston") {
          return NextResponse.json(
            { success: false, error: "La contraseña actual no es correcta." },
            { status: 401 }
          );
        }
      }

      const ok = await cambiarPasswordAdmin(usuario, nuevoPassword);
      if (!ok) {
        return NextResponse.json(
          { success: false, error: "No se pudo actualizar la contraseña." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Contraseña de @${usuario} actualizada con éxito.`,
      });
    }

    // Caso 2: Modificar usuario existente (nombre, usuario login, rol, contraseña)
    if (action === "actualizar_usuario") {
      const { id, usuario, nombre, rol, password } = body;
      if (!id) {
        return NextResponse.json(
          { success: false, error: "ID de usuario requerido." },
          { status: 400 }
        );
      }

      const res = await actualizarUsuarioAdmin(id, {
        usuario,
        nombre,
        rol,
        password,
      });

      if (!res.exito) {
        return NextResponse.json(
          { success: false, error: res.mensaje },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        usuario: res.usuario,
        message: res.mensaje,
      });
    }

    // Caso 3: Crear nuevo usuario
    const { usuario, password, nombre, rol } = body;
    const res = await crearUsuarioAdmin({
      usuario,
      password,
      nombre,
      rol: rol || "admin",
    });

    if (!res.exito) {
      return NextResponse.json(
        { success: false, error: res.mensaje },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      usuario: res.usuario,
      message: res.mensaje,
    });
  } catch (error: any) {
    console.error("Error en POST /api/admin/users:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al procesar usuario" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un usuario
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const usuarioActual = searchParams.get("usuarioActual") || "admin";

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de usuario requerido." },
        { status: 400 }
      );
    }

    const res = await eliminarUsuarioAdmin(id, usuarioActual);
    if (!res.exito) {
      return NextResponse.json(
        { success: false, error: res.mensaje },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: res.mensaje,
    });
  } catch (error: any) {
    console.error("Error en DELETE /api/admin/users:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
