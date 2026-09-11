// client/src/modules/inventario/services/articulo.service.ts

// 1. AQUÍ ESTÁ LA IMPORTACIÓN (Agregamos ICrearArticuloDTO al final)
import type { IArticulo, IActualizarArticuloDTO, ICrearArticuloDTO } from '@erp/contracts';

const API_URL = 'http://localhost:3000/api/inventario/articulos';

export const articuloService = {
  
  // 2. AQUÍ AGREGAMOS LA FUNCIÓN CREAR AL INICIO DEL OBJETO
  crear: async (datos: ICrearArticuloDTO): Promise<void> => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Error al crear el artículo');
    }
  },

  // Los métodos que ya tenías...
  obtenerTodos: async (): Promise<IArticulo[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error al cargar los artículos');
    return response.json();
  },

  actualizarDescripcion: async (codigo: string, datos: IActualizarArticuloDTO): Promise<void> => {
    const response = await fetch(`${API_URL}/${codigo}/descripcion`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    if (!response.ok) throw new Error('Error al actualizar el artículo');
  },

  eliminar: async (codigo: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${codigo}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar el artículo');
  }
};
