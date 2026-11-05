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
        'no-restricted-imports',
      ],
      ['usa new Date()', 'export const x = new Date();', 'no-restricted-syntax'],
      ['usa Date.now()', 'export const x = Date.now();', 'no-restricted-syntax'],
      ['usa Math.random()', 'export const x = Math.random();', 'no-restricted-properties'],
      ["usa fetch('...')", "export const x = fetch('https://ejemplo.com');", 'no-restricted-globals'],
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

  describe('drizzle-orm y data/tablas solo dentro de src/data/ (AD-3)', () => {
    const importaciones: [string, string][] = [
      ['drizzle-orm', "import { eq } from 'drizzle-orm';\nexport const x = eq;"],
      ['drizzle-orm/sqlite-core', "import { text } from 'drizzle-orm/sqlite-core';\nexport const x = text;"],
      ['@/data/tablas', "import { y } from '@/data/tablas/rastro';\nexport const x = y;"],
      ['data/tablas relativo', "import { y } from '../data/tablas/rastro';\nexport const x = y;"],
    ];

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
