import { defineConfig, type Plugin } from 'vite'
import logseqDevPluginPkg from 'vite-plugin-logseq'

// vite-plugin-logseq is CJS with `exports.default = fn` and `__esModule: true`;
// Node's CJS/ESM interop can nest the default one level deeper.
const logseqDevPlugin =
  (logseqDevPluginPkg as unknown as { default?: () => Plugin }).default ??
  (logseqDevPluginPkg as unknown as () => Plugin)

export default defineConfig({
  base: './',
  plugins: [logseqDevPlugin()],
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'esbuild',
  },
})
