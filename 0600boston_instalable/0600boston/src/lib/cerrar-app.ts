/**
 * Utilidad global para salir y cerrar la aplicación 0600Boston.
 * 
 * Acciones que realiza:
 * 1. Limpia la sesión del cliente y vacía el carrito en localStorage y Zustand.
 * 2. Llama a window.close() para cerrar la ventana o PWA standalone.
 * 3. En navegadores que bloquean window.close() para pestañas creadas por el usuario,
 *    redirige a la pantalla dedicada /cerrado que termina el ciclo de vida de la app
 *    y permite cerrar la pestaña de forma segura.
 */
export function salirYCerrarApp(): void {
  if (typeof window === "undefined") return;

  // 1. Limpiar estado persistido
  try {
    const raw = localStorage.getItem("0600boston-store");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state) {
        parsed.state.cliente = null;
        parsed.state.pizzas = [];
        parsed.state.bebidas = [];
        parsed.state.combos = [];
        parsed.state.domicilioEntrega = "";
      }
      localStorage.setItem("0600boston-store", JSON.stringify(parsed));
    }
    sessionStorage.clear();
  } catch (e) {
    console.warn("Error al limpiar almacenamiento en salir:", e);
  }

  // 2. Intentar cerrar ventana de la aplicación o PWA
  try {
    window.close();
  } catch {}

  try {
    window.open("", "_self");
    window.close();
  } catch {}

  // 3. Redirigir a la pantalla de aplicación cerrada
  window.location.href = "/cerrado";
}
