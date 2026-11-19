# INSTITUTO PROFESIONAL VIRGINIO GÓMEZ SEDE CHILLÁN
## EVALUACIÓN INTEGRADORA – ELECTIVO ANGULAR
**ReUse Campus – Plataforma de reutilización e intercambio**

| Atributo | Detalle |
| :--- | :--- |
| **Carrera** | Ingeniería en Informática |
| **Asignatura** | Electivo Angular |
| **Modalidad** | Individual |
| **Ponderación** | Actividad práctica 30% + Interrogación individual 70% |
| **Entrega actividad** | 27 de noviembre de 2026, hasta las 14:00 |
| **Interrogaciones** | Desde el 24 de noviembre de 2026 · duración máxima 10–15 minutos por estudiante |

---

## 1. Condiciones obligatorias de entrega y derecho a interrogación

**ATENCIÓN – CONDICIÓN DE ADMISIBILIDAD:** la única forma válida de entrega es mediante un repositorio GitHub PÚBLICO y el registro de la URL de ese repositorio en la actividad correspondiente de Canvas IPVG, dentro del plazo establecido.

* El repositorio debe ser público y accesible al momento de la entrega y durante la revisión.
* La URL del repositorio GitHub debe ser ingresada obligatoriamente en Canvas IPVG antes del 24 de noviembre de 2026 a las 23:59.
* No se recibirán archivos, enlaces ni repositorios por correo electrónico, mensajería, pendrive u otro medio.
* Si el repositorio no es público, la URL es incorrecta, el proyecto no es revisable o la URL no fue registrada en Canvas dentro del plazo, la actividad se considerará NO ENTREGADA y no será evaluada.
* Para rendir la interrogación del 70%, el estudiante debe contar con una entrega válida de la actividad práctica del 30%.
* Si el estudiante no realiza o no entrega válidamente la actividad, no existe un producto propio que pueda defender y, por tanto, NO tiene derecho a rendir la interrogación.
* Si entrega válidamente la actividad, pero no rinde la interrogación, conserva únicamente el puntaje obtenido en la actividad práctica, con un máximo de 30 puntos sobre 100.

## 2. Propósito de la evaluación
Desarrollar y defender una aplicación web funcional que integre Angular, Node.js con Express y una base de datos relacional. La evaluación busca comprobar que el estudiante puede implementar un flujo de negocio completo, relacionar datos, aplicar reglas, manejar errores y explicar el funcionamiento real de su propia solución.

## 3. Caso: ReUse Campus
ReUse Campus es una plataforma de economía circular para una comunidad educativa. Permite que sus integrantes publiquen artículos que ya no utilizan, por ejemplo, libros, componentes, calculadoras, accesorios o materiales para donarlos o intercambiarlos. Otros usuarios pueden solicitar esos artículos y el propietario decide qué solicitud aceptar. El sistema debe conservar el historial y controlar correctamente los cambios de estado desde la publicación hasta la entrega.

**Importante:** no se considerará suficiente desarrollar cuatro CRUD independientes. Las entidades deben estar relacionadas y las reglas de negocio deben producir efectos coherentes en la aplicación y en la base de datos.

## 4. Tecnologías y contenidos evaluados
* Frontend desarrollado en Angular.
* Consumo de API mediante HttpClient.
* Backend obligatorio con Node.js + Express.
* MySQL u otra base de datos relacional.
* CRUD completo aplicado de manera coherente al dominio.
* Cuatro entidades relacionadas, claves primarias y claves foráneas.
* Formularios, validaciones y manejo de errores.
* Login y control de acceso mediante roles.
* Interfaz clara, consistente y usable.
* API REST con métodos HTTP, parámetros, cuerpos de solicitud, respuestas y códigos de estado coherentes.
* Aplicación de reglas de negocio tanto en la interfaz cuando corresponda como, obligatoriamente, en el backend para las operaciones sensibles.
* Capacidad de explicar el flujo: interfaz Angular → HttpClient → API Express → regla de negocio → base de datos → respuesta → actualización de interfaz.

## 5. Entidades mínimas obligatorias

| Entidad | Campos mínimos | Consideraciones |
| :--- | :--- | :--- |
| **Usuario** | id, nombre, correo, password, rol, estado | Roles mínimos: Usuario y Administrador. |
| **Publicación** | id, título, descripción, categoría, modalidad, estado, fechaPublicación, usuarioId | Modalidad: DONACIÓN o INTERCAMBIO.<br>Estados: DISPONIBLE, RESERVADA, ENTREGADA, CANCELADA. |
| **Solicitud** | id, publicacionId, solicitanteId, mensaje, fechaSolicitud, estado | Estados: PENDIENTE, ACEPTADA, RECHAZADA, CANCELADA. |
| **Entrega/Intercambio** | id, publicacionId, solicitudId, propietarioId, receptorId, fechaAcuerdo, fechaEntrega, estado | Estados: PENDIENTE y COMPLETADA. |

## 6. Reglas de negocio obligatorias

| Regla | Definición |
| :--- | :--- |
| **RN01** | Solo un usuario autenticado puede crear publicaciones. |
| **RN02** | Cada publicación pertenece a un único usuario propietario. |
| **RN03** | El propietario no puede solicitar su propia publicación. |
| **RN04** | Solo se pueden generar solicitudes sobre publicaciones en estado DISPONIBLE. |
| **RN05** | Un mismo usuario no puede mantener dos solicitudes PENDIENTES sobre la misma publicación. |
| **RN06** | Una publicación puede recibir varias solicitudes mientras permanezca DISPONIBLE. |
| **RN07** | Solo el propietario puede aceptar o rechazar solicitudes asociadas a su publicación. |
| **RN08** | Solo una solicitud puede quedar ACEPTADA para una publicación. |
| **RN09** | Al aceptar una solicitud, la publicación debe cambiar automáticamente de DISPONIBLE a RESERVADA. |
| **RN10** | Al aceptar una solicitud, las demás solicitudes PENDIENTES de esa publicación deben cambiar a RECHAZADA. |
| **RN11** | La aceptación debe generar un registro de Entrega/Intercambio en estado PENDIENTE. |
| **RN12** | Una publicación RESERVADA no puede recibir nuevas solicitudes. |
| **RN13** | Una publicación no puede pasar directamente de DISPONIBLE a ENTREGADA. |
| **RN14** | Al confirmar la Entrega/Intercambio como COMPLETADA, la publicación cambia automáticamente a ENTREGADA. |
| **RN15** | Una publicación ENTREGADA no puede recibir nuevas solicitudes. |
| **RN16** | El solicitante puede cancelar su solicitud únicamente mientras esté PENDIENTE. |
| **RN17** | Las operaciones finalizadas necesarias para conservar historial no deben eliminarse físicamente; se deben utilizar estados cuando corresponda. |
| **RN18** | Las operaciones sensibles deben validarse en el backend. Ocultar un botón en Angular no reemplaza la autorización o validación del servidor. |

## 7. Flujo funcional mínimo que debe demostrarse
El sistema debe permitir demostrar, como mínimo, el siguiente flujo: un usuario publica un artículo; dos usuarios distintos realizan solicitudes; el propietario acepta una de ellas; la publicación queda RESERVADA; las demás solicitudes pendientes quedan RECHAZADAS; se genera una Entrega/Intercambio PENDIENTE; y, al confirmar la entrega, esta queda COMPLETADA y la publicación pasa a ENTREGADA.

## 8. Manejo mínimo de errores y situaciones inválidas
* Intento de solicitar una publicación propia.
* Solicitud duplicada del mismo usuario sobre la misma publicación.
* Solicitud sobre una publicación RESERVADA, ENTREGADA o CANCELADA.
* Operación ejecutada por un usuario sin autorización.
* Datos obligatorios incompletos o inválidos.
* Identificador o recurso inexistente.
* Error de comunicación entre Angular y la API.
* Respuesta del backend que debe ser informada al usuario de manera comprensible.

## 9. GitHub, trazabilidad y README
El repositorio deberá evidenciar trabajo progresivo y autoría. Se exigen al menos cinco commits significativos y progresivos.
* **Commit/etapa 1:** inicio del proyecto y modelo de datos.
* **Commit/etapa 2:** backend Express, API y persistencia.
* **Commit/etapa 3:** frontend Angular y consumo inicial de API.
* **Commit/etapa 4:** integración CRUD, relaciones y reglas de negocio.
* **Commit/etapa 5:** autenticación/roles, errores, pruebas, correcciones y documentación.

*No se considerará trazabilidad válida crear los cinco commits de manera artificial, consecutiva o prácticamente en el mismo momento solo para cumplir el mínimo. Los commits deben representar avances reales del desarrollo.*

El README deberá incluir, como mínimo:
* Nombre y descripción del proyecto.
* Nombre del autor.
* Tecnologías utilizadas.
* Requisitos, instalación y ejecución.
* Configuración necesaria de la base de datos.
* Estructura general de la solución.
* Funcionalidades implementadas.
* Pruebas realizadas.
* Declaración de uso de inteligencia artificial.

## 10. Uso de inteligencia artificial
El uso de herramientas de inteligencia artificial está permitido exclusivamente durante el desarrollo. Su utilización no genera una penalización automática, pero debe ser declarada de forma clara, específica y verificable.

La declaración del README debe indicar:
* Herramienta(s) de IA utilizada(s).
* Tareas concretas en las que se utilizó IA.
* Código, explicaciones, documentación o depuración en que existió apoyo de IA.
* Qué partes fueron generadas o propuestas con IA.
* Qué modificaciones, adaptaciones o correcciones realizó el estudiante.
* Cómo verificó que el resultado funcionaba y cumplía las reglas de negocio.

*Durante la interrogación está prohibido utilizar IA. Todo elemento incluido en la entrega será responsabilidad del estudiante y podrá ser localizado, explicado, justificado, corregido o modificado durante la defensa.*

## 11. Evidencias y pruebas mínimas
* Aplicación ejecutable y conectada a la base de datos.
* Login funcional y comportamiento diferenciado por rol.
* CRUD y relaciones entre las cuatro entidades.
* Demostración del flujo funcional completo.
* Pruebas de las principales reglas de negocio.
* Pruebas de situaciones inválidas y manejo de errores.
* Persistencia verificable después de recargar o reiniciar la aplicación.
* README y repositorio público revisables.

## 12. Rúbrica de la actividad práctica – 30 puntos

| Criterio | Pts. | Desempeño esperado |
| :--- | :---: | :--- |
| **Funcionamiento e integración completa** | 6 | La solución opera de extremo a extremo: Angular, API Express y BD relacional; los datos persisten y la interfaz refleja correctamente las operaciones. |
| **Modelo relacional y CRUD** | 5 | Implementa las cuatro entidades, relaciones e integridad necesarias; las operaciones CRUD son coherentes con el dominio. |
| **Reglas de negocio y estados** | 7 | Implementa correctamente las reglas obligatorias, especialmente aceptación, rechazo de solicitudes, reserva y cierre de entrega. |
| **Autenticación, roles y seguridad funcional** | 3 | Login y restricciones de acceso coherentes; las operaciones sensibles se validan en backend. |
| **Manejo de errores y validaciones** | 3 | Controla entradas inválidas, recursos inexistentes, operaciones no permitidas y errores de comunicación. |
| **Interfaz y usabilidad** | 2 | La aplicación es comprensible, consistente y permite ejecutar los flujos sin confusión. |
| **GitHub, trazabilidad, README e IA** | 4 | Repositorio público, URL válida en Canvas, commits progresivos, README completo y declaración precisa de IA. |
| **TOTAL** | **30** | |

## 13. Interrogación individual – 70 puntos
La interrogación comienza desde el 24 de noviembre de 2026. Tendrá una duración máxima de 10 a 15 minutos por estudiante y estará compuesta por cinco preguntas de 14 puntos cada una. Las preguntas se formularán a partir de la solución realmente entregada por el estudiante.

* **Pregunta 1:** funcionamiento de un flujo real de la aplicación.
* **Pregunta 2:** explicación y localización de una regla de negocio.
* **Pregunta 3:** datos, relaciones e integración entre frontend, backend y base de datos.
* **Pregunta 4:** análisis de un error, situación límite o cambio de requerimiento.
* **Pregunta 5:** localización, corrección o modificación breve en vivo sobre el proyecto.

*El estudiante puede abrir y consultar únicamente su propio código y repositorio. No puede utilizar herramientas de IA durante la interrogación. La ejecución correcta de la aplicación no reemplaza la comprensión: el estudiante debe demostrar que entiende lo que entregó.*

## 14. Rúbrica común por pregunta de interrogación – 14 puntos

| Criterio | Pts. | Evidencia esperada |
| :--- | :---: | :--- |
| **Comprensión del funcionamiento** | 5 | Explica correctamente qué ocurre y relaciona los elementos que participan. |
| **Aplicación a su propia solución** | 4 | Localiza y utiliza evidencia concreta de su proyecto, código, datos o comportamiento. |
| **Razonamiento y justificación** | 3 | Justifica decisiones, analiza consecuencias y responde a variaciones o errores. |
| **Claridad y autonomía** | 2 | Responde con claridad y autonomía, sin apoyo de IA. |
| **TOTAL POR PREGUNTA** | **14** | |

## 15. Cálculo y escala
Puntaje final = Actividad práctica (máximo 30 puntos) + Interrogación individual (máximo 70 puntos) = 100 puntos. La evaluación utiliza escala de notas de 1,0 a 7,0 con 60% de exigencia.

## 16. Checklist final antes de entregar
- [ ] El repositorio GitHub es PÚBLICO.
- [ ] La URL abre correctamente sin solicitar permisos.
- [ ] La URL del repositorio fue registrada en Canvas IPVG.
- [ ] El proyecto contiene todos los archivos necesarios para ser revisado y ejecutado.
- [ ] La aplicación utiliza Angular + Node.js/Express + BD relacional.
- [ ] Las cuatro entidades están relacionadas.
- [ ] El CRUD y las reglas de negocio funcionan.
- [ ] Login y roles funcionan.
- [ ] Se probaron errores y situaciones inválidas.
- [ ] Existen al menos cinco commits significativos y progresivos.
- [ ] El README está completo.
- [ ] El uso de IA está declarado con precisión.
- [ ] El estudiante puede explicar y modificar lo que entregó.