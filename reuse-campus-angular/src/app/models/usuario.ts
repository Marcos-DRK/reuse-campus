export type Rol = 'USUARIO' | 'ADMIN';
export type EstadoUsuario = 'ACTIVO' | 'INACTIVO';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  estado: EstadoUsuario;
  fechaRegistro?: string;
}

// Datos que envía el formulario de administración de usuarios
export interface UsuarioForm {
  nombre: string;
  correo: string;
  password?: string;
  rol: Rol;
  estado: EstadoUsuario;
}

export interface RegistroForm {
  nombre: string;
  correo: string;
  password: string;
}

// Respuesta de POST /api/auth/login y /api/auth/registro
export interface Sesion {
  token: string;
  usuario: Usuario;
}
