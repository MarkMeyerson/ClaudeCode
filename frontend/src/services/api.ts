import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface AssessmentResponse {
  questionId: string;
  dimension: string;
  questionText: string;
  answerValue: number;
  answerText?: string;
}

export interface AssessmentData {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  companySize?: string;
  industry?: string;
}

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
  phaseDescription?: string;
  recommendations?: string[];
}

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

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const assessmentApi = {
  // Simple assessment submission (new endpoint)
  submitSimpleAssessment: async (data: {
    company_name: string;
    email: string;
    company_size?: string;
    industry?: string;
  }): Promise<any> => {
    const response = await api.post('/assessment', data);
    return response.data;
  },

  // Get assessment questions
  getQuestions: async (): Promise<{ dimensions: Dimension[]; totalQuestions: number }> => {
    const response = await api.get('/assessment/questions');
    return response.data.data;
  },

  // Start new assessment (using simple endpoint)
  startAssessment: async (data: AssessmentData): Promise<{ assessmentId: string; createdAt: string }> => {
    // Map frontend data format to API format
    const apiData = {
      companyName: data.companyName,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      companySize: data.companySize,
      industry: data.industry
    };
    const response = await api.post('/assessment', apiData);
    // Map response back to expected format
    return {
      assessmentId: response.data.data.assessmentId,
      createdAt: response.data.data.createdAt
    };
  },

  // Submit assessment responses
  submitAssessment: async (
    assessmentId: string,
    responses: AssessmentResponse[]
  ): Promise<{ assessmentId: string; score: AssessmentScore }> => {
    const response = await api.post(`/assessment/${assessmentId}/submit`, { responses });
    return response.data.data;
  },

  // Get assessment results
  getResults: async (assessmentId: string): Promise<any> => {
    const response = await api.get(`/assessment/${assessmentId}/results`);
    return response.data.data;
  },

  // Get PDF report URL
  getPDFUrl: (assessmentId: string): string => {
    return `${API_BASE_URL}/assessment/${assessmentId}/pdf`;
  },

  // Send assessment report via email
  sendReport: async (data: {
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
  }): Promise<{ success: boolean; message: string; email: string; pdfGenerated?: boolean }> => {
    const response = await api.post('/send-report', data);
    return response.data;
  },
};

export default api;
