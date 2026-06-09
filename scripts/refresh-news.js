const https = require('https');

const RENDER_EXTERNAL_HOSTNAME = process.env.RENDER_EXTERNAL_HOSTNAME;
const CRON_SECRET = process.env.CRON_SECRET;

if (!RENDER_EXTERNAL_HOSTNAME) {
  console.error('RENDER_EXTERNAL_HOSTNAME environment variable is not set');
  process.exit(1);
}

if (!CRON_SECRET) {
  console.error('CRON_SECRET environment variable is not set');
  process.exit(1);
}

const url = `https://${RENDER_EXTERNAL_HOSTNAME}/api/news/refresh`;

console.log(`Refreshing news from: ${url}`);

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${CRON_SECRET}`,
  },
};

const req = https.request(url, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Response status: ${res.statusCode}`);
    console.log(`Response body: ${data}`);

    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('News refresh successful');
      process.exit(0);
    } else {
      console.error('News refresh failed');
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
  process.exit(1);
});

req.end();
