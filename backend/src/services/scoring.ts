export interface DimensionScore {
  dimension: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface AssessmentScore {
  dimensionScores: DimensionScore[];
  totalScore: number;
  maxTotalScore: number;
  percentage: number;
  readinessPhase: string;
  phaseDescription: string;
  recommendations: string[];
}

export interface PhaseInfo {
  name: string;
  range: { min: number; max: number };
  description: string;
  keyFocus: string[];
  recommendations: string[];
}

// 6A Phase mapping based on total score
export const phases: PhaseInfo[] = [
  {
    name: 'Pre-Assess',
    range: { min: 0, max: 15 },
    description: 'Your organization is in the very early stages of AI consideration. Focus on building awareness and exploring possibilities.',
    keyFocus: [
      'Build awareness of AI capabilities and potential',
      'Educate leadership and key stakeholders',
      'Identify quick wins and low-hanging fruit'
    ],
    recommendations: [
      'AI Awareness Workshop - Educate your team on AI fundamentals and opportunities',
      'Strategic Discovery Session - Identify potential AI use cases for your business',
      'Executive Briefing - Present AI business case to leadership'
    ]
  },
  {
    name: 'Assess',
    range: { min: 15, max: 30 },
    description: 'Your organization is beginning to explore AI but lacks clarity and readiness. Focus on assessment and planning.',
    keyFocus: [
      'Conduct thorough assessment of current capabilities',
      'Identify gaps in strategy, skills, and infrastructure',
      'Develop preliminary AI roadmap'
    ],
    recommendations: [
      'Comprehensive AI Readiness Assessment - Deep dive into your organization\'s capabilities',
      'AI Strategy Workshop - Develop a clear AI vision and roadmap',
      'Skills Gap Analysis - Identify training and hiring needs'
    ]
  },
  {
    name: 'Align',
    range: { min: 30, max: 45 },
    description: 'Your organization has some AI awareness but needs alignment across strategy, governance, and resources.',
    keyFocus: [
      'Align stakeholders on AI vision and goals',
      'Establish governance frameworks',
      'Secure budget and resources'
    ],
    recommendations: [
      'AI Strategy Development - Create comprehensive AI strategy document',
      'Governance Framework Setup - Establish AI policies, ethics, and compliance',
      'Stakeholder Alignment Workshop - Build consensus and commitment',
      'Budget and Resource Planning - Define investment requirements'
    ]
  },
  {
    name: 'Activate',
    range: { min: 45, max: 60 },
    description: 'Your organization is ready to begin implementing AI projects. Focus on pilot projects and capability building.',
    keyFocus: [
      'Launch pilot AI projects',
      'Build or acquire necessary technical capabilities',
      'Establish measurement and monitoring systems'
    ],
    recommendations: [
      'AI Pilot Project Implementation - Deploy first AI use cases',
      'Team Capability Development - Training and upskilling programs',
      'Technical Infrastructure Setup - Deploy necessary AI tools and platforms',
      'Change Management Program - Prepare organization for AI adoption'
    ]
  },
  {
    name: 'Accelerate',
    range: { min: 60, max: 75 },
    description: 'Your organization has active AI projects and is ready to scale. Focus on expanding AI adoption and optimizing results.',
    keyFocus: [
      'Scale successful AI initiatives',
      'Optimize and improve existing AI implementations',
      'Expand AI across more business functions'
    ],
    recommendations: [
      'AI Scaling Program - Expand successful pilots across organization',
      'Advanced AI Use Cases - Implement more sophisticated AI applications',
      'Performance Optimization - Enhance existing AI implementations',
      'Center of Excellence Setup - Establish AI CoE for ongoing support'
    ]
  },
  {
    name: 'Apply',
    range: { min: 75, max: 85 },
    description: 'Your organization has mature AI capabilities and is applying AI across multiple areas. Focus on refinement and integration.',
    keyFocus: [
      'Integrate AI across business processes',
      'Refine and optimize AI operations',
      'Build sustainable AI practices'
    ],
    recommendations: [
      'Enterprise AI Integration - Embed AI into core business processes',
      'AI Operations Optimization - Streamline and automate AI workflows',
      'Advanced Analytics Implementation - Deploy sophisticated AI analytics',
      'Innovation Lab - Explore cutting-edge AI technologies'
    ]
  },
  {
    name: 'Amplify',
    range: { min: 85, max: 100 },
    description: 'Your organization is an AI leader with advanced capabilities. Focus on innovation and competitive advantage.',
    keyFocus: [
      'Drive innovation with AI',
      'Create competitive differentiation',
      'Share expertise and lead in your industry'
    ],
    recommendations: [
      'Strategic AI Innovation - Develop proprietary AI capabilities',
      'Industry Leadership Program - Position as AI thought leader',
      'AI Ecosystem Development - Build partner and vendor networks',
      'Continuous Innovation - Explore emerging AI technologies and trends'
    ]
  }
];

export const getPhaseByScore = (totalScore: number): PhaseInfo => {
  const phase = phases.find(p => totalScore >= p.range.min && totalScore < p.range.max);
  return phase || phases[phases.length - 1]; // Default to last phase if score is 100
};

export const calculateDimensionScore = (
  responses: { questionId: string; value: number }[],
  dimension: string
): DimensionScore => {
  const dimensionResponses = responses.filter(r => r.questionId.startsWith(dimension.substring(0, 2).toLowerCase()));
  const score = dimensionResponses.reduce((sum, r) => sum + r.value, 0);
  const maxScore = 20; // Each dimension is worth 20 points

  return {
    dimension,
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100)
  };
};

export const calculateAssessmentScore = (
  responses: Array<{ questionId: string; value: number; dimension: string }>
): AssessmentScore => {
  // Calculate scores for each dimension
  const dimensions = [
    'strategic_clarity',
    'governance_readiness',
    'team_capability',
    'technical_infrastructure',
    'executive_alignment'
  ];

  const dimensionScores: DimensionScore[] = dimensions.map(dimension => {
    const dimensionResponses = responses.filter(r => r.dimension === dimension);
    const score = dimensionResponses.reduce((sum, r) => sum + r.value, 0);
    const maxScore = 20;

    return {
      dimension,
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100)
    };
  });

  // Calculate total score
  const totalScore = dimensionScores.reduce((sum, ds) => sum + ds.score, 0);
  const maxTotalScore = 100;
  const percentage = Math.round((totalScore / maxTotalScore) * 100);

  // Determine readiness phase
  const phase = getPhaseByScore(totalScore);

  return {
    dimensionScores,
    totalScore,
    maxTotalScore,
    percentage,
    readinessPhase: phase.name,
    phaseDescription: phase.description,
    recommendations: phase.recommendations
  };
};

export const getDetailedRecommendations = (
  assessmentScore: AssessmentScore
): { priority: string; recommendations: Array<{ area: string; suggestion: string }> } => {
  const { dimensionScores, readinessPhase } = assessmentScore;

  // Find weakest dimensions (below 50%)
  const weakDimensions = dimensionScores
    .filter(ds => ds.percentage < 50)
    .sort((a, b) => a.percentage - b.percentage);

  const recommendations: Array<{ area: string; suggestion: string }> = [];

  // Add dimension-specific recommendations
  weakDimensions.forEach(dim => {
    switch (dim.dimension) {
      case 'strategic_clarity':
        recommendations.push({
          area: 'Strategic Clarity',
          suggestion: 'Develop a clear AI strategy document with specific use cases and measurable outcomes'
        });
        break;
      case 'governance_readiness':
        recommendations.push({
          area: 'Governance & Compliance',
          suggestion: 'Establish AI governance framework including data policies, ethics guidelines, and budget allocation'
        });
        break;
      case 'team_capability':
        recommendations.push({
          area: 'Team Capability',
          suggestion: 'Invest in team training and consider hiring or partnering for AI expertise'
        });
        break;
      case 'technical_infrastructure':
        recommendations.push({
          area: 'Technical Infrastructure',
          suggestion: 'Modernize infrastructure and consolidate data systems to support AI implementations'
        });
        break;
      case 'executive_alignment':
        recommendations.push({
          area: 'Executive Alignment',
          suggestion: 'Secure executive sponsorship and align stakeholders on AI vision and investment'
        });
        break;
    }
  });

  // Determine priority level
  let priority = 'Medium';
  if (assessmentScore.totalScore < 30) {
    priority = 'High - Immediate Action Needed';
  } else if (assessmentScore.totalScore < 60) {
    priority = 'Medium - Strategic Planning Required';
  } else {
    priority = 'Low - Optimization and Scaling';
  }

  return { priority, recommendations };
};
