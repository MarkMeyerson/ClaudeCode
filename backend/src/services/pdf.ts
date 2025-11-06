import PDFDocument from 'pdfkit';
import { AssessmentScore, getDetailedRecommendations } from './scoring';
import fs from 'fs';
import path from 'path';

export interface PDFConfig {
  companyName: string;
  contactName: string;
  assessmentScore: AssessmentScore;
  assessmentId: string;
}

export class PDFService {
  async generateReport(config: PDFConfig): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const { companyName, contactName, assessmentScore } = config;
        const { totalScore, readinessPhase, phaseDescription, dimensionScores, recommendations } = assessmentScore;
        const detailedRecs = getDetailedRecommendations(assessmentScore);

        // Create PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        // Buffer to store PDF
        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Colors
        const primaryColor = '#667eea';
        const secondaryColor = '#764ba2';
        const textColor = '#1f2937';
        const lightGray = '#f3f4f6';

        // Page 1: Cover Page
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#667eea');

        doc.fontSize(48)
          .fillColor('#ffffff')
          .font('Helvetica-Bold')
          .text('AI Readiness', 50, 200, { align: 'center' });

        doc.fontSize(48)
          .text('Assessment Report', 50, 260, { align: 'center' });

        doc.fontSize(20)
          .fillColor('#e0e7ff')
          .font('Helvetica')
          .text(companyName, 50, 380, { align: 'center' });

        doc.fontSize(14)
          .text(`Prepared for: ${contactName}`, 50, 420, { align: 'center' });

        doc.fontSize(12)
          .text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 50, 450, { align: 'center' });

        doc.fontSize(16)
          .fillColor('#ffffff')
          .font('Helvetica-Bold')
          .text('SherpaTech.AI', 50, 700, { align: 'center' });

        // Page 2: Executive Summary
        doc.addPage();

        doc.fontSize(24)
          .fillColor(primaryColor)
          .font('Helvetica-Bold')
          .text('Executive Summary', 50, 50);

        doc.fontSize(12)
          .fillColor(textColor)
          .font('Helvetica')
          .text(`This report presents the AI readiness assessment results for ${companyName}. The assessment evaluates your organization across five critical dimensions to determine your current state and provide actionable recommendations for your AI transformation journey.`, 50, 95, { width: 495, align: 'justify' });

        // Score Box
        const boxY = 160;
        doc.roundedRect(50, boxY, 495, 120, 10)
          .fillAndStroke('#667eea', '#667eea');

        doc.fontSize(16)
          .fillColor('#ffffff')
          .font('Helvetica')
          .text('Your AI Readiness Score', 50, boxY + 20, { width: 495, align: 'center' });

        doc.fontSize(60)
          .font('Helvetica-Bold')
          .text(`${totalScore}`, 50, boxY + 45, { width: 495, align: 'center' });

        doc.fontSize(14)
          .text('out of 100', 50, boxY + 110, { width: 495, align: 'center' });

        // Phase Badge
        const phaseY = boxY + 150;
        doc.roundedRect(150, phaseY, 295, 50, 25)
          .fill('#10b981');

        doc.fontSize(20)
          .fillColor('#ffffff')
          .font('Helvetica-Bold')
          .text(readinessPhase, 150, phaseY + 15, { width: 295, align: 'center' });

        // Phase Description
        doc.fontSize(11)
          .fillColor(textColor)
          .font('Helvetica')
          .text(phaseDescription, 50, phaseY + 80, { width: 495, align: 'justify' });

        // Priority Box
        const priorityY = phaseY + 150;
        doc.fontSize(14)
          .fillColor(primaryColor)
          .font('Helvetica-Bold')
          .text('Priority Level:', 50, priorityY);

        doc.fontSize(12)
          .fillColor(textColor)
          .font('Helvetica')
          .text(detailedRecs.priority, 50, priorityY + 25, { width: 495 });

        // Page 3: Dimension Scores
        doc.addPage();

        doc.fontSize(24)
          .fillColor(primaryColor)
          .font('Helvetica-Bold')
          .text('Dimension Breakdown', 50, 50);

        doc.fontSize(11)
          .fillColor(textColor)
          .font('Helvetica')
          .text('Your organization was assessed across five key dimensions. Each dimension represents a critical aspect of AI readiness and is scored out of 20 points.', 50, 95, { width: 495, align: 'justify' });

        let currentY = 140;
        dimensionScores.forEach((dim, index) => {
          if (currentY > 650) {
            doc.addPage();
            currentY = 50;
          }

          const dimName = this.formatDimensionName(dim.dimension);

          // Dimension name
          doc.fontSize(14)
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text(dimName, 50, currentY);

          currentY += 25;

          // Score
          doc.fontSize(11)
            .fillColor(textColor)
            .font('Helvetica')
            .text(`Score: ${dim.score}/20 (${dim.percentage}%)`, 50, currentY);

          currentY += 20;

          // Progress bar
          const barWidth = 400;
          const barHeight = 15;

          // Background
          doc.roundedRect(50, currentY, barWidth, barHeight, 7)
            .fill('#e5e7eb');

          // Fill
          const fillWidth = (dim.score / dim.maxScore) * barWidth;
          doc.roundedRect(50, currentY, fillWidth, barHeight, 7)
            .fill(primaryColor);

          currentY += 35;

          // Rating label
          let rating = 'Needs Attention';
          if (dim.percentage >= 80) rating = 'Excellent';
          else if (dim.percentage >= 60) rating = 'Good';
          else if (dim.percentage >= 40) rating = 'Fair';

          doc.fontSize(10)
            .fillColor('#6b7280')
            .font('Helvetica-Oblique')
            .text(rating, 50, currentY);

          currentY += 30;
        });

        // Page 4: Recommendations
        doc.addPage();

        doc.fontSize(24)
          .fillColor(primaryColor)
          .font('Helvetica-Bold')
          .text('Recommended Next Steps', 50, 50);

        doc.fontSize(11)
          .fillColor(textColor)
          .font('Helvetica')
          .text('Based on your assessment results, we recommend the following strategic initiatives to advance your AI readiness:', 50, 95, { width: 495, align: 'justify' });

        currentY = 130;

        recommendations.forEach((rec, index) => {
          if (currentY > 680) {
            doc.addPage();
            currentY = 50;
          }

          // Number circle
          doc.circle(60, currentY + 8, 12)
            .fill(primaryColor);

          doc.fontSize(10)
            .fillColor('#ffffff')
            .font('Helvetica-Bold')
            .text(`${index + 1}`, 55, currentY + 4);

          // Recommendation text
          doc.fontSize(11)
            .fillColor(textColor)
            .font('Helvetica')
            .text(rec, 85, currentY, { width: 460, align: 'left' });

          currentY += 40;
        });

        // Detailed recommendations
        if (detailedRecs.recommendations.length > 0) {
          currentY += 20;
          if (currentY > 650) {
            doc.addPage();
            currentY = 50;
          }

          doc.fontSize(16)
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text('Focus Areas', 50, currentY);

          currentY += 30;

          detailedRecs.recommendations.forEach((rec) => {
            if (currentY > 680) {
              doc.addPage();
              currentY = 50;
            }

            doc.fontSize(12)
              .fillColor(primaryColor)
              .font('Helvetica-Bold')
              .text(`${rec.area}:`, 50, currentY);

            currentY += 18;

            doc.fontSize(10)
              .fillColor(textColor)
              .font('Helvetica')
              .text(rec.suggestion, 50, currentY, { width: 495 });

            currentY += 35;
          });
        }

        // Final Page: Call to Action
        doc.addPage();

        doc.fontSize(24)
          .fillColor(primaryColor)
          .font('Helvetica-Bold')
          .text('Ready to Begin Your', 50, 200, { align: 'center' });

        doc.fontSize(24)
          .text('AI Transformation?', 50, 235, { align: 'center' });

        doc.fontSize(12)
          .fillColor(textColor)
          .font('Helvetica')
          .text('SherpaTech.AI is here to guide you through every step of your AI journey. Our team of experts will help you transform your organization with confidence.', 50, 300, { width: 495, align: 'center' });

        // Contact box
        const ctaY = 380;
        doc.roundedRect(100, ctaY, 395, 120, 10)
          .fillAndStroke(lightGray, lightGray);

        doc.fontSize(14)
          .fillColor(primaryColor)
          .font('Helvetica-Bold')
          .text('Next Steps:', 120, ctaY + 20);

        doc.fontSize(11)
          .fillColor(textColor)
          .font('Helvetica')
          .text('Schedule a consultation with our team to discuss your', 120, ctaY + 45, { width: 355 });

        doc.text('assessment results and create a customized AI roadmap.', 120, ctaY + 62, { width: 355 });

        doc.fontSize(12)
          .fillColor(primaryColor)
          .font('Helvetica-Bold')
          .text('Visit: sherpatech.ai/contact', 120, ctaY + 90, { width: 355, align: 'center' });

        // Footer
        doc.fontSize(10)
          .fillColor('#6b7280')
          .font('Helvetica')
          .text('© 2024 SherpaTech.AI - Your AI Transformation Partner', 50, 700, { width: 495, align: 'center' });

        // Finalize PDF
        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  async saveReport(config: PDFConfig, outputPath: string): Promise<string> {
    try {
      const pdfBuffer = await this.generateReport(config);

      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(outputPath, pdfBuffer);
      console.log('✅ PDF report saved:', outputPath);

      return outputPath;
    } catch (error) {
      console.error('❌ Error saving PDF report:', error);
      throw error;
    }
  }

  private formatDimensionName(dimension: string): string {
    return dimension
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

export default new PDFService();
