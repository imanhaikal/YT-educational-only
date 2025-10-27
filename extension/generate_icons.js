
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [128, 48, 32, 16];
const outputDir = path.join(__dirname, 'icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const svgImage = `
<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="128" height="128" fill="#4285F4"/>
<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="60" fill="white">YT</text>
</svg>
`;

const svgBuffer = Buffer.from(svgImage);

sizes.forEach(size => {
  sharp(svgBuffer)
    .resize(size, size)
    .toFile(path.join(outputDir, `icon${size}.png`), (err, info) => {
      if (err) {
        console.error(`Error generating icon${size}.png:`, err);
      } else {
        console.log(`Generated icon${size}.png`);
      }
    });
});
