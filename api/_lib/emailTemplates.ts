/**
 * Generate professional HTML email for AI Assessment results
 */
export function generateEmailHTML(data: {
  name: string;
  overallScore: number;
  readinessLevel: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your AI Readiness Assessment Results</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">

  <!-- Container -->
  <div style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); border-bottom: 4px solid #10b981;">
      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">SherpaTech.AI</h1>
      <p style="color: #e0e7ee; margin: 8px 0 0 0; font-size: 14px; letter-spacing: 0.5px;">Your AI Transformation Partner</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #1e3a5f; margin: 0 0 20px 0; font-size: 24px;">Hi ${data.name},</h2>

      <p style="margin: 0 0 20px 0; font-size: 16px; color: #555;">Thank you for completing the <strong>AI Readiness Assessment</strong>! Your personalized report is attached to this email.</p>

      <!-- Score Card -->
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; box-shadow: 0 4px 15px rgba(30, 58, 95, 0.3);">
        <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Your Overall Score</p>
        <p style="font-size: 56px; font-weight: bold; margin: 0; line-height: 1;">${data.overallScore}</p>
        <p style="font-size: 20px; margin: 5px 0 0 0; opacity: 0.8;">out of 100</p>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
          <p style="margin: 0; font-size: 22px; font-weight: 600; color: #10b981;">${data.readinessLevel}</p>
        </div>
      </div>

      <!-- What's Inside -->
      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px; margin: 30px 0; border-left: 4px solid #1e3a5f;">
        <h3 style="color: #1e3a5f; margin: 0 0 15px 0; font-size: 18px;">📊 Your Detailed Report Includes:</h3>
        <ul style="color: #555; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li style="margin-bottom: 8px;"><strong>5 Dimension Breakdown</strong> - Strategic Clarity, Team Capability, Governance, Infrastructure, and Executive Alignment</li>
          <li style="margin-bottom: 8px;"><strong>Your Key Strengths</strong> - Areas where you excel</li>
          <li style="margin-bottom: 8px;"><strong>Personalized Recommendations</strong> - Actionable steps for improvement</li>
          <li><strong>Next Steps</strong> - Your roadmap for AI transformation</li>
        </ul>
      </div>

      <!-- CTA Box -->
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
        <h3 style="color: #ffffff; margin: 0 0 15px 0; font-size: 22px; font-weight: 700;">Ready to Take the Next Step?</h3>
        <p style="color: #ffffff; margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; opacity: 0.95;">Schedule a <strong>free 30-minute consultation</strong> to discuss your results and create an actionable AI roadmap for your organization.</p>
        <a href="https://sherpatech.ai/contact" style="display: inline-block; background: #ffffff; color: #10b981; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: all 0.3s;">Schedule Free Consultation →</a>
      </div>

      <!-- Tips Section -->
      <div style="background-color: #fff8e1; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
          <strong>💡 Pro Tip:</strong> Review your attached PDF report carefully. It contains detailed insights about each dimension and specific recommendations tailored to your organization's readiness level.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; border-top: 1px solid #e5e7eb; padding: 30px; text-align: center;">
      <div style="margin-bottom: 20px;">
        <h4 style="color: #1e3a5f; margin: 0 0 10px 0; font-size: 18px;">SherpaTech.AI</h4>
        <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">Guiding SMBs Through AI Transformation</p>
      </div>

      <div style="margin: 20px 0;">
        <a href="https://sherpatech.ai" style="color: #1e3a5f; text-decoration: none; margin: 0 10px; font-size: 14px;">🌐 sherpatech.ai</a>
        <span style="color: #ccc;">|</span>
        <a href="mailto:info@sherpatech.ai" style="color: #1e3a5f; text-decoration: none; margin: 0 10px; font-size: 14px;">✉️ info@sherpatech.ai</a>
      </div>

      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.5;">
          You received this email because you completed the AI Readiness Assessment at SherpaTech.AI.<br>
          © ${new Date().getFullYear()} SherpaTech.AI. All rights reserved.
        </p>
      </div>
    </div>

  </div>

</body>
</html>
  `.trim();
}

/**
 * Generate simple plain text version of the email for fallback
 */
export function generateEmailPlainText(data: {
  name: string;
  overallScore: number;
  readinessLevel: string;
}): string {
  return `
Hi ${data.name},

Thank you for completing the AI Readiness Assessment!

YOUR OVERALL SCORE: ${data.overallScore}/100
READINESS LEVEL: ${data.readinessLevel}

Your personalized report is attached to this email as a PDF.

Your detailed report includes:
- Breakdown of all 5 assessment dimensions
- Your key strengths
- Personalized recommendations for improvement
- Next steps for your AI journey

READY TO TAKE THE NEXT STEP?

Schedule a free 30-minute consultation to discuss your results and create an actionable AI roadmap for your organization.

Visit: https://sherpatech.ai/contact

---
SherpaTech.AI
Guiding SMBs Through AI Transformation

Website: https://sherpatech.ai
Email: info@sherpatech.ai

© ${new Date().getFullYear()} SherpaTech.AI. All rights reserved.
  `.trim();
}
