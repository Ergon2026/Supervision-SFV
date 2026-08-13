# Supervisión SFV Campo — Guía de instalación

Aplicativo web instalable (PWA) para el registro de mediciones y supervisión de
sistemas fotovoltaicos autónomos en campo. **Funciona 100% sin señal**: los
registros, fotos y GPS se guardan en la memoria del propio celular
(IndexedDB) y se sincronizan solos a una Google Sheet apenas el técnico
recupera señal o WiFi. También permite exportar un Excel de respaldo en
cualquier momento, sin necesidad de internet.

Compatible con Android 13/14 y superior (Chrome, navegador nativo de
Samsung, etc.). No requiere instalar nada desde Play Store.

---

## Parte 1 — Backend en Google Apps Script (una sola vez)

1. Crea una **Google Sheet nueva** (puede estar vacía) y copia su ID desde
   la URL: `.../spreadsheets/d/ESTE_ES_EL_ID/edit`.
2. En esa Sheet: **Extensiones > Apps Script**.
3. Borra el contenido del editor y pega el contenido del archivo
   `Codigo_AppsScript.gs` (incluido en esta entrega).
4. Reemplaza `SPREADSHEET_ID` con el ID que copiaste en el paso 1.
5. Clic en **Implementar > Nueva implementación**:
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
6. Autoriza los permisos que pida Google (es tu propio script).
7. Copia la URL que termina en `/exec`. La necesitarás en la Parte 3.

Esto sigue el mismo patrón que tus otras herramientas de Apps Script
(ConsolidadorRF, Revisor RF): un Web App que centraliza los registros en una
Sheet, y aquí además guarda las fotos en una carpeta de Drive
("Fotos_Supervision_SFV") con el link insertado en cada fila. Los registros
marcados como **PRUEBA** en el celular no llegan a esta Sheet — se filtran
antes de enviarse (y el backend los rechaza también, por seguridad).

## Parte 2 — Publicar el aplicativo en GitHub Pages (paso a paso)

Un Service Worker (lo que permite que la app funcione sin señal e
instalarse como app) **requiere que el sitio esté servido por HTTPS**.
GitHub Pages es gratis y cumple ese requisito. No necesitas saber usar la
línea de comandos ni Git — todo se hace desde el navegador.

### 2.1 — Crear la cuenta (si no tienes una)
1. Entra a **github.com** y clic en **Sign up**.
2. Completa correo, contraseña y nombre de usuario, verifica el correo.

### 2.2 — Crear el repositorio
1. Ya con sesión iniciada, clic en el botón verde **New** (o el ícono **+**
   arriba a la derecha > **New repository**).
2. **Repository name**: escribe por ejemplo `supervision-sfv`.
3. Puedes dejarlo en **Public** (no vas a subir información sensible, solo
   el código del aplicativo) o elegir **Private** si prefieres — ambos
   funcionan igual con GitHub Pages.
4. **No marques** "Add a README file" (para evitar conflictos al subir).
5. Clic en **Create repository**.

### 2.3 — Subir los archivos de la app
1. En la página del repositorio recién creado, busca el enlace
   **"uploading an existing file"** (o ve a la pestaña **Add file >
   Upload files**).
2. Descomprime en tu computadora el archivo `Supervision_SFV_Campo_App.zip`
   que te entregué. Debe quedar una carpeta `app` con este contenido:
   ```
   index.html
   manifest.json
   sw.js
   icons/icon-192.png
   icons/icon-512.png
   vendor/xlsx.full.min.js
   ```
3. **Arrastra la carpeta `app` completa** (o todos los archivos y
   subcarpetas de adentro) hacia el recuadro de "Upload files" en GitHub.
   El navegador de GitHub sí soporta arrastrar carpetas y mantiene la
   estructura de subcarpetas (`icons/`, `vendor/`) automáticamente.
4. Verifica en la vista previa que aparezcan `icons/icon-192.png`,
   `icons/icon-512.png` y `vendor/xlsx.full.min.js` — si arrastraste solo
   los archivos sueltos sin las carpetas, estos no se subirán bien; en ese
   caso arrastra la carpeta `icons` y la carpeta `vendor` por separado.
5. Abajo, en "Commit changes", deja el mensaje por defecto y clic en
   **Commit changes** (botón verde).

### 2.4 — Activar GitHub Pages
1. En el repositorio, ve a la pestaña **Settings** (⚙️, arriba).
2. En el menú de la izquierda, clic en **Pages**.
3. En **Build and deployment > Source**, selecciona **Deploy from a
   branch**.
4. En **Branch**, selecciona `main` (o `master`) y la carpeta `/ (root)`.
   Clic en **Save**.
5. Espera 1–2 minutos. Recarga la página de Settings > Pages: va a
   mostrar un mensaje verde con la URL, algo como:
   `https://tuusuario.github.io/supervision-sfv/`

### 2.5 — Verificar que funciona
1. Abre esa URL en el celular (Chrome).
2. Debe cargar el formulario. Si ves un error 404, espera un par de
   minutos más (GitHub Pages tarda en publicar la primera vez) o revisa
   que `index.html` haya quedado en la raíz del repositorio, no dentro de
   una subcarpeta `app/`.

### Alternativas
Si en Ergon ya cuentan con otro hosting con HTTPS (Firebase Hosting,
Netlify, servidor interno), puedes usarlo en vez de GitHub Pages — el
requisito único es que sirva los archivos por HTTPS. La única limitación
real es que **no puede alojarse como página de Apps Script (HtmlService)**,
porque Google la sirve dentro de un iframe de otro dominio, lo que bloquea
el Service Worker y por lo tanto el funcionamiento offline real. Por eso el
Web App de Apps Script se usa solo como backend de sincronización
(Parte 1), y el aplicativo en sí se aloja aparte (Parte 2).

## Parte 3 — Instalar en el celular del técnico

1. Abrir la URL publicada (Parte 2) en Chrome del celular.
2. Menú (⋮) > **"Añadir a pantalla de inicio" / "Instalar app"**.
3. Abrir la app ya instalada al menos una vez **con señal**, para que
   quede todo cacheado localmente (formulario, librería de Excel, íconos).
   Desde ese momento funcionará sin señal indefinidamente.
4. Ir a la pestaña **Ajustes** dentro del aplicativo y pegar la URL `/exec`
   obtenida en la Parte 1, luego **Guardar**.

Repetir este paso (instalación) en el celular de cada técnico.

## Uso en campo

### Pantalla principal
Al abrir un **Nuevo registro**, lo primero que se pide es el **código de
suministro/sistema**, la captura de **GPS** y el **técnico responsable**
(con la opción de marcarlo como registro de **PRUEBA**). Solo después de
completar esto y tocar "Continuar" se abre el resto del formulario técnico.
Esto asegura que cada visita quede siempre identificada y geolocalizada
desde el primer paso, sin depender de que el técnico recuerde llenarlo al
final.

### Registros de prueba
Marca la casilla "Este es un registro de PRUEBA" para probar el aplicativo
con códigos ficticios sin afectar la información real:
- Los registros de prueba **se guardan igual** en el celular (para que
  puedas revisar que todo funciona).
- **Nunca se sincronizan** a la Google Sheet (se filtran automáticamente,
  y el backend los rechaza igual si llegaran a enviarse).
- En la pestaña **Ajustes**, el botón **"Borrar registros de PRUEBA"** los
  elimina todos de un solo toque, sin tocar los registros reales.

### Fotos
Se capturan 7 fotos por visita, cada una donde tiene sentido dentro del
formulario:
- **Generales del equipo**: panel, batería, controlador (vista general del
  estado físico).
- **De medición**: foto del multímetro marcando la tensión del panel en
  circuito abierto, foto del multímetro en la batería, y foto de la
  medición en el tomacorriente (salida del controlador) — cada una junto
  a su campo numérico correspondiente en la sección "Indicador de
  operación".
- **Cables con tubería PVC hacia las luminarias**: junto a la sección de
  mantenimiento, donde se evalúa la instalación de cableado.

Todas son opcionales (no bloquean el guardado), pero quedan documentadas
en el Excel exportado y en la Sheet sincronizada, con su propio link a la
foto guardada en Drive.

**¿El aumento de fotos consume señal o datos móviles? No.** La compresión
de cada foto (a un máximo de 1024px, calidad 70%) se hace en el propio
celular con el navegador, sin tocar internet — un registro completo con
las 7 fotos pesa aproximadamente **1–2 MB comprimido**. Ese peso se guarda
en la memoria interna del teléfono (IndexedDB), no en la nube, así que
agregar más campos de foto en el futuro solo afecta cuánto espacio libre
usa el celular — nunca requiere señal ni consume datos móviles, ni antes
ni después de sincronizar. En la pestaña **Ajustes** la app muestra
cuántos MB está usando y cuánto espacio libre queda en el equipo.

### Sincronización
Automática al recuperar señal (evento `online`), o manual con el botón
"🔄 Sincronizar". Cada registro sincronizado queda marcado y no se
reenvía. Los que fallan quedan marcados para reintentar. Los registros de
PRUEBA se excluyen siempre de este proceso.

### Exportar Excel
Disponible en cualquier momento desde la pestaña "Registros" o el botón
inferior "⬇ Excel" — genera el archivo directamente en el celular, sin
necesidad de señal, incluyendo todos los campos, los 10 ítems de
mantenimiento, y qué fotos quedaron adjuntas en cada registro.

## Campos del formulario

El formulario replica exactamente los criterios del Excel proporcionado
(`Cirterios_aplicativo_supervision.xlsx`):

1. **Sistema fotovoltaico**: Estado (COMPLETO/INCOMPLETO) con lógica
   condicional — Detalle completo (INSTALADO/DESINSTALADO) solo si
   COMPLETO; Detalle incompleto (DCEB/PANEL/NINGUNO, selección múltiple)
   solo si INCOMPLETO; Casuística (HURTO/VANDALISMO/SINIESTRO) si
   INCOMPLETO o si el sistema fue DESINSTALADO.
2. **Indicador de operación**: tensiones, capacidad de batería, modelo,
   tipo de controlador, descarga de CSV — con foto de medición junto a
   cada tensión.
3. **Indicador de mantenimiento**: los 10 ítems del Excel con marca ✔/✕,
   más la foto de cables con tubería PVC hacia luminarias.

Se agregaron además (según lo conversado): técnico responsable y código de
suministro como pantalla principal del registro, GPS, marca de registro de
PRUEBA, y las 7 fotos descritas arriba.

## Personalización rápida

- **Colores/logo**: editar las variables CSS al inicio de `index.html`
  (`--verde`, `--amarillo`) y reemplazar `icons/icon-192.png` /
  `icon-512.png`.
- **Campos**: los ítems de mantenimiento están en el arreglo `MTTO_ITEMS`
  dentro de `index.html`; agregar/quitar ahí se refleja en el formulario,
  en el Excel exportado y (si actualizas también `HEADERS`/`doPost` en el
  `.gs`) en la Sheet de destino.
- **Fotos**: los slots de foto están listados en `PHOTO_SLOTS` dentro de
  `index.html`; para agregar una nueva foto hay que sumarla ahí, crear su
  `photo-box` en el HTML, y agregar la columna correspondiente en el
  `.gs` (`HEADERS` y `saveFotoIfPresent_`).
