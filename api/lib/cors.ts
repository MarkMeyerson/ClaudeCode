import { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = [
  'https://staireadiasses.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

export const setCorsHeaders = (req: VercelRequest, res: VercelResponse): boolean => {
  const origin = req.headers.origin;

  // Check if origin is allowed
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    // In development, allow any origin
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
};

export const handleError = (res: VercelResponse, error: any, message: string = 'Internal server error') => {
  console.error('Error:', error);

  const statusCode = error.statusCode || 500;
  const errorMessage = error.message || message;

  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};
