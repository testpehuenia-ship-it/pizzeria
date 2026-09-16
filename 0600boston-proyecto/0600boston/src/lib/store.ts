import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { PizzaDataType, BebidaDataType, AderezoDataType } from "./data";
import { ComboDataType } from "./catalog-db";

export interface ItemCarritoPizza {
  pizza: PizzaDataType;
  tamaño: "4" | "8";
  aderezos: string[];
  precio: number;
}

export interface ItemCarritoBebida {
  bebida: BebidaDataType;
  cantidad: number;
  precioUnitario: number;
}

export interface ItemCarritoCombo {
  combo: ComboDataType;
  cantidad: number;
  precioUnitario: number;
  aderezosPersonalizados?: string[];
}

export interface Cliente {
  id?: string;
  nombre: string;
  apellido: string;
  usuario: string;
  telefono: string;
  direccion: string;
  barrio: string;
  domicilio?: string;
}

interface EstadoTienda {
  cliente: Cliente | null;
  pizzas: ItemCarritoPizza[];
  bebidas: ItemCarritoBebida[];
  combos: ItemCarritoCombo[];
  tipoEntrega: "delivery" | "retiro";
  domicilioEntrega: string;
  
  // Acciones
  setCliente: (cliente: Cliente) => void;
  cerrarSesion: () => void;
  setTipoEntrega: (tipo: "delivery" | "retiro") => void;
  setDomicilioEntrega: (domicilio: string) => void;
  agregarPizza: (pizza: PizzaDataType, tamaño: "4" | "8", aderezos: string[]) => void;
  quitarPizza: (indice: number) => void;
  agregarBebida: (bebida: BebidaDataType) => void;
  quitarBebida: (bebidaId: string) => void;
  agregarCombo: (combo: ComboDataType, aderezos?: string[]) => void;
  quitarCombo: (comboId: string) => void;
  vaciarCarrito: () => void;
  calcularTotal: () => number;
}

export const useTiendaStore = create<EstadoTienda>()(
  persist(
    (set, get) => ({
      cliente: null,
      pizzas: [],
      bebidas: [],
      combos: [],
      tipoEntrega: "delivery",
      domicilioEntrega: "",

      setCliente: (cliente) => {
        const dir = cliente.direccion + (cliente.barrio ? ` (${cliente.barrio})` : "");
        set({ cliente: { ...cliente, domicilio: dir }, domicilioEntrega: dir });
      },
      cerrarSesion: () => set({ cliente: null, domicilioEntrega: "" }),
      setTipoEntrega: (tipoEntrega) => set({ tipoEntrega }),
      setDomicilioEntrega: (domicilioEntrega) => set({ domicilioEntrega }),

      agregarPizza: (pizza, tamaño, aderezos) => {
        const precio =
          tamaño === "4"
            ? (pizza.precio4 ?? (pizza as any).precios?.porcion4 ?? 0)
            : (pizza.precio8 ?? (pizza as any).precios?.porcion8 ?? 0);
        set((state) => ({
          pizzas: [
            ...state.pizzas,
            { pizza, tamaño, aderezos, precio: Number(precio) || 0 },
          ],
        }));
      },

      quitarPizza: (indice) => {
        set((state) => ({
          pizzas: state.pizzas.filter((_, idx) => idx !== indice),
        }));
      },

      agregarBebida: (bebida) => {
        set((state) => {
          const existe = state.bebidas.find((b) => b.bebida.id === bebida.id);
          if (existe) {
            return {
              bebidas: state.bebidas.map((b) =>
                b.bebida.id === bebida.id
                  ? { ...b, cantidad: b.cantidad + 1 }
                  : b
              ),
            };
          }
          return {
            bebidas: [
              ...state.bebidas,
              { bebida, cantidad: 1, precioUnitario: bebida.precio },
            ],
          };
        });
      },

      quitarBebida: (bebidaId) => {
        set((state) => ({
          bebidas: state.bebidas
            .map((b) =>
              b.bebida.id === bebidaId ? { ...b, cantidad: b.cantidad - 1 } : b
            )
            .filter((b) => b.cantidad > 0),
        }));
      },

      agregarCombo: (combo, aderezosPersonalizados = []) => {
        set((state) => {
          const existe = state.combos.find((c) => c.combo.id === combo.id);
          if (existe) {
            return {
              combos: state.combos.map((c) =>
                c.combo.id === combo.id
                  ? { ...c, cantidad: c.cantidad + 1 }
                  : c
              ),
            };
          }
          return {
            combos: [
              ...state.combos,
              {
                combo,
                cantidad: 1,
                precioUnitario: combo.precio,
                aderezosPersonalizados,
              },
            ],
          };
        });
      },

      quitarCombo: (comboId) => {
        set((state) => ({
          combos: state.combos
            .map((c) =>
              c.combo.id === comboId ? { ...c, cantidad: c.cantidad - 1 } : c
            )
            .filter((c) => c.cantidad > 0),
        }));
      },

      vaciarCarrito: () => set({ pizzas: [], bebidas: [], combos: [] }),

      calcularTotal: () => {
        const state = get();
        const totalPizzas = (state.pizzas || []).reduce(
          (acc, p) => acc + (Number(p.precio) || 0),
          0
        );
        const totalBebidas = (state.bebidas || []).reduce(
          (acc, b) =>
            acc + (Number(b.precioUnitario) || 0) * (Number(b.cantidad) || 1),
          0
        );
        const totalCombos = (state.combos || []).reduce(
          (acc, c) =>
            acc +
            (Number(c.precioUnitario || c.combo?.precio) || 0) *
              (Number(c.cantidad) || 1),
          0
        );
        return totalPizzas + totalBebidas + totalCombos;
      },
    }),
    {
      name: "0600boston-store",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
    }
  )
);
