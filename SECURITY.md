# Security Policy

## Security Features

This application implements multiple security layers to protect against common web vulnerabilities:

### 🛡️ Implemented Security Measures

#### 1. **XSS (Cross-Site Scripting) Protection**
- HTML escaping for all user inputs and API responses
- `textContent` used instead of `innerHTML` for dynamic content
- Input validation on both client and server side

#### 2. **CORS (Cross-Origin Resource Sharing)**
- Environment-based origin whitelisting
- Development mode: Allow all origins
- Production mode: Strict origin validation
- Configurable via `.env` file

#### 3. **Rate Limiting**
- Default: 100 requests per minute per IP
- Prevents brute force attacks
- Prevents API abuse
- Configurable via environment variables

#### 4. **Input Validation & Sanitization**
- BTT format validation (alphanumeric + separators only)
- Length restrictions (3-50 characters)
- Server-side validation on all endpoints
- Response data sanitization with length limits

#### 5. **Security Headers (Helmet.js)**
- Content Security Policy (CSP)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy

#### 6. **File Upload Security**
- Client-side file size limit: 5MB
- CSV line count limit: 1000 lines
- File extension validation
- MIME type checking

#### 7. **Request Timeout**
- External API timeout: 10 seconds
- Prevents hanging requests
- Resource protection

#### 8. **Error Handling**
- No sensitive information exposure
- Different error messages for dev/prod
- Comprehensive error logging
- Graceful error recovery

#### 9. **Secure Logging**
- Structured logging with Fastify
- Request ID tracking
- No sensitive data in logs
- Environment-aware logging level

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=production  # Use 'production' in production!

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=60000

# API Configuration
EXTERNAL_API_TIMEOUT=10000
```

### Production Deployment Checklist

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Configure `ALLOWED_ORIGINS` with your domain(s)
- [ ] Adjust `RATE_LIMIT_MAX` based on your needs
- [ ] Enable HTTPS/TLS (use reverse proxy like Nginx)
- [ ] Set up proper firewall rules
- [ ] Configure log rotation
- [ ] Set up monitoring and alerting
- [ ] Regular dependency updates (`npm audit`)
- [ ] Implement backup strategy
- [ ] Set up intrusion detection

## Reporting a Vulnerability

If you discover a security vulnerability, please:

1. **DO NOT** create a public GitHub issue
2. Email the security details to: [Your Email]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to resolve the issue.

## Security Updates

### Version 2.0.0 (Latest)
- ✅ XSS Protection implemented
- ✅ Rate limiting added
- ✅ CORS properly configured
- ✅ Input validation on all endpoints
- ✅ Security headers with Helmet.js
- ✅ File upload security
- ✅ Request timeout protection
- ✅ Error message sanitization

### Version 1.0.0
- ⚠️  Multiple security vulnerabilities (deprecated)

## Known Limitations

1. **API Dependency**: Application relies on external Dakota Cargo API
2. **Client-Side Processing**: CSV processing happens in browser (limited by browser resources)
3. **No Authentication**: Currently no user authentication (add if needed for production)

## Best Practices

### For Developers

1. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm update
   ```

2. **Use Environment Variables**
   - Never commit `.env` file
   - Use `.env.example` as template
   - Different configs for dev/staging/prod

3. **Validate All Inputs**
   - Client-side validation (UX)
   - Server-side validation (Security)
   - Never trust user input

4. **Regular Security Audits**
   - Run `npm audit` regularly
   - Review security headers
   - Test with security tools (OWASP ZAP, Burp Suite)

### For Users

1. **Keep Software Updated**
2. **Use Strong Passwords** (if authentication added)
3. **Use HTTPS Only**
4. **Don't Upload Sensitive Data** without proper encryption
5. **Verify File Sources** before uploading

## Security Testing

### Manual Testing

```bash
# Test rate limiting
for i in {1..110}; do curl http://localhost:3000/api/health; done

# Test invalid input
curl "http://localhost:3000/api/trace?b=<script>alert('xss')</script>"

# Test file size limit
# Upload CSV > 5MB via browser

# Test CORS
curl -H "Origin: http://evil.com" http://localhost:3000/api/health
```

### Automated Testing

```bash
# Run npm audit
npm audit

# Check for outdated packages
npm outdated
```

## License

This security policy is part of the CEK Tracing project and follows the same ISC license.

---

Last Updated: 2025-11-15
