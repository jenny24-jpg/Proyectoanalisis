import { TomaFisicaRepository } from '../repositories/tomaFisica.repository.js';
import { ITomaFisicaCreateDTO, IGuardarConteoDTO, ITomaFisicaResponseDTO } from '@erp/contracts';

export class TomaFisicaService {
  static async aperturar(data: ITomaFisicaCreateDTO): Promise<{ success: boolean; message: string; idToma?: number }> {
    const activa = await TomaFisicaRepository.getActiva(data.idBodega);
    if (activa) {
      throw new Error(`La bodega ya tiene una toma física en proceso (${activa.numeroToma}). Ciérrela antes de abrir otra.`);
    }

    const noToma = `TOMA-2026-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const idToma = await TomaFisicaRepository.aperturar(data, noToma);

    return { success: true, message: 'Toma física aperturada exitosamente.', idToma };
  }

  static async getActiva(idBodega: number): Promise<ITomaFisicaResponseDTO | null> {
    return TomaFisicaRepository.getActiva(idBodega);
  }

  static async guardarConteo(data: IGuardarConteoDTO): Promise<{ success: boolean; message: string }> {
    if (!data.detalles || data.detalles.length === 0) {
      throw new Error('Debe proporcionar al menos un detalle de conteo.');
    }
    await TomaFisicaRepository.guardarConteo(data);
    return { success: true, message: 'Conteo guardado y toma física cerrada correctamente.' };
  }
}
