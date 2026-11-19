/* =========================================================
   ReUse Campus - Datos iniciales de prueba
   Ejecutar:  sqlcmd -S "(localdb)\MSSQLLocalDB" -i database\02_seed.sql
   Contraseñas de prueba:
     admin@reuse.cl  -> Admin123
     ana@reuse.cl, bruno@reuse.cl, carla@reuse.cl -> Usuario123
   ========================================================= */
USE ReUseCampusDB;
GO

-- Requerido por los índices filtrados (sqlcmd lo trae en OFF por defecto)
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

INSERT INTO Usuarios (nombre, correo, password, rol, estado) VALUES
 ('Administrador', 'admin@reuse.cl', '$2b$10$slTWEmiXmkgIQ0ot55dF7.IcGb1cUfbjxUF2SHdnrXh0H.HvpaTTa', 'ADMIN',   'ACTIVO'),
 ('Ana Pérez',     'ana@reuse.cl',   '$2b$10$V3mb6UJsEf7Y8tf3UxS1eOWTKHrcekhJKs1Z2YMuriH8.ZI1PaLLu', 'USUARIO', 'ACTIVO'),
 ('Bruno Soto',    'bruno@reuse.cl', '$2b$10$V3mb6UJsEf7Y8tf3UxS1eOWTKHrcekhJKs1Z2YMuriH8.ZI1PaLLu', 'USUARIO', 'ACTIVO'),
 ('Carla Muñoz',   'carla@reuse.cl', '$2b$10$V3mb6UJsEf7Y8tf3UxS1eOWTKHrcekhJKs1Z2YMuriH8.ZI1PaLLu', 'USUARIO', 'ACTIVO');
GO

INSERT INTO Publicaciones (titulo, descripcion, categoria, modalidad, usuarioId) VALUES
 ('Calculadora Casio fx-570',  'Calculadora científica en buen estado, incluye tapa.',            'Calculadoras', 'DONACION',    2),
 ('Libro Cálculo de Stewart',  'Cálculo de una variable, 7ma edición. Algunas páginas subrayadas.', 'Libros',      'INTERCAMBIO', 2),
 ('Kit Arduino Uno',           'Placa Arduino Uno con cables, protoboard y sensores básicos.',     'Componentes',  'DONACION',    3),
 ('Audífonos con micrófono',   'Audífonos USB, sirven para clases online.',                         'Accesorios',   'INTERCAMBIO', 4);
GO

INSERT INTO Solicitudes (publicacionId, solicitanteId, mensaje) VALUES
 (2, 3, 'Hola Ana, me sirve mucho para Cálculo I. Puedo intercambiarlo por un libro de Física.');
GO

SELECT 'Usuarios' AS tabla, COUNT(*) AS total FROM Usuarios
UNION ALL SELECT 'Publicaciones', COUNT(*) FROM Publicaciones
UNION ALL SELECT 'Solicitudes',   COUNT(*) FROM Solicitudes
UNION ALL SELECT 'Entregas',      COUNT(*) FROM Entregas;
GO
