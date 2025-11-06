import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentApi, Question, Dimension, AssessmentResponse } from '../services/api';

const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [currentDimensionIndex, setCurrentDimensionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const data = await assessmentApi.getQuestions();
      setDimensions(data.dimensions);
      setLoading(false);
    } catch (err) {
      setError('Failed to load assessment questions');
      setLoading(false);
    }
  };

  const currentDimension = dimensions[currentDimensionIndex];
  const currentQuestion = currentDimension?.questions[currentQuestionIndex];
  const totalQuestions = dimensions.reduce((sum, d) => sum + d.questions.length, 0);
  const answeredQuestions = responses.length;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  const handleAnswer = (value: number, label: string) => {
    if (!currentQuestion) return;

    const response: AssessmentResponse = {
      questionId: currentQuestion.id,
      dimension: currentQuestion.dimension,
      questionText: currentQuestion.text,
      answerValue: value,
      answerText: label,
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);

    // Move to next question or dimension
    if (currentQuestionIndex < currentDimension.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentDimensionIndex < dimensions.length - 1) {
      setCurrentDimensionIndex(currentDimensionIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      // All questions answered, submit
      submitAssessment(newResponses);
    }
  };

  const handleBack = () => {
    if (responses.length === 0) {
      navigate('/assessment');
      return;
    }

    // Remove last response
    const newResponses = responses.slice(0, -1);
    setResponses(newResponses);

    // Go back to previous question
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentDimensionIndex > 0) {
      const prevDimensionIndex = currentDimensionIndex - 1;
      setCurrentDimensionIndex(prevDimensionIndex);
      setCurrentQuestionIndex(dimensions[prevDimensionIndex].questions.length - 1);
    }
  };

  const submitAssessment = async (finalResponses: AssessmentResponse[]) => {
    setSubmitting(true);
    try {
      const assessmentId = sessionStorage.getItem('assessmentId');
      if (!assessmentId) {
        throw new Error('Assessment ID not found');
      }

      const result = await assessmentApi.submitAssessment(assessmentId, finalResponses);
      navigate(`/assessment/results/${result.assessmentId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit assessment');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Analyzing Your Responses</h2>
          <p className="text-gray-600">
            We're calculating your AI readiness score and generating your personalized report...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <div className="text-red-500 text-center mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-4">Error</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={() => navigate('/assessment')}
            className="w-full btn btn-primary"
          >
            Return to Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">SherpaTech.AI Assessment</h1>
          <p className="text-indigo-100">Question {answeredQuestions + 1} of {totalQuestions}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="progress-bar bg-white bg-opacity-30">
            <div
              className="progress-fill bg-white"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm text-indigo-100">{Math.round(progress)}% Complete</span>
            <span className="text-sm text-indigo-100">{dimensions.length - currentDimensionIndex} dimensions remaining</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 mb-6">
          {/* Dimension Badge */}
          {currentDimension && (
            <div className="mb-8">
              <span className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-4">
                {currentDimension.name}
              </span>
              <p className="text-gray-600 text-sm">{currentDimension.description}</p>
            </div>
          )}

          {/* Question */}
          {currentQuestion && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                {currentQuestion.text}
              </h2>

              {/* Answer Options */}
              <div className="space-y-4">
                {currentQuestion.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option.value, option.label)}
                    className="w-full text-left p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 group"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 border-2 border-gray-300 rounded-full flex items-center justify-center mr-4 group-hover:border-primary-500 group-hover:bg-primary-500 transition-colors">
                        <span className="text-gray-400 group-hover:text-white font-semibold">
                          {String.fromCharCode(65 + index)}
                        </span>
                      </div>
                      <span className="text-gray-900 font-medium">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            className="btn btn-secondary bg-white text-primary-600 border-white hover:bg-white hover:bg-opacity-90"
          >
            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="text-white text-sm">
            Dimension {currentDimensionIndex + 1} of {dimensions.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;
