import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
export default defineConfig({
  plugins: [solid(), tsconfigPaths()],
  base: "/sheet-seeker",
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})