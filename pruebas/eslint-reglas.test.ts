/** @jest-environment node */
import { ESLint } from 'eslint';
import path from 'node:path';

const raiz = path.resolve(__dirname, '..');

// Se pasa la configuración ya cargada para que ESLint no tenga que importar
// eslint.config.js de forma dinámica (Jest no soporta import() en su VM).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const configuracion = require('../eslint.config.js');
const eslint = new ESLint({ cwd: raiz, overrideConfigFile: true, overrideConfig: configuracion });

async function reglasQueFallan(codigo: string, archivo: string): Promise<string[]> {
  const [resultado] = await eslint.lintText(codigo, { filePath: path.join(raiz, archivo) });
  return resultado.messages.map((m) => m.ruleId ?? m.message);
}

describe('reglas de capas en ESLint', () => {
  describe('src/domain/** (AD-1)', () => {
    const casosQueFallan: [string, string, string][] = [
      ['importa React', "import React from 'react';\nexport const x = React;", 'no-restricted-imports'],
      [
        'importa react-native',
        "import { View } from 'react-native';\nexport const x = View;",
        'no-restricted-imports',
      ],
      [
        'importa expo-sqlite',
        "import { openDatabaseSync } from 'expo-sqlite';\nexport const x = openDatabaseSync;",
        'no-restricted-imports',
      ],
      [
        'importa expo',
        "import Constants from 'expo-constants';\nexport const x = Constants;",
        'no-restricted-imports',
      ],
      ['importa drizzle-orm', "import { eq } from 'drizzle-orm';\nexport const x = eq;", 'no-restricted-imports'],
      [
        'importa otra capa por alias',
        "import { db } from '@/data/db';\nexport const x = db;",
        'no-restricted-imports',
      ],
      [
        'importa otra capa por ruta relativa',
        "import { textosApp } from '../textos/app';\nexport const x = textosApp;",
        'import/no-restricted-paths',
      ],
      [
        'importa otra capa por una ruta relativa que empieza con ./',
        "import { textosApp } from './../textos/app';\nexport const x = textosApp;",
        'import/no-restricted-paths',
      ],
      [
        'importa otra capa pasando por src/',
        "import { textosApp } from '../../src/textos/app';\nexport const x = textosApp;",
        'import/no-restricted-paths',
      ],
      ["usa import() dinámico", "export const x = import('expo-sqlite');", 'no-restricted-syntax'],
      ['importa node:fs', "import { readFileSync } from 'node:fs';\nexport const x = readFileSync;", 'no-restricted-imports'],
      ['importa fs', "import { readFileSync } from 'fs';\nexport const x = readFileSync;", 'import/no-nodejs-modules'],
      ['usa new Date()', 'export const x = new Date();', 'no-restricted-syntax'],
      ['usa Date.now()', 'export const x = Date.now();', 'no-restricted-syntax'],
      ['usa el tipo Date', 'export type T = Date;', 'no-restricted-syntax'],
      ['usa Math.random()', 'export const x = Math.random();', 'no-restricted-properties'],
      ["usa fetch('...')", "export const x = fetch('https://ejemplo.com');", 'no-restricted-globals'],
      ['usa globalThis.fetch', "export const x = globalThis.fetch('https://ejemplo.com');", 'no-restricted-globals'],
      ['usa globalThis.Math.random()', 'export const x = globalThis.Math.random();', 'no-restricted-globals'],
      ['usa crypto.randomUUID()', 'export const x = crypto.randomUUID();', 'no-restricted-globals'],
      ['usa performance.now()', 'export const x = performance.now();', 'no-restricted-globals'],
      ['usa Intl.DateTimeFormat', 'export const x = new Intl.DateTimeFormat();', 'no-restricted-properties'],
    ];

    it.each(casosQueFallan)('falla cuando %s', async (_caso, codigo, regla) => {
      expect(await reglasQueFallan(codigo, 'src/domain/x.ts')).toContain(regla);
    });

    it('también falla en las pruebas de domain/', async () => {
      expect(await reglasQueFallan('export const x = new Date();', 'src/domain/x.test.ts')).toContain(
        'no-restricted-syntax',
      );
    });

    it('acepta un archivo puro', async () => {
      const codigo =
        "export function sumar(a: number, b: number): number {\n  return a + b;\n}\nexport const hoy = '2026-11-04';\n";
      expect(await reglasQueFallan(codigo, 'src/domain/x.ts')).toEqual([]);
    });
  });

  describe('la base solo se toca dentro de src/data/ (AD-3)', () => {
    const importaciones: [string, string][] = [
      ['drizzle-orm', "import { eq } from 'drizzle-orm';\nexport const x = eq;"],
      ['drizzle-orm/sqlite-core', "import { text } from 'drizzle-orm/sqlite-core';\nexport const x = text;"],
      ['@/data/tablas', "import { y } from '@/data/tablas/rastro';\nexport const x = y;"],
      ['data/tablas relativo', "import { y } from '../data/tablas/rastro';\nexport const x = y;"],
      ['@/data/schema', "import { rastro } from '@/data/schema';\nexport const x = rastro;"],
      ['@/data/db', "import { db } from '@/data/db';\nexport const x = db;"],
      ['data/db relativo', "import { db } from '../data/db';\nexport const x = db;"],
      ['@/data/pruebas', "import { crearBaseDePrueba } from '@/data/pruebas/base-en-memoria';\nexport const x = crearBaseDePrueba;"],
      ['expo-sqlite', "import { openDatabaseSync } from 'expo-sqlite';\nexport const x = openDatabaseSync;"],
      ['better-sqlite3', "import Database from 'better-sqlite3';\nexport const x = Database;"],
    ];

    it.each(importaciones)('falla en src/services/ al importar %s', async (_caso, codigo) => {
      expect(await reglasQueFallan(codigo, 'src/services/x.ts')).toContain('no-restricted-imports');
    });

    it.each(importaciones)('falla en src/hooks/ al importar %s', async (_caso, codigo) => {
      expect(await reglasQueFallan(codigo, 'src/hooks/x.ts')).toContain('no-restricted-imports');
    });

    it.each(importaciones)('falla en src/app/ al importar %s', async (_caso, codigo) => {
      expect(await reglasQueFallan(codigo, 'src/app/x.tsx')).toContain('no-restricted-imports');
    });

    it.each(importaciones)('acepta en src/data/ la importación de %s', async (_caso, codigo) => {
      expect(await reglasQueFallan(codigo, 'src/data/x.ts')).not.toContain('no-restricted-imports');
    });

    it('las pantallas sí pueden usar los hooks de data/ que no son tablas', async () => {
      const codigo = "import { useMigraciones } from '@/data/migraciones';\nexport const x = useMigraciones;";
      expect(await reglasQueFallan(codigo, 'src/app/x.tsx')).toEqual([]);
    });
  });

  describe('las pantallas leen "hoy" con useHoy() (AD-8)', () => {
    const importaciones: [string, string][] = [
      ['@/services/reloj', "import { hoy } from '@/services/reloj';\nexport const x = hoy;"],
      ['services/reloj relativo', "import { hoy } from '../services/reloj';\nexport const x = hoy;"],
    ];

    it.each(importaciones)('falla en src/app/ al importar %s', async (_caso, codigo) => {
      expect(await reglasQueFallan(codigo, 'src/app/x.tsx')).toContain('no-restricted-imports');
    });

    it.each(importaciones)('falla en src/components/ al importar %s', async (_caso, codigo) => {
      expect(await reglasQueFallan(codigo, 'src/components/x.tsx')).toContain('no-restricted-imports');
    });

    it('en src/app/ sigue fallando drizzle-orm (no se perdió AD-3)', async () => {
      const codigo = "import { eq } from 'drizzle-orm';\nexport const x = eq;";
      expect(await reglasQueFallan(codigo, 'src/app/x.tsx')).toContain('no-restricted-imports');
    });

    it('en src/components/ sigue fallando @/data/db (no se perdió AD-3)', async () => {
      const codigo = "import { obtenerDb } from '@/data/db';\nexport const x = obtenerDb;";
      expect(await reglasQueFallan(codigo, 'src/components/x.tsx')).toContain('no-restricted-imports');
    });

    it('src/hooks/use-hoy.ts sí puede importar @/services/reloj', async () => {
      const codigo = "import { hoy } from '@/services/reloj';\nexport const x = hoy;";
      expect(await reglasQueFallan(codigo, 'src/hooks/use-hoy.ts')).toEqual([]);
    });

    it('las pantallas sí pueden importar useHoy', async () => {
      const codigo = "import { useHoy } from '@/hooks/use-hoy';\nexport const x = useHoy;";
      expect(await reglasQueFallan(codigo, 'src/app/x.tsx')).toEqual([]);
    });
  });

  describe('las pantallas escriben solo con ejecutar() (AD-3, AD-18)', () => {
    const importaciones: [string, string][] = [
      [
        '@/data/ejecutar-comando',
        "import { ejecutarComando } from '@/data/ejecutar-comando';\nexport const x = ejecutarComando;",
      ],
      ['@/data/cambios', "import { avisarCambio } from '@/data/cambios';\nexport const x = avisarCambio;"],
    ];

    it.each(importaciones)('falla en src/app/ al importar %s', async (_caso, codigo) => {
      expect(await reglasQueFallan(codigo, 'src/app/x.tsx')).toContain('no-restricted-imports');
    });

    it.each(importaciones)('falla en src/components/ al importar %s', async (_caso, codigo) => {
      expect(await reglasQueFallan(codigo, 'src/components/x.tsx')).toContain('no-restricted-imports');
    });

    it('src/hooks/use-comando.ts sí puede importar @/data/ejecutar-comando', async () => {
      const codigo = "import { ejecutarComando } from '@/data/ejecutar-comando';\nexport const x = ejecutarComando;";
      expect(await reglasQueFallan(codigo, 'src/hooks/use-comando.ts')).toEqual([]);
    });

    it('las pantallas sí pueden importar ejecutar', async () => {
      const codigo = "import { ejecutar } from '@/hooks/use-comando';\nexport const x = ejecutar;";
      expect(await reglasQueFallan(codigo, 'src/app/x.tsx')).toEqual([]);
    });
  });

  describe('texto literal en src/app/** (AD-17)', () => {
    it('falla con texto literal fuera de <Text> (react-native/no-raw-text)', async () => {
      const codigo =
        "import { View } from 'react-native';\nexport default function X() {\n  return <View>Hola</View>;\n}\n";
      expect(await reglasQueFallan(codigo, 'src/app/x.tsx')).toContain('react-native/no-raw-text');
    });

    // react-native/no-raw-text permite texto dentro de <Text>; no-restricted-syntax lo cubre.
    const dentroDeText: [string, string][] = [
      ['JSXText', '<Text>Hola</Text>'],
      ['un string en llaves', "<Text>{'Hola'}</Text>"],
      ['un template literal', '<Text>{`Hola`}</Text>'],
      ['un fragmento', '<>Hola</>'],
    ];

    it.each(dentroDeText)('falla con texto literal dentro de <Text> como %s', async (_caso, jsx) => {
      const codigo = `import { Text } from 'react-native';\nexport default function X() {\n  return ${jsx};\n}\n`;
      expect(await reglasQueFallan(codigo, 'src/app/x.tsx')).toContain('no-restricted-syntax');
    });

    const enExpresiones: [string, string][] = [
      ['un ternario', "<Text>{activo ? 'Sí' : 'No'}</Text>"],
      ['un ternario encadenado', "<Text>{a ? textosApp.nombreApp : b ? 'Otro' : textosApp.nombreApp}</Text>"],
      ['un &&', "<Text>{activo && 'Hola'}</Text>"],
      ['un ??', "<Text>{textosApp.nombreApp ?? 'Hola'}</Text>"],
      ['una concatenación', "<Text>{'Hola ' + textosApp.nombreApp}</Text>"],
      ['una concatenación larga', "<Text>{textosApp.nombreApp + ' y ' + textosApp.nombreApp}</Text>"],
      ['un template literal en un ternario', '<Text>{activo ? `Hola` : textosApp.nombreApp}</Text>'],
    ];

    it.each(enExpresiones)('falla con texto literal en %s', async (_caso, jsx) => {
      const codigo = `import { Text } from 'react-native';\nimport { textosApp } from '@/textos/app';\nconst activo = true;\nconst a = true;\nconst b = false;\nexport default function X() {\n  return ${jsx};\n}\n`;
      expect(await reglasQueFallan(codigo, 'src/app/x.tsx')).toContain('no-restricted-syntax');
    });

    const enPropsVisibles: [string, string][] = [
      ['title', '<Button title="Guardar" onPress={() => {}} />'],
      ['title en llaves', "<Button title={'Guardar'} onPress={() => {}} />"],
      ['placeholder', '<TextInput placeholder="Monto" />'],
      ['placeholder en un ternario', "<TextInput placeholder={activo ? 'Monto' : textosApp.nombreApp} />"],
      ['accessibilityLabel', '<View accessibilityLabel="Borrar gasto" />'],
      ['accessibilityHint', '<View accessibilityHint="Borra el gasto" />'],
      ['options.title', "<Stack.Screen options={{ title: 'Inicio' }} />"],
      ['options.headerTitle', "<Stack.Screen options={{ headerTitle: 'Inicio' }} />"],
    ];

    it.each(enPropsVisibles)('falla con texto literal en la prop %s', async (_caso, jsx) => {
      const codigo = `import { Button, TextInput, View } from 'react-native';\nimport { Stack } from 'expo-router';\nimport { textosApp } from '@/textos/app';\nconst activo = true;\nexport default function X() {\n  return ${jsx};\n}\n`;
      expect(await reglasQueFallan(codigo, 'src/app/x.tsx')).toContain('no-restricted-syntax');
    });

    it.each([
      ['Alert.alert', "Alert.alert('Error', 'No se pudo guardar');"],
      ['Alert.prompt', "Alert.prompt('Monto');"],
    ])('falla con texto literal en %s', async (_caso, llamada) => {
      const codigo = `import { Alert } from 'react-native';\nexport function avisar() {\n  ${llamada}\n}\n`;
      expect(await reglasQueFallan(codigo, 'src/app/x.tsx')).toContain('no-restricted-syntax');
    });

    it('también aplica en src/components/', async () => {
      const codigo =
        "import { Text } from 'react-native';\nexport function X() {\n  return <Text>Hola</Text>;\n}\n";
      expect(await reglasQueFallan(codigo, 'src/components/x.tsx')).toContain('no-restricted-syntax');
    });

    it('acepta props visibles y Alert con textos/', async () => {
      const codigo =
        "import { Alert, Button, TextInput } from 'react-native';\nimport { Stack } from 'expo-router';\nimport { textosApp } from '@/textos/app';\nexport default function X() {\n  Alert.alert(textosApp.nombreApp);\n  return (\n    <>\n      <Stack.Screen options={{ title: textosApp.nombreApp }} />\n      <Button title={textosApp.nombreApp} onPress={() => {}} />\n      <TextInput placeholder={textosApp.nombreApp} />\n    </>\n  );\n}\n";
      expect(await reglasQueFallan(codigo, 'src/app/x.tsx')).toEqual([]);
    });

    it('acepta strings en estilos y comparaciones', async () => {
      const codigo =
        "import { Text, View } from 'react-native';\nimport { textosApp } from '@/textos/app';\nconst modo: string = 'a';\nexport default function X() {\n  return (\n    <View style={{ alignItems: modo === 'a' ? 'center' : 'flex-start' }}>\n      <Text>{modo === 'a' ? textosApp.nombreApp : textosApp.preparandoDatos}</Text>\n    </View>\n  );\n}\n";
      expect(await reglasQueFallan(codigo, 'src/app/x.tsx')).toEqual([]);
    });

    it('acepta strings en atributos', async () => {
      const codigo =
        "import { View } from 'react-native';\nexport default function X() {\n  return <View testID=\"inicio\" accessibilityRole={'header'} />;\n}\n";
      expect(await reglasQueFallan(codigo, 'src/app/x.tsx')).toEqual([]);
    });

    it('acepta texto que sale de textos/', async () => {
      const codigo =
        "import { Text } from 'react-native';\nimport { textosApp } from '@/textos/app';\nexport default function X() {\n  return <Text>{textosApp.nombreApp}</Text>;\n}\n";
      expect(await reglasQueFallan(codigo, 'src/app/x.tsx')).toEqual([]);
    });
  });

  describe('no-console (AD-23)', () => {
    it.each(['src/app/x.tsx', 'src/data/x.ts', 'src/services/x.ts', 'pruebas/x.test.ts'])(
      'falla con console.log en %s',
      async (archivo) => {
        expect(await reglasQueFallan("console.log('x');\n", archivo)).toContain('no-console');
      },
    );

    it('acepta un archivo sin console', async () => {
      expect(await reglasQueFallan('export const x = 1;\n', 'src/services/x.ts')).toEqual([]);
    });
  });
});
