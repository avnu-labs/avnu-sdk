import { defineConfig } from 'tsup';

export default defineConfig({
  target: 'es2022',
  entry: ['src/index.ts'],
  sourcemap: true,
  clean: true,
  format: ['cjs'],
  globalName: 'avnu',
});
