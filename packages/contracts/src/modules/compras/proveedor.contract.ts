export interface IProveedor {
  proIdProveedor: number;
  proNit: string | null;
  proNombreEntidad: string;
  proActivo: number;
}

export interface ICreateProveedorDTO {
  proNit: string;
  proNombreEntidad: string;
  proActivo?: number;
}

export interface IUpdateProveedorDTO {
  proNit?: string | null;
  proNombreEntidad?: string;
  proActivo?: number;
}

export const PROVEEDOR_NIT_MIN_LENGTH = 8;
export const PROVEEDOR_NIT_MAX_LENGTH = 13;

export interface IValidacionIdentificacionProveedor {
  valido: boolean;
  mensaje?: string;
}

/**
 * Valida de forma estricta el formato y longitud del número de identificación (NIT / DPI) del proveedor.
 * Exige exclusivamente dígitos numéricos y una longitud de entre 8 y 13 caracteres.
 */
export function validarIdentificacionProveedor(nit?: string | null): IValidacionIdentificacionProveedor {
  if (!nit || typeof nit !== 'string' || nit.trim() === '') {
    return {
      valido: false,
      mensaje: 'El número de identificación (NIT / DPI) es estrictamente obligatorio.',
    };
  }

  const trimmed = nit.trim();

  if (!/^[0-9]+$/.test(trimmed)) {
    return {
      valido: false,
      mensaje: 'El número de identificación (NIT / DPI) debe contener exclusivamente dígitos numéricos (0-9).',
    };
  }

  if (trimmed.length < PROVEEDOR_NIT_MIN_LENGTH || trimmed.length > PROVEEDOR_NIT_MAX_LENGTH) {
    return {
      valido: false,
      mensaje: `El número de identificación (NIT / DPI) debe tener entre ${PROVEEDOR_NIT_MIN_LENGTH} y ${PROVEEDOR_NIT_MAX_LENGTH} caracteres (actualmente tiene ${trimmed.length}).`,
    };
  }

  // Regla: Los NITs (menos de 13 dígitos) no pueden iniciar con cero.
  // Los DPIs de 13 dígitos sí pueden iniciar con cero (códigos de departamento 01 al 22 de Guatemala).
  if (trimmed.startsWith('0') && trimmed.length < 13) {
    return {
      valido: false,
      mensaje: 'El NIT no puede iniciar con cero (únicamente permitido para DPI de 13 dígitos).',
    };
  }

  return { valido: true };
}

export interface IProveedorFilterParams {
  nombre?: string;
  nit?: string;
  activo?: number;
}
