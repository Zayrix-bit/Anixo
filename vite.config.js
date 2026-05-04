import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

import os from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Auto-detect local Chrome to bypass massive puppeteer downloads
const getChromePath = () => {
  if (os.platform() === 'win32') {
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  } else if (os.platform() === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  }
  return '/usr/bin/google-chrome';
};

const localChromePath = getChromePath();
const executablePath = fs.existsSync(localChromePath) ? localChromePath : undefined;

// Read generated routes safely
let prerenderRoutes = ['/']
try {
  const routesPath = path.resolve(__dirname, 'prerender-routes.json')
  if (fs.existsSync(routesPath)) {
    prerenderRoutes = JSON.parse(fs.readFileSync(routesPath, 'utf8'))
  }
} catch (e) {
  console.warn("Could not load prerender-routes.json, falling back to minimal routes.", e)
}

// https://vite.dev/config/
export default defineConfig(async () => {
  // --- BUGFIX FOR vite-plugin-prerender in ES MODULES ---
  // The plugin has a bug where it uses require() inside its .mjs file.
  // We provide a global require to bypass this crash.
  globalThis.require = createRequire(import.meta.url)
  const vitePrerenderModule = await import('vite-plugin-prerender')
  const vitePrerender = vitePrerenderModule.default
  const Renderer = vitePrerender.PuppeteerRenderer

  return {
    plugins: [
      react(), 
      tailwindcss(),
      vitePrerender({
        staticDir: path.join(__dirname, 'dist'),
        routes: prerenderRoutes,
        renderer: new Renderer({
          executablePath, // Uses local Chrome!
          renderAfterTime: 5000,
          skipThirdPartyRequests: true,
        }),
        postProcess(renderedRoute) {
          return renderedRoute;
        }
      })
    ],
    server: {
      proxy: {
        '/api': { target: 'http://localhost:5000', changeOrigin: true, secure: false },
        '/auth': { target: 'http://localhost:5001', changeOrigin: true, secure: false },
        '/watchlist': { target: 'http://localhost:5001', changeOrigin: true, secure: false },
        '/progress': { target: 'http://localhost:5001', changeOrigin: true, secure: false },
        '/settings': { target: 'http://localhost:5001', changeOrigin: true, secure: false },
        '/notifications': { target: 'http://localhost:5001', changeOrigin: true, secure: false }
      }
    }
  }
})
