"use client";

import React, { useState, useEffect, useRef } from "react";
import { PushNotificationRecord, PushTemplateItem } from "@/lib/push-db";
import { getVapidPublicKey, urlBase64ToUint8Array } from "@/lib/vapid-keys";

interface PushAdminProps {
  onMostrarNotificacion: (msg: string, tipo?: "exito" | "error") => void;
}

function parseDispositivo(ua?: string): { nombre: string; icono: string } {
  if (!ua) return { nombre: "Navegador Web", icono: "🌐" };
  const lower = ua.toLowerCase();
  if (lower.includes("android")) {
    return { nombre: "Celular Android", icono: "📱" };
  }
  if (lower.includes("iphone") || lower.includes("ipad")) {
    return { nombre: "Apple iOS (iPhone / iPad)", icono: "🍏" };
  }
  if (lower.includes("windows")) {
    return { nombre: "Computadora Windows (PC)", icono: "💻" };
  }
  if (lower.includes("macintosh") || lower.includes("mac os")) {
    return { nombre: "Computadora Mac", icono: "🖥️" };
  }
  if (lower.includes("linux")) {
    return { nombre: "Computadora Linux", icono: "🐧" };
  }
  return { nombre: "Navegador Web", icono: "🌐" };
}

export function PushAdmin({ onMostrarNotificacion }: PushAdminProps) {
  const [historial, setHistorial] = useState<PushNotificationRecord[]>([]);
  const [plantillas, setPlantillas] = useState<PushTemplateItem[]>([]);
  const [totalSuscripciones, setTotalSuscripciones] = useState<number>(0);
  const [suscripcionesList, setSuscripcionesList] = useState<any[]>([]);
  const [vapidConfigured, setVapidConfigured] = useState<boolean>(true);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [suscribiendo, setSuscribiendo] = useState(false);
  const [guardandoPlantilla, setGuardandoPlantilla] = useState(false);
  const [subiendoIcono, setSubiendoIcono] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const tituloInputRef = useRef<HTMLInputElement>(null);
  const mensajeTextareaRef = useRef<HTMLTextAreaElement>(null);

  const insertarEmojiEnTitulo = (emoji: string) => {
    const input = tituloInputRef.current;
    if (input) {
      const start = input.selectionStart ?? formTitulo.length;
      const end = input.selectionEnd ?? formTitulo.length;
      const nuevo = formTitulo.slice(0, start) + emoji + formTitulo.slice(end);
      setFormTitulo(nuevo);
      setTimeout(() => {
        input.focus();
        const nuevaPos = start + emoji.length;
        input.setSelectionRange(nuevaPos, nuevaPos);
      }, 10);
    } else {
      setFormTitulo((prev) => prev + " " + emoji);
    }
  };

  const insertarEmojiEnMensaje = (emoji: string) => {
    const textarea = mensajeTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? formMensaje.length;
      const end = textarea.selectionEnd ?? formMensaje.length;
      const nuevo = formMensaje.slice(0, start) + emoji + formMensaje.slice(end);
      setFormMensaje(nuevo);
      setTimeout(() => {
        textarea.focus();
        const nuevaPos = start + emoji.length;
        textarea.setSelectionRange(nuevaPos, nuevaPos);
      }, 10);
    } else {
      setFormMensaje((prev) => prev + " " + emoji);
    }
  };

  // Formulario de emisión (precargado con plantilla de bienvenida personalizada)
  const [formTitulo, setFormTitulo] = useState("¡Bienvenido a 0600Boston, {nombre}! 🍕🍀");
  const [formMensaje, setFormMensaje] = useState("Hola {nombre}, gracias por sumarte a nuestra App. Mirá las pizzas artesanales y promos con descuento para vos hoy.");
  const [formUrl, setFormUrl] = useState("/menu");
  const [formIcono, setFormIcono] = useState("🍀");
  const [formDestinatarios, setFormDestinatarios] = useState("Todos los Clientes");

  const handleSubirIcono = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onMostrarNotificacion("Por favor seleccioná un archivo de imagen válido (PNG, WebP, JPG, SVG).", "error");
      return;
    }

    setSubiendoIcono(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("removeBg", "true");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "No se pudo procesar la imagen del icono");
      }

      setFormIcono(data.url);
      onMostrarNotificacion("¡Imagen optimizada y convertida a icono push con éxito!", "exito");
    } catch (err: any) {
      onMostrarNotificacion(`Error al cargar icono: ${err.message}`, "error");
    } finally {
      setSubiendoIcono(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const cargarHistorial = async () => {
    setCargando(true);
    try {
      const res = await fetch("/api/push");
      const data = await res.json();
      if (data.success) {
        if (data.historial) setHistorial(data.historial.slice(0, 3));
        if (data.plantillas) setPlantillas(data.plantillas);
        if (typeof data.totalSuscripciones === "number") setTotalSuscripciones(data.totalSuscripciones);
        if (typeof data.vapidConfigured === "boolean") setVapidConfigured(data.vapidConfigured);
        if (Array.isArray(data.suscripciones)) setSuscripcionesList(data.suscripciones);
      }
    } catch (err) {
      console.error("Error al cargar historial push:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const handleEnviarPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    try {
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: formTitulo,
          mensaje: formMensaje,
          url: formUrl,
          icono: formIcono,
          destinatarios: formDestinatarios,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar notificación push");

      if (typeof data.totalSuscripciones === "number") setTotalSuscripciones(data.totalSuscripciones);

      if (data.totalSuscripciones === 0) {
        onMostrarNotificacion(
          "Notificación registrada en el historial, pero no hay dispositivos suscritos aún. Abre la tienda y permite las notificaciones para conectar el primer dispositivo.",
          "error"
        );
      } else if (data.alcanzados > 0) {
        onMostrarNotificacion(
          `¡Notificación push emitida con éxito! Entregada en tiempo real a ${data.alcanzados} dispositivo(s).`,
          "exito"
        );
      } else {
        onMostrarNotificacion("¡Notificación push procesada y registrada con éxito!", "exito");
      }

      if (data.historial) setHistorial(data.historial.slice(0, 3));
      else cargarHistorial();
    } catch (err: any) {
      onMostrarNotificacion(err.message, "error");
    } finally {
      setEnviando(false);
    }
  };

  const handleGuardarPlantilla = async () => {
    if (!formTitulo.trim() || !formMensaje.trim()) {
      onMostrarNotificacion("Por favor completá título y mensaje antes de guardar la plantilla", "error");
      return;
    }

    setGuardandoPlantilla(true);
    try {
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "guardar_plantilla",
          nombre: formTitulo.length > 32 ? formTitulo.slice(0, 32) + "..." : formTitulo,
          titulo: formTitulo,
          mensaje: formMensaje,
          url: formUrl,
          icono: formIcono,
          destinatarios: formDestinatarios,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar plantilla");

      if (data.plantillas) setPlantillas(data.plantillas);
      onMostrarNotificacion("¡Plantilla guardada con éxito!", "exito");
    } catch (err: any) {
      onMostrarNotificacion(err.message, "error");
    } finally {
      setGuardandoPlantilla(false);
    }
  };

  const handleEliminarPlantilla = async (id: string) => {
    try {
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "eliminar_plantilla",
          id,
        }),
      });
      const data = await res.json();
      if (data.success && data.plantillas) {
        setPlantillas(data.plantillas);
        onMostrarNotificacion("Plantilla eliminada con éxito", "exito");
      }
    } catch (err: any) {
      onMostrarNotificacion("Error al eliminar plantilla", "error");
    }
  };

  const handleCargarNotificacion = (push: PushNotificationRecord) => {
    setFormTitulo(push.titulo);
    setFormMensaje(push.mensaje);
    setFormUrl(push.url);
    setFormIcono(push.icono);
    setFormDestinatarios(push.destinatarios);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
    onMostrarNotificacion("Notificación cargada en el formulario lista para editar y enviar de nuevo", "exito");
  };

  const handleCargarPlantilla = (tmpl: PushTemplateItem) => {
    setFormTitulo(tmpl.titulo);
    setFormMensaje(tmpl.mensaje);
    setFormUrl(tmpl.url);
    setFormIcono(tmpl.icono);
    setFormDestinatarios(tmpl.destinatarios);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
    onMostrarNotificacion(`Plantilla "${tmpl.nombre || tmpl.titulo}" cargada en el formulario`, "exito");
  };

  const handleProbarEnEsteDispositivo = async () => {
    if (!("Notification" in window)) {
      alert("Tu navegador no soporta notificaciones de escritorio.");
      return;
    }

    if (Notification.permission === "granted") {
      new Notification(formTitulo, {
        body: formMensaje,
        icon: "/images/brunoagradece.webp",
      });
      onMostrarNotificacion("Notificación enviada a tu dispositivo.", "exito");
    } else if (Notification.permission === "default") {
      const p = await Notification.requestPermission();
      if (p === "granted") {
        new Notification(formTitulo, {
          body: formMensaje,
          icon: "/images/brunoagradece.webp",
        });
        onMostrarNotificacion("Permiso concedido y notificación de prueba enviada.", "exito");
      }
    } else {
      alert("Las notificaciones están bloqueadas en tu navegador para este sitio. Habilítalas desde el candado en la barra de direcciones.");
    }
  };

  const handleSuscribirYProbarEsteDispositivo = async () => {
    if (!("Notification" in window)) {
      alert("Tu navegador no soporta notificaciones de escritorio.");
      return;
    }

    setSuscribiendo(true);
    try {
      let perm = Notification.permission;
      if (perm === "default") {
        perm = await Notification.requestPermission();
      }

      if (perm !== "granted") {
        onMostrarNotificacion(
          "Permiso de notificaciones denegado. Habilítalas desde el candado en la barra de direcciones.",
          "error"
        );
        return;
      }

      if (!("serviceWorker" in navigator)) {
        throw new Error("Service Worker no soportado en este navegador.");
      }

      let reg = await navigator.serviceWorker.getRegistration("/sw.js");
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js");
      }
      await navigator.serviceWorker.ready;

      const vapidKey = getVapidPublicKey();

      let sub = await reg.pushManager.getSubscription();
      // Si la suscripción anterior existía, la renovamos para asegurar un token nuevo
      if (sub) {
        try {
          await sub.unsubscribe();
        } catch (e) {}
      }

      const convertedKey = urlBase64ToUint8Array(vapidKey);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey as unknown as BufferSource,
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          userAgent: navigator.userAgent,
          clienteNombre: "Administrador (Este Navegador)",
          clienteUsuario: "admin",
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "No se pudo registrar la suscripción");
      }

      onMostrarNotificacion(
        "¡Dispositivo suscrito con éxito! Enviando notificación push real de prueba...",
        "exito"
      );

      // Disparar envío push real inmediato para verificar entrega en pantalla
      const pushRes = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: formTitulo || "🍕 ¡0600Boston Notificaciones Activas!",
          mensaje: formMensaje || "Tu dispositivo está conectado y recibiendo ofertas push en tiempo real.",
          url: formUrl || "/menu",
          icono: formIcono || "🍀",
          destinatarios: "Todos los Clientes",
        }),
      });

      const pushData = await pushRes.json();
      if (pushRes.ok && pushData.alcanzados > 0) {
        onMostrarNotificacion(
          `¡Éxito total! Notificación push enviada y recibida en ${pushData.alcanzados} dispositivo(s).`,
          "exito"
        );
      } else {
        onMostrarNotificacion(
          "Dispositivo registrado en la base de datos. Si no ves la ventana emergente, verifica si tienes activo el modo 'No Molestar' de Windows.",
          "exito"
        );
      }

      cargarHistorial();
    } catch (err: any) {
      console.error(err);
      onMostrarNotificacion(`Error: ${err.message}`, "error");
    } finally {
      setSuscribiendo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Superior de Administración de Push */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#151f2e] border border-emerald-500/20 rounded-2xl p-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>🔔</span>
              <span>Administración de Mensajes Push</span>
            </h2>
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                vapidConfigured
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-red-500/20 text-red-300 border-red-500/40"
              }`}
            >
              {vapidConfigured ? "VAPID Activo" : "VAPID Desconectado"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Enviá ofertas relámpago, avisos de promociones y novedades directamente a las pantallas de los clientes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-[#0d141e] border border-emerald-500/30 px-3 py-1.5 rounded-xl text-center">
            <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Dispositivos Web Push</div>
            <div className="text-sm font-black text-emerald-400">
              {totalSuscripciones} {totalSuscripciones === 1 ? "Dispositivo" : "Dispositivos"}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSuscribirYProbarEsteDispositivo}
            disabled={suscribiendo}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
          >
            <span>📲</span>
            <span>{suscribiendo ? "Conectando..." : "Activar Push en este Navegador"}</span>
          </button>

          <button
            type="button"
            onClick={handleProbarEnEsteDispositivo}
            className="bg-[#1e293b] hover:bg-[#334155] text-slate-300 hover:text-white border border-white/10 font-bold text-xs px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Prueba local directa de navegador"
          >
            <span>🧪</span>
            <span>Test Local</span>
          </button>
        </div>
      </div>

      {/* Alerta didáctica si aún no hay terminales registradas */}
      {totalSuscripciones === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200 shadow-md">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">⚠️</span>
            <div>
              <h4 className="font-extrabold text-amber-300 uppercase tracking-wider text-[11px]">
                Aún no hay ningún dispositivo suscrito en la base de datos
              </h4>
              <p className="mt-0.5 text-slate-300 leading-relaxed">
                El motor Web Push está activo, pero como no hay dispositivos registrados todavía, las notificaciones emitidas no tienen a quién llegar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSuscribirYProbarEsteDispositivo}
            disabled={suscribiendo}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
          >
            <span>🔔</span>
            <span>{suscribiendo ? "Conectando..." : "Suscribir mi Pantalla Ahora"}</span>
          </button>
        </div>
      )}

      {/* Reglas de Precaución y Filtros Inteligentes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#151f2e] border border-emerald-500/30 rounded-2xl p-4 shadow-lg flex items-start gap-3">
          <span className="text-3xl">🛡️</span>
          <div>
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <span>Filtro de Descargas Activo</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Garantizado
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Cuando el cliente descarga o instala la App en su teléfono, el sistema <strong>no vuelve a enviar mensajes de descarga</strong> ni muestra banners invasivos.
            </p>
          </div>
        </div>

        <div className="bg-[#151f2e] border border-emerald-500/30 rounded-2xl p-4 shadow-lg flex items-start gap-3">
          <span className="text-3xl">🔕</span>
          <div>
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <span>Filtro de Permisos Activo</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Garantizado
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Si el cliente ya aceptó las notificaciones, <strong>no se le vuelve a enviar el mensaje de solicitud</strong>. Solo se solicita a quienes aún no las aceptaron o no las tienen.
            </p>
          </div>
        </div>
      </div>

      {/* Formulario para Componer y Emitir Notificación Push */}
      <div ref={formRef} className="bg-[#151f2e] border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📢</span>
            <h3 className="text-base font-black text-white">Componer Nueva Notificación Push</h3>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            Web Push v2.0
          </span>
        </div>

        {/* Sección de Plantillas Guardadas */}
        {plantillas && plantillas.length > 0 && (
          <div className="bg-[#0d141e] border border-white/10 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>📑</span>
                <span>Plantillas Guardadas ({plantillas.length}) - Clic para usar en formulario:</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setFormTitulo("¡Bienvenido a 0600Boston, {nombre}! 🍕🍀");
                  setFormMensaje("Hola {nombre}, gracias por sumarte a nuestra App. Mirá las pizzas artesanales y promos con descuento para vos hoy.");
                  setFormUrl("/menu");
                  setFormIcono("🍀");
                  setFormDestinatarios("Todos los Clientes");
                  formRef.current?.scrollIntoView({ behavior: "smooth" });
                  onMostrarNotificacion("Notificación de Bienvenida {nombre} cargada en el formulario", "exito");
                }}
                className="text-[10px] text-emerald-300 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-2 py-0.5 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1"
                title="Cargar notificación de bienvenida con {nombre} en el formulario"
              >
                <span>✨</span>
                <span>Cargar Bienvenida &#123;nombre&#125;</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {plantillas.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="inline-flex items-center gap-1.5 bg-[#151f2e] hover:bg-emerald-950/50 border border-white/10 hover:border-emerald-400/60 pl-2.5 pr-1.5 py-1 rounded-xl text-xs text-white transition-all shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => handleCargarPlantilla(tmpl)}
                    title="Cargar esta plantilla en el formulario"
                    className="flex items-center gap-1.5 font-bold text-left cursor-pointer"
                  >
                    <span>{tmpl.icono?.startsWith("/") || tmpl.icono?.startsWith("http") ? "🖼️" : tmpl.icono}</span>
                    <span className="text-[11px] text-slate-200">{tmpl.nombre || tmpl.titulo}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminarPlantilla(tmpl.id)}
                    title="Eliminar plantilla"
                    className="text-slate-400 hover:text-red-400 text-xs px-1 hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleEnviarPush} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <label className="text-[11px] font-bold uppercase text-emerald-400">
                  Título del Mensaje
                </label>
                <span className="text-[10px] text-slate-400">
                  Clic para insertar emoji o etiqueta:
                </span>
              </div>

              {/* Barra de Emojis y Etiquetas Rápidas para el Título */}
              <div className="flex items-center gap-1 mb-2 flex-wrap bg-[#0d141e]/80 p-1.5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => insertarEmojiEnTitulo("{nombre}")}
                  className="h-7 px-2.5 bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/50 rounded-lg text-xs font-black text-emerald-300 flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-sm hover:scale-105"
                  title="Insertar etiqueta dinámica {nombre} en el título"
                >
                  <span>🏷️</span>
                  <span>+ &#123;nombre&#125;</span>
                </button>
                {["🔥", "🍕", "🍀", "🎁", "🛵", "🥤", "⭐", "🎉", "🤤", "🧀", "💥", "⏰", "🏷️", "🤑", "🚨", "✨"].map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => insertarEmojiEnTitulo(em)}
                    className="w-7 h-7 bg-[#151f2e] hover:bg-emerald-500/25 border border-white/10 hover:border-emerald-400/50 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm hover:scale-110"
                    title={`Insertar ${em} en el título`}
                  >
                    {em}
                  </button>
                ))}
              </div>

              <input
                ref={tituloInputRef}
                type="text"
                required
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
                placeholder="Ej: 🔥 ¡20% OFF en Pizza Napolitana Grande!"
                className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase text-emerald-400">
                  Icono / Emoji
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={subiendoIcono}
                  className="text-[10px] font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span>🖼️</span>
                  <span>{subiendoIcono ? "Procesando..." : "Subir Imagen / Icono"}</span>
                </button>
              </div>

              {/* Input oculto para subir icono */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/webp,image/jpeg,image/svg+xml"
                onChange={handleSubirIcono}
                className="hidden"
              />

              {/* Presets rápidos con Trébol de 4 Hojas */}
              <div className="flex gap-1 mb-2 flex-wrap">
                {["🍕", "🔥", "🍀", "🎁", "🛵", "🥤", "⭐", "🎉"].map((ico) => (
                  <button
                    key={ico}
                    type="button"
                    onClick={() => setFormIcono(ico)}
                    className={`px-2.5 py-1 rounded-xl text-sm transition-all border cursor-pointer ${
                      formIcono === ico
                        ? "bg-emerald-500/30 border-emerald-400 text-white"
                        : "bg-[#0d141e] border-white/10 hover:border-white/20 text-slate-300"
                    }`}
                  >
                    {ico}
                  </button>
                ))}
              </div>

              {/* Input para Emoji personalizado o URL de icono */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#0d141e] border border-white/15 flex items-center justify-center shrink-0 overflow-hidden text-lg">
                  {formIcono.startsWith("http") || formIcono.startsWith("/") ? (
                    <img src={formIcono} alt="Icono" className="w-full h-full object-contain p-0.5" />
                  ) : (
                    formIcono
                  )}
                </div>
                <input
                  type="text"
                  value={formIcono}
                  onChange={(e) => setFormIcono(e.target.value)}
                  placeholder="Emoji o /ruta/icono.png"
                  className="flex-1 bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Tarjeta de Especificaciones y Requisitos de Iconos Push */}
          <div className="bg-[#0d141e]/80 border border-emerald-500/30 rounded-2xl p-3.5 text-xs">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-[11px] uppercase tracking-wide mb-1.5">
              <span>ℹ️</span>
              <span>Requisitos para Iconos de Notificaciones Push (Web Push Standard):</span>
            </div>
            <ul className="text-slate-300 text-[11px] space-y-1 list-disc list-inside">
              <li><strong className="text-white">Formatos admitidos:</strong> .png, .webp, .jpg o .svg. (Recomendado: <em>PNG transparente</em> o <em>WebP</em>).</li>
              <li><strong className="text-white">Proporción recomendada:</strong> Cuadrada 1:1. Tamaño óptimo: <strong>192 × 192 px</strong> o <strong>512 × 512 px</strong>.</li>
              <li><strong className="text-white">Peso máximo:</strong> Menos de 1 MB (el sistema optimiza y reduce automáticamente a &lt; 50 KB).</li>
              <li><strong className="text-white">Conversor automático:</strong> Al subir cualquier imagen o logo, el sistema recorta bordes vacíos y elimina fondos sólidos automáticamente para adaptarlo a icono web push.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label className="text-[11px] font-bold uppercase text-emerald-400">
                Cuerpo del Mensaje (Texto que verá el cliente en su pantalla o celular)
              </label>
              <span className="text-[10px] text-slate-400">
                Clic para insertar emoji o etiqueta:
              </span>
            </div>

            {/* Barra de Emojis y Etiquetas Rápidas para el Cuerpo del Mensaje */}
            <div className="flex items-center gap-1 mb-2 flex-wrap bg-[#0d141e]/80 p-1.5 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => insertarEmojiEnMensaje("{nombre}")}
                className="h-7 px-2.5 bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/50 rounded-lg text-xs font-black text-emerald-300 flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-sm hover:scale-105"
                title="Insertar etiqueta dinámica {nombre} en el mensaje"
              >
                <span>🏷️</span>
                <span>+ &#123;nombre&#125;</span>
              </button>
              {["🍕", "🔥", "🤤", "🧀", "🎁", "🛵", "🥤", "🎉", "⭐", "💥", "⏰", "🏷️", "💸", "🍀", "😋", "📦", "⚡", "❤️", "🍔", "🍟", "🍺", "👋"].map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => insertarEmojiEnMensaje(em)}
                  className="w-7 h-7 bg-[#151f2e] hover:bg-emerald-500/25 border border-white/10 hover:border-emerald-400/50 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm hover:scale-110"
                  title={`Insertar ${em} en el mensaje`}
                >
                  {em}
                </button>
              ))}
            </div>

            <textarea
              ref={mensajeTextareaRef}
              rows={2}
              required
              value={formMensaje}
              onChange={(e) => setFormMensaje(e.target.value)}
              placeholder="Ej: Hola {nombre}, gracias por sumarte a nuestra App. Mirá las pizzas y combos con descuento para vos hoy."
              className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 leading-relaxed"
            />

            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
              <span>💡</span>
              <span>
                <strong>Personalización dinámica:</strong> Podés usar la etiqueta <strong className="text-white font-mono">&#123;nombre&#125;</strong> tanto en el título como en el cuerpo del mensaje. Cada cliente recibirá su nombre real (ej: <em>&quot;Juan&quot;</em>), o <em>&quot;amigo&quot;</em> si visita la web sin cuenta.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                Página de Destino al Tocar la Notificación
              </label>
              <select
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="/menu">Ver Menú y Pizzas (/menu)</option>
                <option value="/bebidas">Ver Bebidas (/bebidas)</option>
                <option value="/carrito">Ir al Carrito (/carrito)</option>
                <option value="/">Portada (/)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                Destinatarios
              </label>
              <select
                value={formDestinatarios}
                onChange={(e) => setFormDestinatarios(e.target.value)}
                className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="Todos los Clientes">Todos los Clientes Suscritos</option>
                <option value="Clientes con App Instalada">Solo Clientes con App Instalada</option>
                <option value="Nuevos Clientes">Nuevos Clientes Registrados</option>
              </select>
            </div>
          </div>

          {/* Vista previa simulada de cómo se ve en el celular */}
          {(() => {
            const tieneNombre =
              formTitulo.includes("{nombre}") ||
              formMensaje.includes("{nombre}") ||
              formTitulo.includes("[nombre]") ||
              formMensaje.includes("[nombre]");
            const tituloPreview = formTitulo
              .replace(/\{nombre\}/gi, "Juan")
              .replace(/\[nombre\]/gi, "Juan");
            const mensajePreview = formMensaje
              .replace(/\{nombre\}/gi, "Juan")
              .replace(/\[nombre\]/gi, "Juan");

            return (
              <div className="bg-[#0d141e] border border-white/10 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Vista previa en pantalla del cliente:
                  </span>
                  {tieneNombre && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <span>🏷️</span>
                      <span>Simulando etiqueta &#123;nombre&#125; con cliente &quot;Juan&quot;</span>
                    </span>
                  )}
                </div>
                <div className="bg-[#182333] border border-emerald-500/30 rounded-xl p-3 flex items-start gap-3 shadow-md max-w-md">
                  <div className="w-10 h-10 rounded-xl bg-[#0d141e] border border-emerald-400 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                    {formIcono.startsWith("http") || formIcono.startsWith("/") ? (
                      <img src={formIcono} alt="Icono Preview" className="w-full h-full object-contain p-0.5" />
                    ) : (
                      <span>{formIcono}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-emerald-400 font-bold">0600Boston • Ahora</span>
                    </div>
                    <h5 className="font-extrabold text-white text-xs truncate mt-0.5">{tituloPreview}</h5>
                    <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-snug">
                      {mensajePreview}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="flex justify-end items-center gap-2.5 pt-2 border-t border-white/10 flex-wrap">
            <button
              type="button"
              onClick={handleGuardarPlantilla}
              disabled={guardandoPlantilla}
              className="bg-[#1e293b] hover:bg-[#334155] text-emerald-400 hover:text-white border border-emerald-500/40 font-black text-xs px-5 py-3 rounded-2xl shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>💾</span>
              <span>{guardandoPlantilla ? "Guardando..." : "Guardar como Plantilla"}</span>
            </button>

            <button
              type="submit"
              disabled={enviando}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-6 py-3 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{enviando ? "Emitiendo push..." : "🚀 Enviar Notificación Push"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Historial de Últimas 3 Notificaciones Push Guardadas */}
      <div className="bg-[#151f2e] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>📋</span>
              <span>Últimas 3 Notificaciones Push Guardadas</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Se almacenan las 3 emisiones más recientes con opción de cargarlas en el formulario y reutilizarlas.
            </p>
          </div>
          <button
            type="button"
            onClick={cargarHistorial}
            disabled={cargando}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
          >
            {cargando ? "Actualizando..." : "🔄 Actualizar"}
          </button>
        </div>

        <div className="space-y-3">
          {historial.map((push) => (
            <div
              key={push.id}
              className="bg-[#0d141e] border border-white/5 hover:border-emerald-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {push.icono?.startsWith("http") || push.icono?.startsWith("/") ? (
                  <div className="w-10 h-10 p-1 bg-[#151f2e] border border-white/10 rounded-xl shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={push.icono} alt="Icono" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <span className="text-2xl p-2 bg-[#151f2e] border border-white/10 rounded-xl shrink-0">
                    {push.icono}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-white text-sm truncate">{push.titulo}</h4>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                      {push.estado}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{push.mensaje}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-2 font-mono flex-wrap">
                    <span>📅 {new Date(push.fecha).toLocaleString("es-AR")}</span>
                    <span>👥 {push.destinatarios}</span>
                    <span>🔗 Destino: {push.url}</span>
                  </div>
                </div>
              </div>

              {/* Botón Editar / Usar nuevamente */}
              <button
                type="button"
                onClick={() => handleCargarNotificacion(push)}
                className="w-full md:w-auto shrink-0 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 font-extrabold text-xs px-4 py-2.5 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:brightness-110"
              >
                <span>✏️</span>
                <span>Editar / Usar nuevamente</span>
              </button>
            </div>
          ))}

          {historial.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs italic">
              Aún no se han enviado notificaciones push.
            </div>
          )}
        </div>
      </div>

      {/* Lista de Dispositivos y Clientes Suscritos en Tiempo Real */}
      <div className="bg-[#151f2e] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>📱</span>
              <span>Dispositivos Conectados en Tiempo Real ({suscripcionesList.length})</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Terminales y celulares que tienen permisos activos y recibirán tus mensajes push.
            </p>
          </div>
          <button
            type="button"
            onClick={cargarHistorial}
            disabled={cargando}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
          >
            {cargando ? "Actualizando..." : "🔄 Refrescar lista"}
          </button>
        </div>

        {suscripcionesList.length === 0 ? (
          <div className="bg-[#0d141e] border border-dashed border-white/10 rounded-2xl p-6 text-center text-slate-400 text-xs">
            <span className="text-2xl block mb-1">📭</span>
            Aún no hay terminales registradas. Conecta tu pantalla con el botón verde de arriba o invita a tus clientes a activar notificaciones.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {suscripcionesList.map((sub, idx) => {
              const info = parseDispositivo(sub.userAgent);
              return (
                <div
                  key={sub.id || idx}
                  className="bg-[#0d141e] border border-white/10 hover:border-emerald-500/30 rounded-2xl p-3.5 space-y-2 shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{info.icono}</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Listo</span>
                    </span>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-white text-xs truncate">
                      {sub.clienteNombre || "Cliente / Visitante Web"}
                    </h5>
                    {sub.clienteUsuario && (
                      <p className="text-[10px] text-emerald-400 font-mono">@{sub.clienteUsuario}</p>
                    )}
                    <p className="text-[11px] text-slate-300 mt-0.5">{info.nombre}</p>
                  </div>
                  <div className="pt-2 border-t border-white/5 text-[10px] text-slate-500 font-mono">
                    Conectado: {sub.created_at ? new Date(sub.created_at).toLocaleString("es-AR") : "Reciente"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
