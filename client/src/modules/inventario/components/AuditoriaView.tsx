import React, { useState, useEffect } from 'react';
import { ClipboardList, Play, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui';
import { TomaFisicaClientService } from '../services/tomaFisicaClientService';
import { ITomaFisicaResponseDTO, IDetalleConteoDTO } from '@erp/contracts';

const MOCK_BODEGAS = [
  { id: 1, nombre: 'Bodega Principal Central' },
  { id: 2, nombre: 'Bodega Secundaria Norte' }
];

export const AuditoriaView: React.FC = () => {
  const [bodegaActiva, setBodegaActiva] = useState<number>(MOCK_BODEGAS[0].id);
  const [tomaActiva, setTomaActiva] = useState<ITomaFisicaResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conteos, setConteos] = useState<Record<string, number | ''>>({});

  useEffect(() => {
    cargarTomaActiva();
  }, [bodegaActiva]);

  const cargarTomaActiva = async () => {
    setIsLoading(true);
    try {
      const toma = await TomaFisicaClientService.getActiva(bodegaActiva);
      setTomaActiva(toma);
      if (toma) {
        // Inicializar el estado de conteos con el valor físico. 
        // Nota: Oracle no permite NULL, guardamos 0 y diferencia 0 como "no contado".
        const initConteos: Record<string, number | ''> = {};
        toma.detalles.forEach(d => {
          if (d.stockFisico === 0 && d.diferencia === 0) {
            initConteos[d.codigoArticulo] = '';
          } else {
            initConteos[d.codigoArticulo] = d.stockFisico !== null ? d.stockFisico : '';
          }
        });
        setConteos(initConteos);
      } else {
        setConteos({});
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAperturar = async () => {
    setIsLoading(true);
    try {
      await TomaFisicaClientService.aperturar({ idBodega: bodegaActiva, idUsuario: 3 }); // Usuario quemado para prueba
      await cargarTomaActiva();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuardar = async () => {
    if (!tomaActiva) return;

    // Construir DTO filtrando los que no han sido contados (dejados en vacío)
    const detallesConteo: IDetalleConteoDTO[] = [];
    tomaActiva.detalles.forEach(d => {
      const fisico = conteos[d.codigoArticulo];
      if (fisico !== '') {
        detallesConteo.push({
          codigoArticulo: d.codigoArticulo,
          stockFisico: Number(fisico)
        });
      }
    });

    if (detallesConteo.length === 0) {
      alert('Debe registrar al menos un conteo físico antes de guardar.');
      return;
    }

    if (detallesConteo.length < tomaActiva.detalles.length) {
      const confirmar = window.confirm('Hay artículos sin contar. Si guarda ahora, la auditoría se cerrará. ¿Desea continuar?');
      if (!confirmar) return;
    }

    setIsLoading(true);
    try {
      await TomaFisicaClientService.guardarConteo(tomaActiva.idToma, {
        idToma: tomaActiva.idToma,
        idUsuario: 3,
        detalles: detallesConteo
      });
      alert('Auditoría guardada y cerrada exitosamente.');
      await cargarTomaActiva(); // Recargará y dará null
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getRowClass = (teorico: number, fisico: number | '') => {
    if (fisico === '') return 'bg-white';
    if (fisico < teorico) return 'bg-red-50'; // Faltante
    if (fisico > teorico) return 'bg-green-50'; // Sobrante
    return 'bg-white';
  };

  const getDiferenciaVisual = (teorico: number, fisico: number | '') => {
    if (fisico === '') return <span className="text-slate-300">-</span>;
    const diff = Number(fisico) - teorico;
    if (diff < 0) return <span className="text-red-600 font-bold flex items-center justify-center gap-1"><AlertTriangle size={14}/> {diff}</span>;
    if (diff > 0) return <span className="text-green-600 font-bold">+{diff}</span>;
    return <span className="text-slate-400 font-semibold flex items-center justify-center gap-1"><CheckCircle size={14}/> 0</span>;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 mt-4">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <ClipboardList className="text-indigo-600" size={28} />
          Auditoría de Inventario (Toma Física)
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Realice conteos físicos para detectar diferencias contra el sistema.
        </p>
      </div>

      {!tomaActiva ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6">
            <ClipboardList size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Preparar nueva Auditoría</h3>
          <p className="text-slate-500 max-w-md mb-8">
            Selecciona la bodega que deseas auditar. Al iniciar, el sistema tomará una "fotografía" del stock actual para que puedas compararlo con tu conteo físico.
          </p>
          
          <div className="flex flex-col items-start bg-slate-50 p-6 rounded-xl border border-slate-200 w-full max-w-md mb-8">
            <label className="text-sm font-bold text-slate-700 mb-2 w-full text-left">Bodega a auditar:</label>
            <select 
              className="w-full h-11 px-4 border border-slate-300 rounded-lg bg-white text-base focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all cursor-pointer"
              value={bodegaActiva}
              onChange={(e) => setBodegaActiva(Number(e.target.value))}
            >
              {MOCK_BODEGAS.map(b => (
                <option key={b.id} value={b.id}>{b.nombre}</option>
              ))}
            </select>
          </div>

          <Button variant="primary" className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3 text-lg" icon={Play} onClick={handleAperturar} disabled={isLoading}>
            {isLoading ? 'Iniciando Auditoría...' : 'Iniciar Toma Física'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
            <div>
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Auditoría en Progreso</span>
              <h4 className="text-lg font-semibold text-indigo-900">{tomaActiva.numeroToma}</h4>
            </div>
            <Button variant="primary" className="bg-indigo-600 hover:bg-indigo-700" icon={Save} onClick={handleGuardar} disabled={isLoading}>
              Guardar y Cerrar Auditoría
            </Button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="p-4 font-semibold">Código</th>
                  <th className="p-4 font-semibold">Artículo</th>
                  <th className="p-4 font-semibold text-center bg-slate-100">Stock Teórico<br/><span className="text-[10px] font-normal">(Sistema)</span></th>
                  <th className="p-4 font-semibold text-center bg-indigo-50 text-indigo-700">Stock Físico<br/><span className="text-[10px] font-normal">(Conteo Real)</span></th>
                  <th className="p-4 font-semibold text-center">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tomaActiva.detalles.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">No hay artículos en esta bodega para contar.</td></tr>
                )}
                {tomaActiva.detalles.map(d => {
                  const fisico = conteos[d.codigoArticulo];
                  return (
                    <tr key={d.codigoArticulo} className={`transition-colors ${getRowClass(d.stockTeorico, fisico)}`}>
                      <td className="p-4 text-sm font-medium text-slate-700">{d.codigoArticulo}</td>
                      <td className="p-4 text-sm text-slate-600">{d.nombreArticulo}</td>
                      <td className="p-4 text-sm font-bold text-slate-800 text-center bg-slate-50/50">
                        {d.stockTeorico}
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="number"
                          min="0"
                          value={fisico}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseInt(e.target.value);
                            setConteos({ ...conteos, [d.codigoArticulo]: val });
                          }}
                          className="w-24 h-10 px-3 border-2 border-indigo-200 rounded-lg text-center font-bold text-indigo-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                          placeholder="-"
                        />
                      </td>
                      <td className="p-4 text-center">
                        {getDiferenciaVisual(d.stockTeorico, fisico)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
