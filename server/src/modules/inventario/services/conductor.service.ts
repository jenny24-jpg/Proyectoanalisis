import {
  IConductor,
  ICreateConductorDTO,
  IUpdateConductorDTO,
  IConductorFilterParams,
  IEmpleadoOption,
} from '@erp/contracts';
import { ConductorRepository } from '../repositories/conductor.repository.js';
import {
  validateNumericId,
  validateDpiGuatemala,
  validateTipoLicencia,
  validateNoLicencia,
  validateFechaVencimientoLicencia,
  validateEstadoConductor,
} from '../../../utils/sanitizers.js';

export class ConductorService {
  static async getAllConductores(filters: IConductorFilterParams = {}): Promise<IConductor[]> {
    return await ConductorRepository.findAll(filters);
  }

  static async getEmpleados(): Promise<IEmpleadoOption[]> {
    return await ConductorRepository.getEmpleados();
  }

  static async getConductorById(id: number): Promise<IConductor> {
    const validId = validateNumericId(id, 'ID de Conductor');
    const conductor = await ConductorRepository.findById(validId);
    if (!conductor) {
      throw new Error(`No se encontró el conductor con ID #${id}.`);
    }
    return conductor;
  }

  static async createConductor(data: ICreateConductorDTO): Promise<IConductor> {
    const idEmpleado = validateNumericId(data.conIdEmpleado, 'Empleado');
    const dpi = validateDpiGuatemala(data.conDpi, 'DPI');
    const tipoLicencia = validateTipoLicencia(data.conTipoLicencia, 'Tipo de Licencia');
    const noLicencia = validateNoLicencia(data.conNoLicencia, 'Número de Licencia');
    const fechaVenc = validateFechaVencimientoLicencia(data.conFechaVencimientoLic, 'Fecha de Vencimiento de Licencia', false);
    const estado = validateEstadoConductor(data.conEstado, 'Estado');

    // Validar unicidad de DPI
    const existing = await ConductorRepository.findByDpi(dpi);
    if (existing) {
      throw new Error(`Ya existe un conductor registrado con el DPI "${dpi}".`);
    }

    return await ConductorRepository.create({
      conIdEmpleado: idEmpleado,
      conDpi: dpi,
      conTipoLicencia: tipoLicencia,
      conNoLicencia: noLicencia,
      conFechaVencimientoLic: fechaVenc,
      conEstado: estado,
    });
  }

  static async updateConductor(id: number, data: IUpdateConductorDTO): Promise<IConductor> {
    const validId = validateNumericId(id, 'ID de Conductor');
    const existing = await ConductorRepository.findById(validId);
    if (!existing) {
      throw new Error(`No se encontró el conductor con ID #${id} para actualizar.`);
    }

    const payload: IUpdateConductorDTO = {};

    if (data.conIdEmpleado !== undefined) {
      payload.conIdEmpleado = validateNumericId(data.conIdEmpleado, 'Empleado');
    }

    if (data.conDpi !== undefined) {
      const dpi = validateDpiGuatemala(data.conDpi, 'DPI');
      if (dpi !== existing.conDpi) {
        const duplicate = await ConductorRepository.findByDpi(dpi);
        if (duplicate && duplicate.conIdConductor !== validId) {
          throw new Error(`Ya existe otro conductor registrado con el DPI "${dpi}".`);
        }
      }
      payload.conDpi = dpi;
    }

    if (data.conTipoLicencia !== undefined) {
      payload.conTipoLicencia = validateTipoLicencia(data.conTipoLicencia, 'Tipo de Licencia');
    }

    if (data.conNoLicencia !== undefined) {
      payload.conNoLicencia = validateNoLicencia(data.conNoLicencia, 'Número de Licencia');
    }

    if (data.conFechaVencimientoLic !== undefined) {
      // Si el estado a colocar es ACTIVO, no debe estar vencida
      const allowPast = data.conEstado === 'SUSPENDIDO' || data.conEstado === 'INACTIVO';
      payload.conFechaVencimientoLic = validateFechaVencimientoLicencia(
        data.conFechaVencimientoLic,
        'Fecha de Vencimiento de Licencia',
        allowPast
      );
    }

    if (data.conEstado !== undefined) {
      payload.conEstado = validateEstadoConductor(data.conEstado, 'Estado');
    }

    const updated = await ConductorRepository.update(validId, payload);
    if (!updated) {
      throw new Error(`Error al actualizar el conductor #${id}.`);
    }
    return updated;
  }

  static async deleteConductor(id: number): Promise<{ message: string; deactivated: boolean }> {
    const validId = validateNumericId(id, 'ID de Conductor');
    const existing = await ConductorRepository.findById(validId);
    if (!existing) {
      throw new Error(`No se encontró el conductor con ID #${id} para eliminar.`);
    }

    const res = await ConductorRepository.delete(validId);
    if (res.deactivated) {
      return {
        message: `El conductor "${existing.conNombreEmpleado || existing.conDpi}" tiene recepciones asociadas; su estado ha sido cambiado a INACTIVO.`,
        deactivated: true,
      };
    }

    return {
      message: `Conductor "${existing.conNombreEmpleado || existing.conDpi}" eliminado correctamente.`,
      deactivated: false,
    };
  }
}
