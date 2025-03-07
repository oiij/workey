import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/index.ts', './src/node.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  external: ['worker_threads'],
  dts: true,
  minify: false,
})
