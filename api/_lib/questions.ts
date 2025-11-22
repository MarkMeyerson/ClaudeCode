export interface Question {
  id: string;
  text: string;
  dimension: string;
  type: 'scale' | 'multipleChoice' | 'yesNo';
  options?: { value: number; label: string }[];
  maxScore: number;
}

export interface Dimension {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  questions: Question[];
}

export const assessmentDimensions: Dimension[] = [
  {
    id: 'strategic_clarity',
    name: 'Strategic Clarity',
    description: 'Measures your organization\'s clarity on AI strategy and vision',
    maxScore: 20,
    questions: [
      {
        id: 'sc_1',
        text: 'Do you have a documented AI strategy or vision?',
        dimension: 'strategic_clarity',
        type: 'multipleChoice',
        options: [
          { value: 0, label: 'No, we haven\'t discussed AI strategy yet' },
          { value: 2, label: 'We\'ve had informal discussions but nothing documented' },
          { value: 4, label: 'We have a draft strategy being developed' },
          { value: 5, label: 'Yes, we have a fully documented AI strategy' }
        ],
        maxScore: 5
      },
      {
        id: 'sc_2',
        text: 'Can you name 3 specific AI use cases for your business?',
        dimension: 'strategic_clarity',
        type: 'multipleChoice',
        options: [
          { value: 0, label: 'No, we don\'t have specific use cases identified' },
          { value: 2, label: 'We have 1-2 potential use cases in mind' },
          { value: 4, label: 'We have 3-5 specific use cases identified' },
          { value: 5, label: 'Yes, we have 5+ well-defined use cases with business cases' }
        ],
        maxScore: 5
      },
      {
        id: 'sc_3',
        text: 'Who owns AI decisions in your organization?',
        dimension: 'strategic_clarity',
        type: 'multipleChoice',
        options: [
          { value: 0, label: 'Nobody specifically owns AI initiatives' },
          { value: 2, label: 'Various people contribute but no clear owner' },
          { value: 4, label: 'We have a designated person but not their primary role' },
          { value: 5, label: 'We have a dedicated AI leader/champion' }
        ],
        maxScore: 5
      },
      {
        id: 'sc_4',
        text: 'Have you identified measurable outcomes you want from AI?',
        dimension: 'strategic_clarity',
        type: 'multipleChoice',
        options: [
          { value: 0, label: 'No specific outcomes identified yet' },
          { value: 2, label: 'We have general goals but not measurable' },
          { value: 4, label: 'We have some measurable KPIs defined' },
          { value: 5, label: 'Yes, we have clear, measurable KPIs and success metrics' }
        ],
        maxScore: 5
      }
    ]
  },
  {
    id: 'governance_readiness',
    name: 'Governance Readiness',
    description: 'Assesses your organization\'s governance, compliance, and risk management for AI',
    maxScore: 20,
    questions: [
      {
        id: 'gr_1',
        text: 'Have you considered compliance/regulatory requirements for AI?',
        dimension: 'governance_readiness',
        type: 'yesNo',
        options: [
          { value: 0, label: 'No' },
          { value: 5, label: 'Yes' }
        ],
        maxScore: 5
      },
      {
        id: 'gr_2',
        text: 'Do you have data governance or security policies?',
        dimension: 'governance_readiness',
        type: 'multipleChoice',
        options: [
          { value: 0, label: 'No policies in place' },
          { value: 2, label: 'Basic policies but not comprehensive' },
          { value: 4, label: 'Comprehensive policies but not AI-specific' },
          { value: 5, label: 'Comprehensive policies including AI considerations' }
        ],
        maxScore: 5
      },
      {
        id: 'gr_3',
        text: 'Have you discussed AI ethics or bias with your team?',
        dimension: 'governance_readiness',
        type: 'yesNo',
        options: [
          { value: 0, label: 'No' },
          { value: 5, label: 'Yes' }
        ],
        maxScore: 5
      },
      {
        id: 'gr_4',
        text: 'Do you have budget allocated for AI initiatives?',
        dimension: 'governance_readiness',
        type: 'multipleChoice',
        options: [
          { value: 0, label: 'No budget allocated' },
          { value: 2, label: 'Budget under consideration' },
          { value: 4, label: 'Budget allocated for pilot projects' },
          { value: 5, label: 'Dedicated AI budget with clear allocation' }
        ],
        maxScore: 5
      }
    ]
  },
  {
    id: 'team_capability',
    name: 'Team Capability',
    description: 'Evaluates your team\'s skills, readiness, and capacity for AI adoption',
    maxScore: 20,
    questions: [
      {
        id: 'tc_1',
        text: 'Does your team have data/tech skills?',
        dimension: 'team_capability',
        type: 'multipleChoice',
        options: [
          { value: 0, label: 'Limited or no technical skills' },
          { value: 2, label: 'Basic technical skills, need significant training' },
          { value: 4, label: 'Moderate technical skills, some training needed' },
          { value: 5, label: 'Strong technical skills, ready for AI projects' }
        ],
        maxScore: 5
      },
      {
        id: 'tc_2',
        text: 'Are people open to learning new tools?',
        dimension: 'team_capability',
        type: 'multipleChoice',
        options: [
          { value: 0, label: 'Resistant to change' },
          { value: 2, label: 'Somewhat hesitant but willing' },
          { value: 4, label: 'Generally open to new tools' },
          { value: 5, label: 'Very enthusiastic about learning and innovation' }
        ],
        maxScore: 5
      },
      {
        id: 'tc_3',
        text: 'Do you have a dedicated person for AI projects?',
        dimension: 'team_capability',
        type: 'multipleChoice',
        options: [
          { value: 0, label: 'No dedicated resources' },
          { value: 2, label: 'Someone part-time or when available' },
          { value: 4, label: 'One dedicated person' },
          { value: 5, label: 'Dedicated team for AI initiatives' }
        ],
        maxScore: 5
      },
      {
        id: 'tc_4',
        text: 'Have you done change management for tech before?',
        dimension: 'team_capability',
        type: 'multipleChoice',
        options: [
          { value: 0, label: 'No experience with tech change management' },
          { value: 2, label: 'Limited experience, faced challenges' },
          { value: 4, label: 'Some successful tech implementations' },
          { value: 5, label: 'Strong track record of successful tech adoption' }
        ],
        maxScore: 5
      }
    ]
  },
  {
    id: 'technical_infrastructure',
    name: 'Technical Infrastructure',
    description: 'Assesses your technology stack and infrastructure readiness for AI',
    maxScore: 20,
    questions: [
      {
        id: 'ti_1',
        text: 'Is your data consolidated in one system or scattered?',
        dimension: 'technical_infrastructure',
        type: 'multipleChoice',
        options: [
          { value: 0, label: 'Data is highly scattered across many systems' },
          { value: 2, label: 'Data is in multiple systems with some integration' },
          { value: 4, label: 'Most data is consolidated with some silos' },
          { value: 5, label: 'Data is fully consolidated and accessible' }
        ],
        maxScore: 5
      },
      {
        id: 'ti_2',
        text: 'Are your systems modern or legacy?',
        dimension: 'technical_infrastructure',
        type: 'multipleChoice',
        options: [
          { value: 0, label: 'Primarily legacy systems' },
          { value: 2, label: 'Mix of legacy and modern, mostly legacy' },
          { value: 4, label: 'Mix of legacy and modern, mostly modern' },
          { value: 5, label: 'Primarily modern, cloud-based systems' }
        ],
        maxScore: 5
      },
      {
        id: 'ti_3',
        text: 'Do you have APIs/integrations between tools?',
        dimension: 'technical_infrastructure',
        type: 'multipleChoice',
        options: [
          { value: 0, label: 'No integrations or APIs' },
          { value: 2, label: 'Limited manual integrations' },
          { value: 4, label: 'Some automated integrations via APIs' },
          { value: 5, label: 'Comprehensive API ecosystem with seamless integrations' }
        ],
        maxScore: 5
      },
      {
        id: 'ti_4',
        text: 'Can your infrastructure scale to new AI tools?',
        dimension: 'technical_infrastructure',
        type: 'multipleChoice',
        options: [
          { value: 0, label: 'Infrastructure is at capacity or outdated' },
          { value: 2, label: 'Limited scalability, significant upgrades needed' },
          { value: 4, label: 'Moderate scalability with some enhancements needed' },
          { value: 5, label: 'Highly scalable, cloud-based, ready for AI' }
        ],
        maxScore: 5
      }
    ]
  },
  {
    id: 'executive_alignment',
    name: 'Executive Alignment',
    description: 'Measures leadership buy-in and organizational alignment for AI',
    maxScore: 20,
    questions: [
      {
        id: 'ea_1',
        text: 'Does leadership see AI as strategic?',
        dimension: 'executive_alignment',
        type: 'multipleChoice',
        options: [
          { value: 0, label: 'AI is not on leadership\'s radar' },
          { value: 2, label: 'Some interest but not a priority' },
          { value: 4, label: 'Recognized as important, becoming a priority' },
          { value: 5, label: 'AI is a top strategic priority for leadership' }
        ],
        maxScore: 5
      },
      {
        id: 'ea_2',
        text: 'Is there budget approval for AI?',
        dimension: 'executive_alignment',
        type: 'multipleChoice',
        options: [
          { value: 0, label: 'No budget discussions yet' },
          { value: 2, label: 'Budget is being considered' },
          { value: 4, label: 'Budget approved for exploration/pilots' },
          { value: 5, label: 'Significant budget committed to AI initiatives' }
        ],
        maxScore: 5
      },
      {
        id: 'ea_3',
        text: 'Are stakeholders aligned on AI benefits?',
        dimension: 'executive_alignment',
        type: 'multipleChoice',
        options: [
          { value: 0, label: 'No alignment, lots of skepticism' },
          { value: 2, label: 'Some alignment but many concerns' },
          { value: 4, label: 'Most stakeholders are aligned' },
          { value: 5, label: 'Full stakeholder alignment and enthusiasm' }
        ],
        maxScore: 5
      },
      {
        id: 'ea_4',
        text: 'Is there executive sponsorship?',
        dimension: 'executive_alignment',
        type: 'multipleChoice',
        options: [
          { value: 0, label: 'No executive sponsor' },
          { value: 2, label: 'Informal support but no formal sponsor' },
          { value: 4, label: 'One executive sponsor' },
          { value: 5, label: 'Multiple executive sponsors championing AI' }
        ],
        maxScore: 5
      }
    ]
  }
];

// Helper function to get all questions
export const getAllQuestions = (): Question[] => {
  return assessmentDimensions.flatMap(d => d.questions);
};

// Helper function to get questions by dimension
export const getQuestionsByDimension = (dimensionId: string): Question[] => {
  const dimension = assessmentDimensions.find(d => d.id === dimensionId);
  return dimension ? dimension.questions : [];
};
