const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Match things like red-500, red-600/50, etc.
  const newContent = content.replace(/\bred-([1-9]00|50)\b/g, 'discord-$1');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedCount++;
  }
});
console.log('Modified ' + changedCount + ' files.');
