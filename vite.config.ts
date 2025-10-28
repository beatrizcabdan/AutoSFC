import react from '@vitejs/plugin-react'
import * as child_process from "node:child_process";

// https://vite.dev/config/
export default () => {
  const branchName = child_process.execSync('git rev-parse --abbrev-ref HEAD').toString().trimEnd();
  return {
    base: `${branchName === 'main' ? '/' : '/dev'}`,
    plugins: [react()]
  }
}
