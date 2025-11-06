import nodemailer from 'nodemailer';
import { AssessmentScore } from './scoring';

export interface EmailConfig {
  to: string;
  contactName: string;
  companyName: string;
  assessmentScore: AssessmentScore;
  reportUrl?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';

    if (emailProvider === 'smtp') {
      // SMTP configuration (for SendGrid, Gmail, etc.)
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
    } else {
      console.warn('⚠️  Email not configured. Email sending will be disabled.');
    }
  }

  isConfigured(): boolean {
    return !!this.transporter;
  }

  async sendAssessmentReport(config: EmailConfig): Promise<boolean> {
    if (!this.isConfigured() || !this.transporter) {
      console.log('Email not configured, skipping email send');
      return false;
    }

    try {
      const { to, contactName, companyName, assessmentScore } = config;

      const htmlContent = this.generateEmailHTML(contactName, companyName, assessmentScore);

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"SherpaTech.AI" <hello@sherpatech.ai>',
        to,
        subject: `Your AI Readiness Assessment Results - ${companyName}`,
        html: htmlContent,
        text: this.generateEmailText(contactName, companyName, assessmentScore)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      return true;

    } catch (error: any) {
      console.error('❌ Error sending email:', error);
      return false;
    }
  }

  private generateEmailHTML(contactName: string, companyName: string, score: AssessmentScore): string {
    const { totalScore, readinessPhase, phaseDescription, dimensionScores, recommendations } = score;

    const dimensionRows = dimensionScores.map(ds => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${this.formatDimensionName(ds.dimension)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: 600;">${ds.score}/20</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <div style="background: #e5e7eb; border-radius: 9999px; height: 8px; overflow: hidden;">
            <div style="background: #3b82f6; height: 100%; width: ${ds.percentage}%;"></div>
          </div>
        </td>
      </tr>
    `).join('');

    const recommendationItems = recommendations.map(rec => `
      <li style="margin-bottom: 8px; color: #4b5563;">${rec}</li>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your AI Readiness Assessment Results</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">SherpaTech.AI</h1>
      <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">AI Readiness Assessment Results</p>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px;">
      <!-- Greeting -->
      <p style="font-size: 16px; color: #1f2937; margin: 0 0 24px 0;">Hi ${contactName},</p>

      <p style="font-size: 16px; color: #4b5563; margin: 0 0 24px 0;">
        Thank you for completing the AI Readiness Assessment for <strong>${companyName}</strong>.
        Here are your personalized results:
      </p>

      <!-- Score Card -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center;">
        <div style="color: #ffffff; font-size: 18px; margin-bottom: 8px; opacity: 0.9;">Your AI Readiness Score</div>
        <div style="color: #ffffff; font-size: 56px; font-weight: 700; margin: 8px 0;">${totalScore}/100</div>
        <div style="color: #e0e7ff; font-size: 20px; font-weight: 600; margin-top: 8px;">${readinessPhase}</div>
      </div>

      <!-- Phase Description -->
      <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 16px; margin-bottom: 32px; border-radius: 4px;">
        <p style="margin: 0; color: #4b5563; font-size: 15px;">${phaseDescription}</p>
      </div>

      <!-- Dimension Scores -->
      <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 16px 0;">Dimension Breakdown</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600; font-size: 14px;">Dimension</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600; font-size: 14px;">Score</th>
            <th style="padding: 12px; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600; font-size: 14px;">Progress</th>
          </tr>
        </thead>
        <tbody>
          ${dimensionRows}
        </tbody>
      </table>

      <!-- Recommendations -->
      <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 16px 0;">Recommended Next Steps</h2>
      <ul style="padding-left: 24px; margin: 0 0 32px 0;">
        ${recommendationItems}
      </ul>

      <!-- CTA -->
      <div style="background: #f9fafb; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 32px;">
        <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 12px 0;">Ready to Begin Your AI Journey?</h3>
        <p style="color: #6b7280; font-size: 15px; margin: 0 0 20px 0;">
          Let's discuss how SherpaTech.AI can help you achieve your AI transformation goals.
        </p>
        <a href="https://sherpatech.ai/contact" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">Schedule a Consultation</a>
      </div>

      <!-- Footer Message -->
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        Best regards,<br>
        <strong>The SherpaTech.AI Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
        SherpaTech.AI - Your AI Transformation Partner
      </p>
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
        © ${new Date().getFullYear()} SherpaTech.AI. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private generateEmailText(contactName: string, companyName: string, score: AssessmentScore): string {
    const { totalScore, readinessPhase, phaseDescription, dimensionScores, recommendations } = score;

    let text = `Hi ${contactName},\n\n`;
    text += `Thank you for completing the AI Readiness Assessment for ${companyName}.\n\n`;
    text += `YOUR AI READINESS SCORE: ${totalScore}/100\n`;
    text += `READINESS PHASE: ${readinessPhase}\n\n`;
    text += `${phaseDescription}\n\n`;
    text += `DIMENSION BREAKDOWN:\n`;
    dimensionScores.forEach(ds => {
      text += `- ${this.formatDimensionName(ds.dimension)}: ${ds.score}/20 (${ds.percentage}%)\n`;
    });
    text += `\nRECOMMENDED NEXT STEPS:\n`;
    recommendations.forEach(rec => {
      text += `- ${rec}\n`;
    });
    text += `\nReady to begin your AI journey? Let's discuss how SherpaTech.AI can help.\n`;
    text += `Schedule a consultation: https://sherpatech.ai/contact\n\n`;
    text += `Best regards,\nThe SherpaTech.AI Team\n`;

    return text;
  }

  private formatDimensionName(dimension: string): string {
    return dimension
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

export default new EmailService();
