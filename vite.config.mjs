import { resolve } from 'path'
import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'

export default defineConfig({
    root: 'src/',
    publicDir: '../public',
    base: './',
    server:
    {
        host: true,
    },
    build:
    {
        outDir: '../build', 
        emptyOutDir: true, 
        sourcemap: true, 
        rollupOptions: {
          input: {
            index: resolve(__dirname, 'src/index.html'),
          },
        },
    },
    plugins:
    [
      glsl(),
    ]
})