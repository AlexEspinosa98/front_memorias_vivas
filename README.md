# Memorias Vivas · front

Interfaz del archivo digital y muro comunitario del pueblo Arhuaco (Iku).
Next.js 16 (App Router) + React 19 + Tailwind 4.

API: [`backend_memorias_vivas`](https://github.com/AlexEspinosa98/backend_memorias_vivas).

## Puesta en marcha

Primero levante el backend en `http://127.0.0.1:8000`. Después:

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

`http://localhost:3000`. Para entrar con las cuentas de demostración del
backend, la clave es `memorias2026` (ver el README del backend).

## Pantallas

| Ruta | Qué hace |
| --- | --- |
| `/` | Presentación del archivo, últimas historias y las 13 secciones. |
| `/muro` | El muro, con búsqueda y filtros por tipo, comunidad y etiqueta. |
| `/historia/[id]` | Detalle: contenido, materiales, autorización, visita o promoción, aprecios y comentarios. |
| `/publicar` | Flujo de publicación en cuatro pasos: contenido → visibilidad → ubicación → autorización. |
| `/comunidades` y `/comunidades/[slug]` | Comunidades, solicitud de ingreso y, para autoridades, decisión sobre las solicitudes. |
| `/archivo` y `/archivo/[slug]` | Las secciones del archivo con sus figuras y fuentes. |
| `/mapa` | Ubicaciones generales; excluye el contenido sensible. |
| `/revision` | Cola de revisión para autoridades y moderación. |
| `/perfil` | Perfil, comunidades y borradores propios. |
| `/entrar`, `/registro` | Acceso. El registro exige aceptar los criterios de cuidado cultural. |

## Cómo se refleja el cuidado cultural en la interfaz

- Cada tarjeta y cada detalle muestran **quién puede ver** esa historia
  (insignia de visibilidad) y, si aplica, que es **contenido sensible**.
- En una historia sensible la ubicación aparece como reservada, sin
  coordenadas, y no se dibuja en el mapa.
- El formulario de publicación **bloquea** marcar algo como sensible y a la vez
  de uso abierto, antes de llamar a la API.
- No se puede enviar a revisión sin haber registrado la autorización de la
  comunidad; el botón queda deshabilitado y explica por qué.
- La cola de revisión muestra la autorización completa y no deja publicar si
  falta.

## Organización del código

```
src/
  app/              rutas (App Router), una carpeta por pantalla
  components/
    Nav.tsx         navegación
    ui.tsx          botones, campos, insignias, tarjeta de historia
  lib/
    api.ts          cliente de la API, tokens JWT y refresco automático
    auth.tsx        contexto de sesión (useAuth)
    types.ts        tipos que reflejan los serializadores del backend
```

Los tokens se guardan en `localStorage` y se refrescan solos cuando la API
responde 401.

## Despliegue en Vercel

Importar el repositorio y definir una variable:

```
NEXT_PUBLIC_API_URL = https://<el-backend>.vercel.app/api
```

En el backend hay que añadir el dominio del front a `CORS_ALLOWED_ORIGINS`.

## Pendientes conocidos

- El mapa es un esquema en SVG, no cartografía real. Si se necesita un mapa
  verdadero, conviene Leaflet con teselas propias — y mantener la exclusión del
  contenido sensible.
- La subida de fotografías y audios está en la API (`/historias/{id}/materiales/`)
  pero todavía no tiene formulario en el front.
