import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'node:path'
import esbuild from 'esbuild'

function buildPreload(): Plugin {
  return {
    name: 'build-preload',
    buildStart() {
      esbuild.buildSync({
        entryPoints: ['electron/preload.ts'],
        outfile: 'dist-electron/preload.cjs',
        format: 'cjs',
        platform: 'node',
        bundle: true,
        external: ['electron']
      })
    },
    handleHotUpdate({ file, server }) {
      if (file.includes('preload.ts')) {
        esbuild.buildSync({
          entryPoints: ['electron/preload.ts'],
          outfile: 'dist-electron/preload.cjs',
          format: 'cjs',
          platform: 'node',
          bundle: true,
          external: ['electron']
        })
        server.ws.send({ type: 'full-reload' })
      }
    }
  }
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    buildPreload(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['@devicefarmer/adbkit', 'archiver', 'yauzl']
            }
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
