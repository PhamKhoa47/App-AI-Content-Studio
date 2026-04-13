const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Colors
  content = content.replace(/red-600/g, 'blue-600');
  content = content.replace(/red-700/g, 'blue-700');
  content = content.replace(/red-800/g, 'blue-800');
  content = content.replace(/red-500/g, 'blue-500');
  content = content.replace(/red-200/g, 'blue-200');
  content = content.replace(/red-100/g, 'slate-200');
  content = content.replace(/red-50/g, 'slate-100');
  
  content = content.replace(/amber-600/g, 'indigo-600');
  content = content.replace(/amber-700/g, 'indigo-700');
  content = content.replace(/amber-500/g, 'indigo-500');
  content = content.replace(/amber-200/g, 'indigo-200');
  content = content.replace(/amber-100/g, 'indigo-100');
  content = content.replace(/amber-50/g, 'indigo-50');
  content = content.replace(/amber-900/g, 'indigo-900');

  // Specific classes
  content = content.replace(/bg-tet-pattern/g, 'bg-slate-50');
  content = content.replace(/bg-gradient-to-br from-blue-600 to-blue-800/g, 'bg-blue-600');
  content = content.replace(/bg-gradient-to-r from-indigo-500 to-indigo-600/g, 'bg-indigo-600');
  
  fs.writeFileSync(filePath, content, 'utf8');
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === 'dist' || file === '.git' || file === 'public') continue;
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

processDir(__dirname);
console.log('Done replacing colors in root directory');
