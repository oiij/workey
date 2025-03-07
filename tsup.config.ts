import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/index.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  external: ['worker_threads'],
  dts: true,
  minify: false,
})
