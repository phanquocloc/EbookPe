const https = require('https');

// Helper to make HTTPS requests easily
function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

module.exports = async function handler(req, res) {
  // CORS setup for Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Next.js/Vercel parses req.body automatically if it's JSON. 
  // If not, we should parse it. But Vercel API routes usually do it.
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const orderId = body?.orderId;
  
  if (!orderId) {
    return res.status(400).json({ error: 'Missing orderId' });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY; // Must be Service Role Key to bypass RLS

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error("Missing Supabase Env Vars");
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // 1. Fetch Order from Supabase
    const orderRes = await fetchJson(`${SUPABASE_URL}/rest/v1/orders?order_id=eq.${orderId}&select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (orderRes.status !== 200 || !orderRes.data || orderRes.data.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderRes.data[0];

    // If already paid, just fetch links and return
    if (order.status === 'paid') {
      const links = await getDownloadLinks(order, SUPABASE_URL, SUPABASE_KEY);
      return res.status(200).json({ status: 'paid', order, links });
    }

    // 2. Fetch Settings from Supabase to get SePay Key (or use Env if preferred)
    const settingsRes = await fetchJson(`${SUPABASE_URL}/rest/v1/settings?select=sepay_api_key&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    let sepayKey = process.env.SEPAY_API_KEY; // Fallback to env
    if (settingsRes.status === 200 && settingsRes.data && settingsRes.data.length > 0) {
      sepayKey = settingsRes.data[0].sepay_api_key || sepayKey;
    }

    if (!sepayKey) {
      console.error("Missing SePay API Key");
      return res.status(500).json({ error: 'SePay API Key not configured' });
    }

    // Clean SePay key
    const cleanToken = sepayKey.trim().replace(/^Bearer\s+/i, '').replace(/["']/g, '');

    // 3. Check SePay API
    const sepayRes = await fetchJson(`https://my.sepay.vn/userapi/transactions/list?limit=20`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${cleanToken}` }
    });

    if (sepayRes.status !== 200 || !sepayRes.data || !sepayRes.data.transactions) {
      return res.status(200).json({ status: 'pending', message: 'Waiting for payment' });
    }

    const expectedAmount = Number(order.total_amount);
    
    // Find matching transaction
    const matchedTx = sepayRes.data.transactions.find(tx => {
      const txAmount = Number(tx.amount_in);
      const content = (tx.transaction_content || '').toUpperCase();
      return txAmount >= expectedAmount && content.includes(orderId.toUpperCase());
    });

    if (matchedTx) {
      // Payment found! Update order status
      await fetchJson(`${SUPABASE_URL}/rest/v1/orders?order_id=eq.${orderId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status: 'paid' })
      });

      // Update local order object
      order.status = 'paid';

      // Fetch download links
      const links = await getDownloadLinks(order, SUPABASE_URL, SUPABASE_KEY);

      return res.status(200).json({ status: 'paid', order, links });
    }

    return res.status(200).json({ status: 'pending' });

  } catch (error) {
    console.error("Check payment error:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper to fetch download links based on items
async function getDownloadLinks(order, SUPABASE_URL, SUPABASE_KEY) {
  const links = {};
  if (!order.items || !Array.isArray(order.items)) return links;

  for (const item of order.items) {
    const table = item.type === 'combo' ? 'combos' : 'books';
    const res = await fetchJson(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${item.id}&select=title,download_url`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (res.status === 200 && res.data && res.data.length > 0) {
      links[item.id] = {
        title: res.data[0].title,
        url: res.data[0].download_url
      };
    }
  }
  return links;
}
