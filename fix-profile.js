const fs = require('fs');
const content = fs.readFileSync('app/profile/page.js', 'utf8');
const firstClient = content.indexOf('"use client";');
const secondClient = content.indexOf('"use client";', firstClient + 1);
if (secondClient !== -1) {
  const newContent = content.substring(secondClient);
  fs.writeFileSync('app/profile/page.js', newContent);
  console.log('Fixed file');
} else {
  console.log('Second use client not found');
}
