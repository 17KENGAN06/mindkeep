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

// Mobile-local copies last so they win: Expo's native-module resolution falls back to this map,
// and autolinking links the mobile/ copy (e.g. react-native-screens).
const extraNodeModules = {
  ...collectPackages(rootModules),
  ...collectPackages(nestedModules),
};

for (const name of ['expo', 'react', 'react-native']) {
  extraNodeModules[name] = path.join(rootModules, name);
}
// mobile/ pins its own React to match the React Native renderer; the root copy belongs to the website.
if (fs.existsSync(path.join(nestedModules, 'react', 'package.json'))) {
  extraNodeModules.react = path.join(nestedModules, 'react');
}

const config = getDefaultConfig(projectRoot);
config.watchFolders = [projectRoot, rootModules];
config.resolver.disableHierarchicalLookup = true;
// Mobile-local packages first, so versions mobile pins (react, react-native-screens, react-i18next) win over hoisted web ones.
config.resolver.nodeModulesPaths = [nestedModules, rootModules];
config.resolver.extraNodeModules = extraNodeModules;

module.exports = config;
