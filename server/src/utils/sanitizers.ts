/**
 * server/src/utils/sanitizers.ts
 * Utilidades centralizadas de saneamiento y validación defensiva de datos para los servicios del ERP.
 */

// Caracteres peligrosos explícitamente prohibidos para nombres nominales (*, /, @, <, >, =, ;, etc.)
export const CARACTERES_PROHIBIDOS_REGEX = /[*\/@<>=;\\!$%#^?{}[\]~+&|`]/;

// Caracteres prohibidos en direcciones o notas libres (permite #, /, comas, puntos y guiones, pero bloquea inyecciones HTML/SQL)
export const CARACTERES_DIRECCION_PROHIBIDOS_REGEX = /[<>=;\\!$%^?{}[\]~+&|`]/;

// Regex para nombres nominales (letras con acentos y eñes, números, espacios, puntos, comas, guiones y paréntesis)
export const NOMBRE_NOMINAL_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.,\-\(\)]+$/;

// Regex para códigos restrictivos (alfanumérico en mayúsculas, guiones, puntos y guion bajo)
export const CODIGO_ESTRICTO_REGEX = /^[A-Z0-9\.\-_]+$/;

// Regex para códigos con guion bajo exclusivamente (ej. tipos de movimiento)
export const CODIGO_TIPO_MOVIMIENTO_REGEX = /^[A-Z0-9_]+$/;

// Regex para abreviaturas de unidades de medida (permite letras, números, puntos y diagonal '/')
export const ABREVIATURA_UNIDAD_REGEX = /^[A-Z0-9\.\/]+$/;

// Regex para formato de fecha ISO YYYY-MM-DD
export const FECHA_ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Valida y sanea un código restrictivo
 */
export function validateStrictCode(
  value: unknown,
  fieldName: string,
  maxLen: number = 30,
  minLen: number = 1
): string {
  if (value === undefined || value === null || typeof value !== 'string') {
    throw new Error(`El campo ${fieldName} es obligatorio y debe ser una cadena de texto.`);
  }

  const trimmed = value.trim().toUpperCase();

  if (trimmed.length < minLen) {
    throw new Error(`El campo ${fieldName} es obligatorio.`);
  }

  if (trimmed.length > maxLen) {
    throw new Error(`El campo ${fieldName} no puede exceder los ${maxLen} caracteres.`);
  }

  if (!CODIGO_ESTRICTO_REGEX.test(trimmed)) {
    throw new Error(
      `El campo ${fieldName} solo permite letras mayúsculas, dígitos numéricos, guiones y puntos (sin espacios ni símbolos especiales).`
    );
  }

  return trimmed;
}

/**
 * Valida y sanea texto nominal (nombres, marcas, categorías, descripciones estándar)
 */
export function validateNominalText(
  value: unknown,
  fieldName: string,
  maxLen: number = 100,
  minLen: number = 1
): string {
  if (value === undefined || value === null || typeof value !== 'string') {
    throw new Error(`El campo ${fieldName} es obligatorio y debe ser una cadena de texto.`);
  }

  const trimmed = value.trim();

  if (trimmed.length < minLen) {
    throw new Error(`El campo ${fieldName} es obligatorio.`);
  }

  if (trimmed.length > maxLen) {
    throw new Error(`El campo ${fieldName} no puede exceder los ${maxLen} caracteres.`);
  }

  if (CARACTERES_PROHIBIDOS_REGEX.test(trimmed)) {
    throw new Error(
      `El campo ${fieldName} contiene caracteres especiales no permitidos (*, /, @, <, >, =, etc.).`
    );
  }

  if (!NOMBRE_NOMINAL_REGEX.test(trimmed)) {
    throw new Error(
      `El campo ${fieldName} solo permite letras, números, espacios, puntos, comas y guiones.`
    );
  }

  return trimmed;
}

/**
 * Valida y sanea direcciones o notas libres contra inyecciones
 */
export function validateAddressOrNotes(
  value: unknown,
  fieldName: string,
  maxLen: number = 250
): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`El campo ${fieldName} debe ser una cadena de texto.`);
  }

  const trimmed = value.trim();
  if (trimmed === '') return null;

  if (trimmed.length > maxLen) {
    throw new Error(`El campo ${fieldName} no puede exceder los ${maxLen} caracteres.`);
  }

  if (CARACTERES_DIRECCION_PROHIBIDOS_REGEX.test(trimmed)) {
    throw new Error(
      `El campo ${fieldName} contiene caracteres peligrosos bloqueados por seguridad (<, >, =, ;, \\, etc.).`
    );
  }

  return trimmed;
}

/**
 * Valida un identificador numérico o clave foránea positiva
 */
export function validateNumericId(value: unknown, fieldName: string): number {
  const num = Number(value);
  if (value === undefined || value === null || isNaN(num) || !Number.isInteger(num) || num <= 0) {
    throw new Error(`El campo ${fieldName} debe ser un número entero positivo mayor a cero.`);
  }
  return num;
}

/**
 * Valida una bandera booleana (0 o 1)
 */
export function validateBooleanFlag(value: unknown, fieldName: string, defaultValue: number = 1): number {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  const num = Number(value);
  if (![0, 1].includes(num)) {
    throw new Error(`El campo ${fieldName} solo admite valores 0 o 1.`);
  }
  return num;
}

/**
 * Valida formato de fecha ISO YYYY-MM-DD opcional y real en el calendario
 */
export function validateDateString(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    throw new Error(`El campo ${fieldName} debe ser una fecha válida en formato YYYY-MM-DD.`);
  }
  const dateStr = value.slice(0, 10);
  if (!FECHA_ISO_REGEX.test(dateStr)) {
    throw new Error(`El campo ${fieldName} debe tener el formato YYYY-MM-DD.`);
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(`${dateStr}T00:00:00Z`);

  if (
    isNaN(dateObj.getTime()) ||
    dateObj.getUTCFullYear() !== year ||
    dateObj.getUTCMonth() + 1 !== month ||
    dateObj.getUTCDate() !== day
  ) {
    throw new Error(`El campo ${fieldName} no es una fecha válida en el calendario.`);
  }

  return dateStr;
}

/**
 * Valida coherencia cronológica de fechas de lote
 */
export function validateLotDates(fechaProd?: string | null, fechaVenc?: string | null): void {
  if (fechaProd && fechaVenc) {
    if (new Date(fechaVenc).getTime() < new Date(fechaProd).getTime()) {
      throw new Error('La fecha de vencimiento no puede ser anterior a la fecha de producción.');
    }
  }
}

/**
 * Regex para validar placa vehicular estándar (ej: P-123ABC, C-456DEF, P123ABC, A-1234, M-5678, etc.)
 */
export const PLACA_VEHICULAR_REGEX = /^[A-Z0-9]{1,4}(-[A-Z0-9]{1,6})*$/;

/**
 * Valida y sanea placa de vehículo
 */
export function validatePlacaVehiculo(value: unknown, fieldName: string = 'Placa'): string {
  if (value === undefined || value === null || typeof value !== 'string') {
    throw new Error(`El campo ${fieldName} es obligatorio y debe ser una cadena de texto.`);
  }

  const trimmed = value.trim().toUpperCase().replace(/\s+/g, '-');

  if (trimmed.length < 3) {
    throw new Error(`El campo ${fieldName} debe tener al menos 3 caracteres.`);
  }

  if (trimmed.length > 20) {
    throw new Error(`El campo ${fieldName} no puede exceder los 20 caracteres.`);
  }

  if (!PLACA_VEHICULAR_REGEX.test(trimmed)) {
    throw new Error(
      `El campo ${fieldName} "${trimmed}" no cumple con el formato vehicular válido (ej. P-123ABC, C-456XYZ). Solo se permiten letras mayúsculas, números y guiones.`
    );
  }

  return trimmed;
}

/**
 * Valida año de vehículo (número entero razonable entre 1970 y año actual + 2)
 */
export function validateAnioVehiculo(value: unknown, fieldName: string = 'Año'): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const num = Number(value);
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear + 2;

  if (isNaN(num) || !Number.isInteger(num) || num < 1970 || num > maxYear) {
    throw new Error(
      `El campo ${fieldName} debe ser un número de año entero válido entre 1970 y ${maxYear}.`
    );
  }

  return num;
}

/**
 * Valida estado de vehículo
 */
export function validateEstadoVehiculo(value: unknown, fieldName: string = 'Estado'): 'ACTIVO' | 'MANTENIMIENTO' | 'BAJA' {
  if (!value) return 'ACTIVO';
  const val = String(value).trim().toUpperCase();
  if (!['ACTIVO', 'MANTENIMIENTO', 'BAJA'].includes(val)) {
    throw new Error(`El campo ${fieldName} solo permite los estados: ACTIVO, MANTENIMIENTO, BAJA.`);
  }
  return val as 'ACTIVO' | 'MANTENIMIENTO' | 'BAJA';
}

/**
 * Regex para validar DPI de Guatemala (Exactamente 13 dígitos numéricos)
 */
export const DPI_GUATEMALA_REGEX = /^\d{13}$/;

/**
 * Valida y sanea DPI de Guatemala
 */
export function validateDpiGuatemala(value: unknown, fieldName: string = 'DPI'): string {
  if (value === undefined || value === null || typeof value !== 'string') {
    throw new Error(`El campo ${fieldName} es obligatorio y debe ser una cadena de texto.`);
  }

  // Eliminar espacios o guiones si el usuario los escribió
  const cleanDpi = value.trim().replace(/[\s\-]/g, '');

  if (!DPI_GUATEMALA_REGEX.test(cleanDpi)) {
    throw new Error(
      `El campo ${fieldName} debe contener exactamente 13 dígitos numéricos válidos (sin letras ni caracteres especiales).`
    );
  }

  return cleanDpi;
}

/**
 * Valida tipo de licencia de conducir en Guatemala (A, B, C, M)
 */
export function validateTipoLicencia(value: unknown, fieldName: string = 'Tipo de Licencia'): 'A' | 'B' | 'C' | 'M' {
  if (value === undefined || value === null) {
    throw new Error(`El campo ${fieldName} es obligatorio.`);
  }

  const val = String(value).trim().toUpperCase();
  if (!['A', 'B', 'C', 'M'].includes(val)) {
    throw new Error(`El campo ${fieldName} solo permite los tipos oficiales: A (Pesada), B (Liviana), C (Particular) o M (Moto).`);
  }

  return val as 'A' | 'B' | 'C' | 'M';
}

/**
 * Valida número de licencia
 */
export function validateNoLicencia(value: unknown, fieldName: string = 'Número de Licencia'): string {
  if (value === undefined || value === null || typeof value !== 'string') {
    throw new Error(`El campo ${fieldName} es obligatorio y debe ser una cadena de texto.`);
  }

  const trimmed = value.trim().toUpperCase();

  if (trimmed.length < 3) {
    throw new Error(`El campo ${fieldName} debe tener al menos 3 caracteres.`);
  }

  if (trimmed.length > 50) {
    throw new Error(`El campo ${fieldName} no puede exceder los 50 caracteres.`);
  }

  if (CARACTERES_PROHIBIDOS_REGEX.test(trimmed)) {
    throw new Error(`El campo ${fieldName} contiene caracteres no permitidos.`);
  }

  return trimmed;
}

/**
 * Valida fecha de vencimiento de licencia (debe ser fecha válida y no estar vencida si se registra o activa)
 */
export function validateFechaVencimientoLicencia(
  value: unknown,
  fieldName: string = 'Fecha de Vencimiento de Licencia',
  allowPast: boolean = false
): string {
  const dateStr = validateDateString(value, fieldName);
  if (!dateStr) {
    throw new Error(`El campo ${fieldName} es obligatorio.`);
  }

  if (!allowPast) {
    const today = new Date().toISOString().slice(0, 10);
    if (dateStr < today) {
      throw new Error(
        `La licencia ingresada ya se encuentra vencida (${dateStr}). No se puede registrar o asignar un conductor con licencia vencida.`
      );
    }
  }

  return dateStr;
}

/**
 * Valida estado de conductor
 */
export function validateEstadoConductor(value: unknown, fieldName: string = 'Estado'): 'ACTIVO' | 'SUSPENDIDO' | 'INACTIVO' {
  if (!value) return 'ACTIVO';
  const val = String(value).trim().toUpperCase();
  if (!['ACTIVO', 'SUSPENDIDO', 'INACTIVO'].includes(val)) {
    throw new Error(`El campo ${fieldName} solo permite los estados: ACTIVO, SUSPENDIDO, INACTIVO.`);
  }
  return val as 'ACTIVO' | 'SUSPENDIDO' | 'INACTIVO';
}
