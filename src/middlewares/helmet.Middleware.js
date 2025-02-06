// helmetMiddleware.js
import helmet from 'helmet';

// Custom Helmet middleware with production-level configurations
const helmetMiddleware = (req, res, next) => {
  const options = {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], // Allow only same-origin content
        scriptSrc: ["'self'", 'trusted-cdn.com'], // Add trusted external sources for scripts
        styleSrc: ["'self'", 'trusted-cdn.com'], // Add trusted external sources for styles
        imgSrc: ["'self'", 'data:', 'trusted-cdn.com'], // Allow images from same origin and trusted sources
        fontSrc: ["'self'", 'trusted-cdn.com'], // Allow fonts from same origin and trusted sources
        connectSrc: ["'self'", 'api.trusted-service.com'], // Allow connections to trusted APIs
        reportUri: '/report-violation', // Optional: URI to log CSP violations
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true, // Apply to subdomains as well
      preload: true, // Preload in browser HSTS list
    },
    frameguard: { action: 'deny' }, // Prevent clickjacking
    xssFilter: true, // Enable XSS filtering
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }, // Referrer Policy
    permissionsPolicy: {
      features: {
        geolocation: ["'none'"], // Disable geolocation
        microphone: ["'none'"],   // Disable microphone
        camera: ["'none'"],       // Disable camera
      },
    },
    hidePoweredBy: true, // Hide X-Powered-By header (Express)
  };

  helmet(options)(req, res, next);
};

export default helmetMiddleware;
