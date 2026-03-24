const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch only the workspace packages the mobile app depends on (not the entire monorepo,
// which causes crashes when Metro tries to watch transient temp directories)
config.watchFolders = [
  path.resolve(monorepoRoot, 'packages/shared'),
  path.resolve(monorepoRoot, 'packages/proximity-protocol'),
  path.resolve(monorepoRoot, 'node_modules'),
  // pnpm stores the real package files here (symlinks point into this directory)
  path.resolve(monorepoRoot, 'node_modules/.pnpm'),
];

// Let Metro know where to resolve packages from (pnpm monorepo support)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// pnpm uses symlinks — Metro must follow them
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// Allow Metro to resolve packages by walking up the directory tree (needed for pnpm)
config.resolver.disableHierarchicalLookup = false;

// pnpm stores real files in node_modules/.pnpm — Metro needs to resolve through symlinks
// by knowing where the real packages live
config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (target, name) => {
      // First check project node_modules, then monorepo root
      const projectPath = path.resolve(projectRoot, 'node_modules', String(name));
      const monorepoPath = path.resolve(monorepoRoot, 'node_modules', String(name));
      try {
        require('fs').accessSync(projectPath);
        return projectPath;
      } catch {
        return monorepoPath;
      }
    },
  },
);

module.exports = config;
