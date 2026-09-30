const fs = require('fs');
function purge(file) {
  try {
    let data = fs.readFileSync(file, 'utf8');
    data = data.replace(/"downloadUrl":\s*"[^"]+",?/g, '');
    data = data.replace(/downloadUrl:\s*'[^']+',?/g, '');
    data = data.replace(/const REAL_DRIVE_URL[^;]+;/g, "const REAL_DRIVE_URL = '';");
    data = data.replace(/const DEFAULT_DRIVE_URL[^;]+;/g, "const DEFAULT_DRIVE_URL = '';");
    // Also remove API Keys from settings if present in data.js
    data = data.replace(/sepayApiKey:\s*'[^']*',?/g, "sepayApiKey: '',");
    data = data.replace(/emailjsServiceId:\s*'[^']*',?/g, "emailjsServiceId: '',");
    data = data.replace(/emailjsTemplateId:\s*'[^']*',?/g, "emailjsTemplateId: '',");
    data = data.replace(/emailjsPublicKey:\s*'[^']*',?/g, "emailjsPublicKey: '',");
    fs.writeFileSync(file, data);
    console.log("Purged " + file);
  } catch(e) {
    console.log("Failed " + file, e.message);
  }
}

purge('js/data.js');
purge('js/app.js');
purge('js/admin.js');
purge('index.html');
