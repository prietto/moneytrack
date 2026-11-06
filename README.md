# MoneyTrack

App personal de finanzas para Android (Expo SDK 57, Expo Router, SQLite con Drizzle). Local-first: la base del celular es la fuente de verdad.

## Empezar

```bash
npm install
npx expo start                                   # servidor de desarrollo
APP_VARIANT=dev npx expo run:android             # build de desarrollo (paquete .dev)
APP_VARIANT=release npx expo run:android --variant release
```

`APP_VARIANT` acepta `dev` (por defecto) o `release`; cualquier otro valor detiene el build. Las dos variantes se pueden instalar a la vez. `android/` se genera con `npx expo prebuild` y nunca se edita a mano.

## Comandos

```bash
npm run verificar   # tsc + ESLint + Jest; debe pasar antes de cerrar cualquier historia
npm run db:generar  # drizzle-kit generate: nueva migración en drizzle/ tras cambiar el esquema
```

## Estructura

- `src/app/`: pantallas y layouts de Expo Router (cada archivo es una ruta).
- `src/domain/`: núcleo puro de cálculo, sin React, Expo, base de datos, red ni reloj.
- `src/data/`: esquema, tablas, comandos y consultas de Drizzle; único lugar que toca la base.
- `src/hooks/`, `src/services/`: estado reactivo y servicios del teléfono y de la nube.
- `src/textos/`: todo el texto que ve el usuario.
- `drizzle/`: migraciones generadas.
- `pruebas/`: pruebas de reglas de ESLint y de pantallas.

Las reglas de capas las hace cumplir ESLint (`eslint.config.js`). La arquitectura completa está en `_bmad-output/planning-artifacts/architecture/`.
