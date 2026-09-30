const https = require('https');

module.exports = (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const queryToken = req.query && req.query.token ? req.query.token : '';
  let authHeader = req.headers['authorization'] || (queryToken ? `Bearer ${queryToken}` : '');

  if (!authHeader) {
    res.status(400).json({ error: 'Missing Authorization Token' });
    return;
  }

  if (!authHeader.startsWith('Bearer ') && !authHeader.startsWith('Apikey ')) {
    authHeader = `Bearer ${authHeader}`;
  }

  const limit = (req.query && req.query.limit) || 30;

  const options = {
    hostname: 'my.sepay.vn',
    path: `/userapi/transactions/list?limit=${limit}`,
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'User-Agent': 'EbookPe-Vercel-Proxy/2.0'
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => {
      res.status(proxyRes.statusCode || 200).setHeader('Content-Type', 'application/json').send(data);
    });
  });

  proxyReq.on('error', (err) => {
    res.status(500).json({ error: 'SePay Proxy Error: ' + err.message });
  });

  proxyReq.end();
};
