const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(pagesDir);

files.forEach(file => {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Remove activeBgUrl and activeDimming declarations
    content = content.replace(/const activeBgUrl = pageBackgrounds\?\.\[location\.pathname\]\?\.url \|\| globalBackgroundUrl;\n?/g, '');
    content = content.replace(/const activeDimming = pageBackgrounds\?\.\[location\.pathname\]\?\.dimming \?\? 80;\n?/g, '');

    // Remove the background image div
    content = content.replace(/\{activeBgUrl && \(\s*<div\s*className="absolute inset-0 bg-cover bg-center pointer-events-none mix-blend-overlay"\s*style=\{\{ backgroundImage: `url\(\$\{activeBgUrl\}\)`, opacity: 1 - \(activeDimming \/ 100\) \}\}\s*\/>\s*\)\}\n?/g, '');
    content = content.replace(/\{activeBgUrl && \(\s*<div\s*className="absolute inset-0 bg-cover bg-center pointer-events-none mix-blend-overlay"\s*style=\{\{ backgroundImage: `url\(\$\{activeBgUrl\}\)` \}\}\s*\/>\s*\)\}\n?/g, '');

    // Change bg-neutral-950/80 or bg-neutral-950/90 to bg-transparent
    content = content.replace(/bg-neutral-950\/80/g, 'bg-transparent');
    content = content.replace(/bg-neutral-950\/90/g, 'bg-transparent');

    fs.writeFileSync(filePath, content);
  }
});
console.log('Done');
