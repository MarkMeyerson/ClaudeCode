import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { assessmentApi, DimensionScore } from '../services/api';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const ResultsPage: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (assessmentId) {
      loadResults();
    }
  }, [assessmentId]);

  const loadResults = async () => {
    try {
      const data = await assessmentApi.getResults(assessmentId!);
      setResults(data);
      setLoading(false);

      // Automatically send email report after results load
      sendEmailReport(data);
    } catch (err) {
      setError('Failed to load assessment results');
      setLoading(false);
    }
  };

  const sendEmailReport = async (resultsData: any) => {
    setEmailSending(true);

    try {
      const { assessment, score } = resultsData;

      // Map dimension scores to the format expected by the API
      const scores = {
        strategicClarity: score.dimensionScores.find((d: DimensionScore) => d.dimension === 'strategic_clarity')?.score || 0,
        teamCapability: score.dimensionScores.find((d: DimensionScore) => d.dimension === 'team_capability')?.score || 0,
        governanceReadiness: score.dimensionScores.find((d: DimensionScore) => d.dimension === 'governance_readiness')?.score || 0,
        technicalInfrastructure: score.dimensionScores.find((d: DimensionScore) => d.dimension === 'technical_infrastructure')?.score || 0,
        executiveAlignment: score.dimensionScores.find((d: DimensionScore) => d.dimension === 'executive_alignment')?.score || 0,
        overall: score.totalScore || 0,
      };

      await assessmentApi.sendReport({
        email: assessment.email,
        name: assessment.companyName || 'Valued Client',
        organization: assessment.companyName,
        scores,
        readinessPhase: score.readinessPhase,
        recommendations: score.recommendations,
      });

      setEmailSent(true);
      setEmailSending(false);
    } catch (err: any) {
      console.error('Failed to send email report:', err);
      setEmailError('We encountered an issue sending your email report, but your results are displayed below.');
      setEmailSending(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!results) return;
    setDownloadingPDF(true);

    try {
      const { assessment, score } = results;

      // Map dimension scores to the format expected by the API
      const scores = {
        strategicClarity: score.dimensionScores.find((d: DimensionScore) => d.dimension === 'strategic_clarity')?.score || 0,
        teamCapability: score.dimensionScores.find((d: DimensionScore) => d.dimension === 'team_capability')?.score || 0,
        governanceReadiness: score.dimensionScores.find((d: DimensionScore) => d.dimension === 'governance_readiness')?.score || 0,
        technicalInfrastructure: score.dimensionScores.find((d: DimensionScore) => d.dimension === 'technical_infrastructure')?.score || 0,
        executiveAlignment: score.dimensionScores.find((d: DimensionScore) => d.dimension === 'executive_alignment')?.score || 0,
        overall: score.totalScore || 0,
      };

      // Make POST request to send-report with download=true
      const response = await fetch('/api/send-report?download=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: assessment.email,
          name: assessment.companyName || 'Valued Client',
          organization: assessment.companyName,
          scores,
          readinessPhase: score.readinessPhase,
          recommendations: score.recommendations,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get PDF blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AI-Readiness-Assessment-Report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const getPhaseColor = (phase: string): string => {
    const colors: { [key: string]: string } = {
      'Pre-Assess': '#ef4444',
      'Assess': '#f59e0b',
      'Align': '#eab308',
      'Activate': '#84cc16',
      'Accelerate': '#22c55e',
      'Apply': '#10b981',
      'Amplify': '#059669',
    };
    return colors[phase] || '#667eea';
  };

  const formatDimensionName = (dimension: string): string => {
    return dimension
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <div className="text-red-500 text-center mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-4">Error</h2>
          <p className="text-gray-600 text-center">{error || 'Results not found'}</p>
        </div>
      </div>
    );
  }

  const { assessment, score } = results;
  const phaseColor = getPhaseColor(score.readinessPhase);

  // Prepare data for charts
  const radarData = score.dimensionScores.map((ds: DimensionScore) => ({
    dimension: formatDimensionName(ds.dimension).split(' ').join('\n'),
    score: ds.score,
    fullMark: ds.maxScore,
  }));

  const barData = score.dimensionScores.map((ds: DimensionScore) => ({
    name: formatDimensionName(ds.dimension),
    score: ds.score,
    maxScore: ds.maxScore,
    percentage: ds.percentage,
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Email Status Banner */}
        {emailSending && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <p className="text-blue-800">Sending your detailed report via email...</p>
          </div>
        )}

        {emailSent && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-green-800 font-semibold">Report Sent Successfully!</p>
                <p className="text-green-700 text-sm mt-1">
                  We've sent a detailed PDF report to <strong>{assessment.email}</strong>.
                  Check your inbox (and spam folder) for your complete analysis.
                </p>
              </div>
            </div>
          </div>
        )}

        {emailError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-yellow-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-yellow-800 font-semibold">Email Delivery Issue</p>
                <p className="text-yellow-700 text-sm mt-1">{emailError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your AI Readiness Assessment Results
          </h1>
          <p className="text-xl text-gray-600">
            {assessment.companyName}
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl shadow-2xl p-8 md:p-12 mb-8">
          <div className="text-center">
            <p className="text-white text-xl mb-4 opacity-90">Your AI Readiness Score</p>
            <div className="text-white text-7xl font-bold mb-2">{score.totalScore}</div>
            <p className="text-white text-2xl mb-6 opacity-90">out of 100</p>

            <div
              className="inline-block px-8 py-3 rounded-full text-white text-xl font-bold shadow-lg"
              style={{ backgroundColor: phaseColor }}
            >
              {score.readinessPhase}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Radar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Dimension Overview
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" style={{ fontSize: '12px' }} />
                <PolarRadiusAxis angle={90} domain={[0, 20]} />
                <Radar
                  name="Your Score"
                  dataKey="score"
                  stroke="#667eea"
                  fill="#667eea"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Detailed Scores
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} layout="horizontal">
                <XAxis type="number" domain={[0, 20]} />
                <YAxis type="category" dataKey="name" width={150} style={{ fontSize: '11px' }} />
                <Tooltip />
                <Bar dataKey="score" fill="#667eea" radius={[0, 8, 8, 0]}>
                  {barData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.percentage >= 70 ? '#10b981' : entry.percentage >= 50 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dimension Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Dimension Breakdown</h3>
          <div className="space-y-6">
            {score.dimensionScores.map((ds: DimensionScore, index: number) => (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {formatDimensionName(ds.dimension)}
                  </h4>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary-600">{ds.score}</span>
                    <span className="text-gray-500">/{ds.maxScore}</span>
                    <span className="ml-2 text-sm text-gray-500">({ds.percentage}%)</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${ds.percentage}%`,
                      backgroundColor: ds.percentage >= 70 ? '#10b981' : ds.percentage >= 50 ? '#f59e0b' : '#ef4444'
                    }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {ds.percentage >= 80 && 'Excellent - You have strong capabilities in this area'}
                  {ds.percentage >= 60 && ds.percentage < 80 && 'Good - Solid foundation with room for improvement'}
                  {ds.percentage >= 40 && ds.percentage < 60 && 'Fair - Some work needed to strengthen this area'}
                  {ds.percentage < 40 && 'Needs Attention - This area requires significant focus'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* What This Means Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">What This Means for You</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            {score.readinessPhase === 'Pre-Assess' && 'Your organization is in the very early stages of AI consideration. This is an excellent time to start building awareness and exploring possibilities without the pressure of immediate implementation.'}
            {score.readinessPhase === 'Assess' && 'Your organization is beginning to explore AI but needs more clarity and preparation. Focus on assessment and strategic planning to build a solid foundation.'}
            {score.readinessPhase === 'Align' && 'Your organization has AI awareness but needs better alignment across strategy, governance, and resources. This is the time to get everyone on the same page.'}
            {score.readinessPhase === 'Activate' && 'Your organization is ready to start implementing AI projects! Focus on pilot projects and building the necessary capabilities.'}
            {score.readinessPhase === 'Accelerate' && 'Your organization has active AI initiatives and is ready to scale. Time to expand your AI adoption across more areas of the business.'}
            {score.readinessPhase === 'Apply' && 'Your organization has mature AI capabilities. Focus on refining operations and integrating AI more deeply into your business processes.'}
            {score.readinessPhase === 'Amplify' && 'Your organization is an AI leader! Focus on innovation and using AI as a competitive differentiator.'}
          </p>
        </div>

        {/* Actions Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Next Steps</h3>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="border-2 border-primary-500 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Download Full Report</h4>
              </div>
              <p className="text-gray-600 mb-4">
                Get a comprehensive PDF report with detailed analysis and recommendations.
              </p>
              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="w-full btn btn-primary"
              >
                {downloadingPDF ? 'Preparing...' : 'Download PDF Report'}
              </button>
            </div>

            <div className="border-2 border-green-500 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Schedule Consultation</h4>
              </div>
              <p className="text-gray-600 mb-4">
                Discuss your results with our AI experts and create a customized roadmap.
              </p>
              <a
                href="http://book.sherpatech.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full btn btn-primary bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                Book Your Session
              </a>
            </div>
          </div>

          {emailSent && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-indigo-600 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-indigo-900 mb-2">Report Sent to Your Email</h4>
                  <p className="text-sm text-indigo-700">
                    We've sent a detailed PDF copy of this report to <strong>{assessment.email}</strong>.
                    Check your inbox (and spam folder) for the complete analysis.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 text-sm">
          <p>© {new Date().getFullYear()} SherpaTech.AI - Your AI Transformation Partner</p>
          <p className="mt-2">
            Questions? Contact us at <a href="mailto:hello@sherpatech.ai" className="text-primary-600 hover:underline">hello@sherpatech.ai</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
