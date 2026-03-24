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
];

// Let Metro know where to resolve packages from (pnpm monorepo support)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// pnpm uses symlinks — Metro must follow them
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
