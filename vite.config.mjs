import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Локальная модель-переводчик (LM Studio). Запросы из браузера идут на /llm и
// проксируются сюда: для браузера это тот же origin, поэтому CORS в LM Studio
// включать не нужно.
const translator = process.env.VITE_TRANSLATOR_TARGET ?? 'http://127.0.0.1:1234'

const proxy = {
  '/llm': {
    target: translator,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/llm/, ''),
    // первая загрузка 12B-модели занимает минуты — обычных 30 секунд не хватает
    timeout: 15 * 60 * 1000,
    proxyTimeout: 15 * 60 * 1000,
  },
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { proxy },
  preview: { proxy },
})
