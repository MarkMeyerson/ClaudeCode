import { jsPDF } from 'jspdf';

interface AssessmentData {
  name: string;
  organization?: string;
  email: string;
  assessmentDate: string;
  scores: {
    strategicClarity: number;
    teamCapability: number;
    governanceReadiness: number;
    technicalInfrastructure: number;
    executiveAlignment: number;
    overall: number;
  };
  readinessPhase: string;
  recommendations?: string[];
}

// Color scheme
const COLORS = {
  primaryDark: '#1e3a5f',
  primaryLight: '#2d5a87',
  accent: '#10b981',
  accentDark: '#059669',
  text: '#333333',
  textLight: '#666666',
  background: '#f8f9fa',
  white: '#ffffff',
};

// Phase colors
const PHASE_COLORS: { [key: string]: string } = {
  'Pre-Assess': '#ef4444',
  'Assess': '#f59e0b',
  'Align': '#eab308',
  'Activate': '#84cc16',
  'Accelerate': '#22c55e',
  'Apply': '#10b981',
  'Amplify': '#059669',
};

/**
 * Get dimension descriptions
 */
function getDimensionDescription(dimension: string): string {
  const descriptions: { [key: string]: string } = {
    strategicClarity: 'Clarity of AI vision, strategy, and identified use cases',
    teamCapability: 'Team skills, AI knowledge, and change management readiness',
    governanceReadiness: 'AI policies, ethics guidelines, and compliance frameworks',
    technicalInfrastructure: 'Data quality, system architecture, and technical readiness',
    executiveAlignment: 'Leadership support, resource commitment, and stakeholder buy-in',
  };
  return descriptions[dimension] || '';
}

/**
 * Get dimension name formatted
 */
function getDimensionName(dimension: string): string {
  const names: { [key: string]: string } = {
    strategicClarity: 'Strategic Clarity',
    teamCapability: 'Team Capability',
    governanceReadiness: 'Governance Readiness',
    technicalInfrastructure: 'Technical Infrastructure',
    executiveAlignment: 'Executive Alignment',
  };
  return names[dimension] || dimension;
}

/**
 * Get recommendations based on lowest scoring dimensions
 */
function getPersonalizedRecommendations(scores: AssessmentData['scores']): {
  strengths: string[];
  improvements: string[];
} {
  const dimensionScores = [
    { name: 'Strategic Clarity', key: 'strategicClarity', score: scores.strategicClarity },
    { name: 'Team Capability', key: 'teamCapability', score: scores.teamCapability },
    { name: 'Governance Readiness', key: 'governanceReadiness', score: scores.governanceReadiness },
    { name: 'Technical Infrastructure', key: 'technicalInfrastructure', score: scores.technicalInfrastructure },
    { name: 'Executive Alignment', key: 'executiveAlignment', score: scores.executiveAlignment },
  ];

  // Sort by score
  const sorted = [...dimensionScores].sort((a, b) => b.score - a.score);

  const strengths = sorted.slice(0, 2).map(d => d.name);
  const improvements = sorted.slice(-2).map(d => d.name);

  return { strengths, improvements };
}

/**
 * Generate PDF report
 */
export function generatePDF(data: AssessmentData): string {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  // Helper function to add footer
  const addFooter = (pageNum: number) => {
    doc.setFontSize(9);
    doc.setTextColor(COLORS.textLight);
    doc.text(
      `SherpaTech.AI • Guiding SMBs Through AI Transformation • Page ${pageNum}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  };

  // ============================================================
  // PAGE 1: Cover & Summary
  // ============================================================

  // Header gradient (simulated with rectangle)
  doc.setFillColor(30, 58, 95); // primaryDark
  doc.rect(0, 0, pageWidth, 60, 'F');

  // Logo/Title
  doc.setFontSize(32);
  doc.setTextColor(COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text('SherpaTech.AI', pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Your AI Transformation Partner', pageWidth / 2, 45, { align: 'center' });

  // Report title
  doc.setFontSize(24);
  doc.setTextColor(COLORS.primaryDark);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Readiness Assessment', pageWidth / 2, 80, { align: 'center' });
  doc.text('Report', pageWidth / 2, 95, { align: 'center' });

  // Recipient info
  doc.setFontSize(14);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'normal');
  doc.text(`Prepared for: ${data.name}`, pageWidth / 2, 115, { align: 'center' });
  if (data.organization) {
    doc.text(data.organization, pageWidth / 2, 125, { align: 'center' });
  }
  doc.setFontSize(11);
  doc.setTextColor(COLORS.textLight);
  doc.text(`Assessment Date: ${data.assessmentDate}`, pageWidth / 2, 135, { align: 'center' });

  // Overall score box
  const boxY = 155;
  const boxHeight = 60;
  doc.setFillColor(30, 58, 95);
  doc.roundedRect(margin, boxY, pageWidth - 2 * margin, boxHeight, 5, 5, 'F');

  doc.setFontSize(12);
  doc.setTextColor(COLORS.white);
  doc.text('YOUR OVERALL SCORE', pageWidth / 2, boxY + 15, { align: 'center' });

  doc.setFontSize(48);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.scores.overall}`, pageWidth / 2, boxY + 38, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('out of 100', pageWidth / 2, boxY + 50, { align: 'center' });

  // Readiness phase badge
  const phaseColor = PHASE_COLORS[data.readinessPhase] || COLORS.accent;
  const [r, g, b] = hexToRgb(phaseColor);
  doc.setFillColor(r, g, b);
  doc.roundedRect(margin + 30, boxY + boxHeight + 15, pageWidth - 2 * margin - 60, 15, 3, 3, 'F');

  doc.setFontSize(14);
  doc.setTextColor(COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text(data.readinessPhase, pageWidth / 2, boxY + boxHeight + 25, { align: 'center' });

  addFooter(1);

  // ============================================================
  // PAGE 2: Detailed Scores
  // ============================================================

  doc.addPage();

  // Page header
  doc.setFontSize(20);
  doc.setTextColor(COLORS.primaryDark);
  doc.setFont('helvetica', 'bold');
  doc.text('Dimension Breakdown', margin, 30);

  // Dimension scores
  const dimensions = [
    { key: 'strategicClarity', name: 'Strategic Clarity' },
    { key: 'teamCapability', name: 'Team Capability' },
    { key: 'governanceReadiness', name: 'Governance Readiness' },
    { key: 'technicalInfrastructure', name: 'Technical Infrastructure' },
    { key: 'executiveAlignment', name: 'Executive Alignment' },
  ];

  let yPos = 50;
  const barWidth = pageWidth - 2 * margin;
  const barHeight = 8;

  dimensions.forEach((dimension, index) => {
    const score = data.scores[dimension.key as keyof typeof data.scores] as number;
    const description = getDimensionDescription(dimension.key);

    // Dimension name and score
    doc.setFontSize(14);
    doc.setTextColor(COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.text(dimension.name, margin, yPos);

    doc.setFontSize(12);
    doc.setTextColor(COLORS.primaryDark);
    doc.text(`${score}/100`, pageWidth - margin, yPos, { align: 'right' });

    yPos += 8;

    // Progress bar background
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(margin, yPos, barWidth, barHeight, 2, 2, 'F');

    // Progress bar fill
    const fillWidth = (barWidth * score) / 100;
    const barColor = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
    const [r, g, b] = hexToRgb(barColor);
    doc.setFillColor(r, g, b);
    doc.roundedRect(margin, yPos, fillWidth, barHeight, 2, 2, 'F');

    yPos += 12;

    // Description
    doc.setFontSize(10);
    doc.setTextColor(COLORS.textLight);
    doc.setFont('helvetica', 'normal');
    doc.text(description, margin, yPos, { maxWidth: barWidth });

    yPos += 20;

    // Add extra space before next dimension
    if (index < dimensions.length - 1) {
      yPos += 5;
    }
  });

  addFooter(2);

  // ============================================================
  // PAGE 3: Recommendations & Next Steps
  // ============================================================

  doc.addPage();

  // Page header
  doc.setFontSize(20);
  doc.setTextColor(COLORS.primaryDark);
  doc.setFont('helvetica', 'bold');
  doc.text('Your Personalized Recommendations', margin, 30);

  yPos = 50;

  // Get recommendations
  const { strengths, improvements } = getPersonalizedRecommendations(data.scores);

  // Strengths section
  doc.setFontSize(16);
  doc.setTextColor(COLORS.accent);
  doc.setFont('helvetica', 'bold');
  doc.text('Your Strengths', margin, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'normal');

  strengths.forEach((strength) => {
    doc.text(`• ${strength}`, margin + 5, yPos);
    yPos += 7;
  });

  yPos += 10;

  // Areas for growth section
  doc.setFontSize(16);
  doc.setTextColor('#f59e0b');
  doc.setFont('helvetica', 'bold');
  doc.text('Areas for Growth', margin, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'normal');

  improvements.forEach((improvement) => {
    doc.text(`• ${improvement}`, margin + 5, yPos);
    yPos += 7;
  });

  yPos += 15;

  // Next steps based on phase
  doc.setFontSize(16);
  doc.setTextColor(COLORS.primaryDark);
  doc.setFont('helvetica', 'bold');
  doc.text('Recommended Next Steps', margin, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'normal');

  const nextSteps = getNextSteps(data.readinessPhase, data.scores.overall);
  nextSteps.forEach((step, index) => {
    const stepText = `${index + 1}. ${step}`;
    const lines = doc.splitTextToSize(stepText, pageWidth - 2 * margin - 10);
    lines.forEach((line: string) => {
      doc.text(line, margin + 5, yPos);
      yPos += 6;
    });
    yPos += 3;
  });

  addFooter(3);

  // ============================================================
  // PAGE 4: Call to Action
  // ============================================================

  doc.addPage();

  // Centered CTA
  yPos = 60;

  doc.setFontSize(24);
  doc.setTextColor(COLORS.primaryDark);
  doc.setFont('helvetica', 'bold');
  doc.text('Ready to Accelerate Your', pageWidth / 2, yPos, { align: 'center' });
  doc.text('AI Journey?', pageWidth / 2, yPos + 12, { align: 'center' });

  yPos += 35;

  doc.setFontSize(12);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'normal');
  const valueProposition = 'SherpaTech.AI partners with SMBs to turn AI potential into practical results. We guide you from strategy to implementation with expert advice tailored to your unique needs.';
  const vpLines = doc.splitTextToSize(valueProposition, pageWidth - 2 * margin - 20);
  vpLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, yPos, { align: 'center' });
    yPos += 7;
  });

  yPos += 20;

  // CTA Box
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(margin + 20, yPos, pageWidth - 2 * margin - 40, 35, 5, 5, 'F');

  doc.setFontSize(16);
  doc.setTextColor(COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text('Schedule a Free Consultation', pageWidth / 2, yPos + 22, { align: 'center' });

  yPos += 50;

  // Contact information
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primaryDark);
  doc.setFont('helvetica', 'bold');
  doc.text('Contact Us', pageWidth / 2, yPos, { align: 'center' });

  yPos += 12;

  doc.setFontSize(11);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'normal');
  doc.text('Email: info@sherpatech.ai', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  doc.text('Web: sherpatech.ai', pageWidth / 2, yPos, { align: 'center' });

  yPos += 20;

  // QR code placeholder (text-based)
  doc.setFillColor(240, 240, 240);
  doc.rect(pageWidth / 2 - 25, yPos, 50, 50, 'F');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.textLight);
  doc.text('Scan to book', pageWidth / 2, yPos + 55, { align: 'center' });
  doc.text('your consultation', pageWidth / 2, yPos + 61, { align: 'center' });

  addFooter(4);

  // Convert to base64
  const pdfBase64 = doc.output('datauristring').split(',')[1];
  return pdfBase64;
}

/**
 * Helper function to convert hex color to RGB
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

/**
 * Get next steps based on readiness phase
 */
function getNextSteps(phase: string, score: number): string[] {
  if (score >= 75) {
    return [
      'Scale your AI initiatives across the organization',
      'Establish centers of excellence for AI',
      'Develop advanced use cases and innovations',
      'Share best practices and lessons learned',
    ];
  } else if (score >= 55) {
    return [
      'Launch pilot AI projects in identified use cases',
      'Build or acquire necessary technical capabilities',
      'Establish measurement and monitoring systems',
      'Create feedback loops for continuous improvement',
    ];
  } else if (score >= 35) {
    return [
      'Define clear AI vision and strategic goals',
      'Identify high-value use cases for AI',
      'Develop governance frameworks and policies',
      'Assess and plan for necessary infrastructure upgrades',
      'Build stakeholder alignment and secure resources',
    ];
  } else {
    return [
      'Build awareness of AI opportunities and risks',
      'Educate leadership team on AI fundamentals',
      'Assess current state of data and infrastructure',
      'Identify quick wins to build momentum',
      'Create a preliminary AI roadmap',
    ];
  }
}
