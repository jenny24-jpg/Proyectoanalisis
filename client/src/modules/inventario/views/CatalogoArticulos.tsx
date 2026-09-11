import React, { useEffect, useState } from 'react';
import { Pencil, Trash2, Package, Plus, X } from 'lucide-react';
import { articuloService } from '../services/articulo.service';
import type { IArticulo, ICrearArticuloDTO } from '@erp/contracts';

export const CatalogoArticulos = () => {
  const [articulos, setArticulos] = useState<IArticulo[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Estados para el Modal de Crear
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoArticulo, setNuevoArticulo] = useState<ICrearArticuloDTO>({
    ART_CODIGO_ARTICULO: '',
    ART_DESCRIPCION: '',
    ART_ID_CATEGORIA: 1, // Por defecto usamos el ID 1 para evitar errores de llave foránea
    ART_ID_MARCA: 1,
    ART_ID_UNIDAD_COMPRA: 1,
    ART_ID_UNIDAD_VENTA: 1,
    ART_MANEJA_LOTE: 0,
  });

  const cargarArticulos = async () => {
    try {
      const data = await articuloService.obtenerTodos();
      setArticulos(data);
    } catch (error) {
      console.error(error);
      alert('Hubo un problema al cargar los datos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarArticulos();
  }, []);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await articuloService.crear(nuevoArticulo);
      setMostrarModal(false);
      setNuevoArticulo({ ...nuevoArticulo, ART_CODIGO_ARTICULO: '', ART_DESCRIPCION: '' }); // Limpiar
      await cargarArticulos();
    } catch (error: any) {
      alert(error.message || 'Error al crear.');
    }
  };

  const handleActualizar = async (codigo: string, descripcionActual: string) => {
    const nuevaDescripcion = prompt('Editar descripción del artículo:', descripcionActual);
    if (nuevaDescripcion && nuevaDescripcion !== descripcionActual) {
      try {
        await articuloService.actualizarDescripcion(codigo, { ART_DESCRIPCION: nuevaDescripcion });
        await cargarArticulos();
      } catch (error) {
        alert('Error al actualizar.');
      }
    }
  };

  const handleEliminar = async (codigo: string) => {
    const confirmar = window.confirm(`¿Estás seguro de eliminar el artículo ${codigo}?`);
    if (confirmar) {
      try {
        await articuloService.eliminar(codigo);
        await cargarArticulos();
      } catch (error) {
        alert('Error al eliminar.');
      }
    }
  };

  if (cargando) return <div className="p-8 text-center text-gray-500">Cargando catálogo...</div>;

  return (
    <div className="space-y-6 relative">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Catálogo de Artículos
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de descripciones y estado del inventario</p>
        </div>
        <button 
          onClick={() => setMostrarModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Nuevo Artículo
        </button>
      </div>

      {/* Modal de Creación */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Agregar Nuevo Artículo</h2>
              <button onClick={() => setMostrarModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCrear} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                <input 
                  required
                  type="text" 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="Ej. ART-0010"
                  value={nuevoArticulo.ART_CODIGO_ARTICULO}
                  onChange={(e) => setNuevoArticulo({...nuevoArticulo, ART_CODIGO_ARTICULO: e.target.value.toUpperCase()})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input 
                  required
                  type="text" 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="Descripción del producto"
                  value={nuevoArticulo.ART_DESCRIPCION}
                  onChange={(e) => setNuevoArticulo({...nuevoArticulo, ART_DESCRIPCION: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="lote"
                  checked={nuevoArticulo.ART_MANEJA_LOTE === 1}
                  onChange={(e) => setNuevoArticulo({...nuevoArticulo, ART_MANEJA_LOTE: e.target.checked ? 1 : 0})}
                />
                <label htmlFor="lote" className="text-sm text-gray-700">Maneja Lote de Vencimiento</label>
              </div>
              
              <div className="pt-4 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de Datos */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="px-6 py-3 font-medium">Código</th>
              <th className="px-6 py-3 font-medium">Descripción</th>
              <th className="px-6 py-3 font-medium">Existencias</th>
              <th className="px-6 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {articulos.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                  No hay artículos registrados.
                </td>
              </tr>
            ) : (
              articulos.map((art) => (
                <tr key={art.ART_CODIGO_ARTICULO} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{art.ART_CODIGO_ARTICULO}</td>
                  <td className="px-6 py-4 text-gray-600">{art.ART_DESCRIPCION}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${(art.STOCK_TOTAL || 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {art.STOCK_TOTAL || 0} Unds.
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => handleActualizar(art.ART_CODIGO_ARTICULO, art.ART_DESCRIPCION)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleEliminar(art.ART_CODIGO_ARTICULO)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
