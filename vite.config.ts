import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative assets make the built app work from GitHub Pages project paths
  // such as https://arfipod.github.io/dos-banderas/ and from local previews.
  base: './',
  plugins: [react()],
});
