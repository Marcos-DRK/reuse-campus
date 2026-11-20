import { EstadoPublicacion } from './publicacion';

export type EstadoSolicitud = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'CANCELADA';

export interface Solicitud {
  id: number;
  publicacionId: number;   // FK -> Publicaciones
  solicitanteId: number;   // FK -> Usuarios
  mensaje: string;
  fechaSolicitud: string;
  estado: EstadoSolicitud;
  publicacionTitulo: string;
  publicacionEstado: EstadoPublicacion;
  propietarioId: number;
  propietarioNombre: string;
  solicitanteNombre: string;
  solicitanteCorreo: string;
}

// Respuesta de PATCH /api/solicitudes/:id/aceptar
export interface RespuestaAceptar {
  mensaje: string;
  entregaId: number;
  solicitudesRechazadas: number;
}
