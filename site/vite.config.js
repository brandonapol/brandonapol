import { defineConfig } from 'vite';

// Relative base so the build works at a custom domain root or a /repo/ subpath.
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        resume: 'resume.html',
      },
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.js'],
  },
});
