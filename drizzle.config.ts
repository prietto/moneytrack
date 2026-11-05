import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/data/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  // Obligatorio: genera drizzle/migrations.js, que el bundle de la app necesita.
  driver: 'expo',
});
