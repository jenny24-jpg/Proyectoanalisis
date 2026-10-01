import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Warehouse,
  Truck,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Layers,
  Box,
  MapPin,
  Calendar,
  DollarSign,
  Barcode,
  Info,
  UserCheck,
  Car,
  Download,
  Eye,
  FileUp,
} from 'lucide-react';
import {
  Button,
  StatCard,
  DataTable,
  StatusBadge,
  TextInput,
  Select,
  TextArea,
  Checkbox,
  ConfirmDialog,
} from '../../../components/ui';
import { SolicitudOriginalCard, SolicitudOriginalInfo } from './SolicitudOriginalCard';
import { OrdenCompraClientService } from '../services/ordenCompraClientService';
import {
  RecepcionBodegaClientService,
  IBodegaOption,
  IUbicacionOption,
} from '../services/recepcionBodegaClientService';
import { SolicitudCompraClientService } from '../services/solicitudCompraClientService';
import { VehiculoClientService } from '../../inventario/services/vehiculoClientService';
import { ConductorClientService } from '../../inventario/services/conductorClientService';
import { CotizacionClientService } from '../services/cotizacionClientService';
import {
  IOrdenCompraCompleta,
  IRecepcionBodega,
  IRecepcionBodegaCompleta,
  IRegistrarRecepcionDTO,
  ISolicitudCompra,
  IVehiculo,
  IConductor,
  IProveedor,
} from '@erp/contracts';
import { formatCurrency, formatDate } from '../../../utils/formatters';

export interface BodegaViewProps {
  solicitud?: SolicitudOriginalInfo | null;
  onBack?: () => void;
  onSuccess?: () => void;
  onNavigateToStage?: (stageId: 'aprobacion' | 'matriz' | 'seleccion' | 'presupuesto' | 'bodega' | '3way') => void;
}

interface ItemRecepcionFormState {
  codigoArticulo: string;
  descripcionArticulo: string;
  cantidadOrdenada: number;
  cantidadRecibida: number;
  precioUnitario: number;
  verificadoFisicamente: boolean;
  idUbicacion: number;
}

export const BodegaView: React.FC<BodegaViewProps> = ({
  solicitud,
  onBack,
  onSuccess,
  onNavigateToStage,
}) => {
  // Estado para la orden de compra y recepción activa
  const [ordenCompra, setOrdenCompra] = useState<IOrdenCompraCompleta | null>(null);
  const [recepcionExistente, setRecepcionExistente] = useState<IRecepcionBodegaCompleta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Catálogos dinámicos
  const [bodegas, setBodegas] = useState<IBodegaOption[]>([]);
  const [ubicaciones, setUbicaciones] = useState<IUbicacionOption[]>([]);
  const [vehiculos, setVehiculos] = useState<IVehiculo[]>([]);
  const [conductores, setConductores] = useState<IConductor[]>([]);
  const [proveedores, setProveedores] = useState<IProveedor[]>([]);

  // Formulario de Guía de Despacho y Transporte
  const [guiaDespacho, setGuiaDespacho] = useState<string>('');
  const [transportista, setTransportista] = useState<string>('');
  const [conductorAjeno, setConductorAjeno] = useState<string>('');
  const [tipoTransporte, setTipoTransporte] = useState<'AJENO' | 'PROPIO'>('AJENO');
  const [idProveedorTransporte, setIdProveedorTransporte] = useState<number | undefined>(undefined);
  const [idVehiculo, setIdVehiculo] = useState<number | undefined>(undefined);
  const [idConductor, setIdConductor] = useState<number | undefined>(undefined);
  const [placaVehiculo, setPlacaVehiculo] = useState<string>('');
  const [modeloVehiculo, setModeloVehiculo] = useState<string>('');
  const [archivoComprobante, setArchivoComprobante] = useState<File | null>(null);

  const [fechaLlegada, setFechaLlegada] = useState<string>(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    return localISOTime;
  });
  const [idBodega, setIdBodega] = useState<number>(1);
  const [observaciones, setObservaciones] = useState<string>('');

  // Artículos de inspección
  const [itemsInspection, setItemsInspection] = useState<ItemRecepcionFormState[]>([]);

  // Modal de confirmación
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Mensajes de Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Vista Standalone / Historial General de Recepciones
  const [recepcionesGenerales, setRecepcionesGenerales] = useState<IRecepcionBodega[]>([]);
  const [solicitudesGenerales, setSolicitudesGenerales] = useState<ISolicitudCompra[]>([]);
  const [isLoadingGeneral, setIsLoadingGeneral] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [filterBodega, setFilterBodega] = useState<string>('TODAS');
  const [selectedRecepcionModal, setSelectedRecepcionModal] = useState<IRecepcionBodegaCompleta | null>(null);

  // Cargar catálogos iniciales
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [bods, ubis, vehs, conds, provs] = await Promise.all([
          RecepcionBodegaClientService.getBodegas(),
          RecepcionBodegaClientService.getUbicaciones(),
          VehiculoClientService.getVehiculos({ estado: 'ACTIVO' }).catch(() => []),
          ConductorClientService.getConductores({ estado: 'ACTIVO' }).catch(() => []),
          CotizacionClientService.getProveedores().catch(() => []),
        ]);
        setBodegas(bods);
        setUbicaciones(ubis);
        setVehiculos(vehs);
        setConductores(conds);
        setProveedores(provs);

        if (bods.length > 0 && !idBodega) {
          setIdBodega(bods[0].idBodega);
        }
        if (vehs.length > 0 && !idVehiculo) {
          setIdVehiculo(vehs[0].vehIdVehiculo);
        }
        if (conds.length > 0 && !idConductor) {
          setIdConductor(conds[0].conIdConductor);
        }
      } catch (err) {
        console.warn('[BodegaView]: Error cargando catálogos de bodega y flota:', err);
      }
    };
    fetchCatalogs();
  }, []);


  // Cargar ubicaciones cuando cambia la bodega seleccionada
  useEffect(() => {
    if (idBodega) {
      RecepcionBodegaClientService.getUbicaciones(idBodega).then((ubis) => {
        setUbicaciones(ubis);
      });
    }
  }, [idBodega]);

  // Cargar datos de la solicitud / PO específica
  const loadSingleSolicitudData = async (noDoc: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const po = await OrdenCompraClientService.getOrdenCompraPorSolicitud(noDoc);
      if (!po) {
        setErrorMsg(`No se encontró una Orden de Compra emitida para la solicitud ${noDoc}. Debe ser aprobada en la etapa de Presupuesto.`);
        setIsLoading(false);
        return;
      }
      setOrdenCompra(po);

      // Verificar si ya tiene recepción registrada
      const recExist = await RecepcionBodegaClientService.getRecepcionPorNoPo(po.ocoNoPo);
      if (recExist) {
        setRecepcionExistente(recExist);
      } else {
        // Inicializar filas de inspección a partir del detalle de la PO o detalles de la solicitud completa
        const defaultUbi = ubicaciones.find((u) => u.idBodega === 1)?.idUbicacion || 1;
        let initialItems: ItemRecepcionFormState[] = [];

        if (po.detalles && po.detalles.length > 0) {
          initialItems = po.detalles.map((det) => ({
            codigoArticulo: det.docCodigoArticulo,
            descripcionArticulo: det.artDescripcion || det.docCodigoArticulo,
            cantidadOrdenada: Number(det.docCantidadPedida || 1),
            cantidadRecibida: Number(det.docCantidadPedida || 1),
            precioUnitario: Number(det.docPrecioUnitario || 0),
            verificadoFisicamente: true,
            idUbicacion: defaultUbi,
          }));
        } else {
          // Intentar obtener detalles desde la solicitud completa
          const solCompleta = await SolicitudCompraClientService.getSolicitudCompleta(noDoc).catch(() => null);
          if (solCompleta?.detalles && solCompleta.detalles.length > 0) {
            initialItems = solCompleta.detalles.map((det) => ({
              codigoArticulo: det.dsolCodigoArticulo,
              descripcionArticulo: det.artDescripcion || det.dsolCodigoArticulo,
              cantidadOrdenada: Number(det.dsolCantidad || 1),
              cantidadRecibida: Number(det.dsolCantidad || 1),
              precioUnitario: Number(det.dsolPrecioEstimado || 0),
              verificadoFisicamente: true,
              idUbicacion: defaultUbi,
            }));
          } else {
            // Fallback garantizado
            initialItems = [
              {
                codigoArticulo: 'ART-0002',
                descripcionArticulo: 'Artículo Requerido',
                cantidadOrdenada: 1,
                cantidadRecibida: 1,
                precioUnitario: Number(po.ocoSubtotal || po.ocoTotal || 0),
                verificadoFisicamente: true,
                idUbicacion: defaultUbi,
              },
            ];
          }
        }

        setItemsInspection(initialItems);
        setIdBodega(1);
        setGuiaDespacho(`GR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
        setTransportista('');
        setConductorAjeno('');
        setPlacaVehiculo('');
        setModeloVehiculo('');
      }
    } catch (err: any) {
      console.error('[BodegaView]: Error cargando datos de PO / Recepción:', err);
      setErrorMsg(err.message || 'Error al obtener la información de recepción de mercancía.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos de la vista general / historial
  const loadGeneralData = async () => {
    setIsLoadingGeneral(true);
    setErrorMsg(null);
    try {
      const [recs, sols] = await Promise.all([
        RecepcionBodegaClientService.getRecepciones(),
        SolicitudCompraClientService.getSolicitudes().catch(() => []),
      ]);
      setRecepcionesGenerales(recs);
      setSolicitudesGenerales(sols);
    } catch (err: any) {
      console.error('[BodegaView]: Error cargando historial general:', err);
      setErrorMsg(err.message || 'Error al obtener el historial general de recepciones.');
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  useEffect(() => {
    if (solicitud?.noDocumento) {
      loadSingleSolicitudData(solicitud.noDocumento);
    } else {
      loadGeneralData();
    }
  }, [solicitud?.noDocumento]);

  // Manejadores de cambios en la tabla de inspección
  const handleQuantityChange = (codigoArticulo: string, val: number) => {
    const intVal = Number.isInteger(val) ? val : Math.trunc(val || 0);
    setItemsInspection((prev) =>
      prev.map((item) => {
        if (item.codigoArticulo === codigoArticulo) {
          const clamped = Math.max(0, Math.min(item.cantidadOrdenada * 2, intVal));
          return { ...item, cantidadRecibida: clamped };
        }
        return item;
      })
    );
  };

  const handleVerifyChange = (codigoArticulo: string, checked: boolean) => {
    setItemsInspection((prev) =>
      prev.map((item) =>
        item.codigoArticulo === codigoArticulo ? { ...item, verificadoFisicamente: checked } : item
      )
    );
  };

  const handleLocationChange = (codigoArticulo: string, ubiId: number) => {
    setItemsInspection((prev) =>
      prev.map((item) => (item.codigoArticulo === codigoArticulo ? { ...item, idUbicacion: ubiId } : item))
    );
  };

  const handleMarkAllConforming = () => {
    setItemsInspection((prev) =>
      prev.map((item) => ({
        ...item,
        cantidadRecibida: item.cantidadOrdenada,
        verificadoFisicamente: true,
      }))
    );
  };

  // Cálculos financieros y estado de recepción
  const financialSummary = useMemo(() => {
    let subtotal = 0;
    let hasDifferences = false;
    let allVerified = true;
    let totalItems = 0;

    for (const it of itemsInspection) {
      subtotal += it.cantidadRecibida * it.precioUnitario;
      if (it.cantidadRecibida !== it.cantidadOrdenada) {
        hasDifferences = true;
      }
      if (!it.verificadoFisicamente) {
        allVerified = false;
      }
      totalItems += it.cantidadRecibida;
    }

    subtotal = +subtotal.toFixed(2);
    let iva = +(subtotal * 0.12).toFixed(2);
    let total = +(subtotal + iva).toFixed(2);

    // Si es recepción total y coincide con la PO, heredar exactamente los valores de la PO
    if (!hasDifferences && ordenCompra && ordenCompra.ocoSubtotal != null) {
      subtotal = ordenCompra.ocoSubtotal;
      iva = ordenCompra.ocoMontoIva != null ? ordenCompra.ocoMontoIva : +(subtotal * 0.12).toFixed(2);
      total = ordenCompra.ocoTotal != null ? ordenCompra.ocoTotal : +(subtotal + iva).toFixed(2);
    }

    const tipo: 'TOTAL' | 'PARCIAL' = hasDifferences ? 'PARCIAL' : 'TOTAL';

    return {
      subtotal,
      iva,
      total,
      tipo,
      hasDifferences,
      allVerified,
      totalItems,
      lineasCount: itemsInspection.length,
    };
  }, [itemsInspection, ordenCompra]);

  // Registrar recepción en backend & Oracle DB
  const handleConfirmRecepcion = async () => {
    if (!ordenCompra) return;
    if (!guiaDespacho.trim()) {
      setErrorMsg('Por favor ingresa el número de guía de remisión o despacho.');
      return;
    }

    if (tipoTransporte === 'AJENO') {
      if (!transportista.trim()) {
        setErrorMsg('Por favor ingresa la Empresa Proveedora de Transporte.');
        return;
      }
      if (!conductorAjeno.trim()) {
        setErrorMsg('Por favor ingresa el Nombre del Conductor.');
        return;
      }
      if (!placaVehiculo.trim()) {
        setErrorMsg('Por favor ingresa la Placa del Vehículo.');
        return;
      }
      if (!modeloVehiculo.trim()) {
        setErrorMsg('Por favor ingresa la Descripción o Modelo del Camión.');
        return;
      }
    } else {
      if (!idConductor) {
        setErrorMsg('Por favor selecciona el conductor asignado de la empresa.');
        return;
      }
      if (!idVehiculo) {
        setErrorMsg('Por favor selecciona el vehículo institucional para la recepción.');
        return;
      }

      const cond = conductores.find((c) => c.conIdConductor === idConductor);
      if (cond && cond.conFechaVencimientoLic) {
        const isExpired = new Date(cond.conFechaVencimientoLic) < new Date();
        if (isExpired) {
          setErrorMsg(`Atención: El conductor ${cond.conNombreEmpleado || 'Conductor #' + cond.conIdConductor} tiene la licencia vencida desde el ${formatDate(cond.conFechaVencimientoLic, '2026-01-01')}. Por favor regularice o asigne otro conductor.`);
          return;
        }
      }
    }

    if (!itemsInspection || itemsInspection.length === 0) {
      setErrorMsg('Debe incluir al menos un artículo en la recepción.');
      return;
    }

    const algunRecibido = itemsInspection.some((it) => Number(it.cantidadRecibida || 0) > 0);
    if (!algunRecibido) {
      setErrorMsg('Debe recibir al menos 1 unidad física en algún artículo para procesar la entrada.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const mappedItems = itemsInspection.map((it) => ({
        codigoArticulo: it.codigoArticulo,
        cantidadPedida: Number(it.cantidadOrdenada || 1),
        cantidadRecibida: Number(it.cantidadRecibida || 0),
        verificadoFisicamente: it.verificadoFisicamente ? 1 : 0,
        idUbicacion: Number(it.idUbicacion) || 1,
        costoUnitario: Number(it.precioUnitario || 0),
        precioUnitario: Number(it.precioUnitario || 0),
      }));

      const selectedCond = conductores.find((c) => c.conIdConductor === idConductor);
      const selectedVeh = vehiculos.find((v) => v.vehIdVehiculo === idVehiculo);
      const selectedProv = proveedores.find((p) => p.proIdProveedor === idProveedorTransporte);

      const nombreChoferPropio = selectedCond ? (selectedCond.conNombreEmpleado || 'Conductor #' + selectedCond.conIdConductor) : 'Conductor Interno';
      const transportistaFinal = tipoTransporte === 'AJENO'
        ? `${conductorAjeno.trim()} (${transportista.trim()})`
        : nombreChoferPropio;

      const placaFinal = tipoTransporte === 'PROPIO' ? (selectedVeh?.vehPlaca || placaVehiculo) : placaVehiculo.trim();
      const modeloFinal = tipoTransporte === 'PROPIO' ? `${selectedVeh?.vehMarca || ''} ${selectedVeh?.vehModelo || ''}`.trim() : modeloVehiculo.trim();

      const dto: IRegistrarRecepcionDTO = {
        noPo: ordenCompra.ocoNoPo,
        noDocumentoSolicitud: solicitud?.noDocumento,
        idBodega: Number(idBodega),
        guiaDespacho: guiaDespacho.trim(),
        transportista: transportistaFinal,
        rboTipoTransporte: tipoTransporte,
        rboTransportistaNombre: transportistaFinal,
        rboPlacaVehiculo: placaFinal || undefined,
        rboModeloVehiculo: modeloFinal || undefined,
        idVehiculo: tipoTransporte === 'PROPIO' ? idVehiculo : undefined,
        idConductor: tipoTransporte === 'PROPIO' ? idConductor : undefined,
        idProveedorTransporte: tipoTransporte === 'AJENO' ? idProveedorTransporte : undefined,
        placaAjena: tipoTransporte === 'AJENO' ? placaVehiculo.trim() : undefined,
        modeloAjeno: tipoTransporte === 'AJENO' ? modeloVehiculo.trim() : undefined,
        fechaLlegada: fechaLlegada ? new Date(fechaLlegada).toISOString() : new Date().toISOString(),
        idUsuarioBodega: 1, // Usuario bodega en sesión
        observaciones: observaciones.trim() || undefined,
        detalles: mappedItems,
        items: mappedItems,
      };

      const result = await RecepcionBodegaClientService.registrarRecepcion(dto, archivoComprobante);
      setRecepcionExistente(result);
      setSuccessMsg(`¡Recepción ${result.rboNoRecepcion} registrada con éxito! Kardex, inventario y comprobante digital guardados.`);
      setIsConfirmOpen(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('[BodegaView.handleConfirmRecepcion Error]:', err);
      setErrorMsg(err.message || 'Error al registrar el ingreso en bodega.');
    } finally {
      setIsSubmitting(false);
    }
  };


  // Filtrado de la vista general de recepciones
  const filteredRecepcionesGenerales = useMemo(() => {
    return recepcionesGenerales.filter((rec) => {
      const query = searchQuery.toLowerCase().trim();
      const bodegaNombre = rec.rboNombreBodega || rec.bodNombre || '';
      const usuarioNombre = rec.rboNombreUsuario || rec.usuarioNombre || '';
      const matchesSearch =
        !query ||
        rec.rboNoRecepcion.toLowerCase().includes(query) ||
        rec.rboNoPo.toLowerCase().includes(query) ||
        bodegaNombre.toLowerCase().includes(query) ||
        usuarioNombre.toLowerCase().includes(query);

      const matchesTipo =
        filterTipo === 'TODOS' ||
        (rec.rboTipoRecepcion || '').toUpperCase() === filterTipo.toUpperCase();

      const matchesBodega =
        filterBodega === 'TODAS' ||
        String(rec.rboIdBodega) === filterBodega;

      return matchesSearch && matchesTipo && matchesBodega;
    });
  }, [recepcionesGenerales, searchQuery, filterTipo, filterBodega]);

  // Métricas para la vista general
  const generalStats = useMemo(() => {
    const total = recepcionesGenerales.length;
    const totales = recepcionesGenerales.filter((r) => (r.rboTipoRecepcion || '').toUpperCase() === 'TOTAL').length;
    const parciales = recepcionesGenerales.filter((r) => (r.rboTipoRecepcion || '').toUpperCase() === 'PARCIAL').length;
    const totalMonto = recepcionesGenerales.reduce((acc, r) => acc + (Number(r.rboTotalFacturar) || 0), 0);

    return { total, totales, parciales, totalMonto };
  }, [recepcionesGenerales]);

  // Columnas para la tabla general
  const tableColumns = [
    {
      header: 'NO. RECEPCIÓN',
      accessorKey: 'rboNoRecepcion',
      align: 'left' as const,
      cell: ({ value, row }: { value: string; row: IRecepcionBodega }) => (
        <button
          type="button"
          onClick={() => {
            RecepcionBodegaClientService.getRecepcionPorNoRecepcion(row.rboNoRecepcion).then((res) => {
              if (res) setSelectedRecepcionModal(res);
            });
          }}
          className="font-bold text-cyan-600 hover:text-cyan-800 hover:underline flex items-center gap-1.5 text-xs text-left"
        >
          <PackageCheck size={14} className="shrink-0" />
          {value}
        </button>
      ),
    },
    {
      header: 'ORDEN COMPRA (PO)',
      accessorKey: 'rboNoPo',
      align: 'left' as const,
      cell: ({ value }: { value: string }) => (
        <span className="font-semibold text-slate-700 text-xs">{value}</span>
      ),
    },
    {
      header: 'FECHA RECEPCIÓN',
      accessorKey: 'rboFechaRecepcion',
      align: 'left' as const,
      cell: ({ value }: { value: string | Date }) => (
        <span className="text-slate-600 text-xs">{formatDate(value, '2026-03-01')}</span>
      ),
    },
    {
      header: 'BODEGA DESTINO',
      accessorKey: 'bodNombre',
      align: 'left' as const,
      cell: ({ value, row }: { value: string; row: IRecepcionBodega }) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium">
          <Warehouse size={13} className="text-slate-400" />
          {row.rboNombreBodega || value || `Bodega #${row.rboIdBodega}`}
        </div>
      ),
    },
    {
      header: 'TIPO RECEPCIÓN',
      accessorKey: 'rboTipoRecepcion',
      align: 'center' as const,
      cell: ({ value }: { value: string }) => {
        const isTotal = (value || '').toUpperCase() === 'TOTAL';
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
              isTotal
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {isTotal ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
            {isTotal ? 'TOTAL (100%)' : 'PARCIAL'}
          </span>
        );
      },
    },
    {
      header: 'TOTAL FACTURAR',
      accessorKey: 'rboTotalFacturar',
      align: 'right' as const,
      cell: ({ value }: { value: number }) => (
        <span className="font-bold text-slate-900 text-xs">{formatCurrency(value)}</span>
      ),
    },
    {
      header: 'ACCIONES',
      accessorKey: 'acciones',
      align: 'center' as const,
      cell: ({ row }: { row: IRecepcionBodega }) => (
        <Button
          variant="ghost"
          size="sm"
          icon={FileText}
          onClick={() => {
            RecepcionBodegaClientService.getRecepcionPorNoRecepcion(row.rboNoRecepcion).then((res) => {
              if (res) setSelectedRecepcionModal(res);
            });
          }}
        >
          Comprobante
        </Button>
      ),
    },
  ];

  // RENDER: Vista de Solicitud Específica (Etapa 5 del Pipeline)
  if (solicitud) {
    return (
      <div className="space-y-6 w-full pb-16 animate-fadeIn min-w-0">
        {/* Encabezado de Navegación */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack}>
                Volver a Registros
              </Button>
            )}
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center gap-1.5">
              <Warehouse size={13} />
              Etapa 5 de 6: Recepción en Almacén
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              Recepción en Bodega & Control de Inventario
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={() => loadSingleSolicitudData(solicitud.noDocumento)}
              disabled={isLoading}
            >
              Actualizar
            </Button>
          </div>
        </div>

        {/* Tarjeta de Solicitud Original */}
        <SolicitudOriginalCard solicitud={solicitud} />

        {/* Alertas de Error o Éxito */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-900">Atención en Recepción</p>
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
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-start gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-emerald-900">Operación Exitosa</p>
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

        {/* SI YA TIENE RECEPCIÓN REGISTRADA */}
        {recepcionExistente ? (
          <div className="space-y-6">
            {/* Tarjeta de Recepción Confirmada (Diseño Estándar Institucional) */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Mercancía Ingresada al Kardex e Inventario
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Comprobante de Recepción: {recepcionExistente.rboNoRecepcion}
                  </h2>
                  <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                    La mercancía amparada bajo la Orden de Compra <span className="font-semibold text-slate-900">{recepcionExistente.rboNoPo}</span> fue verificada físicamente e ingresada en <span className="font-semibold text-slate-900">{recepcionExistente.rboNombreBodega || recepcionExistente.bodNombre || `Bodega #${recepcionExistente.rboIdBodega}`}</span>.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  <Button
                    variant="primary"
                    size="md"
                    icon={ArrowRight}
                    iconPosition="right"
                    onClick={() => {
                      if (onNavigateToStage) {
                        onNavigateToStage('3way');
                      } else if (onSuccess) {
                        onSuccess();
                      }
                    }}
                  >
                    Avanzar a 3-Way Match (Etapa 6)
                  </Button>
                </div>
              </div>
            </div>

            {/* Resumen de Recepción y Datos de Transporte */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <Truck size={16} className="text-cyan-600" />
                    Datos de Transporte
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    (recepcionExistente.rboTipoTransporte || tipoTransporte) === 'PROPIO'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}>
                    {(recepcionExistente.rboTipoTransporte || tipoTransporte) === 'PROPIO' ? 'Flota Propia' : 'Transporte Ajeno'}
                  </span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Guía de Despacho:</span>
                    <span className="font-bold text-slate-800">{recepcionExistente.guiaDespacho || guiaDespacho || 'GR-OFICIAL'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Transportista / Chofer:</span>
                    <span className="font-medium text-slate-800">
                      {recepcionExistente.rboTransportistaNombre || recepcionExistente.empleadoChoferNombre || recepcionExistente.transportista || transportista || 'Conductor asignado'}
                    </span>
                  </div>
                  {(recepcionExistente.rboPlacaVehiculo || recepcionExistente.rboModeloVehiculo || placaVehiculo) && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Vehículo / Placa:</span>
                      <span className="font-medium text-slate-800">
                        {recepcionExistente.rboPlacaVehiculo || placaVehiculo} {recepcionExistente.rboModeloVehiculo ? `(${recepcionExistente.rboModeloVehiculo})` : ''}
                      </span>
                    </div>
                  )}
                  {recepcionExistente.conDpi && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">DPI Conductor:</span>
                      <span className="font-medium text-slate-800">{recepcionExistente.conDpi}</span>
                    </div>
                  )}
                  {recepcionExistente.conNoLicencia && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Licencia:</span>
                      <span className="font-medium text-slate-800">
                        Tipo {recepcionExistente.conTipoLicencia} - {recepcionExistente.conNoLicencia}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Fecha Recepción:</span>
                    <span className="font-medium text-slate-800">{formatDate(recepcionExistente.rboFechaRecepcion, '2026-03-01')}</span>
                  </div>
                  <div className="pt-2">
                    <a
                      href={RecepcionBodegaClientService.getDocumentoUrl(recepcionExistente.rboNoRecepcion)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-colors shadow-2xs"
                    >
                      <Eye size={14} className="text-cyan-600" />
                      Ver Comprobante Adjunto
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <Warehouse size={16} className="text-amber-600" />
                  Almacén y Responsable
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Bodega Destino:</span>
                    <span className="font-bold text-slate-800">{recepcionExistente.rboNombreBodega || recepcionExistente.bodNombre || `Bodega #${recepcionExistente.rboIdBodega}`}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Responsable Bodega:</span>
                    <span className="font-medium text-slate-800">{recepcionExistente.rboNombreUsuario || recepcionExistente.usuarioNombre || 'Bodeguero en turno'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Tipo Recepción:</span>
                    <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                      (recepcionExistente.rboTipoRecepcion || '').toUpperCase() === 'TOTAL'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {recepcionExistente.rboTipoRecepcion || 'TOTAL'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <DollarSign size={16} className="text-emerald-600" />
                  Valoración Ingresada
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Subtotal Recibido:</span>
                    <span className="font-medium text-slate-800">{formatCurrency(recepcionExistente.rboSubtotalRecibido)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">IVA (12%):</span>
                    <span className="font-medium text-slate-800">{formatCurrency(recepcionExistente.rboIvaRecibido)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-bold text-slate-900">Total a Facturar:</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(recepcionExistente.rboTotalFacturar)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de Artículos Recibidos */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <PackageCheck size={18} className="text-emerald-600" />
                  Artículos Recibidos e Ingresados en Inventario (Kardex)
                </h3>
                <span className="text-xs text-slate-500">
                  {recepcionExistente.detalles?.length || 0} artículo(s)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">CÓDIGO</th>
                      <th className="px-4 py-3">DESCRIPCIÓN</th>
                      <th className="px-4 py-3 text-center">CANTIDAD RECIBIDA</th>
                      <th className="px-4 py-3 text-center">INSPECCIÓN FÍSICA</th>
                      <th className="px-4 py-3 text-right">PRECIO UNITARIO</th>
                      <th className="px-4 py-3 text-right">TOTAL LÍNEA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(recepcionExistente.detalles || []).map((det, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">
                          {det.dreCodigoArticulo}
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">
                          {det.artDescripcion || det.dreDescripcionArticulo || det.dreCodigoArticulo}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-900">
                          {det.dreCantidadRecibida}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {det.dreVerificadoFisicamente ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 size={12} /> Conforme
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <AlertTriangle size={12} /> Observado
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 font-mono">
                          {formatCurrency(det.precioUnitario || det.drePrecioUnitario || 0)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                          {formatCurrency((det.dreCantidadRecibida || 0) * (det.precioUnitario || det.drePrecioUnitario || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* FORMULARIO DE RECEPCIÓN FÍSICA E INSPECCIÓN */
          <div className="space-y-6">
            {/* 1. SECCIÓN: DATOS DE TRANSPORTE Y GUÍA DE DESPACHO */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                  <Truck size={20} className="text-cyan-600" />
                  1. Guía de Despacho y Gestión de Transporte (Recepción Física)
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  Orden de Compra: {ordenCompra?.ocoNoPo || 'PO-...'}
                </span>
              </div>

              {/* Selector de Tipo de Transporte: PROPIO vs AJENO */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block">Tipo de Transporte Logístico:</label>
                  <p className="text-[11px] text-slate-500">Indica si el flete fue realizado por la flota interna de la empresa o por un tercero/proveedor.</p>
                </div>
                <div className="inline-flex rounded-lg p-1 bg-slate-200/80 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoTransporte('AJENO');
                      setTransportista('');
                      setConductorAjeno('');
                      setPlacaVehiculo('');
                      setModeloVehiculo('');
                      setIdProveedorTransporte(undefined);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                      tipoTransporte === 'AJENO'
                        ? 'bg-white text-purple-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Truck size={14} />
                    Transporte Ajeno / Tercero
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoTransporte('PROPIO');
                      const selVeh = vehiculos.find((v) => v.vehIdVehiculo === idVehiculo) || vehiculos[0];
                      if (selVeh) {
                        setIdVehiculo(selVeh.vehIdVehiculo);
                        setPlacaVehiculo(selVeh.vehPlaca);
                        setModeloVehiculo(`${selVeh.vehMarca} ${selVeh.vehModelo || ''}`.trim());
                      }
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                      tipoTransporte === 'PROPIO'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserCheck size={14} />
                    Transporte Propio (Empresa)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TextInput
                  label="No. Guía de Remisión / Despacho"
                  required
                  placeholder="Ej: GR-2026-9041"
                  value={guiaDespacho}
                  onChange={(e) => setGuiaDespacho(e.target.value)}
                  icon={Barcode}
                />

                <TextInput
                  label="Fecha y Hora de Llegada"
                  type="datetime-local"
                  required
                  value={fechaLlegada}
                  onChange={(e) => setFechaLlegada(e.target.value)}
                  icon={Calendar}
                />

                <Select
                  label="Bodega de Destino"
                  required
                  value={idBodega}
                  onChange={(e) => setIdBodega(Number(e.target.value))}
                  icon={Warehouse}
                  options={
                    bodegas.length > 0
                      ? bodegas.map((b) => ({
                          value: b.idBodega,
                          label: b.codigo ? `[${b.codigo}] ${b.nombre}` : (b.nombre || `Bodega #${b.idBodega}`),
                        }))
                      : [{ value: 1, label: 'Bodega Central de Almacén' }]
                  }
                />
              </div>

              {/* Contenido Dinámico según Tipo de Transporte */}
              {tipoTransporte === 'PROPIO' ? (
                <div className="space-y-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Selector de Conductor Institucional con validación */}
                    <div>
                      <Select
                        label="Conductor Asignado (Flota Propia)"
                        required
                        value={idConductor || (conductores[0]?.conIdConductor ?? '')}
                        onChange={(e) => setIdConductor(Number(e.target.value))}
                        icon={UserCheck}
                        options={
                          conductores.length > 0
                            ? conductores.map((c) => ({
                                value: c.conIdConductor,
                                label: `${c.conNombreEmpleado || 'Conductor #' + c.conIdConductor} (DPI: ${c.conDpi || 'S/D'})`,
                              }))
                            : [{ value: '', label: 'No hay conductores registrados' }]
                        }
                      />
                      {(() => {
                        const cond = conductores.find((c) => c.conIdConductor === idConductor);
                        if (!cond) return null;
                        const isExpired = cond.conFechaVencimientoLic ? new Date(cond.conFechaVencimientoLic) < new Date() : false;
                        return (
                          <div className={`mt-2 p-2.5 rounded-lg text-xs flex items-center justify-between border ${
                            isExpired ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          }`}>
                            <div className="space-y-0.5">
                              <p className="font-bold">Licencia: Tipo {cond.conTipoLicencia} - No. {cond.conNoLicencia}</p>
                              <p className="text-[11px]">DPI: {cond.conDpi} | Vence: {formatDate(cond.conFechaVencimientoLic, '2026-12-31')}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isExpired ? 'bg-rose-200 text-rose-900' : 'bg-emerald-200 text-emerald-900'
                            }`}>
                              {isExpired ? '⚠️ Licencia Vencida' : '✓ Vigente'}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Selector de Vehículo Institucional */}
                    <div>
                      <Select
                        label="Vehículo Institucional Asignado"
                        required
                        value={idVehiculo || (vehiculos[0]?.vehIdVehiculo ?? '')}
                        onChange={(e) => {
                          const vId = Number(e.target.value);
                          setIdVehiculo(vId);
                          const veh = vehiculos.find((v) => v.vehIdVehiculo === vId);
                          if (veh) {
                            setPlacaVehiculo(veh.vehPlaca);
                            setModeloVehiculo(`${veh.vehMarca} ${veh.vehModelo || ''}`.trim());
                          }
                        }}
                        icon={Car}
                        options={
                          vehiculos.length > 0
                            ? vehiculos.map((v) => ({
                                value: v.vehIdVehiculo,
                                label: `[${v.vehPlaca}] ${v.vehMarca} ${v.vehModelo || ''} (${v.vehAnio || 'N/A'})`,
                              }))
                            : [{ value: '', label: 'No hay vehículos registrados' }]
                        }
                      />
                      {(() => {
                        const veh = vehiculos.find((v) => v.vehIdVehiculo === idVehiculo);
                        if (!veh) return null;
                        return (
                          <div className="mt-2 p-2.5 rounded-lg text-xs bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-between">
                            <div>
                              <p className="font-bold">Placa: {veh.vehPlaca} | {veh.vehMarca} {veh.vehModelo}</p>
                              <p className="text-[11px] text-slate-500">Año: {veh.vehAnio || 'N/A'} | Estado: {veh.vehEstado}</p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              Flota Activa
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-4 rounded-xl bg-purple-50/50 border border-purple-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput
                      label="Empresa Proveedora de Transporte"
                      required
                      placeholder="Ej. Trans-Logística S.A."
                      value={transportista}
                      onChange={(e) => setTransportista(e.target.value)}
                      icon={Truck}
                    />

                    <TextInput
                      label="Nombre del Conductor"
                      required
                      placeholder="Ej. Juan Carlos Pérez"
                      value={conductorAjeno}
                      onChange={(e) => setConductorAjeno(e.target.value)}
                      icon={UserCheck}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput
                      label="Placa del Vehículo"
                      required
                      placeholder="Ej. P-123ABC"
                      value={placaVehiculo}
                      onChange={(e) => setPlacaVehiculo(e.target.value)}
                      icon={Car}
                    />

                    <TextInput
                      label="Descripción / Modelo del Camión"
                      required
                      placeholder="Ej. Camión Freightliner 10 Toneladas"
                      value={modeloVehiculo}
                      onChange={(e) => setModeloVehiculo(e.target.value)}
                      icon={Truck}
                    />
                  </div>
                </div>
              )}

              {/* Adjuntar Comprobante Físico / Guía de Remisión (BLOB) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileUp size={16} className="text-cyan-600" />
                    Adjuntar Comprobante Físico o Guía de Remisión Firmada (Archivo Digital):
                  </label>
                  <span className="text-[11px] font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                    Almacenamiento Seguro
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="archivo-recepcion-input"
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setArchivoComprobante(e.target.files[0]);
                      }
                    }}
                    className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
                  />
                  {archivoComprobante && (
                    <div className="flex items-center gap-2 text-xs text-slate-700 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                      <FileText size={14} className="text-emerald-600" />
                      <span>{archivoComprobante.name} ({(archivoComprobante.size / 1024).toFixed(1)} KB)</span>
                      <button
                        type="button"
                        onClick={() => {
                          setArchivoComprobante(null);
                          const input = document.getElementById('archivo-recepcion-input') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                        className="text-rose-500 hover:text-rose-700 p-0.5"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-1">
                <TextInput
                  label="Observaciones Generales de la Entrega (Opcional)"
                  placeholder="Ej: Entrega realizada en camión refrigerado, precintos intactos..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>
            </div>

            {/* 2. SECCIÓN: INSPECCIÓN DE CALIDAD Y CONTEO FÍSICO */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <PackageCheck size={20} className="text-emerald-600" />
                    2. Inspección de Calidad & Conteo Físico de Mercancía
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verifica el estado físico del embalaje, cuenta los artículos recibidos y asigna la estantería o lote de almacén.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Check}
                    onClick={handleMarkAllConforming}
                    className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 bg-white"
                  >
                    Marcar Todo Conforme (100%)
                  </Button>
                </div>
              </div>

              {/* Tabla de Artículos a Recibir */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">ARTÍCULO / CÓDIGO</th>
                      <th className="px-4 py-3 text-center">CANT. ORDENADA</th>
                      <th className="px-4 py-3 text-center w-36">CANT. RECIBIDA</th>
                      <th className="px-4 py-3 text-center">ESTADO RECEPCIÓN</th>
                      <th className="px-4 py-3 text-center">INSPECCIÓN FÍSICA</th>
                      <th className="px-4 py-3">UBICACIÓN / ESTANTERÍA</th>
                      <th className="px-4 py-3 text-right">COSTO UNIT.</th>
                      <th className="px-4 py-3 text-right">VALOR TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemsInspection.map((item) => {
                      const isComplete = item.cantidadRecibida === item.cantidadOrdenada;
                      const isPartial = item.cantidadRecibida < item.cantidadOrdenada && item.cantidadRecibida > 0;
                      const isZero = item.cantidadRecibida === 0;
                      const isExcess = item.cantidadRecibida > item.cantidadOrdenada;

                      return (
                        <tr key={item.codigoArticulo} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-mono font-bold text-slate-900">{item.codigoArticulo}</div>
                            <div className="text-slate-600 text-[11px] font-medium max-w-xs truncate">
                              {item.descripcionArticulo}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center font-bold text-slate-700 text-sm font-mono">
                            {item.cantidadOrdenada}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="1"
                                min={0}
                                max={item.cantidadOrdenada * 2}
                                value={item.cantidadRecibida}
                                onKeyDown={(e) => {
                                  if (['e', 'E', '.', ',', '-', '+'].includes(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                                onChange={(e) => {
                                  const parsed = parseInt(e.target.value, 10);
                                  handleQuantityChange(item.codigoArticulo, isNaN(parsed) ? 0 : parsed);
                                }}
                                className={`w-20 h-9 px-2 text-center text-sm font-bold rounded-lg border outline-none font-mono ${
                                  isComplete
                                    ? 'border-emerald-300 bg-emerald-50/40 text-emerald-900 focus:ring-2 focus:ring-emerald-200'
                                    : isPartial
                                    ? 'border-amber-400 bg-amber-50/60 text-amber-900 focus:ring-2 focus:ring-amber-200'
                                    : isZero
                                    ? 'border-rose-300 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-200'
                                    : 'border-blue-300 bg-blue-50/40 text-blue-900 focus:ring-2 focus:ring-blue-200'
                                }`}
                              />
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center">
                            {isComplete ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 size={12} /> Completo
                              </span>
                            ) : isPartial ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <AlertTriangle size={12} /> Parcial (-{item.cantidadOrdenada - item.cantidadRecibida})
                              </span>
                            ) : isZero ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                <X size={12} /> No Recibido
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                Excedente (+{item.cantidadRecibida - item.cantidadOrdenada})
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={item.verificadoFisicamente}
                                onChange={(e) => handleVerifyChange(item.codigoArticulo, e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                              />
                              <span className={`text-[11px] font-semibold ${item.verificadoFisicamente ? 'text-emerald-700' : 'text-slate-400'}`}>
                                {item.verificadoFisicamente ? 'Empaque OK' : 'Pendiente'}
                              </span>
                            </label>
                          </td>

                          <td className="px-4 py-3">
                            <select
                              value={item.idUbicacion}
                              onChange={(e) => handleLocationChange(item.codigoArticulo, Number(e.target.value))}
                              className="h-8 px-2 text-xs rounded-md border border-slate-200 bg-white text-slate-800 font-medium outline-none focus:border-blue-500 max-w-[180px]"
                            >
                              {ubicaciones
                                .filter((u) => u.idBodega === Number(idBodega))
                                .map((u) => (
                                  <option key={u.idUbicacion} value={u.idUbicacion}>
                                    {u.codigo} {u.descripcion ? `- ${u.descripcion}` : ''}
                                  </option>
                                ))}
                              {ubicaciones.filter((u) => u.idBodega === Number(idBodega)).length === 0 && (
                                <option value="1">Ubicación Principal</option>
                              )}
                            </select>
                          </td>

                          <td className="px-4 py-3 text-right font-mono text-slate-700 font-medium">
                            {formatCurrency(item.precioUnitario)}
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(item.cantidadRecibida * item.precioUnitario)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. RESUMEN FINANCIERO, IMPACTO EN KARDEX Y BOTÓN DE CONFIRMACIÓN */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Card de Impacto en Inventario / Kardex (Tema Claro Corporativo) */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Box size={20} className="text-cyan-600" />
                    <span className="font-bold text-sm text-slate-900">
                      3. Control de Existencias e Ingreso a Inventario
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    financialSummary.tipo === 'TOTAL'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {financialSummary.tipo === 'TOTAL' ? 'RECEPCIÓN TOTAL' : 'RECEPCIÓN PARCIAL'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-slate-500 font-medium">Tipo Movimiento:</span>
                    <p className="font-bold text-slate-900 text-sm">Entrada por Compra</p>
                    <p className="text-[10px] text-slate-500">Ingreso formal a almacén</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-slate-500 font-medium">Artículos / Unidades:</span>
                    <p className="font-bold text-slate-900 text-sm">{financialSummary.totalItems} unidades</p>
                    <p className="text-[10px] text-slate-500">En {financialSummary.lineasCount} líneas de producto</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-slate-500 font-medium">Actualización Stock:</span>
                    <p className="font-bold text-emerald-600 text-sm">Inmediata (Realtime)</p>
                    <p className="text-[10px] text-slate-500">Existencia & Costo compra</p>
                  </div>
                </div>

                {financialSummary.hasDifferences ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2.5">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Aviso de Recepción Parcial:</span> Se detectaron discrepancias entre lo ordenado y lo recibido. El sistema registrará el estatus PARCIAL y mantendrá la trazabilidad intacta sin corromper el histórico de compras ni el inventario.
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2.5">
                    <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Recepción 100% Conforme:</span> Todas las cantidades coinciden con la Orden de Compra y están verificadas físicamente.
                    </div>
                  </div>
                )}
              </div>

              {/* Card de Liquidación y Confirmación */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                  <DollarSign size={18} className="text-emerald-600" />
                  Liquidación de Recepción
                </h4>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Recibido:</span>
                    <span className="font-mono font-medium">{formatCurrency(financialSummary.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>IVA (12%):</span>
                    <span className="font-mono font-medium">{formatCurrency(financialSummary.iva)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900">Total a Facturar:</span>
                    <span className="font-bold text-lg text-slate-900 font-mono">
                      {formatCurrency(financialSummary.total)}
                    </span>
                  </div>
                </div>

                <div className="pt-3">
                  <Button
                    variant="primary"
                    size="lg"
                    icon={PackageCheck}
                    onClick={() => setIsConfirmOpen(true)}
                    disabled={isSubmitting || financialSummary.totalItems === 0}
                    className="w-full justify-center bg-cyan-700 hover:bg-cyan-600 text-white shadow-md font-bold text-sm py-3"
                  >
                    Confirmar Ingreso a Bodega e Inventario
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación Corporativo */}
        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleConfirmRecepcion}
          title="¿Confirmar Recepción e Ingreso a Inventario?"
          description={`Se registrará la entrada física de mercancía por valor de ${formatCurrency(financialSummary.total)} amparada en la Guía de Despacho ${guiaDespacho}. Esta acción actualizará las existencias en el inventario de la bodega y registrará formalmente la entrada de la mercancía.`}
          itemName={`PO: ${ordenCompra?.ocoNoPo} | Tipo: ${financialSummary.tipo}`}
          confirmText="Confirmar Ingreso a Bodega"
          cancelText="Revisar Conteo"
          variant="primary"
          confirmIcon={PackageCheck}
          isLoading={isSubmitting}
        />
      </div>
    );
  }

  // RENDER: Vista Standalone / Historial General de Recepciones de Bodega
  return (
    <div className="space-y-6 w-full pb-16 animate-fadeIn min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Warehouse className="text-cyan-600" size={24} />
            Módulo de Recepción en Bodega & Control de Inventario
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de ingresos físicos, guías de remisión, inspección de calidad y movimientos de Kardex.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={loadGeneralData}
            disabled={isLoadingGeneral}
          >
            Actualizar Historial
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Recepciones"
          value={generalStats.total}
          icon={PackageCheck}
          changeLabel="en almacén"
        />
        <StatCard
          title="Recepciones Totales"
          value={generalStats.totales}
          icon={CheckCircle2}
          changeLabel="100% conformes"
        />
        <StatCard
          title="Recepciones Parciales"
          value={generalStats.parciales}
          icon={AlertTriangle}
          changeLabel="con diferencias"
        />
        <StatCard
          title="Monto Ingresado (Kardex)"
          value={formatCurrency(generalStats.totalMonto)}
          icon={DollarSign}
          changeLabel="valor al stock"
        />
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <TextInput
            placeholder="Buscar por No. Recepción, PO, Bodega..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={Search}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="w-44">
            <Select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              options={[
                { value: 'TODOS', label: 'Todos los Tipos' },
                { value: 'TOTAL', label: 'Recepción Total' },
                { value: 'PARCIAL', label: 'Recepción Parcial' },
              ]}
              icon={Filter}
            />
          </div>

          <div className="w-48">
            <Select
              value={filterBodega}
              onChange={(e) => setFilterBodega(e.target.value)}
              options={[
                { value: 'TODAS', label: 'Todas las Bodegas' },
                ...bodegas.map((b) => ({
                  value: String(b.idBodega),
                  label: b.nombre,
                })),
              ]}
              icon={Warehouse}
            />
          </div>
        </div>
      </div>

      {/* Tabla de Registros Generales */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <DataTable
          columns={tableColumns}
          data={filteredRecepcionesGenerales}
          isLoading={isLoadingGeneral}
          emptyText="No se encontraron recepciones de bodega registradas con los filtros seleccionados."
        />
      </div>

      {/* Modal Detalle de Recepción Seleccionada */}
      {selectedRecepcionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-scaleUp max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <PackageCheck size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Comprobante de Recepción: {selectedRecepcionModal.rboNoRecepcion}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Orden de Compra: <span className="font-semibold text-slate-800">{selectedRecepcionModal.rboNoPo}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecepcionModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Bodega:</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {selectedRecepcionModal.rboNombreBodega || selectedRecepcionModal.bodNombre || `Bodega #${selectedRecepcionModal.rboIdBodega}`}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Fecha Recepción:</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {formatDate(selectedRecepcionModal.rboFechaRecepcion, '2026-03-01')}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Total Facturar:</span>
                  <span className="font-bold text-emerald-600 text-sm font-mono">
                    {formatCurrency(selectedRecepcionModal.rboTotalFacturar)}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5">CÓDIGO</th>
                      <th className="px-3 py-2.5">DESCRIPCIÓN</th>
                      <th className="px-3 py-2.5 text-center">CANT. RECIBIDA</th>
                      <th className="px-3 py-2.5 text-center">ESTADO</th>
                      <th className="px-3 py-2.5 text-right">TOTAL LÍNEA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedRecepcionModal.detalles || []).map((det, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-mono font-bold text-slate-800">{det.dreCodigoArticulo}</td>
                        <td className="px-3 py-2 text-slate-700 font-medium">{det.artDescripcion || det.dreDescripcionArticulo || det.dreCodigoArticulo}</td>
                        <td className="px-3 py-2 text-center font-bold text-slate-900">{det.dreCantidadRecibida}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Verificado
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900 font-mono">
                          {formatCurrency((det.dreCantidadRecibida || 0) * (det.precioUnitario || det.drePrecioUnitario || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <a
                href={RecepcionBodegaClientService.getDocumentoUrl(selectedRecepcionModal.rboNoRecepcion)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors shadow-2xs"
              >
                <Download size={14} className="text-cyan-600" />
                Descargar Documento / Guía
              </a>
              <Button variant="secondary" onClick={() => setSelectedRecepcionModal(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

