import { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, handleError } from './_lib/cors';
import { assessmentDimensions, getAllQuestions } from './_lib/questions';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (setCorsHeaders(req, res)) {
    return; // Preflight request handled
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    res.status(200).json({
      success: true,
      data: {
        dimensions: assessmentDimensions,
        totalQuestions: getAllQuestions().length
      }
    });
  } catch (error: any) {
    handleError(res, error, 'Failed to fetch assessment questions');
  }
}
