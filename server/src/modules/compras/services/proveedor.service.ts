import { ProveedorRepository } from '../repositories/proveedor.repository.js';
import {
  IProveedor,
  ICreateProveedorDTO,
  IUpdateProveedorDTO,
  IProveedorFilterParams,
} from '@erp/contracts';

// Expresión regular que valida formato estándar de NIT: solo números y opcionalmente un guion con dígito verificador (0-9 o K)
// Se rechaza explícitamente "CF" y cualquier otra letra que no corresponda
const NIT_REGEX = /^[0-9]+(-[0-9K])?$/;

/**
 * Servicio de Negocio para el catálogo de Proveedores
 */
export class ProveedorService {
  static async obtenerProveedores(filters: IProveedorFilterParams = {}): Promise<IProveedor[]> {
    return await ProveedorRepository.findAll(filters);
  }

  static async obtenerPorId(id: number): Promise<IProveedor | null> {
    if (!id || id <= 0) {
      throw new Error('El ID del proveedor debe ser un número positivo.');
    }
    return await ProveedorRepository.findById(id);
  }

  static async crearProveedor(data: ICreateProveedorDTO): Promise<IProveedor> {
    if (!data.proNombreEntidad || data.proNombreEntidad.trim() === '') {
      throw new Error('El nombre o razón social del proveedor es obligatorio.');
    }

    if (data.proNombreEntidad.trim().length > 150) {
      throw new Error('El nombre del proveedor no puede exceder 150 caracteres.');
    }

    if (!data.proNit || data.proNit.trim() === '') {
      throw new Error('El NIT del proveedor es estrictamente obligatorio.');
    }

    const nitTrimmed = data.proNit.trim().toUpperCase();

    if (nitTrimmed === 'CF') {
      throw new Error('No se permite registrar proveedores con "CF". Debe ingresar un número de NIT válido.');
    }

    if (nitTrimmed.length > 50) {
      throw new Error('El NIT no puede exceder 50 caracteres.');
    }

    if (!NIT_REGEX.test(nitTrimmed)) {
      throw new Error('El formato del NIT es inválido. Debe contener únicamente números y opcionalmente un guion con dígito verificador (ej. 1234567-8, 1234567-K). No se admite "CF".');
    }

    data.proNit = nitTrimmed;

    if (data.proActivo !== undefined && ![0, 1].includes(data.proActivo)) {
      throw new Error('El campo activo solo admite valores 0 o 1.');
    }

    return await ProveedorRepository.create(data);
  }

  static async actualizarProveedor(id: number, data: IUpdateProveedorDTO): Promise<IProveedor> {
    if (!id || id <= 0) {
      throw new Error('El ID del proveedor debe ser un número positivo.');
    }

    if (data.proNombreEntidad !== undefined) {
      if (data.proNombreEntidad.trim() === '') {
        throw new Error('El nombre del proveedor no puede estar vacío.');
      }
      if (data.proNombreEntidad.trim().length > 150) {
        throw new Error('El nombre del proveedor no puede exceder 150 caracteres.');
      }
    }

    if (data.proNit !== undefined) {
      if (!data.proNit || data.proNit.trim() === '') {
        throw new Error('El NIT del proveedor es estrictamente obligatorio y no puede estar vacío.');
      }

      const nitTrimmed = data.proNit.trim().toUpperCase();

      if (nitTrimmed === 'CF') {
        throw new Error('No se permite registrar proveedores con "CF". Debe ingresar un número de NIT válido.');
      }

      if (nitTrimmed.length > 50) {
        throw new Error('El NIT no puede exceder 50 caracteres.');
      }

      if (!NIT_REGEX.test(nitTrimmed)) {
        throw new Error('El formato del NIT es inválido. Debe contener únicamente números y opcionalmente un guion con dígito verificador (ej. 1234567-8, 1234567-K). No se admite "CF".');
      }

      data.proNit = nitTrimmed;
    }

    if (data.proActivo !== undefined && ![0, 1].includes(data.proActivo)) {
      throw new Error('El campo activo solo admite valores 0 o 1.');
    }

    const updated = await ProveedorRepository.update(id, data);
    if (!updated) {
      throw new Error(`No se encontró el proveedor con ID ${id}.`);
    }

    return updated;
  }

  static async eliminarProveedor(id: number): Promise<{ deleted: boolean; deactivated: boolean; message: string }> {
    if (!id || id <= 0) {
      throw new Error('El ID del proveedor debe ser un número positivo.');
    }

    const result = await ProveedorRepository.delete(id);
    if (result.deactivated) {
      return {
        ...result,
        message: 'El proveedor posee cotizaciones o facturas asociadas en el sistema, por lo que fue desactivado para proteger la integridad referencial.',
      };
    }
    return {
      ...result,
      message: 'Proveedor eliminado exitosamente.',
    };
  }
}
