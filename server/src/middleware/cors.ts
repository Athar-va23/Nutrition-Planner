import cors from 'cors';

// Build allowed origins from environment + safe defaults
const allowedOrigins: string[] = [
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000',
];

// Add production CLIENT_URL if set
if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

const isDev = process.env.NODE_ENV !== 'production';

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin ONLY in development
    // (e.g., mobile apps, curl, Postman — these don't send Origin headers)
    if (!origin) {
      return callback(null, isDev);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

