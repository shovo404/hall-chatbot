import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    // GitHub Pages base path (repo name)
    base: '/hall-chatbot/',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [react()],

    // Do NOT inject sensitive API keys into the client bundle. Configure keys in the Admin Dashboard or on a server-side environment.


    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});