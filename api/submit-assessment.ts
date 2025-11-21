import { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, handleError } from './lib/cors';
import { query } from './lib/db';
import { calculateAssessmentScore } from './lib/scoring';

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
    // Get assessment ID from query parameter
    const assessmentId = req.query.id as string;
    const { responses } = req.body;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: 'Assessment ID is required'
      });
    }

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        message: 'Responses array is required'
      });
    }

    // Get assessment details
    const assessmentResult = await query(
      'SELECT * FROM assessments WHERE id = $1',
      [assessmentId]
    );

    if (assessmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    const assessment = assessmentResult.rows[0];

    // Save individual responses
    for (const response of responses) {
      await query(
        `INSERT INTO responses
          (assessment_id, dimension, question_id, question_text, answer_value, answer_text)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          assessmentId,
          response.dimension,
          response.questionId,
          response.questionText,
          response.answerValue,
          response.answerText || null
        ]
      );
    }

    // Calculate scores
    const assessmentScore = calculateAssessmentScore(responses);

    // Update assessment with scores
    await query(
      `UPDATE assessments SET
        strategic_clarity_score = $1,
        governance_readiness_score = $2,
        team_capability_score = $3,
        technical_infrastructure_score = $4,
        executive_alignment_score = $5,
        total_score = $6,
        readiness_phase = $7,
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [
        assessmentScore.dimensionScores.find(d => d.dimension === 'strategic_clarity')?.score || 0,
        assessmentScore.dimensionScores.find(d => d.dimension === 'governance_readiness')?.score || 0,
        assessmentScore.dimensionScores.find(d => d.dimension === 'team_capability')?.score || 0,
        assessmentScore.dimensionScores.find(d => d.dimension === 'technical_infrastructure')?.score || 0,
        assessmentScore.dimensionScores.find(d => d.dimension === 'executive_alignment')?.score || 0,
        assessmentScore.totalScore,
        assessmentScore.readinessPhase,
        assessmentId
      ]
    );

    // Note: HubSpot sync and email sending are omitted in serverless version
    // These can be implemented as separate background jobs or webhook handlers

    res.status(200).json({
      success: true,
      data: {
        assessmentId,
        score: assessmentScore
      }
    });

  } catch (error: any) {
    console.error('Error submitting assessment:', error);
    handleError(res, error, 'Failed to submit assessment');
  }
}
