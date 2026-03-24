/**
 * Shared configuration presets for the monorepo.
 * Other packages extend these via their own tsconfig.json.
 */
export const tsConfigBase = {
  compilerOptions: {
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'bundler',
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    declaration: true,
    sourceMap: true,
  },
} as const;
