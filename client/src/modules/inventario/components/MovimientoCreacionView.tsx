import React, { useState, useRef, useEffect } from 'react';
import { Package, Plus, Save, Trash2, AlertCircle, ChevronDown, Search, ArrowRightLeft, Printer } from 'lucide-react';
import { Button } from '../../../components/ui';
import { IMovimientoInventarioCreateDTO, IMovimientoInventarioDetalleCreateDTO } from '@erp/contracts';
import { MovimientoInventarioClientService } from '../services/movimientoInventarioClientService';

interface MovimientoCreacionViewProps {
  onSuccess?: () => void;
}

// === Mocks para los Selectores con Búsqueda ===
// Nota: La tabla CMP_BODEGA sí existe en la BD (datos_prueba.sql).
// Usaremos estos mocks mientras se conecta el fetch real.
const MOCK_USUARIOS = [
  { id: 1, nombre: 'Ana López - Compras' },
  { id: 2, nombre: 'Luis Ramírez - Compras' },
  { id: 3, nombre: 'Marta Girón - Bodega' },
];

const MOCK_ARTICULOS = [
  { codigo: 'ART-0001', nombre: 'Laptop HP ProBook' },
  { codigo: 'ART-0002', nombre: 'Mouse Inalámbrico Logitech' },
  { codigo: 'ART-0003', nombre: 'Teclado Mecánico Keychron' },
  { codigo: 'ART-0004', nombre: 'Monitor Dell 24"' },
  { codigo: 'ART-0005', nombre: 'Resma de Papel Tamaño Carta' },
];

const MOCK_BODEGAS = [
  { id: 1, nombre: 'Bodega Principal Central' },
  { id: 2, nombre: 'Bodega Secundaria Norte' }
];

// === Componente Auxiliar para Autocompletado ===
const AutocompleteSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  displayKey, 
  valueKey 
}: { 
  options: any[]; 
  value: any; 
  onChange: (val: any) => void; 
  placeholder: string;
  displayKey: string;
  valueKey: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt[valueKey] === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    String(opt[displayKey]).toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(opt[valueKey]).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchTerm('');
        }}
      >
        <span className={`text-sm truncate ${selectedOption ? 'text-slate-800' : 'text-slate-400'}`}>
          {selectedOption ? `${selectedOption[valueKey]} - ${selectedOption[displayKey]}` : placeholder}
        </span>
        <ChevronDown size={16} className="text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 text-slate-400">
            <Search size={16} />
            <input
              type="text"
              autoFocus
              className="w-full text-sm outline-none text-slate-800"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ul className="overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <li
                  key={opt[valueKey]}
                  className="px-3 py-2 text-sm text-slate-700 hover:bg-emerald-50 cursor-pointer"
                  onClick={() => {
                    onChange(opt[valueKey]);
                    setIsOpen(false);
                  }}
                >
                  <span className="font-medium text-slate-900 mr-2">{opt[valueKey]}</span>
                  {opt[displayKey]}
                </li>
              ))
            ) : (
              <li className="px-3 py-4 text-sm text-center text-slate-500">No se encontraron resultados</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export const MovimientoCreacionView: React.FC<MovimientoCreacionViewProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Guardamos la última solicitud procesada para poder imprimir el PDF
  const [ultimoMovimiento, setUltimoMovimiento] = useState<any>(null);

  // Form State (Master)
  const [idBodegaOrigen, setIdBodegaOrigen] = useState<number | ''>('');
  const [idBodegaDestino, setIdBodegaDestino] = useState<number | ''>('');
  const [idUsuario, setIdUsuario] = useState<number | ''>('');
  const [observaciones, setObservaciones] = useState('');

  // Form State (Details)
  const [detalles, setDetalles] = useState<IMovimientoInventarioDetalleCreateDTO[]>([
    { codigoArticulo: '', cantidad: 1 }
  ]);

  const handleAddDetalle = () => {
    setDetalles([...detalles, { codigoArticulo: '', cantidad: 1 }]);
  };

  const handleRemoveDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const handleChangeDetalle = (index: number, field: keyof IMovimientoInventarioDetalleCreateDTO, value: any) => {
    const newDetalles = [...detalles];
    newDetalles[index] = { ...newDetalles[index], [field]: value };
    setDetalles(newDetalles);
  };

  const handlePrintDespacho = (movimientoInfo: any) => {
    // Buscar los nombres reales para imprimir
    const usuarioInfo = MOCK_USUARIOS.find(u => u.id === idUsuario)?.nombre || 'Usuario Desconocido';
    const bodegaSalidaInfo = MOCK_BODEGAS.find(b => b.id === idBodegaOrigen)?.nombre || 'Bodega Desconocida';
    const bodegaEntradaInfo = MOCK_BODEGAS.find(b => b.id === idBodegaDestino)?.nombre || 'Bodega Desconocida';
    
    // Mapear detalles para tener el nombre del artículo
    const detallesImprimir = detalles.map(d => {
      const art = MOCK_ARTICULOS.find(a => a.codigo === d.codigoArticulo);
      return {
        codigo: d.codigoArticulo,
        nombre: art ? art.nombre : 'Artículo Desconocido',
        cantidad: d.cantidad
      };
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes (popups) para imprimir el despacho.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Despacho de Traslado - ${movimientoInfo.noMovimiento}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin: 0; }
          .doc-number { font-size: 14px; color: #666; margin-top: 5px; }
          .info-grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .info-box { border: 1px solid #ccc; padding: 15px; width: 45%; border-radius: 5px; }
          .info-box strong { display: block; margin-bottom: 5px; color: #000; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f4f4f4; font-weight: bold; }
          td.qty { text-align: center; font-weight: bold; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; }
          .signatures { display: flex; justify-content: space-around; margin-top: 60px; }
          .signature-line { border-top: 1px solid #000; width: 250px; text-align: center; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Nota de Despacho por Traslado</h1>
          <div class="doc-number">Documento: ${movimientoInfo.noMovimiento} | Fecha: ${new Date().toLocaleDateString()}</div>
        </div>
        
        <div class="info-grid">
          <div class="info-box">
            <strong>Solicitado por (Responsable):</strong>
            ${usuarioInfo}
          </div>
          <div class="info-box">
            <strong>Ruta de Traslado:</strong>
            De: ${bodegaSalidaInfo}<br>
            Para: ${bodegaEntradaInfo}
          </div>
        </div>

        ${observaciones ? `<p><strong>Observaciones:</strong> ${observaciones}</p>` : ''}

        <table>
          <thead>
            <tr>
              <th width="20%">Código</th>
              <th width="60%">Descripción del Artículo</th>
              <th width="20%" style="text-align:center;">Cant. Trasladada</th>
            </tr>
          </thead>
          <tbody>
            ${detallesImprimir.map(d => `
              <tr>
                <td>${d.codigo}</td>
                <td>${d.nombre}</td>
                <td class="qty">${d.cantidad}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="signatures">
          <div class="signature-line">
            Firma de Entrega (Bodega Salida)
          </div>
          <div class="signature-line">
            Firma de Recibido (Bodega Entrada)
          </div>
        </div>

        <div class="footer">
          Generado automáticamente por el ERP Universitario
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Esperar un momento a que renderice y llamar al diálogo de impresión del navegador
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setUltimoMovimiento(null);

    if (!idUsuario) return setErrorMsg('Seleccione un usuario responsable.'), setIsLoading(false);
    if (!idBodegaOrigen) return setErrorMsg('Seleccione la bodega de salida.'), setIsLoading(false);
    if (!idBodegaDestino) return setErrorMsg('Seleccione la bodega de entrada.'), setIsLoading(false);
    if (idBodegaOrigen === idBodegaDestino) return setErrorMsg('La bodega salida y entrada no pueden ser iguales.'), setIsLoading(false);

    const validDetalles = detalles.filter(d => d.codigoArticulo?.trim() !== '' && d.cantidad > 0);

    if (validDetalles.length === 0) {
      setErrorMsg('Debe seleccionar al menos un artículo válido con cantidad mayor a 0.');
      setIsLoading(false);
      return;
    }

    try {
      const payload: IMovimientoInventarioCreateDTO = {
        tipoMovimiento: 'TRF_SALIDA', // Se fuerza transferencia según el requerimiento
        idBodegaOrigen: Number(idBodegaOrigen),
        idBodegaDestino: Number(idBodegaDestino),
        idUsuario: Number(idUsuario),
        observaciones: observaciones.trim() || undefined,
        detalles: validDetalles
      };

      const res = await MovimientoInventarioClientService.crearMovimiento(payload);
      setSuccessMsg(`Traslado registrado exitosamente: ${res.noMovimiento}`);
      setUltimoMovimiento(res);

      // Lanzar la ventana de impresión automáticamente
      handlePrintDespacho(res);
      
      if (onSuccess) {
        setTimeout(() => onSuccess(), 3500); // Dar tiempo para imprimir antes de cambiar de tab
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Ocurrió un error al procesar el traslado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 mt-4">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <ArrowRightLeft className="text-emerald-600" size={28} />
          Traslado de Inventario
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Registre las transferencias de mercadería entre bodegas y genere la nota de despacho.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium flex items-center gap-2">
          <AlertCircle size={18} />
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            {successMsg}
          </div>
          {ultimoMovimiento && (
            <Button variant="secondary" size="sm" icon={Printer} onClick={() => handlePrintDespacho(ultimoMovimiento)}>
              Reimprimir Despacho
            </Button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        {/* Cabecera */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Bodega de Salida</label>
            <AutocompleteSelect 
              options={MOCK_BODEGAS}
              value={idBodegaOrigen}
              onChange={(val) => setIdBodegaOrigen(val)}
              placeholder="Seleccione bodega..."
              displayKey="nombre"
              valueKey="id"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block text-emerald-600">Bodega de Entrada</label>
            <AutocompleteSelect 
              options={MOCK_BODEGAS.filter(b => b.id !== idBodegaOrigen)}
              value={idBodegaDestino}
              onChange={(val) => setIdBodegaDestino(val)}
              placeholder="Seleccione bodega destino..."
              displayKey="nombre"
              valueKey="id"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Usuario Responsable</label>
            <AutocompleteSelect 
              options={MOCK_USUARIOS}
              value={idUsuario}
              onChange={(val) => setIdUsuario(val)}
              placeholder="Buscar responsable..."
              displayKey="nombre"
              valueKey="id"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Observaciones / Motivo</label>
            <input 
              type="text" 
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Motivo del traslado..."
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm"
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Detalles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Artículos a Trasladar</h3>
            <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={handleAddDetalle}>
              Agregar Artículo
            </Button>
          </div>

          <div className="overflow-x-visible">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Busca tu articulo</th>
                  <th className="pb-3 font-semibold w-32 text-center">Cantidad</th>
                  <th className="pb-3 font-semibold w-16 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detalles.map((detalle, index) => (
                  <tr key={index} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4 align-top pt-4">
                      <AutocompleteSelect 
                        options={MOCK_ARTICULOS}
                        value={detalle.codigoArticulo}
                        onChange={(val) => handleChangeDetalle(index, 'codigoArticulo', val)}
                        placeholder="Buscar artículo..."
                        displayKey="nombre"
                        valueKey="codigo"
                      />
                    </td>
                    <td className="py-3 px-2 align-top pt-4">
                      <input 
                        type="number" 
                        min="1"
                        value={detalle.cantidad}
                        onChange={(e) => handleChangeDetalle(index, 'cantidad', parseInt(e.target.value) || 1)}
                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 text-center focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        required
                      />
                    </td>
                    <td className="py-3 text-center align-top pt-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveDetalle(index)}
                        disabled={detalles.length === 1}
                        className="text-slate-400 hover:text-red-600 disabled:opacity-50 transition-colors p-2 rounded-lg hover:bg-red-50 mt-[-4px]"
                        title="Eliminar fila"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button 
            type="submit" 
            variant="primary" 
            icon={Printer} 
            disabled={isLoading}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? 'Procesando...' : 'Aplicar e Imprimir'}
          </Button>
        </div>
      </form>
    </div>
  );
};
