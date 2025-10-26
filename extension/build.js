const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const distDir = 'dist';

// Create dist directory if it doesn't exist
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// --- Copy non-JS assets ---

// Function to copy a file or directory recursively
function copy(source, destination) {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    fs.readdirSync(source).forEach(child => {
      copy(path.join(source, child), path.join(destination, child));
    });
  } else {
    fs.copyFileSync(source, destination);
  }
}

// Define what to copy
const assets = [
  'manifest.json',
  'popup.html',
  'popup.css',
  { from: 'src/options', to: 'options' },
  { from: 'src/styles', to: 'styles' },
];

// Perform the copy
assets.forEach(asset => {
  const sourcePath = typeof asset === 'string' ? asset : asset.from;
  const destPath = path.join(distDir, typeof asset === 'string' ? asset : asset.to);
  copy(sourcePath, destPath);
  console.log(`Copied '${sourcePath}' to '${destPath}'`);
});


// --- Bundle JavaScript ---

esbuild.build({
  entryPoints: {
    'content-script': 'src/content-script/index.js',
    'service-worker': 'src/service-worker/index.js',
    'popup': 'src/popup/popup.js',
    'options': 'src/options/options.js'
  },
  bundle: true,
  outdir: distDir,
  minify: true,
  sourcemap: 'inline',
}).then(() => {
    console.log('JavaScript bundled successfully!');
}).catch((err) => {
    console.error(err);
    process.exit(1);
});