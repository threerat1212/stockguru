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

const url = `https://${RENDER_EXTERNAL_HOSTNAME}/api/alerts/check`;

console.log(`Checking alerts from: ${url}`);

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${CRON_SECRET}`,
  },
};

const req = https.request(url, options, (res) => {
  res.on('end', () => {
    console.log(`Response status: ${res.statusCode}`);

    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('Alerts check successful');
      process.exit(0);
    } else {
      console.error('Alerts check failed');
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
  process.exit(1);
});

req.end();
