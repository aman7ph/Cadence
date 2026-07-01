const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Let Metro watch all packages in the monorepo
config.watchFolders = [workspaceRoot];

// Prefer local node_modules, then workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Exclude Rust/Tauri build artifacts — Metro crashes watching temp files there
config.watchman = config.watchman ?? {};
config.resolver.blockList = [
  /apps[/\\]tray[/\\]src-tauri[/\\]target[/\\].*/,
  /apps[/\\]CadenceTray[/\\]src-tauri[/\\]target[/\\].*/,
];

module.exports = config;
