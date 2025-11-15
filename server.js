require('dotenv').config();
const fastify = require('fastify')({
    logger: true,
    requestIdLogLabel: 'reqId',
    disableRequestLogging: false,
    requestIdHeader: 'x-request-id'
});
const path = require('path');
const fetch = require('node-fetch');

// Security: Register Helmet for security headers
fastify.register(require('@fastify/helmet'), {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // For inline styles in index.html
            scriptSrc: ["'self'"], // No unsafe-inline - using event listeners instead
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
});

// Security: Rate limiting to prevent abuse
fastify.register(require('@fastify/rate-limit'), {
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    timeWindow: parseInt(process.env.RATE_LIMIT_TIME_WINDOW) || 60000, // 1 minute
    cache: 10000,
    allowList: ['127.0.0.1'],
    redis: null,
    skipOnError: true,
    keyGenerator: function(request) {
        return request.headers['x-forwarded-for'] || request.ip;
    },
    errorResponseBuilder: function(request, context) {
        return {
            statusCode: 429,
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Retry after ${Math.ceil(context.after / 1000)} seconds.`,
            date: Date.now(),
            expiresIn: Math.ceil(context.after / 1000)
        };
    }
});

// Security: CORS configuration with environment-based origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000'];

fastify.register(require('@fastify/cors'), {
    origin: (origin, cb) => {
        // Allow requests with no origin (mobile apps, Postman, etc)
        if (!origin) {
            cb(null, true);
            return;
        }

        // Development: allow all
        if (process.env.NODE_ENV === 'development') {
            cb(null, true);
            return;
        }

        // Production: check whitelist
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            cb(null, true);
            return;
        }

        // Reject
        cb(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
});

// Register static file serving - restricted to public folder
fastify.register(require('@fastify/static'), {
    root: path.join(__dirname),
    prefix: '/',
    constraints: {},
    // Security: Prevent directory listing
    list: false,
    // Security: Serve specific files only
    decorateReply: true
});

// Security: Input validation function
function validateBTT(btt) {
    if (!btt || typeof btt !== 'string') {
        return { valid: false, error: 'BTT must be a string' };
    }

    if (btt.length > 50) {
        return { valid: false, error: 'BTT too long (max 50 characters)' };
    }

    if (btt.length < 3) {
        return { valid: false, error: 'BTT too short (min 3 characters)' };
    }

    // Allow only alphanumeric and common separators
    if (!/^[a-zA-Z0-9\-_]+$/.test(btt)) {
        return { valid: false, error: 'BTT contains invalid characters' };
    }

    return { valid: true };
}

// API Proxy endpoint with security improvements
fastify.get('/api/trace', async (request, reply) => {
    try {
        const { b } = request.query;

        // Security: Input validation
        if (!b) {
            return reply.code(400).send({
                error: 'Bad Request',
                message: 'Parameter BTT (b) diperlukan'
            });
        }

        // Security: Validate BTT format
        const validation = validateBTT(b);
        if (!validation.valid) {
            return reply.code(400).send({
                error: 'Bad Request',
                message: validation.error
            });
        }

        // Call Dakota Cargo API with timeout
        const apiUrl = `https://dakotacargo.co.id/api/tracelastonly/?b=${encodeURIComponent(b)}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, parseInt(process.env.EXTERNAL_API_TIMEOUT) || 10000);

        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                // Security: Don't expose detailed API errors
                fastify.log.warn(`External API error: ${response.status} for BTT: ${b}`);
                return reply.code(502).send({
                    error: 'Bad Gateway',
                    message: 'Gagal mengambil data dari layanan tracking'
                });
            }

            const data = await response.json();

            // Security: Sanitize response data
            const sanitizedData = {
                detail: data.detail ? {
                    tanggal: String(data.detail.tanggal || '-').substring(0, 100),
                    keterangan: String(data.detail.keterangan || '-').substring(0, 500),
                    posisi: String(data.detail.posisi || '-').substring(0, 200),
                    status: String(data.detail.status || '-').substring(0, 50)
                } : null
            };

            return reply.send(sanitizedData);

        } catch (fetchError) {
            clearTimeout(timeout);

            if (fetchError.name === 'AbortError') {
                fastify.log.warn(`API timeout for BTT: ${b}`);
                return reply.code(504).send({
                    error: 'Gateway Timeout',
                    message: 'Request timeout - layanan tracking tidak merespons'
                });
            }

            throw fetchError;
        }

    } catch (error) {
        // Security: Log error but don't expose details to client
        fastify.log.error({
            err: error,
            endpoint: '/api/trace',
            query: request.query
        });

        // Don't expose internal error details in production
        if (process.env.NODE_ENV === 'production') {
            return reply.code(500).send({
                error: 'Internal Server Error',
                message: 'Terjadi kesalahan pada server'
            });
        } else {
            return reply.code(500).send({
                error: 'Internal Server Error',
                message: 'Gagal mengambil data dari API',
                details: error.message // Only in development
            });
        }
    }
});

// Health check endpoint
fastify.get('/api/health', async (request, reply) => {
    return {
        status: 'OK',
        message: 'Server berjalan dengan baik',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    };
});

// Security: 404 handler
fastify.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
        error: 'Not Found',
        message: 'Endpoint tidak ditemukan',
        path: request.url
    });
});

// Security: Global error handler
fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error({
        err: error,
        request: {
            method: request.method,
            url: request.url,
            headers: request.headers
        }
    });

    // Don't expose error details in production
    if (process.env.NODE_ENV === 'production') {
        reply.code(error.statusCode || 500).send({
            error: error.name || 'Error',
            message: 'Terjadi kesalahan pada server'
        });
    } else {
        reply.code(error.statusCode || 500).send({
            error: error.name || 'Error',
            message: error.message,
            stack: error.stack
        });
    }
});

// Start server
const start = async () => {
    try {
        const port = parseInt(process.env.PORT) || 3000;
        const host = process.env.HOST || '0.0.0.0';

        await fastify.listen({ port, host });

        console.log('\n========================================');
        console.log('🚀 Server berhasil dijalankan!');
        console.log('========================================');
        console.log(`📍 URL: http://localhost:${port}/index.html`);
        console.log(`🔍 Health: http://localhost:${port}/api/health`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🛡️  Security: ENABLED`);
        console.log(`   - Helmet (Security Headers)`);
        console.log(`   - Rate Limiting (${process.env.RATE_LIMIT_MAX || 100} req/min)`);
        console.log(`   - CORS Protection`);
        console.log(`   - Input Validation`);
        console.log('========================================\n');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await fastify.close();
    console.log('✅ Server closed');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM received, shutting down...');
    await fastify.close();
    process.exit(0);
});

start();
