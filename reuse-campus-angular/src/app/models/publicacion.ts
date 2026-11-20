export type Modalidad = 'DONACION' | 'INTERCAMBIO';
export type EstadoPublicacion = 'DISPONIBLE' | 'RESERVADA' | 'ENTREGADA' | 'CANCELADA';

export interface Publicacion {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  modalidad: Modalidad;
  estado: EstadoPublicacion;
  fechaPublicacion: string;
  usuarioId: number;            // FK -> Usuarios (propietario)
  propietarioNombre: string;    // viene del JOIN con Usuarios
  solicitudesPendientes: number;
}

// Lo que se envía al crear/editar. El estado y el usuarioId NO se envían (los decide el backend).
export interface PublicacionForm {
  titulo: string;
  descripcion: string;
  categoria: string;
  modalidad: Modalidad;
}

export interface FiltrosPublicacion {
  texto: string;
  categoria: string;
  modalidad: string;
  estado: string;
}

export const CATEGORIAS = ['Libros', 'Calculadoras', 'Componentes', 'Accesorios', 'Materiales', 'Otros'];
export const MODALIDADES: Modalidad[] = ['DONACION', 'INTERCAMBIO'];
export const ESTADOS_PUBLICACION: EstadoPublicacion[] = ['DISPONIBLE', 'RESERVADA', 'ENTREGADA', 'CANCELADA'];
