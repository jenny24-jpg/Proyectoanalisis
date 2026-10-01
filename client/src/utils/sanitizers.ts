/**
 * client/src/utils/sanitizers.ts
 * Utilidades de saneamiento reactivo en tiempo real y validación para formularios del ERP.
 */

// Caracteres peligrosos explícitamente prohibidos para nombres y textos nominales (*, /, @, <, >, =, etc.)
export const CARACTERES_PROHIBIDOS_REGEX = /[*\/@<>=;\\!$%#^?{}[\]~+&|`]/g;

// Caracteres peligrosos bloqueados en direcciones o notas amplias
export const CARACTERES_DIRECCION_PROHIBIDOS_REGEX = /[<>=;\\!$%^?{}[\]~+&|`]/g;

// Regex para caracteres permitidos en nombres nominales (letras, números, puntuación básica y paréntesis)
export const NOMBRE_NOMINAL_PERMITIDO_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.,\-\(\)]*$/;

// Regex para códigos restrictivos permitidos
export const CODIGO_ESTRICTO_PERMITIDO_REGEX = /^[A-Z0-9\.\-_]*$/;

// Regex para códigos con guion bajo (tipos de movimiento)
export const CODIGO_MOVIMIENTO_PERMITIDO_REGEX = /^[A-Z0-9_]*$/;

// Regex para abreviaturas de unidades
export const ABREVIATURA_UNIDAD_PERMITIDO_REGEX = /^[A-Z0-9\.\/]*$/;

/**
 * Sanea y valida en caliente códigos restrictivos (mayúsculas, números, guiones y puntos)
 */
export function sanitizeStrictCode(val: string): {
  sanitized: string;
  hasForbidden: boolean;
  error: string | null;
} {
  const upper = val.toUpperCase();
  const hasInvalid = /[^A-Z0-9\.\-_]/.test(upper);
  const sanitized = upper.replace(/[^A-Z0-9\.\-_]/g, '');

  return {
    sanitized,
    hasForbidden: hasInvalid,
    error: hasInvalid
      ? 'Solo se permiten letras mayúsculas, números, puntos y guiones (sin espacios).'
      : null,
  };
}

/**
 * Sanea y valida en caliente nombres nominales (marcas, categorías, descripciones, etc.)
 */
export function sanitizeNominalText(val: string): {
  sanitized: string;
  hasForbidden: boolean;
  error: string | null;
} {
  const hasForbiddenChars = /[*\/@<>=;\\!$%#^?{}[\]~+&|`]/.test(val);
  const sanitized = val.replace(/[*\/@<>=;\\!$%#^?{}[\]~+&|`]/g, '');

  let error: string | null = null;
  if (hasForbiddenChars) {
    error = 'No se permiten caracteres especiales no válidos (*, /, @, <, >, =, etc.).';
  } else if (val && !NOMBRE_NOMINAL_PERMITIDO_REGEX.test(val)) {
    error = 'Solo se permiten letras, números, espacios, puntos, comas y guiones.';
  }

  return {
    sanitized,
    hasForbidden: hasForbiddenChars,
    error,
  };
}

/**
 * Sanea y valida en caliente direcciones y notas amplias (permite #, /, comas, puntos)
 */
export function sanitizeAddress(val: string): {
  sanitized: string;
  hasForbidden: boolean;
  error: string | null;
} {
  const hasForbiddenChars = /[<>=;\\!$%^?{}[\]~+&|`]/.test(val);
  const sanitized = val.replace(/[<>=;\\!$%^?{}[\]~+&|`]/g, '');

  let error: string | null = null;
  if (hasForbiddenChars) {
    error = 'Se detectaron caracteres peligrosos bloqueados por seguridad (<, >, =, ;, etc.).';
  }

  return {
    sanitized,
    hasForbidden: hasForbiddenChars,
    error,
  };
}

/**
 * Sanea y valida en caliente abreviaturas de unidades de medida (ej. KG, M3, KM/H)
 */
export function sanitizeAbreviatura(val: string): {
  sanitized: string;
  hasForbidden: boolean;
  error: string | null;
} {
  const upper = val.toUpperCase();
  const hasInvalid = /[^A-Z0-9\.\/]/.test(upper);
  const sanitized = upper.replace(/[^A-Z0-9\.\/]/g, '');

  return {
    sanitized,
    hasForbidden: hasInvalid,
    error: hasInvalid
      ? 'Solo se permiten letras mayúsculas, números, punto o barra inclinada (ej. KG, M/S).'
      : null,
  };
}

/**
 * Sanea y valida en caliente dígitos numéricos exclusivamente (0-9)
 */
export function sanitizeNumericDigits(val: string): {
  sanitized: string;
  hasForbidden: boolean;
  error: string | null;
} {
  const hasInvalid = /\D/.test(val);
  const sanitized = val.replace(/\D/g, '');

  return {
    sanitized,
    hasForbidden: hasInvalid,
    error: hasInvalid ? 'Solo se permiten dígitos numéricos (0-9).' : null,
  };
}

/**
 * Sanea y valida en caliente placas vehiculares (ej: P-123ABC, C-456DEF, P123ABC)
 */
export function sanitizePlaca(val: string): {
  sanitized: string;
  hasForbidden: boolean;
  error: string | null;
} {
  const upper = val.toUpperCase();
  const hasInvalid = /[^A-Z0-9\-]/.test(upper);
  const sanitized = upper.replace(/[^A-Z0-9\-]/g, '');

  return {
    sanitized,
    hasForbidden: hasInvalid,
    error: hasInvalid ? 'Solo se permiten letras mayúsculas, números y guiones.' : null,
  };
}

/**
 * Sanea y valida en caliente DPI de Guatemala (Exactamente 13 dígitos numéricos)
 */
export function sanitizeDpiGuatemala(val: string): {
  sanitized: string;
  hasForbidden: boolean;
  error: string | null;
} {
  const hasInvalid = /\D/.test(val);
  // Limitar a máximo 13 dígitos
  const sanitized = val.replace(/\D/g, '').slice(0, 13);

  let error: string | null = null;
  if (hasInvalid) {
    error = 'El DPI solo permite números (sin letras ni caracteres especiales).';
  } else if (sanitized.length > 0 && sanitized.length < 13) {
    error = `El DPI debe tener 13 dígitos (llevas ${sanitized.length}).`;
  }

  return {
    sanitized,
    hasForbidden: hasInvalid,
    error,
  };
}

/**
 * Valida fecha de vencimiento de licencia (no vencida)
 */
export function validateLicenciaVencimiento(fechaStr: string): string | null {
  if (!fechaStr) return 'La fecha de vencimiento de licencia es obligatoria.';
  const today = new Date().toISOString().slice(0, 10);
  if (fechaStr < today) {
    return `La licencia ya está vencida (${fechaStr}). Ingrese una fecha de vigencia válida.`;
  }
  return null;
}

