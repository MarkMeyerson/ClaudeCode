import { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, handleError } from './_lib/cors';
import { query } from './_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (setCorsHeaders(req, res)) {
    return; // Preflight request handled
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const {
      companyName,
      contactName,
      email,
      phone,
      companySize,
      industry
    } = req.body;

    // Validation
    if (!companyName || !contactName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Company name, contact name, and email are required'
      });
    }

    // Create assessment
    const result = await query(
      `INSERT INTO assessments
        (company_name, contact_name, email, phone, company_size, industry, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'in_progress')
       RETURNING id, created_at`,
      [companyName, contactName, email, phone, companySize, industry]
    );

    const assessment = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        assessmentId: assessment.id,
        createdAt: assessment.created_at
      }
    });

  } catch (error: any) {
    console.error('Error creating assessment:', error);
    handleError(res, error, 'Failed to create assessment');
  }
}
