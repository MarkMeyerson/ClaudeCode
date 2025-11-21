import { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, handleError } from './lib/cors';
import { query } from './lib/db';

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
    // Get assessment ID from query parameter
    const assessmentId = req.query.id as string;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: 'Assessment ID is required'
      });
    }

    const result = await query(
      'SELECT * FROM assessments WHERE id = $1',
      [assessmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    const assessment = result.rows[0];

    // Get responses
    const responsesResult = await query(
      'SELECT * FROM responses WHERE assessment_id = $1 ORDER BY created_at',
      [assessmentId]
    );

    // Reconstruct score object
    const dimensionScores = [
      {
        dimension: 'strategic_clarity',
        score: assessment.strategic_clarity_score,
        maxScore: 20,
        percentage: Math.round((assessment.strategic_clarity_score / 20) * 100)
      },
      {
        dimension: 'governance_readiness',
        score: assessment.governance_readiness_score,
        maxScore: 20,
        percentage: Math.round((assessment.governance_readiness_score / 20) * 100)
      },
      {
        dimension: 'team_capability',
        score: assessment.team_capability_score,
        maxScore: 20,
        percentage: Math.round((assessment.team_capability_score / 20) * 100)
      },
      {
        dimension: 'technical_infrastructure',
        score: assessment.technical_infrastructure_score,
        maxScore: 20,
        percentage: Math.round((assessment.technical_infrastructure_score / 20) * 100)
      },
      {
        dimension: 'executive_alignment',
        score: assessment.executive_alignment_score,
        maxScore: 20,
        percentage: Math.round((assessment.executive_alignment_score / 20) * 100)
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        assessment: {
          id: assessment.id,
          companyName: assessment.company_name,
          contactName: assessment.contact_name,
          email: assessment.email,
          completedAt: assessment.completed_at
        },
        score: {
          dimensionScores,
          totalScore: assessment.total_score,
          maxTotalScore: 100,
          percentage: Math.round((assessment.total_score / 100) * 100),
          readinessPhase: assessment.readiness_phase
        },
        responses: responsesResult.rows
      }
    });

  } catch (error: any) {
    console.error('Error fetching results:', error);
    handleError(res, error, 'Failed to fetch assessment results');
  }
}
