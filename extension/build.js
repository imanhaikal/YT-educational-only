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

const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf-8'));
manifest.icons = {
  "16": "icon16.png",
  "32": "icon32.png",
  "48": "icon48.png",
  "128": "icon128.png"
};
fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Copied and modified 'manifest.json' to '${path.join(distDir, 'manifest.json')}'`);

copy('popup.html', path.join(distDir, 'popup.html'));
console.log(`Copied 'popup.html' to '${path.join(distDir, 'popup.html')}'`);
copy('popup.css', path.join(distDir, 'popup.css'));
console.log(`Copied 'popup.css' to '${path.join(distDir, 'popup.css')}'`);
copy('src/options', path.join(distDir, 'options'));
console.log(`Copied 'src/options' to '${path.join(distDir, 'options')}'`);
copy('src/styles', path.join(distDir, 'styles'));
console.log(`Copied 'src/styles' to '${path.join(distDir, 'styles')}'`);

fs.readdirSync('icons').forEach(file => {
  copy(path.join('icons', file), path.join(distDir, file));
  console.log(`Copied '${path.join('icons', file)}' to '${path.join(distDir, file)}'`);
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