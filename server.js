const fastify = require('fastify')({ logger: true });
const path = require('path');
const fetch = require('node-fetch');

// Register CORS plugin
fastify.register(require('@fastify/cors'), {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS']
});

// Register static file serving
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname),
  prefix: '/'
});

// API Proxy endpoint
fastify.get('/api/trace', async (request, reply) => {
  try {
    const { b } = request.query;

    if (!b) {
      return reply.code(400).send({
        error: 'Parameter BTT (b) diperlukan'
      });
    }

    // Call Dakota Cargo API
    const apiUrl = `https://dakotacargo.co.id/api/tracelastonly/?b=${encodeURIComponent(b)}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return reply.code(response.status).send({
        error: `API returned status ${response.status}`
      });
    }

    const data = await response.json();

    return reply.send(data);

  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({
      error: 'Gagal mengambil data dari API',
      message: error.message
    });
  }
});

// Health check endpoint
fastify.get('/api/health', async (request, reply) => {
  return { status: 'OK', message: 'Server berjalan dengan baik' };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('\n========================================');
    console.log('🚀 Server berhasil dijalankan!');
    console.log('========================================');
    console.log(`📍 Buka aplikasi di: http://localhost:3000/index.html`);
    console.log(`🔍 Health check: http://localhost:3000/api/health`);
    console.log('========================================\n');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
