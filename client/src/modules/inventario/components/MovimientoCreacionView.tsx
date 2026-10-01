import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRightLeft,
  Plus,
  Search,
  Printer,
  RefreshCw,
  Warehouse,
  Package,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button, StatCard, DataTable, StatusBadge } from '../../../components/ui';
import type { IMovimientoInventarioCreateDTO } from '@erp/contracts';
import { BodegaClientService } from '../services/bodegaClientService';
import { articuloService } from '../services/articulo.service';
import { MovimientoModal } from './MovimientoModal';

export interface MovimientoRegistro {
  id: string;
  noMovimiento: string;
  tipoMovimiento: string;
  idBodegaOrigen: number;
  bodegaOrigenNombre: string;
  idBodegaDestino: number;
  bodegaDestinoNombre: string;
  idUsuario: number;
  usuarioNombre: string;
  fecha: string;
  observaciones?: string;
  totalItems: number;
  totalUnidades: number;
  detalles: {
    codigoArticulo: string;
    nombreArticulo?: string;
    cantidad: number;
  }[];
}

interface MovimientoCreacionViewProps {
  onSuccess?: () => void;
}

const DEFAULT_USUARIOS = [
  { id: 1, nombre: 'Ana López - Compras' },
  { id: 2, nombre: 'Luis Ramírez - Compras' },
  { id: 3, nombre: 'Marta Girón - Bodega' },
];

const INITIAL_MOCK_MOVIMIENTOS: MovimientoRegistro[] = [
  {
    id: 'mov-1',
    noMovimiento: 'MOV-2026-08124',
    tipoMovimiento: 'TRF_SALIDA',
    idBodegaOrigen: 1,
    bodegaOrigenNombre: 'Bodega Principal Central',
    idBodegaDestino: 2,
    bodegaDestinoNombre: 'Bodega Secundaria Norte',
    idUsuario: 1,
    usuarioNombre: 'Ana López - Compras',
    fecha: '11/09/2026, 10:15',
    observaciones: 'Reabastecimiento preventivo de equipos',
    totalItems: 2,
    totalUnidades: 15,
    detalles: [
      { codigoArticulo: 'ART-0001', nombreArticulo: 'Laptop HP ProBook', cantidad: 5 },
      { codigoArticulo: 'ART-0002', nombreArticulo: 'Mouse Inalámbrico Logitech', cantidad: 10 },
    ],
  },
  {
    id: 'mov-2',
    noMovimiento: 'MOV-2026-07950',
    tipoMovimiento: 'TRF_SALIDA',
    idBodegaOrigen: 2,
    bodegaOrigenNombre: 'Bodega Secundaria Norte',
    idBodegaDestino: 1,
    bodegaDestinoNombre: 'Bodega Principal Central',
    idUsuario: 3,
    usuarioNombre: 'Marta Girón - Bodega',
    fecha: '10/09/2026, 16:40',
    observaciones: 'Retorno de suministros de oficina',
    totalItems: 1,
    totalUnidades: 30,
    detalles: [
      { codigoArticulo: 'ART-0005', nombreArticulo: 'Resma de Papel Tamaño Carta', cantidad: 30 },
    ],
  },
  {
    id: 'mov-3',
    noMovimiento: 'MOV-2026-06811',
    tipoMovimiento: 'TRF_SALIDA',
    idBodegaOrigen: 1,
    bodegaOrigenNombre: 'Bodega Principal Central',
    idBodegaDestino: 2,
    bodegaDestinoNombre: 'Bodega Secundaria Norte',
    idUsuario: 2,
    usuarioNombre: 'Luis Ramírez - Compras',
    fecha: '09/09/2026, 09:20',
    observaciones: 'Distribución de periféricos de cómputo',
    totalItems: 2,
    totalUnidades: 18,
    detalles: [
      { codigoArticulo: 'ART-0003', nombreArticulo: 'Teclado Mecánico Keychron', cantidad: 8 },
      { codigoArticulo: 'ART-0004', nombreArticulo: 'Monitor Dell 24"', cantidad: 10 },
    ],
  },
];

export const MovimientoCreacionView: React.FC<MovimientoCreacionViewProps> = ({ onSuccess }) => {
  const [movimientos, setMovimientos] = useState<MovimientoRegistro[]>(() => {
    try {
      const saved = localStorage.getItem('erp_kardex_movimientos');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error reading saved movements:', e);
    }
    return INITIAL_MOCK_MOVIMIENTOS;
  });

  const [bodegas, setBodegas] = useState<{ id: number; nombre: string }[]>([
    { id: 1, nombre: 'Bodega Principal Central' },
    { id: 2, nombre: 'Bodega Secundaria Norte' },
  ]);

  const [articulos, setArticulos] = useState<{ codigo: string; nombre: string }[]>([
    { codigo: 'ART-0001', nombre: 'Laptop HP ProBook' },
    { codigo: 'ART-0002', nombre: 'Mouse Inalámbrico Logitech' },
    { codigo: 'ART-0003', nombre: 'Teclado Mecánico Keychron' },
    { codigo: 'ART-0004', nombre: 'Monitor Dell 24"' },
    { codigo: 'ART-0005', nombre: 'Resma de Papel Tamaño Carta' },
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterBodega, setFilterBodega] = useState<string>('TODAS');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [ultimoMovimientoImprimir, setUltimoMovimientoImprimir] = useState<any>(null);

  const loadDependencies = async () => {
    setIsLoading(true);
    try {
      const [bodegasData, articulosData] = await Promise.allSettled([
        BodegaClientService.getBodegas({ activo: 1 }),
        articuloService.obtenerTodos(),
      ]);

      if (bodegasData.status === 'fulfilled' && bodegasData.value.length > 0) {
        setBodegas(bodegasData.value.map(b => ({ id: b.bodIdBodega, nombre: b.bodNombre })));
      }

      if (articulosData.status === 'fulfilled' && articulosData.value.length > 0) {
        setArticulos(articulosData.value.map(a => ({ codigo: a.ART_CODIGO_ARTICULO, nombre: a.ART_DESCRIPCION })));
      }
    } catch (e) {
      console.error('[MovimientoCreacionView] Error cargando dependencias:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('erp_kardex_movimientos', JSON.stringify(movimientos));
    } catch (e) {
      console.warn('Error saving movements:', e);
    }
  }, [movimientos]);

  const handlePrintDespacho = (movimiento: MovimientoRegistro) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes (popups) para imprimir el despacho.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Despacho de Traslado - ${movimiento.noMovimiento}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 25px; }
          .title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; font-weight: 500; }
          .doc-number { font-size: 14px; font-weight: bold; color: #059669; margin-top: 6px; font-family: monospace; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
          .info-box { border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 8px; background: #f8fafc; }
          .info-box strong { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 4px; }
          .info-box span { font-size: 14px; font-weight: 700; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; font-size: 13px; }
          th { background-color: #f1f5f9; font-weight: 700; text-transform: uppercase; font-size: 11px; color: #475569; }
          td.qty { text-align: center; font-weight: 800; color: #0f172a; }
          td.code { font-family: monospace; font-weight: 700; color: #334155; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 70px; }
          .signature-box { border-top: 1px solid #475569; text-align: center; padding-top: 8px; font-size: 12px; font-weight: 600; color: #334155; }
          .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Nota de Despacho por Traslado</h1>
          <div class="subtitle">Sistema ERP - Módulo de Control y Operaciones de Inventario</div>
          <div class="doc-number">DOCUMENTO: ${movimiento.noMovimiento} • FECHA: ${movimiento.fecha}</div>
        </div>
        
        <div class="info-grid">
          <div class="info-box">
            <strong>Usuario Solicitante / Responsable:</strong>
            <span>${movimiento.usuarioNombre}</span>
          </div>
          <div class="info-box">
            <strong>Ruta Logística de Traslado:</strong>
            <span>De: ${movimiento.bodegaOrigenNombre} ➜ Para: ${movimiento.bodegaDestinoNombre}</span>
          </div>
        </div>

        ${movimiento.observaciones ? `
          <div style="background:#fffbeb; border:1px solid #fef3c7; padding:10px 14px; border-radius:6px; margin-bottom:20px; font-size:12px; color:#92400e;">
            <strong>Observaciones:</strong> ${movimiento.observaciones}
          </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th width="25%">Código Artículo</th>
              <th width="55%">Descripción del Artículo</th>
              <th width="20%" style="text-align:center;">Cant. Trasladada</th>
            </tr>
          </thead>
          <tbody>
            ${movimiento.detalles.map(d => `
              <tr>
                <td class="code">${d.codigoArticulo}</td>
                <td>${d.nombreArticulo || d.codigoArticulo}</td>
                <td class="qty">${d.cantidad} Unds.</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="signatures">
          <div class="signature-box">
            Firma y Sello de Entrega<br>
            <span style="font-size:10px; font-weight:normal; color:#64748b;">(Bodega de Salida: ${movimiento.bodegaOrigenNombre})</span>
          </div>
          <div class="signature-box">
            Firma y Sello de Recepción Conforme<br>
            <span style="font-size:10px; font-weight:normal; color:#64748b;">(Bodega de Entrada: ${movimiento.bodegaDestinoNombre})</span>
          </div>
        </div>

        <div class="footer">
          Documento generado automáticamente por el ERP Universitario • Copia de Seguridad para Archivo Físico
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  const handleModalSuccess = (resultado: any, payload: IMovimientoInventarioCreateDTO) => {
    const origenNombre = bodegas.find(b => b.id === payload.idBodegaOrigen)?.nombre || `Bodega #${payload.idBodegaOrigen}`;
    const destinoNombre = bodegas.find(b => b.id === payload.idBodegaDestino)?.nombre || `Bodega #${payload.idBodegaDestino}`;
    const usuarioNombre = DEFAULT_USUARIOS.find(u => u.id === payload.idUsuario)?.nombre || `Usuario #${payload.idUsuario}`;

    const totalUnidades = payload.detalles.reduce((acc, d) => acc + d.cantidad, 0);

    const mappedDetalles = payload.detalles.map(d => {
      const art = articulos.find(a => a.codigo === d.codigoArticulo);
      return {
        codigoArticulo: d.codigoArticulo,
        nombreArticulo: art ? art.nombre : d.codigoArticulo,
        cantidad: d.cantidad,
      };
    });

    const nuevoRegistro: MovimientoRegistro = {
      id: `mov-${Date.now()}`,
      noMovimiento: resultado.noMovimiento || `MOV-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      tipoMovimiento: payload.tipoMovimiento || 'TRF_SALIDA',
      idBodegaOrigen: payload.idBodegaOrigen,
      bodegaOrigenNombre: origenNombre,
      idBodegaDestino: payload.idBodegaDestino || 0,
      bodegaDestinoNombre: destinoNombre,
      idUsuario: payload.idUsuario,
      usuarioNombre: usuarioNombre,
      fecha: new Date().toLocaleString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      observaciones: payload.observaciones,
      totalItems: payload.detalles.length,
      totalUnidades: totalUnidades,
      detalles: mappedDetalles,
    };

    setMovimientos(prev => [nuevoRegistro, ...prev]);
    setSuccessMsg(`Traslado ${nuevoRegistro.noMovimiento} aplicado correctamente.`);
    setUltimoMovimientoImprimir(nuevoRegistro);

    // Lanzar diálogo de impresión
    handlePrintDespacho(nuevoRegistro);

    if (onSuccess) {
      onSuccess();
    }
  };

  // Metrics
  const totalMovimientos = movimientos.length;
  const bodegasOperativas = bodegas.length;
  const totalUnidadesMovilizadas = useMemo(() => {
    return movimientos.reduce((acc, m) => acc + m.totalUnidades, 0);
  }, [movimientos]);

  // Filtering
  const filteredMovimientos = useMemo(() => {
    return movimientos.filter((m) => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        m.noMovimiento.toLowerCase().includes(query) ||
        m.usuarioNombre.toLowerCase().includes(query) ||
        m.bodegaOrigenNombre.toLowerCase().includes(query) ||
        m.bodegaDestinoNombre.toLowerCase().includes(query) ||
        m.detalles.some(d => d.codigoArticulo.toLowerCase().includes(query) || (d.nombreArticulo && d.nombreArticulo.toLowerCase().includes(query)));

      const matchBodega =
        filterBodega === 'TODAS' ||
        String(m.idBodegaOrigen) === filterBodega ||
        String(m.idBodegaDestino) === filterBodega;

      return matchSearch && matchBodega;
    });
  }, [movimientos, searchQuery, filterBodega]);

  const columns = [
    {
      header: 'NO. DOCUMENTO',
      accessorKey: 'noMovimiento',
      cell: ({ value }: { value: string }) => (
        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
          {value}
        </span>
      ),
    },
    {
      header: 'TIPO OPERACIÓN',
      accessorKey: 'tipoMovimiento',
      cell: () => (
        <StatusBadge status="aprobado" label="Transferencia Salida" size="sm" />
      ),
    },
    {
      header: 'RUTA (ORIGEN ➜ DESTINO)',
      cell: ({ row }: { row: MovimientoRegistro }) => (
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-800 truncate max-w-[130px] sm:max-w-[180px]" title={row.bodegaOrigenNombre}>
            {row.bodegaOrigenNombre}
          </span>
          <ArrowRight size={14} className="text-emerald-600 shrink-0" />
          <span className="font-bold text-emerald-800 truncate max-w-[130px] sm:max-w-[180px]" title={row.bodegaDestinoNombre}>
            {row.bodegaDestinoNombre}
          </span>
        </div>
      ),
    },
    {
      header: 'RESPONSABLE',
      accessorKey: 'usuarioNombre',
      cell: ({ value }: { value: string }) => (
        <span className="text-xs font-medium text-slate-600">{value}</span>
      ),
    },
    {
      header: 'VOLUMEN',
      align: 'center' as const,
      cell: ({ row }: { row: MovimientoRegistro }) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
          {row.totalItems} ítems ({row.totalUnidades} unds)
        </span>
      ),
    },
    {
      header: 'FECHA Y HORA',
      accessorKey: 'fecha',
      cell: ({ value }: { value: string }) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">{value}</span>
      ),
    },
    {
      header: 'ACCIONES',
      align: 'right' as const,
      cell: ({ row }: { row: MovimientoRegistro }) => (
        <div className="flex items-center justify-end">
          <Button
            variant="secondary"
            size="sm"
            icon={Printer}
            onClick={() => handlePrintDespacho(row)}
            title="Reimprimir Nota de Despacho"
          >
            Reimprimir
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Title and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <ArrowRightLeft size={18} />
            </div>
            Movimientos de Inventario y Kardex
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Registro de transferencias entre bodegas, trazabilidad de salidas y emisión de notas de despacho
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" icon={RefreshCw} onClick={loadDependencies} disabled={isLoading}>
            Actualizar
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            Nuevo Traslado
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="TOTAL TRASLADOS"
          value={totalMovimientos}
          icon={ArrowRightLeft}
          changeLabel="movimientos en Kardex"
        />
        <StatCard
          title="BODEGAS VINCULADAS"
          value={bodegasOperativas}
          icon={Warehouse}
          changeLabel="habilitadas para traslados"
        />
        <StatCard
          title="UNIDADES TRASLADADAS"
          value={totalUnidadesMovilizadas}
          icon={Package}
          isPositive={true}
          changeLabel="artículos movilizados"
        />
        <StatCard
          title="ESTADO LOGÍSTICA"
          value="100% Operativo"
          icon={CheckCircle2}
          isPositive={true}
          changeLabel="sin traslados demorados"
        />
      </div>

      {/* Success Feedback Alert */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          {ultimoMovimientoImprimir && (
            <Button
              variant="secondary"
              size="sm"
              icon={Printer}
              onClick={() => handlePrintDespacho(ultimoMovimientoImprimir)}
            >
              Reimprimir Despacho
            </Button>
          )}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por documento, bodega o ítem..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Filtrar por Bodega:</span>
          <select
            value={filterBodega}
            onChange={(e) => setFilterBodega(e.target.value)}
            className="h-9 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="TODAS">Todas las Bodegas</option>
            {bodegas.map(b => (
              <option key={b.id} value={String(b.id)}>{b.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kardex DataTable */}
      <DataTable
        columns={columns}
        data={filteredMovimientos}
        isLoading={isLoading}
        emptyText="No se encontraron registros de traslados con los filtros seleccionados."
      />

      {/* Modal para Crear Traslado */}
      <MovimientoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        bodegas={bodegas}
        articulos={articulos}
        usuarios={DEFAULT_USUARIOS}
      />
    </div>
  );
};
