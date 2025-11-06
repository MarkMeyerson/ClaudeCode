import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/db';
import { calculateAssessmentScore } from '../services/scoring';
import hubspotService from '../services/hubspot';
import emailService from '../services/email';
import pdfService from '../services/pdf';
import { assessmentDimensions, getAllQuestions } from '../config/questions';

const router = Router();

// Get assessment questions
router.get('/questions', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        dimensions: assessmentDimensions,
        totalQuestions: getAllQuestions().length
      }
    });
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assessment questions',
      error: error.message
    });
  }
});

// Create new assessment
router.post('/start', async (req: Request, res: Response) => {
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

    res.json({
      success: true,
      data: {
        assessmentId: assessment.id,
        createdAt: assessment.created_at
      }
    });

  } catch (error: any) {
    console.error('Error creating assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create assessment',
      error: error.message
    });
  }
});

// Submit assessment responses
router.post('/:assessmentId/submit', async (req: Request, res: Response) => {
  try {
    const { assessmentId } = req.params;
    const { responses } = req.body;

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

    // Sync to HubSpot (async, don't block response)
    syncToHubSpot(assessment, assessmentScore).catch(err =>
      console.error('HubSpot sync error:', err)
    );

    // Send email report (async, don't block response)
    sendEmailReport(assessment, assessmentScore).catch(err =>
      console.error('Email send error:', err)
    );

    res.json({
      success: true,
      data: {
        assessmentId,
        score: assessmentScore
      }
    });

  } catch (error: any) {
    console.error('Error submitting assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit assessment',
      error: error.message
    });
  }
});

// Get assessment results
router.get('/:assessmentId/results', async (req: Request, res: Response) => {
  try {
    const { assessmentId } = req.params;

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

    res.json({
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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assessment results',
      error: error.message
    });
  }
});

// Download PDF report
router.get('/:assessmentId/pdf', async (req: Request, res: Response) => {
  try {
    const { assessmentId } = req.params;

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

    const assessmentScore = calculateAssessmentScore(
      dimensionScores.map(ds => ({
        questionId: ds.dimension,
        value: ds.score,
        dimension: ds.dimension
      }))
    );

    // Generate PDF
    const pdfBuffer = await pdfService.generateReport({
      companyName: assessment.company_name,
      contactName: assessment.contact_name,
      assessmentScore,
      assessmentId
    });

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="AI-Readiness-Report-${assessment.company_name.replace(/\s+/g, '-')}.pdf"`);
    res.send(pdfBuffer);

  } catch (error: any) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF report',
      error: error.message
    });
  }
});

// Helper functions
async function syncToHubSpot(assessment: any, score: any): Promise<void> {
  try {
    const contactId = await hubspotService.createOrUpdateContact({
      email: assessment.email,
      firstname: assessment.contact_name,
      lastname: '',
      phone: assessment.phone,
      company: assessment.company_name,
      industry: assessment.industry,
      ai_readiness_score: score.totalScore,
      ai_readiness_phase: score.readinessPhase,
      strategic_clarity_score: score.dimensionScores.find((d: any) => d.dimension === 'strategic_clarity')?.score,
      governance_readiness_score: score.dimensionScores.find((d: any) => d.dimension === 'governance_readiness')?.score,
      team_capability_score: score.dimensionScores.find((d: any) => d.dimension === 'team_capability')?.score,
      technical_infrastructure_score: score.dimensionScores.find((d: any) => d.dimension === 'technical_infrastructure')?.score,
      executive_alignment_score: score.dimensionScores.find((d: any) => d.dimension === 'executive_alignment')?.score,
      assessment_completed_date: new Date().toISOString()
    });

    if (contactId) {
      await query(
        `UPDATE assessments SET
          hubspot_contact_id = $1,
          hubspot_synced = true,
          hubspot_synced_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [contactId, assessment.id]
      );
    }
  } catch (error) {
    console.error('HubSpot sync failed:', error);
  }
}

async function sendEmailReport(assessment: any, score: any): Promise<void> {
  try {
    const sent = await emailService.sendAssessmentReport({
      to: assessment.email,
      contactName: assessment.contact_name,
      companyName: assessment.company_name,
      assessmentScore: score
    });

    if (sent) {
      await query(
        `UPDATE assessments SET
          report_emailed = true,
          report_emailed_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [assessment.id]
      );
    }
  } catch (error) {
    console.error('Email send failed:', error);
  }
}

export default router;
