import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Elimina la sección css/postcss ya que ahora se maneja en postcss.config.js
});