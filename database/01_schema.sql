/* =========================================================
   ReUse Campus - Modelo de datos (SQL Server)
   Ejecutar:  sqlcmd -S "(localdb)\MSSQLLocalDB" -i database\01_schema.sql
   ATENCIÓN: elimina y vuelve a crear la base ReUseCampusDB.
   ========================================================= */
USE master;
GO

IF DB_ID('ReUseCampusDB') IS NOT NULL
BEGIN
    ALTER DATABASE ReUseCampusDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE ReUseCampusDB;
END
GO

CREATE DATABASE ReUseCampusDB;
GO

USE ReUseCampusDB;
GO

-- Requerido por los índices filtrados (sqlcmd lo trae en OFF por defecto)
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

/* ---------- 1. Usuarios ---------- */
CREATE TABLE Usuarios (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    nombre        NVARCHAR(100) NOT NULL,
    correo        NVARCHAR(150) NOT NULL,
    password      NVARCHAR(255) NOT NULL,          -- se guarda el hash bcrypt, nunca el texto plano
    rol           VARCHAR(20)   NOT NULL DEFAULT 'USUARIO',
    estado        VARCHAR(20)   NOT NULL DEFAULT 'ACTIVO',
    fechaRegistro DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_Usuarios_correo UNIQUE (correo),
    CONSTRAINT CK_Usuarios_rol    CHECK (rol IN ('USUARIO', 'ADMIN')),
    CONSTRAINT CK_Usuarios_estado CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);
GO

/* ---------- 2. Publicaciones (RN02: cada publicación pertenece a un usuario) ---------- */
CREATE TABLE Publicaciones (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    titulo           NVARCHAR(150) NOT NULL,
    descripcion      NVARCHAR(1000) NOT NULL,
    categoria        NVARCHAR(60)  NOT NULL,
    modalidad        VARCHAR(20)   NOT NULL,
    estado           VARCHAR(20)   NOT NULL DEFAULT 'DISPONIBLE',
    fechaPublicacion DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    usuarioId        INT           NOT NULL,
    CONSTRAINT FK_Publicaciones_Usuarios FOREIGN KEY (usuarioId) REFERENCES Usuarios(id),
    CONSTRAINT CK_Publicaciones_modalidad CHECK (modalidad IN ('DONACION', 'INTERCAMBIO')),
    CONSTRAINT CK_Publicaciones_estado    CHECK (estado IN ('DISPONIBLE', 'RESERVADA', 'ENTREGADA', 'CANCELADA'))
);
GO

/* ---------- 3. Solicitudes ---------- */
CREATE TABLE Solicitudes (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    publicacionId  INT            NOT NULL,
    solicitanteId  INT            NOT NULL,
    mensaje        NVARCHAR(500)  NOT NULL,
    fechaSolicitud DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    estado         VARCHAR(20)    NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT FK_Solicitudes_Publicaciones FOREIGN KEY (publicacionId) REFERENCES Publicaciones(id),
    CONSTRAINT FK_Solicitudes_Usuarios      FOREIGN KEY (solicitanteId) REFERENCES Usuarios(id),
    CONSTRAINT CK_Solicitudes_estado CHECK (estado IN ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'CANCELADA'))
);
GO

-- RN05 (respaldo en BD): un usuario no puede tener dos solicitudes PENDIENTES sobre la misma publicación
CREATE UNIQUE INDEX UX_Solicitudes_pendiente_unica
    ON Solicitudes (publicacionId, solicitanteId)
    WHERE estado = 'PENDIENTE';
GO

-- RN08 (respaldo en BD): solo una solicitud ACEPTADA por publicación
CREATE UNIQUE INDEX UX_Solicitudes_aceptada_unica
    ON Solicitudes (publicacionId)
    WHERE estado = 'ACEPTADA';
GO

/* ---------- 4. Entregas / Intercambios ---------- */
CREATE TABLE Entregas (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    publicacionId INT          NOT NULL,
    solicitudId   INT          NOT NULL,
    propietarioId INT          NOT NULL,
    receptorId    INT          NOT NULL,
    fechaAcuerdo  DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    fechaEntrega  DATETIME2    NULL,
    estado        VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT FK_Entregas_Publicaciones FOREIGN KEY (publicacionId) REFERENCES Publicaciones(id),
    CONSTRAINT FK_Entregas_Solicitudes   FOREIGN KEY (solicitudId)   REFERENCES Solicitudes(id),
    CONSTRAINT FK_Entregas_Propietario   FOREIGN KEY (propietarioId) REFERENCES Usuarios(id),
    CONSTRAINT FK_Entregas_Receptor      FOREIGN KEY (receptorId)    REFERENCES Usuarios(id),
    CONSTRAINT UQ_Entregas_solicitud UNIQUE (solicitudId),
    CONSTRAINT CK_Entregas_estado CHECK (estado IN ('PENDIENTE', 'COMPLETADA'))
);
GO

PRINT 'Base de datos ReUseCampusDB creada correctamente';
GO
