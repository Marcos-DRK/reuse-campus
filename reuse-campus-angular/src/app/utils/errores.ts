import { HttpErrorResponse } from '@angular/common/http';

// Convierte cualquier error de HttpClient en un mensaje comprensible para el usuario.
export function mensajeError(error: unknown, porDefecto = 'Ocurrió un error inesperado.'): string {
  if (error instanceof HttpErrorResponse) {
    // status 0 = Angular no pudo comunicarse con la API (servidor apagado, CORS, red)
    if (error.status === 0) {
      return 'No se pudo conectar con la API. Verifique que el servidor esté encendido en http://localhost:3000.';
    }
    // El backend siempre responde { mensaje: '...' } en los errores
    if (error.error && typeof error.error.mensaje === 'string') {
      return error.error.mensaje;
    }
    if (error.status >= 500) {
      return 'Error interno del servidor. Intente nuevamente.';
    }
  }
  return porDefecto;
}
