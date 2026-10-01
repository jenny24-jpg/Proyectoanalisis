import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  Video,
  Image as ImageIcon,
  FileText,
  Search,
  Filter,
  Plus,
  Play,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Layers,
  X,
  Eye,
  BookOpen,
  Info,
  Globe,
  Download,
} from 'lucide-react';
import {
  Button,
  StatCard,
  TextInput,
  Select,
  TextArea,
  ConfirmDialog,
} from '../../../components/ui';
import { GuiaSistemaClientService } from '../services/guiaSistemaClientService';
import { IGuiaSistema, ICrearGuiaSistemaDTO } from '@erp/contracts';
import { formatDate } from '../../../utils/formatters';

/**
 * Valida si una URL ingresada proviene exclusivamente de Google Drive o YouTube
 */
export function isValidGuiaMediaUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();

  // Permitir uploads internos locales
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) return true;

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.toLowerCase();

    // Google Drive
    if (host === 'drive.google.com' || host.endsWith('.drive.google.com') || host === 'docs.google.com') {
      return true;
    }

    // YouTube
    if (
      host === 'youtube.com' ||
      host === 'www.youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'youtu.be' ||
      host.endsWith('.youtube.com')
    ) {
      return true;
    }

    return false;
  } catch (_e) {
    return false;
  }
}

/**
 * Transforma enlaces de YouTube o Google Drive a sus formatos oficiales de incrustación (Embed / Preview)
 */
export function getEmbedMediaInfo(url: string, idGuia?: number, tipo?: string) {
  if (!url) {
    if (idGuia) {
      return {
        type: 'BLOB_DIRECT',
        embedUrl: GuiaSistemaClientService.getArchivoUrl(idGuia),
        thumbnailUrl: '',
        isEmbed: false,
      };
    }
    return { type: 'UNKNOWN', embedUrl: '', thumbnailUrl: '', isEmbed: false };
  }
  const trimmed = url.trim();

  // 1. Endpoint directo de BLOB
  if (trimmed.includes('/api/compras/guias/') || trimmed.endsWith('/archivo')) {
    return {
      type: 'BLOB_DIRECT',
      embedUrl: trimmed,
      thumbnailUrl: '',
      isEmbed: false,
    };
  }

  // 2. YouTube
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    let videoId = '';
    if (trimmed.includes('youtu.be/')) {
      videoId = trimmed.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0] || '';
    } else if (trimmed.includes('shorts/')) {
      videoId = trimmed.split('shorts/')[1]?.split('?')[0]?.split('&')[0] || '';
    } else if (trimmed.includes('embed/')) {
      videoId = trimmed.split('embed/')[1]?.split('?')[0]?.split('&')[0] || '';
    } else if (trimmed.includes('watch?v=')) {
      videoId = trimmed.split('watch?v=')[1]?.split('&')[0]?.split('?')[0] || '';
    } else if (trimmed.includes('v=')) {
      videoId = trimmed.split('v=')[1]?.split('&')[0]?.split('?')[0] || '';
    }

    if (videoId) {
      return {
        type: 'YOUTUBE',
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        isEmbed: true,
      };
    }
  }

  // 3. Google Drive
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    let fileId = '';
    if (trimmed.includes('/file/d/')) {
      fileId = trimmed.split('/file/d/')[1]?.split('/')[0]?.split('?')[0] || '';
    } else if (trimmed.includes('id=')) {
      fileId = trimmed.split('id=')[1]?.split('&')[0] || '';
    }

    if (fileId) {
      return {
        type: 'GOOGLE_DRIVE',
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        thumbnailUrl: '',
        isEmbed: true,
      };
    }

    if (trimmed.endsWith('/preview')) {
      return {
        type: 'GOOGLE_DRIVE',
        embedUrl: trimmed,
        thumbnailUrl: '',
        isEmbed: true,
      };
    }
  }

  // 4. Archivo directo o fallback
  const directUrl = idGuia ? GuiaSistemaClientService.getArchivoUrl(idGuia) : trimmed;

  return {
    type: 'DIRECT',
    embedUrl: directUrl,
    thumbnailUrl: '',
    isEmbed: false,
  };
}

export const GuiasSistemaView: React.FC = () => {
  const [guias, setGuias] = useState<IGuiaSistema[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterModulo, setFilterModulo] = useState<string>('TODOS');
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');

  // Modal Crear / Subir Guía
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formTitulo, setFormTitulo] = useState<string>('');
  const [formDescripcion, setFormDescripcion] = useState<string>('');
  const [formTipoContenido, setFormTipoContenido] = useState<'PDF' | 'PRESENTACION' | 'VIDEO' | 'IMAGEN' | 'DOCUMENTO'>('PDF');
  const [formModuloDestino, setFormModuloDestino] = useState<string>('COMPRAS');
  const [formUrlRecurso, setFormUrlRecurso] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Modal Vista Previa / Reproductor Multimedia
  const [previewGuia, setPreviewGuia] = useState<IGuiaSistema | null>(null);

  // Confirmar eliminación
  const [guiaToDelete, setGuiaToDelete] = useState<IGuiaSistema | null>(null);

  const loadGuias = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await GuiaSistemaClientService.getGuias();
      setGuias(data);
    } catch (err: any) {
      console.error('[GuiasSistemaView] Error cargando guías:', err);
      setErrorMsg(err.message || 'Error al conectar con la base de datos para cargar las guías del sistema.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGuias();
  }, []);

  const filteredGuias = useMemo(() => {
    return guias.filter((g) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        g.guiTitulo.toLowerCase().includes(query) ||
        (g.guiDescripcion && g.guiDescripcion.toLowerCase().includes(query)) ||
        (g.guiModuloDestino && g.guiModuloDestino.toLowerCase().includes(query));

      const matchesModulo =
        filterModulo === 'TODOS' ||
        (g.guiModuloDestino || '').toUpperCase() === filterModulo.toUpperCase();

      const matchesTipo =
        filterTipo === 'TODOS' ||
        (g.guiTipoContenido || '').toUpperCase() === filterTipo.toUpperCase();

      return matchesSearch && matchesModulo && matchesTipo;
    });
  }, [guias, searchQuery, filterModulo, filterTipo]);

  const stats = useMemo(() => {
    const total = guias.length;
    const videos = guias.filter((g) => g.guiTipoContenido === 'VIDEO').length;
    const pdfs = guias.filter((g) => g.guiTipoContenido === 'PDF' || g.guiTipoContenido === 'DOCUMENTO').length;
    const presentaciones = guias.filter((g) => g.guiTipoContenido === 'PRESENTACION').length;
    const imagenes = guias.filter((g) => g.guiTipoContenido === 'IMAGEN').length;
    return { total, videos, pdfs, presentaciones, imagenes };
  }, [guias]);

  const handleCreateGuia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim()) {
      setErrorMsg('Por favor ingresa un título descriptivo para la guía.');
      return;
    }

    // Regla estricta 1: Si es VIDEO -> No se permiten archivos, exige enlace externo válido
    if (formTipoContenido === 'VIDEO') {
      if (!formUrlRecurso.trim()) {
        setErrorMsg('Para guías de tipo Video es obligatorio ingresar un enlace de YouTube o Google Drive.');
        return;
      }
      if (!isValidGuiaMediaUrl(formUrlRecurso)) {
        setErrorMsg('El enlace de video debe provenir exclusivamente de YouTube (youtube.com / youtu.be) o Google Drive (drive.google.com).');
        return;
      }
    }

    // Regla estricta 2: Si es PDF, Presentación, Documento o Imagen -> Requiere archivo para persistir en almacenamiento digital
    if (formTipoContenido === 'PDF' || formTipoContenido === 'PRESENTACION' || formTipoContenido === 'DOCUMENTO' || formTipoContenido === 'IMAGEN') {
      if (!selectedFile) {
        setErrorMsg(`Para recursos de tipo ${formTipoContenido} es obligatorio cargar el archivo correspondiente para adjuntarlo al sistema.`);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const dto: ICrearGuiaSistemaDTO = {
        guiTitulo: formTitulo.trim(),
        guiDescripcion: formDescripcion.trim() || undefined,
        guiTipoContenido: formTipoContenido,
        guiUrlRecurso: formTipoContenido === 'VIDEO' ? formUrlRecurso.trim() : undefined,
        guiModuloDestino: formModuloDestino.trim().toUpperCase(),
        guiActivo: 1,
      };

      await GuiaSistemaClientService.crearGuia(dto, selectedFile);

      setSuccessMsg('¡Guía registrada exitosamente y archivo almacenado en el sistema!');
      setIsModalOpen(false);
      resetForm();
      loadGuias();
    } catch (err: any) {
      console.error('[GuiasSistemaView] Error al guardar guía:', err);
      setErrorMsg(err.message || 'Error al registrar la guía en la base de datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGuia = async () => {
    if (!guiaToDelete) return;
    try {
      await GuiaSistemaClientService.deleteGuia(guiaToDelete.guiIdGuia);
      setSuccessMsg('Guía eliminada correctamente.');
      setGuiaToDelete(null);
      loadGuias();
    } catch (err: any) {
      console.error('[GuiasSistemaView] Error al eliminar guía:', err);
      setErrorMsg(err.message || 'Error al eliminar la guía.');
    }
  };

  const resetForm = () => {
    setFormTitulo('');
    setFormDescripcion('');
    setFormTipoContenido('PDF');
    setFormModuloDestino('COMPRAS');
    setFormUrlRecurso('');
    setSelectedFile(null);
  };


  return (
    <div className="space-y-6 w-full pb-16 min-w-0 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <BookOpen className="text-blue-600" size={28} />
            Guías y Manuales Interactivos del Sistema
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Biblioteca de videos tutoriales (YouTube / Google Drive) y manuales operativos para el ERP
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="shadow-sm"
          >
            Nueva Guía Multimedia
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-rose-900">Atención</p>
            <p className="text-xs text-rose-700 mt-0.5">{errorMsg}</p>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700 p-1">
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
          <button type="button" onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 p-1">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Recursos"
          value={stats.total}
          icon={Layers}
          changeLabel="Total Registrados"
        />
        <StatCard
          title="Videos Tutoriales"
          value={stats.videos}
          icon={Video}
          isPositive={true}
          changeLabel="YouTube / Google Drive"
        />
        <StatCard
          title="Capturas / Infografías"
          value={stats.imagenes}
          icon={ImageIcon}
          changeLabel="Guías Paso a Paso"
        />
        <StatCard
          title="Documentos / PDFs"
          value={stats.pdfs + stats.presentaciones}
          icon={FileText}
          changeLabel="Manuales Operativos"
        />
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar guía por título, descripción o módulo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={filterModulo}
              onChange={(e) => setFilterModulo(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
            >
              <option value="TODOS">Todos los Módulos</option>
              <option value="COMPRAS">Módulo de Compras</option>
              <option value="INVENTARIO">Módulo de Inventario / Bodega</option>
              <option value="PRODUCTOS">Módulo de Productos</option>
              <option value="PRESUPUESTO">Módulo de Presupuesto</option>
              <option value="CXP">Cuentas por Pagar</option>
              <option value="GENERAL">General del Sistema</option>
            </select>
          </div>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
          >
            <option value="TODOS">Todos los Tipos</option>
            <option value="VIDEO">Videos (YouTube / Drive / MP4)</option>
            <option value="IMAGEN">Imágenes / Infografías</option>
            <option value="DOCUMENTO">Documentos / Manuales</option>
          </select>
        </div>
      </div>

      {/* Grid de Guías Multimedia */}
      {isLoading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
          <p className="text-sm font-semibold text-slate-600">Cargando guías y recursos multimedia...</p>
        </div>
      ) : filteredGuias.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 shadow-2xs">
          <HelpCircle size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-700">No se encontraron guías multimedia</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery || filterModulo !== 'TODOS' || filterTipo !== 'TODOS'
              ? 'Prueba ajustando los filtros de búsqueda para encontrar recursos de ayuda.'
              : 'Empieza agregando un enlace de YouTube o Google Drive con un tutorial explicativo para los usuarios.'}
          </p>
          <div className="mt-4">
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
              Agregar Primera Guía
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuias.map((guia) => {
            const isVideo = guia.guiTipoContenido === 'VIDEO';
            const isImage = guia.guiTipoContenido === 'IMAGEN';
            const mediaInfo = getEmbedMediaInfo(guia.guiUrlRecurso);

            return (
              <div
                key={guia.guiIdGuia}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Media Preview Box */}
                <div className="relative h-48 bg-slate-900 overflow-hidden flex items-center justify-center">
                  {mediaInfo.type === 'YOUTUBE' ? (
                    <div
                      className="relative w-full h-full bg-slate-950 flex items-center justify-center cursor-pointer group-hover:scale-105 transition-transform duration-300"
                      onClick={() => setPreviewGuia(guia)}
                    >
                      <img
                        src={mediaInfo.thumbnailUrl}
                        alt={guia.guiTitulo}
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-red-500 transition-all">
                          <Play size={24} className="ml-1 fill-white" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-[10px] font-bold rounded">
                        YouTube
                      </span>
                    </div>
                  ) : mediaInfo.type === 'GOOGLE_DRIVE' ? (
                    <div
                      className="relative w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex flex-col items-center justify-center cursor-pointer group-hover:scale-105 transition-transform duration-300 p-4 text-center"
                      onClick={() => setPreviewGuia(guia)}
                    >
                      <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition-all">
                        <Play size={24} className="ml-1 fill-amber-300" />
                      </div>
                      <span className="text-xs font-semibold text-slate-200 truncate max-w-[220px]">
                        Google Drive Media
                      </span>
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-[10px] font-bold rounded">
                        Drive
                      </span>
                    </div>
                  ) : isVideo ? (
                    <div
                      className="relative w-full h-full bg-slate-950 flex items-center justify-center cursor-pointer group-hover:scale-105 transition-transform duration-300"
                      onClick={() => setPreviewGuia(guia)}
                    >
                      <video
                        src={mediaInfo.embedUrl}
                        className="w-full h-full object-cover opacity-60"
                        muted
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-blue-500 transition-all">
                          <Play size={24} className="ml-1" />
                        </div>
                      </div>
                    </div>
                  ) : isImage ? (
                    <div
                      className="w-full h-full cursor-pointer bg-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
                      onClick={() => setPreviewGuia(guia)}
                    >
                      <img
                        src={mediaInfo.embedUrl}
                        alt={guia.guiTitulo}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="p-2.5 rounded-full bg-slate-900/80 text-white">
                          <Eye size={20} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 text-center cursor-pointer"
                      onClick={() => setPreviewGuia(guia)}
                    >
                      <FileText size={48} className="text-blue-400 mb-2" />
                      <span className="text-xs text-slate-300 font-semibold max-w-[200px] truncate">
                        {guia.guiUrlRecurso.split('/').pop() || 'Manual del Sistema'}
                      </span>
                    </div>
                  )}

                  {/* Badge Tipo Contenido */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-white bg-slate-900/80 backdrop-blur-xs flex items-center gap-1.5 shadow-xs">
                    {isVideo && <Video size={13} className="text-red-400" />}
                    {isImage && <ImageIcon size={13} className="text-cyan-400" />}
                    {!isVideo && !isImage && <FileText size={13} className="text-amber-400" />}
                    {guia.guiTipoContenido}
                  </span>

                  {/* Badge Módulo */}
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-blue-900 bg-blue-100/90 backdrop-blur-xs shadow-xs">
                    {guia.guiModuloDestino || 'GENERAL'}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {guia.guiTitulo}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {guia.guiDescripcion || 'Sin descripción adicional para este recurso.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatDate(guia.guiFechaCreacion, '2026-03-01')}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {guia.guiTipoContenido !== 'VIDEO' && (
                        <a
                          href={GuiaSistemaClientService.getArchivoUrl(guia.guiIdGuia)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
                          title="Descargar archivo adjunto"
                        >
                          <Download size={16} />
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        onClick={() => setPreviewGuia(guia)}
                      >
                        Ver Guía
                      </Button>
                      <button
                        type="button"
                        onClick={() => setGuiaToDelete(guia)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar guía"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      )}

      {/* Modal: Crear / Subir Nueva Guía */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                <BookOpen size={22} className="text-blue-600" />
                Nueva Guía Multimedia del Sistema
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGuia} className="space-y-4">
              <TextInput
                label="Título de la Guía"
                required
                placeholder="Ej: Cómo emitir una Orden de Compra paso a paso"
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Módulo de Destino"
                  required
                  value={formModuloDestino}
                  onChange={(e) => setFormModuloDestino(e.target.value)}
                  options={[
                    { value: 'COMPRAS', label: 'Compras (Pipeline & PO)' },
                    { value: 'INVENTARIO', label: 'Inventario / Bodega & Kardex' },
                    { value: 'PRODUCTOS', label: 'Productos & Catálogo' },
                    { value: 'PRESUPUESTO', label: 'Presupuesto' },
                    { value: 'CXP', label: 'Cuentas por Pagar (3-Way Match)' },
                    { value: 'GENERAL', label: 'General del Sistema' },
                  ]}
                />

                <Select
                  label="Tipo de Recurso"
                  required
                  value={formTipoContenido}
                  onChange={(e) => {
                    const nextTipo = e.target.value as any;
                    setFormTipoContenido(nextTipo);
                    if (nextTipo === 'VIDEO') {
                      setSelectedFile(null);
                    } else {
                      setFormUrlRecurso('');
                    }
                  }}
                  options={[
                    { value: 'PDF', label: 'Documento / Manual PDF' },
                    { value: 'PRESENTACION', label: 'Presentación PPTX' },
                    { value: 'VIDEO', label: 'Video Tutorial' },
                    { value: 'IMAGEN', label: 'Infografía / Captura' },
                  ]}
                />
              </div>

              {/* LÓGICA CONDICIONAL ESTRICTA: VIDEO vs ARCHIVO LOCAL */}
              {formTipoContenido === 'VIDEO' ? (
                <div className="space-y-3 p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <TextInput
                    label="Enlace del Video Tutorial (YouTube o Google Drive)"
                    required
                    placeholder="https://youtube.com/watch?v=... o https://drive.google.com/file/d/..."
                    value={formUrlRecurso}
                    onChange={(e) => setFormUrlRecurso(e.target.value)}
                    icon={Globe}
                  />

                  {/* ADVERTENCIA DE VISIBILIDAD PÚBLICA */}
                  <div className="p-3 bg-white/90 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <span className="font-bold text-amber-950">Advertencia de Visibilidad:</span> Para que los colaboradores puedan reproducir el video sin inconvenientes, verifique que la configuración en <strong>YouTube</strong> esté en <em>Público / No listado</em> o en <strong>Google Drive</strong> con permisos de <em>"Cualquier persona que tenga el vínculo puede ver"</em>.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Upload size={16} className="text-blue-600" />
                      Cargar Archivo
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Obligatorio
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs">
                      <Upload size={15} />
                      <span>Examinar Archivo</span>
                      <input
                        type="file"
                        className="hidden"
                        accept={
                          formTipoContenido === 'PRESENTACION'
                            ? '.pptx,.ppt,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation'
                            : formTipoContenido === 'IMAGEN'
                            ? 'image/png,image/jpeg,image/webp'
                            : '.pdf,application/pdf'
                        }
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSelectedFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>

                    {selectedFile ? (
                      <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                        <CheckCircle2 size={15} className="text-emerald-600" />
                        <span className="font-bold">{selectedFile.name}</span> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="text-rose-500 hover:text-rose-700 p-0.5 ml-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">
                        Selecciona un archivo {formTipoContenido === 'PRESENTACION' ? 'PowerPoint (.pptx)' : formTipoContenido === 'IMAGEN' ? 'de imagen (.png, .jpg)' : 'PDF (.pdf)'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <TextArea
                label="Descripción y Pasos de la Guía"
                placeholder="Describe brevemente qué aprenderá el usuario con este recurso..."
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
                rows={3}
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={CheckCircle2}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Guardando en Base de Datos...' : 'Guardar Guía'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Vista Previa y Reproductor Multimedia Integrado */}
      {previewGuia && (() => {
        const mediaInfo = getEmbedMediaInfo(previewGuia.guiUrlRecurso, previewGuia.guiIdGuia, previewGuia.guiTipoContenido);
        const isBlob = previewGuia.guiTipoContenido !== 'VIDEO' || mediaInfo.type === 'BLOB_DIRECT';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 text-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-800 space-y-4 animate-scaleUp overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-bold text-base">
                  {previewGuia.guiTipoContenido === 'VIDEO' && <Video size={20} className="text-blue-400" />}
                  {previewGuia.guiTipoContenido === 'IMAGEN' && <ImageIcon size={20} className="text-cyan-400" />}
                  {(previewGuia.guiTipoContenido === 'PDF' || previewGuia.guiTipoContenido === 'DOCUMENTO') && <FileText size={20} className="text-amber-400" />}
                  {previewGuia.guiTipoContenido === 'PRESENTACION' && <Layers size={20} className="text-purple-400" />}
                  <span className="truncate max-w-xl">{previewGuia.guiTitulo}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewGuia(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Reproductor / Visualizador Incrustado */}
              <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-[45vh] max-h-[65vh]">
                {mediaInfo.isEmbed ? (
                  <iframe
                    src={mediaInfo.embedUrl}
                    title={previewGuia.guiTitulo}
                    className="w-full h-[55vh] rounded-xl border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : previewGuia.guiTipoContenido === 'IMAGEN' ? (
                  <img
                    src={mediaInfo.embedUrl}
                    alt={previewGuia.guiTitulo}
                    className="w-full max-h-[55vh] object-contain"
                  />
                ) : previewGuia.guiTipoContenido === 'PDF' || previewGuia.guiTipoContenido === 'DOCUMENTO' ? (
                  <iframe
                    src={mediaInfo.embedUrl}
                    title={previewGuia.guiTitulo}
                    className="w-full h-[55vh] rounded-xl border-0 bg-white"
                  />
                ) : (
                  <div className="p-8 text-center space-y-4">
                    <FileText size={64} className="text-blue-400 mx-auto" />
                    <p className="text-sm text-slate-300">Documento disponible para visualización o descarga</p>
                    <a
                      href={GuiaSistemaClientService.getArchivoUrl(previewGuia.guiIdGuia)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold transition-all text-white"
                    >
                      <ExternalLink size={15} />
                      Abrir / Descargar Archivo
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-2 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>Módulo: <strong className="text-slate-200">{previewGuia.guiModuloDestino || 'GENERAL'}</strong></span>
                <div className="flex items-center gap-3">
                  {isBlob && (
                    <a
                      href={GuiaSistemaClientService.getArchivoUrl(previewGuia.guiIdGuia)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 font-bold underline"
                    >
                      Descargar Archivo
                    </a>
                  )}
                  <span className="truncate max-w-xs text-slate-500">{previewGuia.guiUrlRecurso}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Confirmar Eliminación */}
      <ConfirmDialog
        isOpen={Boolean(guiaToDelete)}
        title="Eliminar Guía del Sistema"
        description={`¿Estás seguro de que deseas eliminar la guía "${guiaToDelete?.guiTitulo}"? Esta acción removerá el registro de la base de datos.`}
        confirmText="Eliminar Guía"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDeleteGuia}
        onClose={() => setGuiaToDelete(null)}
      />
    </div>
  );
};

