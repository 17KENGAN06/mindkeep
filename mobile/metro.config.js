const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const rootModules = path.resolve(workspaceRoot, 'node_modules');
const nestedModules = path.resolve(projectRoot, 'node_modules');

function collectPackages(dir) {
  const out = {};
  if (!fs.existsSync(dir)) return out;

  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('.')) continue;

    if (name.startsWith('@')) {
      const scopeDir = path.join(dir, name);
      let entries;
      try {
        entries = fs.readdirSync(scopeDir);
      } catch {
        continue;
      }
      for (const nested of entries) {
        const pkgPath = path.join(scopeDir, nested);
        if (fs.existsSync(path.join(pkgPath, 'package.json'))) {
          out[`${name}/${nested}`] = pkgPath;
        }
      }
      continue;
    }

    const pkgPath = path.join(dir, name);
    if (fs.existsSync(path.join(pkgPath, 'package.json'))) {
      out[name] = pkgPath;
    }
  }

  return out;
}

const extraNodeModules = {
  ...collectPackages(nestedModules),
  ...collectPackages(rootModules),
};

for (const name of ['expo', 'react', 'react-native']) {
  extraNodeModules[name] = path.join(rootModules, name);
}

const config = getDefaultConfig(projectRoot);
config.watchFolders = [projectRoot, rootModules];
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [rootModules, nestedModules];
config.resolver.extraNodeModules = extraNodeModules;

module.exports = config;
