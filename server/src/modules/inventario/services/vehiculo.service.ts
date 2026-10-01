import {
  IVehiculo,
  ICreateVehiculoDTO,
  IUpdateVehiculoDTO,
  IVehiculoFilterParams,
} from '@erp/contracts';
import { VehiculoRepository } from '../repositories/vehiculo.repository.js';
import {
  validateNominalText,
  validatePlacaVehiculo,
  validateAnioVehiculo,
  validateEstadoVehiculo,
  validateNumericId,
} from '../../../utils/sanitizers.js';

export class VehiculoService {
  static async getAllVehiculos(filters: IVehiculoFilterParams = {}): Promise<IVehiculo[]> {
    return await VehiculoRepository.findAll(filters);
  }

  static async getVehiculoById(id: number): Promise<IVehiculo> {
    const validId = validateNumericId(id, 'ID de Vehículo');
    const vehiculo = await VehiculoRepository.findById(validId);
    if (!vehiculo) {
      throw new Error(`No se encontró el vehículo con ID #${id}.`);
    }
    return vehiculo;
  }

  static async createVehiculo(data: ICreateVehiculoDTO): Promise<IVehiculo> {
    const placa = validatePlacaVehiculo(data.vehPlaca, 'Placa');
    const marca = validateNominalText(data.vehMarca, 'Marca', 50, 2);
    const modelo = validateNominalText(data.vehModelo, 'Modelo', 50, 1);
    const anio = validateAnioVehiculo(data.vehAnio, 'Año');
    const estado = validateEstadoVehiculo(data.vehEstado, 'Estado');

    // Verificar unicidad de placa
    const existing = await VehiculoRepository.findByPlaca(placa);
    if (existing) {
      throw new Error(`Ya existe un vehículo registrado con la placa "${placa}".`);
    }

    return await VehiculoRepository.create({
      vehPlaca: placa,
      vehMarca: marca,
      vehModelo: modelo,
      vehAnio: anio,
      vehEstado: estado,
    });
  }

  static async updateVehiculo(id: number, data: IUpdateVehiculoDTO): Promise<IVehiculo> {
    const validId = validateNumericId(id, 'ID de Vehículo');
    const existing = await VehiculoRepository.findById(validId);
    if (!existing) {
      throw new Error(`No se encontró el vehículo con ID #${id} para actualizar.`);
    }

    const payload: IUpdateVehiculoDTO = {};

    if (data.vehPlaca !== undefined) {
      const placa = validatePlacaVehiculo(data.vehPlaca, 'Placa');
      if (placa !== existing.vehPlaca) {
        const duplicate = await VehiculoRepository.findByPlaca(placa);
        if (duplicate && duplicate.vehIdVehiculo !== validId) {
          throw new Error(`Ya existe otro vehículo registrado con la placa "${placa}".`);
        }
      }
      payload.vehPlaca = placa;
    }

    if (data.vehMarca !== undefined) {
      payload.vehMarca = validateNominalText(data.vehMarca, 'Marca', 50, 2);
    }

    if (data.vehModelo !== undefined) {
      payload.vehModelo = validateNominalText(data.vehModelo, 'Modelo', 50, 1);
    }

    if (data.vehAnio !== undefined) {
      payload.vehAnio = validateAnioVehiculo(data.vehAnio, 'Año');
    }

    if (data.vehEstado !== undefined) {
      payload.vehEstado = validateEstadoVehiculo(data.vehEstado, 'Estado');
    }

    const updated = await VehiculoRepository.update(validId, payload);
    if (!updated) {
      throw new Error(`Error al actualizar el vehículo #${id}.`);
    }
    return updated;
  }

  static async deleteVehiculo(id: number): Promise<{ message: string; deactivated: boolean }> {
    const validId = validateNumericId(id, 'ID de Vehículo');
    const existing = await VehiculoRepository.findById(validId);
    if (!existing) {
      throw new Error(`No se encontró el vehículo con ID #${id} para eliminar.`);
    }

    const res = await VehiculoRepository.delete(validId);
    if (res.deactivated) {
      return {
        message: `El vehículo con placa "${existing.vehPlaca}" tiene operaciones asociadas en almacén; su estado ha sido cambiado a BAJA.`,
        deactivated: true,
      };
    }

    return {
      message: `Vehículo con placa "${existing.vehPlaca}" eliminado correctamente.`,
      deactivated: false,
    };
  }
}
