
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  // Fixed: Cast process to any to avoid Property 'cwd' does not exist on type 'Process' error
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      'process.env.KV_REST_API_URL': JSON.stringify(env.KV_REST_API_URL),
      'process.env.KV_REST_API_TOKEN': JSON.stringify(env.KV_REST_API_TOKEN),
    },
    server: {
      port: 3000,
    },
  };
});
