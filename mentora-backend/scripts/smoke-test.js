const http = require('http');

const { createApp } = require('../app');
const { createFileDatabase } = require('../lib/fileDatabase');

const request = (server, path, method = 'GET', body = null, token = null) =>
  new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const address = server.address();

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: address.port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : {},
          });
        });
      }
    );

    req.on('error', reject);

    if (payload) {
      req.write(payload);
    }

    req.end();
  });

const main = async () => {
  const app = createApp({ database: createFileDatabase() });
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });

  try {
    const health = await request(server, '/health');
    if (health.statusCode !== 200) {
      throw new Error(`Health check failed with ${health.statusCode}`);
    }

    const register = await request(server, '/api/auth/register', 'POST', {
      name: 'Smoke User',
      email: `smoke.${Date.now()}@gmail.com`,
      password: 'secret123',
    });

    if (register.statusCode !== 201) {
      throw new Error(`Register failed with ${register.statusCode}`);
    }

    const accessToken = register.body.data.tokens.accessToken;

    const profile = await request(server, '/api/user/profile', 'GET', null, accessToken);
    if (profile.statusCode !== 200) {
      throw new Error(`Profile fetch failed with ${profile.statusCode}`);
    }

    console.log('Smoke test passed.');
    server.close(() => process.exit(0));
  } catch (error) {
    console.error('Smoke test failed:', error.message);
    server.close(() => process.exit(1));
  }
};

main();
