export interface ISolicitudHeader {
  noDocumento: string;
  fecha: string;
  entidad: string;
  departamento: string;
  responsable: string;
  montoTotal: number;
  estado: string;
}

export interface ICotizacionProveedorData {
  nombreProveedor: string;
  precioTotal: number | string;
  tiempoEntregaDias: number | string;
  plazoPago: string;
  archivoPdfBase64: string | null;
  archivoPdfNombre: string | null;
}

export interface IMatrizCotizacionState {
  solicitud: ISolicitudHeader;
  cotizaciones: [ICotizacionProveedorData, ICotizacionProveedorData, ICotizacionProveedorData];
  esExcepcionUnico: boolean;
  justificacionExcepcion: string;
}

const SAMPLE_SOLICITUDES: ISolicitudHeader[] = [
  {
    noDocumento: 'SOL-001',
    fecha: '15/10/2023',
    entidad: 'Distribuidora Nacional S.A.',
    departamento: 'Tecnología',
    responsable: 'Carlos Mendoza',
    montoTotal: 778.4,
    estado: 'Aprobado',
  },
  {
    noDocumento: 'SOL-2024-001',
    fecha: '24 Oct 2023',
    entidad: 'Equipos Universitarios R.L.',
    departamento: 'Tecnología',
    responsable: 'Carlos Mendoza',
    montoTotal: 12450.0,
    estado: 'Aprobado',
  },
  {
    noDocumento: 'SOL-2024-002',
    fecha: '23 Oct 2023',
    entidad: 'Suministros Globales S.A.',
    departamento: 'Operaciones',
    responsable: 'Sofía Rodríguez',
    montoTotal: 3200.0,
    estado: 'Pendiente',
  },
  {
    noDocumento: 'SOL-2024-003',
    fecha: '22 Oct 2023',
    entidad: 'Consultores de Sistemas Gt',
    departamento: 'Finanzas',
    responsable: 'Alejandro Ruiz',
    montoTotal: 45000.0,
    estado: 'En Revisión',
  },
  {
    noDocumento: 'SOL-2024-004',
    fecha: '21 Oct 2023',
    entidad: 'Comercializadora del Sur',
    departamento: 'Marketing',
    responsable: 'Valeria Gómez',
    montoTotal: 1850.0,
    estado: 'Aprobado',
  },
];

const MATRIZ_CACHE: Record<string, IMatrizCotizacionState> = {
  'SOL-001': {
    solicitud: SAMPLE_SOLICITUDES[0],
    cotizaciones: [
      {
        nombreProveedor: 'Distribuidora Nacional S.A.',
        precioTotal: 778.4,
        tiempoEntregaDias: 5,
        plazoPago: '30 días',
        archivoPdfBase64: null,
        archivoPdfNombre: null,
      },
      {
        nombreProveedor: '',
        precioTotal: '',
        tiempoEntregaDias: '',
        plazoPago: '',
        archivoPdfBase64: null,
        archivoPdfNombre: null,
      },
      {
        nombreProveedor: '',
        precioTotal: '',
        tiempoEntregaDias: '',
        plazoPago: '',
        archivoPdfBase64: null,
        archivoPdfNombre: null,
      },
    ],
    esExcepcionUnico: false,
    justificacionExcepcion: '',
  },
};

export class CotizacionMatrizService {
  static getSolicitudes(): ISolicitudHeader[] {
    return SAMPLE_SOLICITUDES;
  }

  static getMatrizBySolicitudNo(noDocumento: string): IMatrizCotizacionState {
    if (MATRIZ_CACHE[noDocumento]) {
      return JSON.parse(JSON.stringify(MATRIZ_CACHE[noDocumento]));
    }

    const sol = SAMPLE_SOLICITUDES.find((s) => s.noDocumento === noDocumento) || {
      noDocumento,
      fecha: '15/10/2023',
      entidad: 'Distribuidora Nacional S.A.',
      departamento: 'Tecnología',
      responsable: 'Carlos Mendoza',
      montoTotal: 778.4,
      estado: 'Aprobado',
    };

    return {
      solicitud: sol,
      cotizaciones: [
        { nombreProveedor: '', precioTotal: '', tiempoEntregaDias: '', plazoPago: '', archivoPdfBase64: null, archivoPdfNombre: null },
        { nombreProveedor: '', precioTotal: '', tiempoEntregaDias: '', plazoPago: '', archivoPdfBase64: null, archivoPdfNombre: null },
        { nombreProveedor: '', precioTotal: '', tiempoEntregaDias: '', plazoPago: '', archivoPdfBase64: null, archivoPdfNombre: null },
      ],
      esExcepcionUnico: false,
      justificacionExcepcion: '',
    };
  }

  static saveMatriz(data: IMatrizCotizacionState): void {
    MATRIZ_CACHE[data.solicitud.noDocumento] = JSON.parse(JSON.stringify(data));
  }
}
