import { defineConfig } from 'bumpp'

export default defineConfig({
  recursive: true,
  execute: 'pnpm build && pnpm test',
  commit: 'v',
  tag: 'v',
})
