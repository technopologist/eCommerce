import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server is started by server/index.js (Vite in middleware mode),
// so the API and the app share one port. Run `npm run dev`, not `vite`.
export default defineConfig({
  plugins: [react()],
});
