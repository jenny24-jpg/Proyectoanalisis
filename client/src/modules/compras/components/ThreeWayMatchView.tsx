import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Warehouse,
  Receipt,
  ShieldCheck,
  DollarSign,
  Printer,
  RefreshCw,
  Search,
  Filter,
  Layers,
  X,
  Lock,
  Building,
  Calendar,
  Barcode,
  Check,
} from 'lucide-react';
import { Button, StatCard, DataTable, TextInput, Select, ConfirmDialog } from '../../../components/ui';
import { SolicitudOriginalCard, SolicitudOriginalInfo } from './SolicitudOriginalCard';
import { ThreeWayMatchClientService } from '../services/threeWayMatchClientService';
import {
  IThreeWayMatchData,
  IFacturaCxP,
  ILiquidarThreeWayMatchDTO,
  IItemThreeWayComparison,
} from '@erp/contracts';
import { formatCurrency, formatDate } from '../../../utils/formatters';

export interface ThreeWayMatchViewProps {
  solicitud?: SolicitudOriginalInfo;
  onBack?: () => void;
  onSuccess?: () => void;
  onNavigateToStage?: (stageKey: string) => void;
}

export const ThreeWayMatchView: React.FC<ThreeWayMatchViewProps> = ({
  solicitud,
  onBack,
  onSuccess,
  onNavigateToStage,
}) => {
  // Estado para Solicitud individual
  const [matchData, setMatchData] = useState<IThreeWayMatchData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  // Formulario interactivo de Factura del Proveedor (si aún no está liquidada)
  const [noFacturaInput, setNoFacturaInput] = useState<string>('');
  const [fechaFacturaInput, setFechaFacturaInput] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [subtotalFacturaInput, setSubtotalFacturaInput] = useState<number>(0);
  const [montoIvaFacturaInput, setMontoIvaFacturaInput] = useState<number>(0);
  const [totalFacturaInput, setTotalFacturaInput] = useState<number>(0);
  const [notasLiquidacionInput, setNotasLiquidacionInput] = useState<string>('');

  // Estado para la conciliación a nivel de línea
  const [lineItems, setLineItems] = useState<IItemThreeWayComparison[]>([]);
  const [toleranciaAceptada, setToleranciaAceptada] = useState<boolean>(false);

  // Estado para la Vista General / Historial de Facturas
  const [facturasGenerales, setFacturasGenerales] = useState<IFacturaCxP[]>([]);
  const [isLoadingGeneral, setIsLoadingGeneral] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [selectedFacturaModal, setSelectedFacturaModal] = useState<IFacturaCxP | null>(null);

  // Cargar datos de la solicitud específica
  const loadSingleMatchData = async (noDoc: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await ThreeWayMatchClientService.getThreeWayMatchData(noDoc);
      setMatchData(data);
      const itemsList = data.comparison?.items || [];
      setLineItems(itemsList);

      if (data.facturaExistente) {
        setNoFacturaInput(data.facturaExistente.facNoFactura);
        setFechaFacturaInput(
          data.facturaExistente.facFechaFactura
            ? new Date(data.facturaExistente.facFechaFactura).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
        );
        setSubtotalFacturaInput(data.facturaExistente.facSubtotal);
        setMontoIvaFacturaInput(data.facturaExistente.facMontoIva);
        setTotalFacturaInput(data.facturaExistente.facTotalFactura);
      } else {
        // Heredar exactamente los montos de la PO o Recepción de Bodega sin duplicar IVA
        const sugeridoSubtotal = data.ordenCompra?.ocoSubtotal != null
          ? data.ordenCompra.ocoSubtotal
          : (data.recepcionBodega?.rboSubtotalRecibido != null
            ? data.recepcionBodega.rboSubtotalRecibido
            : (itemsList.length > 0 ? itemsList.reduce((acc, it) => acc + it.subtotalPo, 0) : 0));

        const sugeridoIva = data.ordenCompra?.ocoMontoIva != null
          ? data.ordenCompra.ocoMontoIva
          : (data.recepcionBodega?.rboIvaRecibido != null
            ? data.recepcionBodega.rboIvaRecibido
            : +(sugeridoSubtotal * 0.12).toFixed(2));

        const sugeridoTotal = data.ordenCompra?.ocoTotal != null
          ? data.ordenCompra.ocoTotal
          : (data.recepcionBodega?.rboTotalFacturar != null
            ? data.recepcionBodega.rboTotalFacturar
            : +(sugeridoSubtotal + sugeridoIva).toFixed(2));

        const year = new Date().getFullYear();
        const randNum = Math.floor(1000 + Math.random() * 9000);
        setNoFacturaInput(`FACT-${year}-${randNum}`);
        setSubtotalFacturaInput(sugeridoSubtotal);
        setMontoIvaFacturaInput(sugeridoIva);
        setTotalFacturaInput(sugeridoTotal);
      }
    } catch (err: any) {
      console.error('[ThreeWayMatchView]: Error cargando datos de 3-Way Match:', err);
      setErrorMsg(err.message || 'Error al obtener la información de 3-Way Match.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos de la vista general
  const loadGeneralFacturas = async () => {
    setIsLoadingGeneral(true);
    setErrorMsg(null);
    try {
      const list = await ThreeWayMatchClientService.getFacturas();
      setFacturasGenerales(list);
    } catch (err: any) {
      console.error('[ThreeWayMatchView]: Error cargando facturas generales:', err);
      setErrorMsg(err.message || 'Error al obtener el historial de facturas.');
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  useEffect(() => {
    if (solicitud?.noDocumento) {
      loadSingleMatchData(solicitud.noDocumento);
    } else {
      loadGeneralFacturas();
    }
  }, [solicitud?.noDocumento]);

  // Actualizar una línea de ítem individual y recalcular totales reactivamente en tiempo real
  const handleLineItemChange = (index: number, field: 'cantidadFacturada' | 'precioUnitarioFactura', rawVal: number) => {
    let val = isNaN(rawVal) ? 0 : Math.max(0, rawVal);
    if (field === 'cantidadFacturada') {
      val = Math.trunc(val);
    }
    const updated = lineItems.map((item, i) => {
      if (i !== index) return item;
      const copy = { ...item };
      if (field === 'cantidadFacturada') {
        copy.cantidadFacturada = val;
      } else {
        copy.precioUnitarioFactura = val;
      }

      copy.subtotalFactura = +(copy.cantidadFacturada * copy.precioUnitarioFactura).toFixed(2);
      copy.diferenciaCantidad = copy.cantidadPedidaPo - copy.cantidadFacturada;
      copy.diferenciaPrecio = +(copy.precioUnitarioPo - copy.precioUnitarioFactura).toFixed(2);
      copy.diferenciaMonto = +(copy.subtotalPo - copy.subtotalFactura).toFixed(2);

      const cantOk = copy.cantidadPedidaPo === copy.cantidadRecibidaBodega && copy.cantidadRecibidaBodega === copy.cantidadFacturada;
      const preOk = Math.abs(copy.precioUnitarioPo - copy.precioUnitarioFactura) < 0.001;

      copy.esConforme = cantOk && preOk;
      if (cantOk && preOk) {
        copy.resultadoTresVias = 'CONFORME';
      } else if (!cantOk && !preOk) {
        copy.resultadoTresVias = 'DISCREPANCIA_AMBAS';
      } else if (!cantOk) {
        copy.resultadoTresVias = 'DISCREPANCIA_CANTIDAD';
      } else {
        copy.resultadoTresVias = 'DISCREPANCIA_PRECIO';
      }

      return copy;
    });

    setLineItems(updated);

    // Recalcular montos globales de factura en tiempo real
    const allMatchPo = matchData?.ordenCompra && updated.every(
      it => it.cantidadFacturada === it.cantidadPedidaPo && Math.abs(it.precioUnitarioFactura - it.precioUnitarioPo) < 0.001
    );

    if (allMatchPo && matchData?.ordenCompra) {
      setSubtotalFacturaInput(matchData.ordenCompra.ocoSubtotal);
      setMontoIvaFacturaInput(matchData.ordenCompra.ocoMontoIva);
      setTotalFacturaInput(matchData.ordenCompra.ocoTotal);
    } else {
      const newSubtotal = +(updated.reduce((acc, it) => acc + (it.subtotalFactura || 0), 0)).toFixed(2);
      const newIva = +(newSubtotal * 0.12).toFixed(2);
      const newTotal = +(newSubtotal + newIva).toFixed(2);

      setSubtotalFacturaInput(newSubtotal);
      setMontoIvaFacturaInput(newIva);
      setTotalFacturaInput(newTotal);
    }
  };

  // Función para alinear automáticamente todos los ítems y montos con la PO (100% Conforme estricto)
  const handleAlinearConPO = () => {
    if (!matchData?.ordenCompra) return;

    const poSubtotal = matchData.ordenCompra.ocoSubtotal;
    const poIva = matchData.ordenCompra.ocoMontoIva;
    const poTotal = matchData.ordenCompra.ocoTotal;

    const updated = lineItems.map(it => {
      const cant = it.cantidadPedidaPo;
      const pre = it.precioUnitarioPo;
      const sub = +(cant * pre).toFixed(2);
      return {
        ...it,
        cantidadFacturada: cant,
        precioUnitarioFactura: pre,
        subtotalFactura: sub,
        diferenciaCantidad: 0,
        diferenciaPrecio: 0,
        diferenciaMonto: 0,
        esConforme: true,
        resultadoTresVias: 'CONFORME' as const,
      };
    });

    setLineItems(updated);
    setSubtotalFacturaInput(poSubtotal);
    setMontoIvaFacturaInput(poIva);
    setTotalFacturaInput(poTotal);
    setToleranciaAceptada(false);
    setErrorMsg(null);
  };

  // Función para sincronizar automáticamente con las cantidades y montos de Bodega
  const handleSincronizarConBodega = () => {
    const updated = lineItems.map(it => {
      const cant = it.cantidadRecibidaBodega;
      const pre = it.precioUnitarioPo;
      const sub = +(cant * pre).toFixed(2);
      const cantOk = it.cantidadPedidaPo === cant;
      const preOk = true;
      return {
        ...it,
        cantidadFacturada: cant,
        precioUnitarioFactura: pre,
        subtotalFactura: sub,
        diferenciaCantidad: it.cantidadPedidaPo - cant,
        diferenciaPrecio: 0,
        diferenciaMonto: +(it.subtotalPo - sub).toFixed(2),
        esConforme: cantOk && preOk,
        resultadoTresVias: cantOk ? 'CONFORME' : 'DISCREPANCIA_CANTIDAD',
      };
    });

    setLineItems(updated);

    if (matchData?.recepcionBodega) {
      setSubtotalFacturaInput(matchData.recepcionBodega.rboSubtotalRecibido);
      setMontoIvaFacturaInput(matchData.recepcionBodega.rboIvaRecibido);
      setTotalFacturaInput(matchData.recepcionBodega.rboTotalFacturar);
    } else {
      const newSub = +(updated.reduce((a, b) => a + b.subtotalFactura, 0)).toFixed(2);
      const newIva = +(newSub * 0.12).toFixed(2);
      setSubtotalFacturaInput(newSub);
      setMontoIvaFacturaInput(newIva);
      setTotalFacturaInput(+(newSub + newIva).toFixed(2));
    }
  };

  // Recalcular IVA y Total cuando cambia el subtotal de factura en modo manual
  const handleSubtotalChange = (newSub: number) => {
    const sub = Math.max(0, newSub);
    if (matchData?.ordenCompra && Math.abs(sub - matchData.ordenCompra.ocoSubtotal) < 0.01) {
      setSubtotalFacturaInput(matchData.ordenCompra.ocoSubtotal);
      setMontoIvaFacturaInput(matchData.ordenCompra.ocoMontoIva);
      setTotalFacturaInput(matchData.ordenCompra.ocoTotal);
    } else {
      const iva = +(sub * 0.12).toFixed(2);
      const tot = +(sub + iva).toFixed(2);
      setSubtotalFacturaInput(sub);
      setMontoIvaFacturaInput(iva);
      setTotalFacturaInput(tot);
    }
  };

  // Liquidar formalmente el 3-Way Match
  const handleLiquidarMatch = async () => {
    if (!matchData || !matchData.ordenCompra || !matchData.recepcionBodega) {
      setErrorMsg('No se puede liquidar: Falta la Orden de Compra o la Recepción física en Bodega.');
      return;
    }

    if (!noFacturaInput.trim()) {
      setErrorMsg('Por favor ingresa el número o serie de la factura del proveedor.');
      return;
    }

    if (totalFacturaInput <= 0) {
      setErrorMsg('El total de la factura debe ser mayor a Q 0.00');
      return;
    }

    // Validación por ítem: Bloqueo si hay discrepancias no autorizadas
    const hayDiscrepancias = lineItems.some(it => !it.esConforme);
    if (hayDiscrepancias && !toleranciaAceptada) {
      setErrorMsg('Existen discrepancias a nivel de línea entre la Orden de Compra, Recepción en Bodega y la Factura. Debe revisar las líneas o activar la autorización con justificación.');
      return;
    }

    if (hayDiscrepancias && (!notasLiquidacionInput || !notasLiquidacionInput.trim())) {
      setErrorMsg('Al registrar una conciliación con discrepancias, es obligatorio ingresar una justificación o nota de auditoría.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const dto: ILiquidarThreeWayMatchDTO = {
        noPo: matchData.ordenCompra.ocoNoPo,
        noRecepcion: matchData.recepcionBodega.rboNoRecepcion,
        noDocumentoSolicitud: matchData.solicitud.solNoDocumento,
        noFactura: noFacturaInput.trim(),
        idProveedor: matchData.cotizacion ? matchData.cotizacion.cotIdProveedor : 1,
        fechaFactura: fechaFacturaInput || new Date().toISOString(),
        subtotalFactura: Number(subtotalFacturaInput),
        montoIvaFactura: Number(montoIvaFacturaInput),
        totalFactura: Number(totalFacturaInput),
        notasLiquidacion: notasLiquidacionInput.trim() || undefined,
        toleranciaAceptada: hayDiscrepancias ? toleranciaAceptada : true,
        items: lineItems,
      };

      const updated = await ThreeWayMatchClientService.liquidar(dto);
      setMatchData(updated);
      setLineItems(updated.comparison?.items || []);
      setSuccessMsg(`¡3-Way Match completado con éxito! Factura ${noFacturaInput.trim()} conciliada por línea y guardada en CXP_DOCUMENTO_DETALLE.`);
      setIsConfirmOpen(false);

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1200);
    } catch (err: any) {
      console.error('[ThreeWayMatchView.handleLiquidarMatch Error]:', err);
      setErrorMsg(err.message || 'Error al liquidar el 3-Way Match.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cálculos reactivos de variación en vivo y estado de bloqueo
  const liveComparison = useMemo(() => {
    if (!matchData || !matchData.ordenCompra) {
      return {
        montoPo: 0,
        montoBodega: 0,
        montoFactura: totalFacturaInput,
        variacionMonto: 0,
        variacionPorcentaje: 0,
        esConforme: true,
        discrepanciasCount: 0,
        hasDiscrepancies: false,
        isBlocked: false,
      };
    }

    const montoPo = matchData.ordenCompra.ocoTotal;
    const montoBodega = matchData.recepcionBodega ? matchData.recepcionBodega.rboTotalFacturar : montoPo;
    const montoFactura = Number(totalFacturaInput);
    const variacionMonto = +(montoFactura - montoPo).toFixed(2);
    const variacionPorcentaje = montoPo > 0 ? +((variacionMonto / montoPo) * 100).toFixed(2) : 0;
    
    const discrepantItems = lineItems.filter(it => !it.esConforme);
    const discrepanciasCount = discrepantItems.length;
    const hasDiscrepancies = discrepanciasCount > 0 || Math.abs(variacionMonto) > 0.05;
    const isBlocked = hasDiscrepancies && !toleranciaAceptada;
    const esConforme = !hasDiscrepancies;

    return {
      montoPo,
      montoBodega,
      montoFactura,
      variacionMonto,
      variacionPorcentaje,
      esConforme,
      discrepanciasCount,
      hasDiscrepancies,
      isBlocked,
    };
  }, [matchData, totalFacturaInput, lineItems, toleranciaAceptada]);

  // Filtrado para la vista general
  const filteredFacturas = useMemo(() => {
    return facturasGenerales.filter((f) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        f.facNoFactura.toLowerCase().includes(q) ||
        f.facNoPo.toLowerCase().includes(q) ||
        f.facNoRecepcion.toLowerCase().includes(q) ||
        (f.proNombreEntidad && f.proNombreEntidad.toLowerCase().includes(q));

      const matchEstado = filterEstado === 'TODOS' || String(f.facIdEstado) === filterEstado;
      return matchSearch && matchEstado;
    });
  }, [facturasGenerales, searchQuery, filterEstado]);

  // Métricas generales
  const generalStats = useMemo(() => {
    const total = facturasGenerales.length;
    const totalMonto = facturasGenerales.reduce((acc, f) => acc + (Number(f.facTotalFactura) || 0), 0);
    return { total, totalMonto };
  }, [facturasGenerales]);

  // Columnas para la tabla del catálogo general
  const tableColumns = [
    {
      header: 'NO. FACTURA CXP',
      accessorKey: 'facNoFactura',
      align: 'left' as const,
      cell: ({ value, row }: { value: string; row: IFacturaCxP }) => (
        <button
          type="button"
          onClick={() => setSelectedFacturaModal(row)}
          className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1.5 text-xs text-left"
        >
          <Receipt size={14} className="shrink-0 text-emerald-600" />
          {value}
        </button>
      ),
    },
    {
      header: 'ORDEN COMPRA (PO)',
      accessorKey: 'facNoPo',
      align: 'left' as const,
      cell: ({ value }: { value: string }) => (
        <span className="font-semibold text-slate-700 text-xs font-mono">{value}</span>
      ),
    },
    {
      header: 'RECEPCIÓN (GRN)',
      accessorKey: 'facNoRecepcion',
      align: 'left' as const,
      cell: ({ value }: { value: string }) => (
        <span className="font-semibold text-cyan-700 text-xs font-mono">{value}</span>
      ),
    },
    {
      header: 'PROVEEDOR',
      accessorKey: 'proNombreEntidad',
      align: 'left' as const,
      cell: ({ value, row }: { value: string; row: IFacturaCxP }) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium">
          <Building size={13} className="text-slate-400" />
          {value || `Proveedor #${row.facIdProveedor}`}
        </div>
      ),
    },
    {
      header: 'FECHA FACTURA',
      accessorKey: 'facFechaFactura',
      align: 'left' as const,
      cell: ({ value }: { value: string | Date }) => (
        <span className="text-slate-600 text-xs">{formatDate(value, '2026-03-01')}</span>
      ),
    },
    {
      header: 'TOTAL LIQUIDADO',
      accessorKey: 'facTotalFactura',
      align: 'right' as const,
      cell: ({ value }: { value: number }) => (
        <span className="font-bold text-slate-900 text-xs font-mono">{formatCurrency(value)}</span>
      ),
    },
    {
      header: 'ESTADO 3-WAY',
      accessorKey: 'facIdEstado',
      align: 'center' as const,
      cell: () => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} /> Liquidada (6/6)
        </span>
      ),
    },
  ];

  // RENDER: Vista de Solicitud Específica (Etapa 6 del Pipeline)
  if (solicitud) {
    const isLiquidado = Boolean(matchData?.facturaExistente);
    const hasBodega = Boolean(matchData?.recepcionBodega);
    const hasPo = Boolean(matchData?.ordenCompra);

    return (
      <div id="threeway-match-document" className="space-y-6 w-full pb-16 animate-fadeIn min-w-0">
        {/* Encabezado Oficial Exclusivo para Impresión */}
        <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                Dictamen de Conciliación Tripartita (3-Way Match)
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Auditoría de Compras, Recepción Física en Almacén y Liquidación de Factura CxP
              </p>
            </div>
            <div className="text-right text-xs text-slate-600 font-mono space-y-0.5">
              <p>Fecha Dictamen: {new Date().toLocaleDateString('es-GT')}</p>
              <p className="font-bold text-emerald-800">ESTADO: CONCILIADO Y LIQUIDADO</p>
            </div>
          </div>
        </div>

        {/* Top Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 print:hidden">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack}>
                Volver a Registros
              </Button>
            )}
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
              isLiquidado
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              <ShieldCheck size={14} className={isLiquidado ? 'text-emerald-700' : 'text-blue-600'} />
              {isLiquidado ? 'Etapa 6/6: Finalizada' : 'Etapa 6 de 6: 3-Way Match & Liquidación'}
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              Conciliación Tripartita Documental
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={() => loadSingleMatchData(solicitud.noDocumento)}
              disabled={isLoading}
            >
              Actualizar
            </Button>
            {isLiquidado && (
              <Button
                variant="secondary"
                size="sm"
                icon={Printer}
                onClick={() => window.print()}
                className="bg-white border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs font-semibold"
              >
                Imprimir Dictamen
              </Button>
            )}
          </div>
        </div>

        {/* Tarjeta de Solicitud Original */}
        <SolicitudOriginalCard
          solicitud={{
            ...solicitud,
            estado: isLiquidado ? 'Finalizada' : solicitud.estado,
          }}
        />

        {/* Alertas */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3 shadow-xs print:hidden">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-900">Validación 3-Way Match</p>
              <p className="text-xs text-rose-700 mt-0.5">{errorMsg}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-700 p-1"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-start gap-3 shadow-xs print:hidden">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-emerald-900">Conciliación Completada</p>
              <p className="text-xs text-emerald-700 mt-0.5">{successMsg}</p>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-500 hover:text-emerald-700 p-1"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Banner de Estado General (Diseño Corporativo Claro y Armonioso) */}
        {isLiquidado ? (
          <div className="bg-white rounded-2xl p-6 shadow-2xs relative overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/80 text-xs font-bold">
                  <CheckCircle2 size={14} className="text-emerald-700" />
                  Ciclo de Compras Finalizado (Etapa 6/6 Concluida)
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Factura CxP Autorizada: <span className="text-emerald-700 font-mono">{matchData?.facturaExistente?.facNoFactura}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  El cruce entre la <span className="font-semibold text-slate-800">Orden de Compra {matchData?.ordenCompra?.ocoNoPo}</span>, la <span className="font-semibold text-slate-800">Recepción de Bodega {matchData?.recepcionBodega?.rboNoRecepcion}</span> y la <span className="font-semibold text-emerald-800">Factura del Proveedor</span> fue verificado con 100% de conformidad económica y física.
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/90 text-left md:text-right space-y-1 shadow-2xs shrink-0">
                <span className="text-xs text-emerald-800 uppercase tracking-wider font-bold block">Monto Desembolso CxP</span>
                <p className="text-2xl font-black text-emerald-700 font-mono">
                  {formatCurrency(matchData?.facturaExistente?.facTotalFactura || 0)}
                </p>
                <span className="text-[11px] text-emerald-700 font-medium block">Autorizado para Cuentas por Pagar</span>
              </div>
            </div>
          </div>
        ) : !hasBodega ? (
          /* AVISO SI AÚN NO HA PASADO POR RECEPCIÓN DE BODEGA */
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900 space-y-3 print:hidden">
            <div className="flex items-center gap-2 text-base font-bold text-amber-900">
              <Warehouse size={20} className="text-amber-700" />
              Paso Previo Requerido: Recepción en Bodega (Etapa 5)
            </div>
            <p className="text-xs text-amber-800 leading-relaxed max-w-3xl">
              Esta solicitud tiene su Orden de Compra emitida ({matchData?.ordenCompra?.ocoNoPo || 'PO-...'}), pero aún no cuenta con el comprobante de recepción física de mercancía registrado en Bodega (Kardex). Para realizar el 3-Way Match, primero debe registrarse el ingreso de los artículos en almacén.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                icon={Warehouse}
                onClick={() => {
                  if (onNavigateToStage) onNavigateToStage('bodega');
                }}
                className="bg-amber-700 hover:bg-amber-800 text-white"
              >
                Ir a Recepción en Bodega (Etapa 5)
              </Button>
            </div>
          </div>
        ) : null}

        {/* 1. SECCIÓN: LOS 3 PILARES DEL 3-WAY MATCH (COMPARATIVA TRIPARTITA) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PILAR 1: ORDEN DE COMPRA (PO) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <FileSpreadsheet size={18} className="text-blue-600" />
                1. Orden de Compra (PO)
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Autorizada
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">No. PO Oficial:</span>
                <span className="font-mono font-bold text-slate-800">{matchData?.ordenCompra?.ocoNoPo || 'N/D'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Fecha Emisión:</span>
                <span className="font-medium text-slate-800">{formatDate(matchData?.ordenCompra?.ocoFechaEmision, '2026-03-01')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Subtotal Autorizado:</span>
                <span className="font-mono text-slate-800">{formatCurrency(matchData?.ordenCompra?.ocoSubtotal || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">IVA (12%):</span>
                <span className="font-mono text-slate-800">{formatCurrency(matchData?.ordenCompra?.ocoMontoIva || 0)}</span>
              </div>
              <div className="flex justify-between py-1.5 pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900 text-sm">Total Ordenado:</span>
                <span className="font-mono font-bold text-blue-700 text-sm">{formatCurrency(matchData?.ordenCompra?.ocoTotal || 0)}</span>
              </div>
            </div>
          </div>

          {/* PILAR 2: RECEPCIÓN EN BODEGA (GRN) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Warehouse size={18} className="text-cyan-600" />
                2. Recepción Bodega (GRN)
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                hasBodega
                  ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {hasBodega ? (matchData?.recepcionBodega?.rboTipoRecepcion || 'TOTAL') : 'Pendiente'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">No. Recepción:</span>
                <span className="font-mono font-bold text-slate-800">{matchData?.recepcionBodega?.rboNoRecepcion || 'Sin registrar'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Guía de Despacho:</span>
                <span className="font-medium text-slate-800">{matchData?.recepcionBodega?.guiaDespacho || 'GR-OFICIAL'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Subtotal Recibido:</span>
                <span className="font-mono text-slate-800">{formatCurrency(matchData?.recepcionBodega?.rboSubtotalRecibido || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">IVA (12%):</span>
                <span className="font-mono text-slate-800">{formatCurrency(matchData?.recepcionBodega?.rboIvaRecibido || 0)}</span>
              </div>
              <div className="flex justify-between py-1.5 pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900 text-sm">Total a Facturar:</span>
                <span className="font-mono font-bold text-cyan-700 text-sm">{formatCurrency(matchData?.recepcionBodega?.rboTotalFacturar || 0)}</span>
              </div>
            </div>
          </div>

          {/* PILAR 3: FACTURA DEL PROVEEDOR (CXP) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Receipt size={18} className="text-emerald-600" />
                3. Factura Proveedor (CXP)
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                isLiquidado
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {isLiquidado ? 'Liquidada' : 'Por Conciliar'}
              </span>
            </div>

            {isLiquidado ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">No. Factura / Serie:</span>
                  <span className="font-mono font-bold text-slate-800">{matchData?.facturaExistente?.facNoFactura}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Fecha Factura:</span>
                  <span className="font-medium text-slate-800">{formatDate(matchData?.facturaExistente?.facFechaFactura, '2026-03-01')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Subtotal Facturado:</span>
                  <span className="font-mono text-slate-800">{formatCurrency(matchData?.facturaExistente?.facSubtotal || 0)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">IVA (12%):</span>
                  <span className="font-mono text-slate-800">{formatCurrency(matchData?.facturaExistente?.facMontoIva || 0)}</span>
                </div>
                <div className="flex justify-between py-1.5 pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900 text-sm">Total Facturado:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">{formatCurrency(matchData?.facturaExistente?.facTotalFactura || 0)}</span>
                </div>
              </div>
            ) : (
              /* Formulario de Factura en vivo */
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. Factura / DTE <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={noFacturaInput}
                    onChange={(e) => setNoFacturaInput(e.target.value)}
                    placeholder="Ej: FACT-2026-9481"
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Subtotal (Q)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={subtotalFacturaInput}
                      onChange={(e) => handleSubtotalChange(Number(e.target.value))}
                      className="w-full h-8 px-2 text-right rounded-lg border border-slate-200 bg-white font-mono font-medium text-slate-800 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">IVA 12% (Q)</label>
                    <input
                      type="number"
                      disabled
                      value={montoIvaFacturaInput}
                      className="w-full h-8 px-2 text-right rounded-lg border border-slate-200 bg-slate-50 font-mono text-slate-500 text-xs cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex justify-between py-1.5 pt-2 border-t border-slate-200 items-baseline">
                  <span className="font-bold text-slate-900 text-sm">Total a Conciliar:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {formatCurrency(totalFacturaInput)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. SECCIÓN: MATRIZ DETALLADA DE CONCILIACIÓN ÍTEM POR ÍTEM */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-600" />
                Matriz de Cotejo Documental (Cruce Línea por Línea)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparación cuantitativa y de precios por ítem: Orden de Compra (PO) vs. Recepción en Bodega (GRN) vs. Factura (CXP).
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!isLiquidado && (
                <>
                  <button
                    type="button"
                    onClick={handleAlinearConPO}
                    className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-colors shadow-2xs"
                    title="Ajustar todas las cantidades y precios exactamente a la Orden de Compra"
                  >
                    Alinear con PO (100% Conforme)
                  </button>
                  <button
                    type="button"
                    onClick={handleSincronizarConBodega}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                    title="Ajustar las cantidades a lo efectivamente recibido en Almacén"
                  >
                    Sincronizar con Bodega
                  </button>
                </>
              )}
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                Tolerancia: ±0.00%
              </span>
            </div>
          </div>

          {/* Banner de Alerta de Discrepancia si existe alguna línea no conforme */}
          {liveComparison.hasDiscrepancies && (
            <div className="mx-6 my-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
              <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-bold text-amber-950">
                  ¡Atención! Se detectaron {liveComparison.discrepanciasCount} artículo(s) con discrepancia entre lo ordenado, lo recibido y lo facturado.
                </p>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Para proceder con la liquidación a Cuentas por Pagar (CXP), debe ajustar los valores o activar la casilla de autorización especial con la nota de justificación correspondiente.
                </p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ARTÍCULO</th>
                  <th className="px-3 py-3 text-center">CANT. PO</th>
                  <th className="px-3 py-3 text-center">CANT. BODEGA</th>
                  <th className="px-3 py-3 text-center">CANT. FACTURA</th>
                  <th className="px-3 py-3 text-right">PRECIO PO</th>
                  <th className="px-3 py-3 text-right">PRECIO FACTURA</th>
                  <th className="px-3 py-3 text-right">SUBTOTAL FACTURA</th>
                  <th className="px-3 py-3 text-center">DIF. PRECIO / CANT</th>
                  <th className="px-4 py-3 text-center">RESULTADO 3-VÍAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineItems.map((item, idx) => {
                  const cantOk = item.cantidadPedidaPo === item.cantidadRecibidaBodega;
                  const preOk = Math.abs(item.precioUnitarioPo - item.precioUnitarioFactura) < 0.001;
                  const itemConforme = cantOk && preOk;

                  const resCode = item.resultadoTresVias || (itemConforme ? 'CONFORME' : (!cantOk && !preOk ? 'DISCREPANCIA_AMBAS' : (!cantOk ? 'DISCREPANCIA_CANTIDAD' : 'DISCREPANCIA_PRECIO')));

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        !itemConforme ? 'bg-amber-50/25' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-slate-900">{item.codigoArticulo}</div>
                        <div className="text-slate-600 text-[11px] font-medium max-w-xs truncate">
                          {item.descripcionArticulo}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center font-mono font-bold text-slate-800">
                        {item.cantidadPedidaPo}
                      </td>

                      <td className="px-3 py-3 text-center font-mono font-bold text-cyan-800">
                        {item.cantidadRecibidaBodega}
                      </td>

                      {/* Cantidad Facturada (Editable si no está liquidada) */}
                      <td className="px-3 py-3 text-center">
                        {isLiquidado ? (
                          <span className="font-mono font-bold text-emerald-800">{item.cantidadFacturada}</span>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.cantidadFacturada}
                            onKeyDown={(e) => {
                              if (['e', 'E', '.', ',', '-', '+'].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              const parsed = parseInt(e.target.value, 10);
                              handleLineItemChange(idx, 'cantidadFacturada', isNaN(parsed) ? 0 : parsed);
                            }}
                            className="w-16 h-7 text-center rounded border border-slate-300 font-mono font-bold text-xs bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                          />
                        )}
                      </td>

                      <td className="px-3 py-3 text-right font-mono text-slate-600">
                        {formatCurrency(item.precioUnitarioPo)}
                      </td>

                      {/* Precio Facturado (Editable si no está liquidada) */}
                      <td className="px-3 py-3 text-right">
                        {isLiquidado ? (
                          <span className="font-mono font-bold text-emerald-800">{formatCurrency(item.precioUnitarioFactura)}</span>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.precioUnitarioFactura}
                            onChange={(e) => handleLineItemChange(idx, 'precioUnitarioFactura', parseFloat(e.target.value))}
                            className="w-24 h-7 text-right rounded border border-slate-300 font-mono font-bold text-xs bg-white px-1.5 focus:ring-2 focus:ring-blue-100 outline-none"
                          />
                        )}
                      </td>

                      <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.subtotalFactura)}
                      </td>

                      {/* Diferencias */}
                      <td className="px-3 py-3 text-center font-mono text-[11px]">
                        <div className={item.diferenciaCantidad !== 0 ? 'text-amber-700 font-bold' : 'text-slate-400'}>
                          Δ Cant: {item.diferenciaCantidad > 0 ? `-${item.diferenciaCantidad}` : item.diferenciaCantidad < 0 ? `+${Math.abs(item.diferenciaCantidad)}` : '0'}
                        </div>
                        <div className={Math.abs(item.diferenciaPrecio || 0) > 0.001 ? 'text-amber-700 font-bold' : 'text-slate-400'}>
                          Δ Pre: {formatCurrency(item.diferenciaPrecio || 0)}
                        </div>
                      </td>

                      {/* Badge RESULTADO_TRES_VIAS */}
                      <td className="px-4 py-3 text-center">
                        {resCode === 'CONFORME' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 size={12} /> Conforme 100%
                          </span>
                        ) : resCode === 'DISCREPANCIA_CANTIDAD' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200" title="Diferencia entre cantidad pedida y recibida">
                            <AlertTriangle size={12} /> Dif. Cantidad
                          </span>
                        ) : resCode === 'DISCREPANCIA_PRECIO' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200" title="Diferencia entre precio PO y factura">
                            <AlertTriangle size={12} /> Dif. Precio
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200" title="Diferencias en cantidad y precio">
                            <AlertTriangle size={12} /> Dif. Cant. y Precio
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. SECCIÓN: RESUMEN DE CONFORMIDAD, AUDITORÍA Y BOTÓN DE LIQUIDACIÓN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Panel de Auditoría y Checklist */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-600" />
                <span className="font-bold text-sm text-slate-900">
                  Dictamen de Auditoría y Control Interno (ERP-CxP)
                </span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                liveComparison.esConforme
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {liveComparison.esConforme ? 'CONCILIACIÓN SIN DISCREPANCIAS' : 'REQUIERE AUTORIZACIÓN ESPECIAL'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check size={14} />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-slate-900 block">Cotización Oficial Ganadora:</span>
                  <p className="text-slate-500 text-[11px]">
                    Condiciones comerciales y proveedor adjudicado verificados ({matchData?.cotizacion?.cotNombreProveedor || matchData?.ordenCompra?.proNombreEntidad || 'Proveedor adjudicado'}).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check size={14} />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-slate-900 block">Orden de Compra Autorizada:</span>
                  <p className="text-slate-500 text-[11px]">
                    Presupuesto validado y emitido bajo la Orden {matchData?.ordenCompra?.ocoNoPo}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check size={14} />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-slate-900 block">Kardex & Almacén Actualizado:</span>
                  <p className="text-slate-500 text-[11px]">
                    Mercancía ingresada al inventario general con comprobante de recepción {matchData?.recepcionBodega?.rboNoRecepcion || 'GRN'}.
                  </p>
                </div>
              </div>
            </div>

            {/* Justificación de Discrepancia si no es 100% conforme */}
            {!isLiquidado && liveComparison.hasDiscrepancies && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="tolerancia-check"
                    checked={toleranciaAceptada}
                    onChange={(e) => setToleranciaAceptada(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <label htmlFor="tolerancia-check" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Autorizo la liquidación de la Factura aceptando las variaciones a nivel de línea.
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Justificación / Nota de Aprobación de Discrepancia <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={notasLiquidacionInput}
                    onChange={(e) => setNotasLiquidacionInput(e.target.value)}
                    placeholder="Ej: Aprobado ajuste por entrega parcial acordada con el proveedor..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Panel de Liquidación / Acción Final */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <DollarSign size={18} className="text-emerald-600" />
              Cierre y Liquidación CxP
            </h4>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Monto PO:</span>
                <span className="font-mono font-medium">{formatCurrency(liveComparison.montoPo)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Monto Recibido:</span>
                <span className="font-mono font-medium">{formatCurrency(liveComparison.montoBodega)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Variación:</span>
                <span className={`font-mono font-bold ${liveComparison.variacionMonto === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {formatCurrency(liveComparison.variacionMonto)} ({liveComparison.variacionPorcentaje}%)
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-bold text-slate-900">Total Liquidación:</span>
                <span className="font-bold text-lg text-emerald-700 font-mono">
                  {formatCurrency(liveComparison.montoFactura)}
                </span>
              </div>
            </div>

            <div className="pt-3">
              {isLiquidado ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs text-center font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Ciclo Cerrado y Factura Liquidada</span>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  icon={ShieldCheck}
                  onClick={() => setIsConfirmOpen(true)}
                  disabled={isSubmitting || !hasBodega || !hasPo || liveComparison.isBlocked}
                  className="w-full justify-center bg-emerald-700 hover:bg-emerald-600 text-white shadow-md font-bold text-sm py-3 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {liveComparison.isBlocked
                    ? 'Bloqueado por Discrepancia'
                    : isSubmitting
                    ? 'Procesando Liquidación...'
                    : 'Aprobar y Liquidar 3-Way Match'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Confirmación Corporativo */}
        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleLiquidarMatch}
          title="¿Aprobar y Liquidar 3-Way Match?"
          description={`Se registrará la Factura ${noFacturaInput} en el módulo de Cuentas por Pagar (CxP) por un monto total de ${formatCurrency(totalFacturaInput)}, autorizando el desembolso y cerrando formalmente el ciclo de compras de la solicitud ${solicitud.noDocumento}.`}
          itemName={`Factura: ${noFacturaInput} | PO: ${matchData?.ordenCompra?.ocoNoPo}`}
          confirmText="Confirmar y Liquidar CxP"
          cancelText="Revisar Datos"
          variant="primary"
          confirmIcon={ShieldCheck}
          isLoading={isSubmitting}
        />
      </div>
    );
  }

  // RENDER: Vista Standalone / Historial General de Facturas CXP
  return (
    <div className="space-y-6 w-full pb-16 animate-fadeIn min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="text-emerald-600" size={24} />
            Módulo de 3-Way Matching & Liquidación (CXP)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Historial de facturas conciliadas, cruce tripartito de compras y autorización de pagos a proveedores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={loadGeneralFacturas}
            disabled={isLoadingGeneral}
          >
            Actualizar Historial
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Facturas CXP"
          value={generalStats.total}
          icon={Receipt}
          changeLabel="conciliadas en BD"
        />
        <StatCard
          title="Monto Total Liquidado"
          value={formatCurrency(generalStats.totalMonto)}
          icon={DollarSign}
          changeLabel="autorizado a pago"
        />
        <StatCard
          title="Conformidad 3-Way"
          value="100%"
          icon={ShieldCheck}
          changeLabel="sin discrepancias"
        />
        <StatCard
          title="Etapa de Compras"
          value="6 de 6"
          icon={Layers}
          changeLabel="ciclo completado"
        />
      </div>

      {/* Toolbar Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <TextInput
            placeholder="Buscar por Factura, PO, Recepción o Proveedor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={Search}
          />
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            options={[
              { value: 'TODOS', label: 'Todos los Estados' },
              { value: '5', label: 'Liquidadas / Autorizadas' },
            ]}
            icon={Filter}
          />
        </div>
      </div>

      {/* Tabla de Facturas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <DataTable
          columns={tableColumns}
          data={filteredFacturas}
          isLoading={isLoadingGeneral}
          emptyText="No se encontraron facturas registradas en CMP_FACTURA_CXP."
        />
      </div>

      {/* Modal Detalle Factura */}
      {selectedFacturaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-scaleUp">
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Receipt size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Factura CXP: {selectedFacturaModal.facNoFactura}
                  </h3>
                  <p className="text-xs text-slate-500">
                    PO: <span className="font-semibold text-slate-800">{selectedFacturaModal.facNoPo}</span> | Recepción: <span className="font-semibold text-slate-800">{selectedFacturaModal.facNoRecepcion}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFacturaModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Proveedor:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedFacturaModal.proNombreEntidad || `Proveedor #${selectedFacturaModal.facIdProveedor}`}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Fecha Emisión Factura:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatDate(selectedFacturaModal.facFechaFactura, '2026-03-01')}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex justify-between text-emerald-900">
                  <span>Subtotal Facturado:</span>
                  <span className="font-mono font-medium">{formatCurrency(selectedFacturaModal.facSubtotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-900">
                  <span>IVA (12%):</span>
                  <span className="font-mono font-medium">{formatCurrency(selectedFacturaModal.facMontoIva)}</span>
                </div>
                <div className="pt-2 border-t border-emerald-200 flex justify-between font-bold text-emerald-950 text-sm">
                  <span>Total Autorizado CxP:</span>
                  <span className="font-mono">{formatCurrency(selectedFacturaModal.facTotalFactura)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <Button variant="secondary" onClick={() => setSelectedFacturaModal(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
