const fs = require('fs');
const path = 'c:/Users/ovesk/watch-auction-marketplace/frontend/app/admin/page.js';
let content = fs.readFileSync(path, 'utf8');
// Replace literal \n with real newline
content = content.replace(/\\n/g, '\n');
fs.writeFileSync(path, content);
console.log("Newlines fixed in admin/page.js");
