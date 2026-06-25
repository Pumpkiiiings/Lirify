// build.js — Lirify build script
// Generates dist/ folder with lirify.exe + plugins/ + README

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

console.log('🔨 Building Lirify...\n');

// ── 1. Create dist/ structure ──
console.log('📁 Creating dist/ structure...');
fs.mkdirSync(path.join(DIST, 'plugins'), { recursive: true });
fs.mkdirSync(path.join(DIST, 'config'), { recursive: true });

// ── 2. Copy plugins ──
console.log('🔌 Copying plugins...');
const pluginsDir = path.join(ROOT, 'plugins');
const distPluginsDir = path.join(DIST, 'plugins');
if (fs.existsSync(pluginsDir)) {
  for (const file of fs.readdirSync(pluginsDir)) {
    if (file.endsWith('.js')) {
      fs.copyFileSync(
        path.join(pluginsDir, file),
        path.join(distPluginsDir, file)
      );
      console.log(`   ✓ ${file}`);
    }
  }
}

// ── 3. Compile exe with pkg ──
console.log('\n⚙️  Compiling lirify.exe (this may take a few minutes)...');
try {
  execSync(
    'npx pkg . --targets node18-win-x64 --output dist/lirify.exe --compress GZip',
    { stdio: 'inherit', cwd: ROOT }
  );
  console.log('\n✅ lirify.exe compiled!');
} catch (e) {
  console.error('\n❌ pkg compilation failed:', e.message);
  console.log('\n💡 Falling back: creating launcher.bat instead...');
  createBatLauncher();
}

// ── 4. Create README ──
console.log('\n📄 Writing README...');
const readme = `# Lirify Proxy v${require('./package.json').version}

## Como usar

1. Pon tu Minecraft en modo multiplayer
2. Conecta a: localhost:25565
3. El proxy te conecta automaticamente a Hypixel

## Archivos

- lirify.exe   — El proxy (doble clic para arrancar)
- plugins/     — Pon tus plugins .js aqui
- config/      — Configuracion (se genera automaticamente)

## Comandos en el chat

  /proxy server          — Ver y cambiar servidor
  /proxy addserver <nombre> <host:puerto>
  /proxy world           — Ver estado del mundo
  /proxy plugins         — Ver plugins cargados
`;
fs.writeFileSync(path.join(DIST, 'README.txt'), readme, 'utf8');

// ── 5. Summary ──
console.log('\n🎉 Build complete! Files in dist/:');
listDir(DIST, '  ');

function createBatLauncher() {
  const bat = `@echo off
title Lirify Proxy
echo.
echo  ==========================================
echo   Lirify Proxy v${require('./package.json').version}
echo  ==========================================
echo.

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo  ERROR: Node.js no esta instalado.
  echo  Descargalo en: https://nodejs.org
  pause
  exit /b 1
)

echo  Iniciando proxy en localhost:25565...
echo  Conecta tu Minecraft a: localhost:25565
echo  Presiona Ctrl+C para detener
echo.
node "%~dp0src\\proxy.js"
pause
`;
  const distBat = path.join(DIST, 'lirify.bat');
  fs.copyFileSync(path.join(ROOT, 'package.json'), path.join(DIST, 'package.json'));
  // Copy src
  copyDir(path.join(ROOT, 'src'), path.join(DIST, 'src'));
  copyDir(path.join(ROOT, 'node_modules'), path.join(DIST, 'node_modules'));
  fs.writeFileSync(distBat, bat);
  console.log('  ✓ lirify.bat created (requires Node.js installed)');
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function listDir(dir, indent = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    console.log(`${indent}${entry.isDirectory() ? '📁' : '📄'} ${entry.name}`);
    if (entry.isDirectory()) listDir(path.join(dir, entry.name), indent + '  ');
  }
}
