import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'packages/config',
  'packages/config-exporter',
  'packages/vite-plugin',
])
