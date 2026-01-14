import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from "node:child_process"

// @ts-ignore
const projName = execSync('git rev-parse --show-toplevel')
    .toString().trim().split('/').at(-1)

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react()],
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
    LATEST_COMMIT: JSON.stringify(execSync('git rev-parse --short=8 HEAD')
        .toString().trim()),
    PROJECT_NAME: JSON.stringify(projName)
  },
  build: {outDir: "dist/dev/"}
})
