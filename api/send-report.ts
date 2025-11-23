import { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from './lib/cors';
import { sendEmail } from './lib/microsoftGraph';
import { generateEmailHTML, generateEmailPlainText } from './lib/emailTemplates';
import { generatePDF } from './lib/generatePDF';
import { sendToHubSpot } from './lib/hubspot';

interface SendReportRequest {
  email: string;
  name: string;
  organization?: string;
  phone?: string;
  scores: {
    strategicClarity: number;
    teamCapability: number;
    governanceReadiness: number;
    technicalInfrastructure: number;
    executiveAlignment: number;
    overall: number;
  };
  recommendations?: string[];
  readinessPhase?: string;
}

/**
 * Determine readiness phase based on overall score
 */
function getReadinessPhase(score: number): string {
  if (score >= 85) return 'Amplify';
  if (score >= 75) return 'Apply';
  if (score >= 65) return 'Accelerate';
  if (score >= 55) return 'Activate';
  if (score >= 45) return 'Align';
  if (score >= 35) return 'Assess';
  return 'Pre-Assess';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (setCorsHeaders(req, res)) {
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  // Check if this is a download request
  const isDownload = req.query.download === 'true';

  try {
    // Validate request body
    const requestData: SendReportRequest = req.body;

    if (!requestData.email || !requestData.name || !requestData.scores) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, name, and scores are required.',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requestData.email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format.',
      });
    }

    // Validate scores
    if (
      !requestData.scores.overall ||
      requestData.scores.overall < 0 ||
      requestData.scores.overall > 100
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid overall score. Must be between 0 and 100.',
      });
    }

    // Determine readiness phase if not provided
    const readinessPhase = requestData.readinessPhase || getReadinessPhase(requestData.scores.overall);

    console.log(`Processing report request for ${requestData.email}`);

    // Generate email HTML
    const htmlContent = generateEmailHTML({
      name: requestData.name,
      overallScore: requestData.scores.overall,
      readinessLevel: readinessPhase,
    });

    // Generate PDF report
    let pdfBase64: string | null = null;
    try {
      console.log('Generating PDF report...');
      pdfBase64 = generatePDF({
        name: requestData.name,
        organization: requestData.organization,
        email: requestData.email,
        assessmentDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        scores: requestData.scores,
        readinessPhase,
        recommendations: requestData.recommendations,
      });
      console.log('PDF generated successfully');
    } catch (pdfError: any) {
      console.error('PDF generation failed:', pdfError);
      // For download mode, this is a critical error
      if (isDownload) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate PDF',
          details: pdfError.message,
        });
      }
      // For email mode, continue without PDF - email will still be sent
    }

    // If download mode, return PDF as downloadable blob
    if (isDownload) {
      if (!pdfBase64) {
        return res.status(500).json({
          success: false,
          error: 'PDF generation failed',
        });
      }

      // Convert base64 to buffer
      const pdfBuffer = Buffer.from(pdfBase64, 'base64');

      // Set headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="AI-Readiness-Assessment-Report.pdf"');
      res.setHeader('Content-Length', pdfBuffer.length);

      return res.status(200).send(pdfBuffer);
    }

    // Send email via Microsoft Graph with PDF attachment
    try {
      const emailOptions: any = {
        to: {
          email: requestData.email,
          name: requestData.name,
        },
        subject: 'Your AI Readiness Assessment Results - SherpaTech.AI',
        htmlContent,
      };

      // Add PDF attachment if it was generated successfully
      if (pdfBase64) {
        emailOptions.attachments = [
          {
            name: 'AI-Readiness-Assessment-Report.pdf',
            contentType: 'application/pdf',
            contentBytes: pdfBase64,
          },
        ];
      }

      await sendEmail(emailOptions);

      console.log(`Email sent successfully to ${requestData.email}`);

      // Send lead data to HubSpot (async, don't wait for it)
      sendToHubSpot({
        email: requestData.email,
        name: requestData.name,
        organization: requestData.organization,
        phone: requestData.phone,
        scores: requestData.scores,
        readinessPhase,
      }).catch((hubspotError) => {
        // Already logged in sendToHubSpot, just prevent unhandled rejection
        console.error('HubSpot error (non-blocking):', hubspotError.message);
      });

      return res.status(200).json({
        success: true,
        message: 'Report sent successfully',
        email: requestData.email,
        pdfGenerated: !!pdfBase64,
      });
    } catch (emailError: any) {
      console.error('Email sending failed:', emailError);

      // Return error but don't crash
      return res.status(500).json({
        success: false,
        error: 'Failed to send email',
        details: emailError.message,
        // Still return the data so frontend can show results
        fallback: true,
      });
    }
  } catch (error: any) {
    console.error('Error in send-report endpoint:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
    });
  }
}
