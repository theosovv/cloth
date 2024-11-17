import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import path from 'path';

export default defineConfig({
  plugins: [wasm()],
  server: {
    port: 3000,
    fs: {
      allow: [
        path.resolve(__dirname, '../../../')
      ]
    }
  },
  resolve: {
    alias: {
      '@cloth/bindings': path.resolve(__dirname, '../../bindings/dist')
    },
    extensions: ['.ts', '.js'],
    preserveSymlinks: true
  },
  optimizeDeps: {
    exclude: ['@cloth/bindings']
  }
});