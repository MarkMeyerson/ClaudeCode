import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AcademicCapIcon, ChartBarIcon, UserGroupIcon, RocketLaunchIcon, BoltIcon, CogIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface Phase {
  name: string;
  scoreRange: string;
  description: string;
  focusArea: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  bgColor: string;
}

const phases: Phase[] = [
  {
    name: 'Pre-Assess',
    scoreRange: '0-15',
    description: 'Building awareness and exploring possibilities',
    focusArea: 'Education, awareness',
    icon: AcademicCapIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  {
    name: 'Assess',
    scoreRange: '15-30',
    description: 'Assessment and strategic planning phase',
    focusArea: 'Planning & evaluation',
    icon: ChartBarIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  {
    name: 'Align',
    scoreRange: '30-45',
    description: 'Stakeholder alignment and resource planning',
    focusArea: 'Alignment & governance',
    icon: UserGroupIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  {
    name: 'Activate',
    scoreRange: '45-60',
    description: 'Pilot projects and capability building',
    focusArea: 'Implementation & pilots',
    icon: RocketLaunchIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    name: 'Accelerate',
    scoreRange: '60-75',
    description: 'Scaling successful initiatives',
    focusArea: 'Scaling & optimization',
    icon: BoltIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    name: 'Apply',
    scoreRange: '75-85',
    description: 'Enterprise integration and optimization',
    focusArea: 'Integration & refinement',
    icon: CogIcon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  {
    name: 'Amplify',
    scoreRange: '85-100',
    description: 'Innovation and competitive differentiation',
    focusArea: 'Innovation & leadership',
    icon: SparklesIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  }
];

const FrameworkInfoPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            The 6A Framework
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A comprehensive 7-phase AI maturity model that helps organizations navigate their AI transformation journey from awareness to amplification.
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What is the 6A Framework?</h2>
          <p className="text-gray-700 mb-4">
            The 6A Framework is a structured approach to AI readiness and implementation that maps your organization's maturity across seven distinct phases. Each phase represents a critical stage in your AI journey, with specific focus areas and actionable recommendations.
          </p>
          <p className="text-gray-700">
            By assessing where you currently stand on the 6A spectrum (scored from 0-100), you can identify the right next steps to advance your AI capabilities and achieve measurable business outcomes.
          </p>
        </div>

        {/* Phases Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">The Seven Phases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {phases.map((phase, index) => {
              const Icon = phase.icon;
              return (
                <div
                  key={index}
                  className={`${phase.bgColor} rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow duration-300 border-l-4 ${phase.color.replace('text-', 'border-')}`}
                >
                  <div className="flex items-center mb-4">
                    <Icon className={`h-8 w-8 ${phase.color} mr-3`} />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{phase.name}</h3>
                      <span className="text-sm text-gray-500">Score: {phase.scoreRange}</span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3 font-medium">{phase.description}</p>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Focus:</span> {phase.focusArea}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Journey Visualization */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your AI Journey</h2>
          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-yellow-500 via-green-500 via-blue-500 to-purple-600"></div>
            <div className="relative flex justify-between items-start">
              {phases.map((phase, index) => (
                <div key={index} className="flex flex-col items-center" style={{ width: '14%' }}>
                  <div className={`w-10 h-10 rounded-full ${phase.bgColor} border-2 ${phase.color.replace('text-', 'border-')} flex items-center justify-center mb-2`}>
                    <span className={`text-sm font-bold ${phase.color}`}>{index + 1}</span>
                  </div>
                  <span className="text-xs text-gray-600 text-center">{phase.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 text-center text-gray-600">
            <p>Progress from awareness to AI leadership through structured, measurable phases</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Discover Your AI Readiness?</h2>
          <p className="text-xl mb-6 text-blue-100">
            Take our comprehensive assessment to find out where you stand on the 6A Framework and get personalized recommendations.
          </p>
          <button
            onClick={() => navigate('/assessment')}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200 shadow-lg"
          >
            Start Your Assessment
          </button>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900 underline"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default FrameworkInfoPage;
