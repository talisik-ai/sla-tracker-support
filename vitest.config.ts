import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    viteReact(),
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        'src/routes/demo/**',
        'src/routeTree.gen.ts',
        'dist/**',
        '.output/**',
      ],
      // Target thresholds
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
      // Report uncovered lines
      all: true,
      // Include only source files
      include: ['src/**/*.{ts,tsx}'],
    },
  },
})

