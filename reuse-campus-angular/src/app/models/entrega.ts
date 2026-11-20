import { EstadoPublicacion, Modalidad } from './publicacion';

export type EstadoEntrega = 'PENDIENTE' | 'COMPLETADA';

export interface Entrega {
  id: number;
  publicacionId: number;  // FK -> Publicaciones
  solicitudId: number;    // FK -> Solicitudes (la aceptada)
  propietarioId: number;  // FK -> Usuarios (quien entrega)
  receptorId: number;     // FK -> Usuarios (quien recibe)
  fechaAcuerdo: string;
  fechaEntrega: string | null;
  estado: EstadoEntrega;
  publicacionTitulo: string;
  publicacionEstado: EstadoPublicacion;
  modalidad: Modalidad;
  propietarioNombre: string;
  receptorNombre: string;
  solicitudMensaje: string;
}
