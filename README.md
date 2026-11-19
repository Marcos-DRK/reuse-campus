# ♻️ ReUse Campus

Plataforma web de **economía circular** para una comunidad educativa. Sus integrantes publican artículos que ya no usan (libros, calculadoras, componentes, accesorios, materiales) para **donarlos o intercambiarlos**. Otros usuarios los solicitan, el propietario elige qué solicitud aceptar y el sistema controla todo el ciclo de estados hasta la entrega, conservando el historial.

Evaluación Integradora · Electivo Angular · Ingeniería en Informática · IP Virginio Gómez, sede Chillán.

**Autor:** Marco

---

## 1. Tecnologías utilizadas

| Capa | Tecnología |
| :--- | :--- |
| Frontend | **Angular 22** (componentes standalone, signals, Reactive Forms, Router, guards, interceptor funcional) |
| Comunicación | **HttpClient** → HTTP + JSON, autenticación con **JWT** (encabezado `Authorization: Bearer`) |
| Backend | **Node.js 24 + Express 5** (API REST) |
| Base de datos | **SQL Server** (LocalDB `(localdb)\MSSQLLocalDB`) con el paquete `mssql` + driver `msnodesqlv8` (ODBC Driver 17, autenticación de Windows) |
| Seguridad | `bcryptjs` (hash de contraseñas), `jsonwebtoken` (sesión), validación de reglas en el servidor |
| Pruebas | `node:test` + `supertest` (pruebas de integración contra la BD real) |

```text
NAVEGADOR
   │
   ▼
ANGULAR 22 (http://localhost:4200)
   │  HttpClient + interceptor (token JWT)
   ▼
API REST EXPRESS (http://localhost:3000/api)
   │  middleware verificarToken → regla de negocio → consulta parametrizada / transacción
   ▼
SQL SERVER (ReUseCampusDB → Usuarios, Publicaciones, Solicitudes, Entregas)
```

## 2. Requisitos

- Node.js 20 o superior y npm (probado con Node 24.20 / npm 11.19).
- Angular CLI 22 (`npm install -g @angular/cli`).
- SQL Server: **LocalDB** (viene con Visual Studio / SQL Server Express) o una instancia SQL Server Express/Developer.
- **ODBC Driver 17 for SQL Server** y la herramienta `sqlcmd` (o SQL Server Management Studio / Azure Data Studio).
- Windows (el driver `msnodesqlv8` usa autenticación de Windows).

Comprobación:

```bash
node -v
ng version
sqllocaldb info MSSQLLocalDB
```

## 3. Configuración de la base de datos

1. Inicie LocalDB (si no está iniciado):

```bash
sqllocaldb start MSSQLLocalDB
```

2. Cree la base de datos, tablas, claves y restricciones:

```bash
sqlcmd -S "(localdb)\MSSQLLocalDB" -i database\01_schema.sql -f 65001
```

3. Cargue los datos de prueba:

```bash
sqlcmd -S "(localdb)\MSSQLLocalDB" -i database\02_seed.sql -f 65001
```

> `01_schema.sql` **elimina y vuelve a crear** `ReUseCampusDB`; sirve también para dejar la BD limpia antes de una demostración.
> También se pueden abrir los dos scripts en SSMS y ejecutarlos en orden.

4. Configure la conexión de la API: copie `api-reuse-campus/.env.example` como `api-reuse-campus/.env` y ajuste si es necesario:

```ini
PORT=3000
JWT_SECRET=cambie-esta-clave-secreta
DB_CONNECTION_STRING=Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\MSSQLLocalDB;Database=ReUseCampusDB;Trusted_Connection=yes;
```

Para una instancia SQL Server Express use `Server=localhost\SQLEXPRESS`.

### Modelo relacional

```text
Usuarios (id PK, nombre, correo UNIQUE, password[hash], rol, estado, fechaRegistro)
   │ 1
   │──────────────< Publicaciones (id PK, titulo, descripcion, categoria, modalidad, estado,
   │ 1                              fechaPublicacion, usuarioId FK → Usuarios)
   │                    │ 1
   │──────────────<     │──────────< Solicitudes (id PK, publicacionId FK, solicitanteId FK → Usuarios,
   │                    │                          mensaje, fechaSolicitud, estado)
   │                    │                    │ 1
   │                    │ 1                  │ 1
   └──(propietario/receptor)──< Entregas (id PK, publicacionId FK, solicitudId FK UNIQUE,
                                           propietarioId FK, receptorId FK, fechaAcuerdo, fechaEntrega, estado)
```

- `CHECK` en todos los estados, roles y modalidades.
- Índice único filtrado `UX_Solicitudes_pendiente_unica (publicacionId, solicitanteId) WHERE estado='PENDIENTE'` → refuerza **RN05** en la BD.
- Índice único filtrado `UX_Solicitudes_aceptada_unica (publicacionId) WHERE estado='ACEPTADA'` → refuerza **RN08** en la BD.
- Las FK no tienen `ON DELETE CASCADE`: el historial no se puede borrar en cascada (**RN17**).

## 4. Instalación y ejecución

```bash
# Terminal 1 - API
cd api-reuse-campus
npm install
npm start          # http://localhost:3000
```

```bash
# Terminal 2 - Angular
cd reuse-campus-angular
npm install
ng serve           # http://localhost:4200
```

| Orden | Acción | Resultado |
| :--- | :--- | :--- |
| 1 | Iniciar LocalDB y ejecutar los scripts (solo la primera vez) | BD `ReUseCampusDB` lista |
| 2 | `npm start` en `api-reuse-campus` | API en el puerto 3000 |
| 3 | `ng serve` en `reuse-campus-angular` | Angular en el puerto 4200 |
| 4 | Abrir `http://localhost:4200` | Pantalla de login |

> Si `npm install` advierte sobre *install scripts* de `msnodesqlv8`, no es un error: el paquete trae binarios precompilados. Si la conexión fallara, ejecute `npm install-scripts approve msnodesqlv8` y `npm rebuild msnodesqlv8`.

### Problemas frecuentes

| Problema | Solución |
| :--- | :--- |
| `Login timeout expired` / `Server is not found` al usar `(localdb)\MSSQLLocalDB` | Inicie LocalDB: `sqllocaldb start MSSQLLocalDB` |
| `sqllocaldb start` responde *SQL Server process failed to start* | Quedó un proceso huérfano: `sqllocaldb stop MSSQLLocalDB -k` y luego `sqllocaldb start MSSQLLocalDB` |
| `Cannot open database "ReUseCampusDB"` | Ejecute `database\01_schema.sql` y `database\02_seed.sql` |
| `CREATE INDEX failed ... QUOTED_IDENTIFIER` | Use los scripts del repositorio (ya incluyen `SET QUOTED_IDENTIFIER ON`) |
| Angular muestra "No se pudo conectar con la API" | Inicie la API con `npm start` en `api-reuse-campus` |
| Las pruebas (`npm test`) fallan en el login del admin | Cargue primero `02_seed.sql` (las pruebas usan `admin@reuse.cl`) |
| `ng serve` no refleja un cambio | Detenga `ng serve` (Ctrl+C) y vuelva a ejecutarlo |

### Usuarios de prueba (02_seed.sql)

| Correo | Contraseña | Rol |
| :--- | :--- | :--- |
| admin@reuse.cl | Admin123 | ADMIN |
| ana@reuse.cl | Usuario123 | USUARIO |
| bruno@reuse.cl | Usuario123 | USUARIO |
| carla@reuse.cl | Usuario123 | USUARIO |

## 5. Estructura de la solución

```text
Trabajo N°3/
├── database/
│   ├── 01_schema.sql            # BD, 4 tablas, PK, FK, CHECK, índices filtrados
│   └── 02_seed.sql              # datos de prueba
├── api-reuse-campus/            # Backend Node.js + Express
│   ├── .env.example
│   ├── src/
│   │   ├── server.js            # levanta la API (app.listen)
│   │   ├── app.js               # express, cors, json, rutas, 404 y manejador de errores
│   │   ├── db.js                # pool de conexión a SQL Server
│   │   ├── middlewares/
│   │   │   ├── auth.js          # generarToken, verificarToken (JWT), soloAdmin
│   │   │   └── errores.js       # ErrorApp, 404, manejo central de errores
│   │   ├── utils/validaciones.js
│   │   └── routes/
│   │       ├── auth.js          # registro, login, perfil
│   │       ├── usuarios.js      # CRUD usuarios (ADMIN)
│   │       ├── publicaciones.js # CRUD publicaciones + cancelar
│   │       ├── solicitudes.js   # crear, editar, aceptar, rechazar, cancelar
│   │       └── entregas.js      # listar, ver, completar
│   └── tests/flujo.test.js      # 14 pruebas de integración
└── reuse-campus-angular/        # Frontend Angular 22
    └── src/app/
        ├── config.ts            # URL de la API
        ├── models/              # usuario, publicacion, solicitud, entrega
        ├── services/            # auth, publicaciones, solicitudes, entregas, usuarios (HttpClient)
        ├── interceptors/        # auth-interceptor (token + 401)
        ├── guards/              # authGuard, adminGuard, invitadoGuard
        ├── utils/errores.ts     # convierte errores HTTP en mensajes comprensibles
        ├── components/          # cabecera, menu, login, registro, inicio, publicaciones,
        │                        # publicacion-detalle, publicacion-form, mis-publicaciones,
        │                        # mis-solicitudes, entregas, admin-usuarios
        ├── app.routes.ts
        └── app.config.ts
```

## 6. API REST

Todas las rutas (salvo registro/login) requieren `Authorization: Bearer <token>`. Los errores siempre responden `{ "mensaje": "..." }`.

| Método | Ruta | Descripción | Códigos |
| :--- | :--- | :--- | :--- |
| POST | `/api/auth/registro` | Crea cuenta USUARIO | 201, 400, 409 |
| POST | `/api/auth/login` | Inicia sesión, devuelve token | 200, 400, 401, 403 |
| GET | `/api/auth/perfil` | Usuario autenticado | 200, 401 |
| GET | `/api/usuarios` | Lista usuarios (ADMIN) | 200, 401, 403 |
| GET | `/api/usuarios/:id` | Ver usuario (ADMIN) | 200, 400, 404 |
| POST | `/api/usuarios` | Crear usuario (ADMIN) | 201, 400, 409 |
| PUT | `/api/usuarios/:id` | Editar nombre, correo, rol, estado (ADMIN) | 200, 400, 404, 409 |
| DELETE | `/api/usuarios/:id` | Baja lógica → INACTIVO (ADMIN) | 200, 404, 409 |
| GET | `/api/publicaciones?estado=&categoria=&modalidad=&texto=` | Catálogo con filtros | 200, 400 |
| GET | `/api/publicaciones/mias` | Mis publicaciones | 200 |
| GET | `/api/publicaciones/:id` | Detalle | 200, 400, 404 |
| POST | `/api/publicaciones` | Crear (queda DISPONIBLE) | 201, 400, 401 |
| PUT | `/api/publicaciones/:id` | Editar (dueño/admin, solo DISPONIBLE) | 200, 400, 403, 404, 409 |
| PATCH | `/api/publicaciones/:id/cancelar` | DISPONIBLE → CANCELADA | 200, 403, 404, 409 |
| DELETE | `/api/publicaciones/:id` | Eliminar solo si no tiene solicitudes | 200, 403, 404, 409 |
| GET | `/api/solicitudes/mias` | Mis solicitudes | 200 |
| GET | `/api/solicitudes/publicacion/:id` | Solicitudes recibidas (dueño/admin) | 200, 403, 404 |
| GET | `/api/solicitudes/:id` | Ver solicitud | 200, 403, 404 |
| POST | `/api/solicitudes` | Solicitar `{publicacionId, mensaje}` | 201, 400, 403, 404, 409 |
| PUT | `/api/solicitudes/:id` | Editar mensaje (solo PENDIENTE) | 200, 403, 409 |
| PATCH | `/api/solicitudes/:id/aceptar` | Aceptar (transacción) | 200, 403, 404, 409 |
| PATCH | `/api/solicitudes/:id/rechazar` | Rechazar | 200, 403, 404, 409 |
| PATCH | `/api/solicitudes/:id/cancelar` | Cancelar (solicitante, solo PENDIENTE) | 200, 403, 404, 409 |
| GET | `/api/entregas` | Mis entregas (admin: todas) | 200 |
| GET | `/api/entregas/:id` | Ver entrega | 200, 403, 404 |
| PATCH | `/api/entregas/:id/completar` | Completar (transacción) | 200, 403, 404, 409 |

## 7. Funcionalidades implementadas

- **Login, registro y cierre de sesión** con JWT; la sesión sobrevive a la recarga (localStorage).
- **Roles USUARIO y ADMIN**: el menú, los guards y el backend se comportan distinto por rol. El ADMIN gestiona usuarios (crear, editar, cambiar rol/estado, desactivar) y puede ver todas las entregas.
- **Publicaciones**: catálogo con filtros (texto, categoría, modalidad, estado), detalle, crear, editar, cancelar y eliminar (solo sin historial).
- **Solicitudes**: solicitar con mensaje, editar el mensaje y cancelar mientras está PENDIENTE; el propietario ve las solicitudes recibidas y acepta o rechaza.
- **Entregas/Intercambios**: se crean automáticamente al aceptar; el propietario las confirma y la publicación pasa a ENTREGADA.
- **Inicio** con resumen: disponibles, mis publicaciones, solicitudes por revisar, mis solicitudes pendientes y entregas pendientes.
- **Validaciones** en Angular (Reactive Forms) **y** en Express; mensajes de error comprensibles, incluido el error de comunicación cuando la API está apagada.

### Reglas de negocio: dónde se implementan

| Regla | Backend (obligatorio) | Frontend / BD |
| :--- | :--- | :--- |
| RN01 Solo autenticados publican | `middlewares/auth.js` → `verificarToken`; `routes/publicaciones.js` (`router.use(verificarToken)`) | `authGuard` |
| RN02 Un único propietario | `routes/publicaciones.js` POST usa `req.usuario.id` (ignora el body) | FK `usuarioId` NOT NULL |
| RN03 No solicitar lo propio | `routes/solicitudes.js` POST → 403 | Detalle oculta el formulario |
| RN04 Solo sobre DISPONIBLE | `routes/solicitudes.js` POST → 409 | Mensaje en detalle |
| RN05 Sin PENDIENTE duplicada | `routes/solicitudes.js` POST → 409 | Índice único filtrado |
| RN06 Varias solicitudes por publicación | `routes/solicitudes.js` POST (permitido) | — |
| RN07 Solo el dueño acepta/rechaza | `routes/solicitudes.js` aceptar/rechazar → 403 | Botones solo para el dueño |
| RN08 Solo una ACEPTADA | `routes/solicitudes.js` aceptar (valida DISPONIBLE + UPDLOCK) | Índice único filtrado |
| RN09 Aceptar → RESERVADA | `routes/solicitudes.js` aceptar (transacción, paso 2) | — |
| RN10 Resto PENDIENTES → RECHAZADA | `routes/solicitudes.js` aceptar (transacción, paso 3) | — |
| RN11 Crear Entrega PENDIENTE | `routes/solicitudes.js` aceptar (transacción, paso 4) | — |
| RN12 RESERVADA no recibe solicitudes | `routes/solicitudes.js` POST → 409 | — |
| RN13 No DISPONIBLE → ENTREGADA directo | `routes/publicaciones.js` PUT rechaza `estado`; `routes/entregas.js` exige RESERVADA | — |
| RN14 Completar → ENTREGADA | `routes/entregas.js` completar (transacción) | — |
| RN15 ENTREGADA no recibe solicitudes | `routes/solicitudes.js` POST → 409 | — |
| RN16 Cancelar solo PENDIENTE | `routes/solicitudes.js` cancelar → 403/409 | Botón solo en PENDIENTE |
| RN17 Historial por estados | Usuarios → INACTIVO; publicaciones → CANCELADA; solicitudes → CANCELADA/RECHAZADA; entregas sin DELETE | FK sin cascada |
| RN18 Validación en servidor | Todas las reglas anteriores viven en Express | Los guards/botones ocultos solo son usabilidad |

## 8. Pruebas realizadas

### Pruebas automáticas (API + SQL Server real)

```bash
cd api-reuse-campus
npm test
```

Requiere la BD creada con `01_schema.sql` + `02_seed.sql`. No necesita la API encendida (supertest levanta la app en memoria) y puede repetirse: cada ejecución crea usuarios con correo único.

Resultado: **14 pruebas, 14 aprobadas** (verificado también sobre una copia limpia del repositorio instalada con `npm ci`). Cubren:

| Prueba | Resultado esperado |
| :--- | :--- |
| Flujo completo: publicar → 2 solicitudes → aceptar → RESERVADA / RECHAZADA / Entrega PENDIENTE → completar → ENTREGADA | 200/201 y estados correctos |
| RN12 y RN15: solicitar publicación RESERVADA / ENTREGADA | 409 |
| RN08: aceptar una segunda solicitud | 409 |
| El receptor intenta completar la entrega | 403 |
| Completar dos veces | 409 |
| RN17: eliminar publicación con historial | 409 |
| RN01: publicar sin token | 401 |
| RN02: enviar otro `usuarioId` en el body | se ignora, el dueño es el del token |
| RN03: solicitar la propia publicación | 403 |
| RN05: solicitud PENDIENTE duplicada | 409 |
| RN07: un tercero acepta/rechaza | 403 |
| RN13: enviar `estado` en el PUT | 400 |
| RN16: cancelar ajena (403), cancelar (200), cancelar de nuevo (409) | 403 / 200 / 409 |
| Publicación CANCELADA no recibe solicitudes | 409 |
| Datos incompletos o inválidos | 400 |
| Recurso inexistente / ID inválido / ruta inexistente | 404 / 400 / 404 |
| USUARIO entra a `/api/usuarios` (403); ADMIN (200) | 403 / 200 |
| Login incorrecto (401); usuario INACTIVO (403, también con su token anterior) | 401 / 403 |
| Token falso (401) y JSON mal formado (400) | 401 / 400 |

### Pruebas manuales en la aplicación (navegador)

| Prueba | Resultado |
| :--- | :--- |
| Login de Bruno y Carla; ambos solicitan la calculadora de Ana | Solicitudes PENDIENTES visibles para Ana |
| Ana acepta la solicitud de Bruno | Mensaje "1 rechazada automáticamente"; publicación RESERVADA; Carla RECHAZADA |
| Ana confirma la entrega en *Entregas* | Entrega COMPLETADA con fecha; publicación ENTREGADA |
| Formulario de publicación vacío | Mensajes de validación por campo |
| API detenida y navegar a Publicaciones | "No se pudo conectar con la API..." + botón Reintentar |
| Crear publicación, reiniciar la API y recargar | La publicación sigue en Angular y en `SELECT * FROM Publicaciones` |
| Ana (USUARIO) abre `/admin/usuarios` | Redirige a inicio; la API directa responde 403 |
| Admin crea usuario con correo repetido | "Ya existe un usuario registrado con ese correo" (409) |
| Login con contraseña incorrecta | "Correo o contraseña incorrectos" |
| `ng build` | Compila sin errores |

## 9. Declaración de uso de inteligencia artificial

**Herramienta utilizada:** Claude Code (modelo Claude Opus 5.5, de Anthropic), dentro de la aplicación de escritorio de Claude.

**Tareas en las que se utilizó IA:**

- Lectura del enunciado y de la Actividad 6, y propuesta de la arquitectura (estructura de carpetas, endpoints y componentes).
- **Generación del código**: script SQL del modelo de datos y datos de prueba, API Express completa (rutas, middlewares de autenticación y errores, transacciones de aceptar y completar) y frontend Angular (modelos, servicios, interceptor, guards, componentes y estilos).
- Generación de las pruebas automáticas (`tests/flujo.test.js`) y de este README.
- Depuración durante el desarrollo:
  - `sqlcmd` crea las conexiones con `QUOTED_IDENTIFIER OFF` y los índices filtrados fallaban; se agregó `SET QUOTED_IDENTIFIER ON` a los scripts.
  - El formulario de solicitud no tenía `[formGroup]` y recargaba la página; se corrigió.
  - Las fechas se mostraban con 3 horas de desfase; se cambió a `SYSUTCDATETIME()`.

**Qué partes fueron generadas o propuestas con IA:** prácticamente todo el código inicial del repositorio (carpetas `database/`, `api-reuse-campus/` y `reuse-campus-angular/src/app/`), tomando como guía el estilo de la Actividad 6 (validación de id con `Number.isInteger`, respuestas `res.status().json()`, servicios con HttpClient, Reactive Forms y control flow `@if/@for`).

**Modificaciones, adaptaciones o correcciones realizadas por el estudiante:**
> ✏️ *Marco: complete esta sección con lo que usted cambió, por ejemplo: decisiones que tomó (SQL Server en lugar de MySQL, LocalDB), ajustes de diseño o texto, cambios de reglas, pruebas extra, correcciones propias y commits posteriores.*

**Cómo se verificó que funciona y cumple las reglas de negocio:**

- Ejecución de `npm test`: 14/14 pruebas aprobadas contra SQL Server real, una o más por regla de negocio y por cada situación inválida del punto 8 del enunciado.
- Ejecución de `ng build` sin errores.
- Recorrido manual del flujo completo del punto 7 en el navegador con tres usuarios (Ana, Bruno y Carla), revisando los estados en la interfaz y con `SELECT` en SQL Server.
- Prueba de persistencia reiniciando la API y prueba de error de comunicación con la API detenida.
- Revisión y explicación personal de cada archivo para la interrogación.
