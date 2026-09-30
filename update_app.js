const fs = require('fs');
let data = fs.readFileSync('js/app.js', 'utf8');

// Replace combo book links
data = data.replace(
  /let bDl = \(b\.downloadUrl \|\| ''\)\.trim\(\);\s*if \(bDl\.startsWith\('drive\.google\.com'\)\) bDl = 'https:\/\/' \+ bDl;/g,
  `const secureLinks = window.EbookDB.getSecureLinks() || {}; let bDl = secureLinks[b.id] ? secureLinks[b.id].url : '';`
);

// Replace single book links
data = data.replace(
  /let downloadUrl = \(book\?\.downloadUrl \|\| item\.downloadUrl \|\| ''\)\.trim\(\);\s*if \(downloadUrl\.startsWith\('drive\.google\.com'\)\) downloadUrl = 'https:\/\/' \+ downloadUrl;/g,
  `const secureLinks = window.EbookDB.getSecureLinks() || {}; let downloadUrl = secureLinks[item.id] ? secureLinks[item.id].url : '';`
);

// Remove combo download url logic
data = data.replace(
  /let comboDl = \(combo\.downloadUrl \|\| ''\)\.trim\(\);\s*if \(comboDl\.startsWith\('drive\.google\.com'\)\) comboDl = 'https:\/\/' \+ comboDl;/g,
  ``
);

fs.writeFileSync('js/app.js', data);
console.log("Updated app.js links");
