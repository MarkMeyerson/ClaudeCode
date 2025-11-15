/**
 * ROI Dashboard Component - Executive Overview
 * Comprehensive ROI visualization with real-time data
 */

import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ROIDashboardProps {
  organizationId: string;
  period: 'monthly' | 'quarterly' | 'annual';
}

interface ROIMetrics {
  totalInvestment: number;
  totalValue: number;
  roiPercentage: number;
  paybackAchieved: boolean;
  paybackMonth: number;
  costBreakdown: {
    licenses: number;
    implementation: number;
    training: number;
    support: number;
  };
  valueBreakdown: {
    productivity: number;
    timeSavings: number;
    qualityImprovement: number;
    innovation: number;
  };
  trends: Array<{
    month: string;
    costs: number;
    benefits: number;
    roi: number;
  }>;
  benchmarks: {
    vsIndustryAvg: number;
    vsBaseline: number;
    vsProjection: number;
  };
}

export const ROIDashboard: React.FC<ROIDashboardProps> = ({ organizationId, period }) => {
  const [metrics, setMetrics] = useState<ROIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchROIMetrics();
  }, [organizationId, period, timeframe]);

  const fetchROIMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/roi/dashboard/${organizationId}?period=${period}&timeframe=${timeframe}`);
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch ROI metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return <div className="text-center py-8">No ROI data available</div>;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const costData = Object.entries(metrics.costBreakdown).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const valueData = Object.entries(metrics.valueBreakdown).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1'),
    value
  }));

  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ROI Dashboard</h2>
          <div className="flex space-x-2">
            {(['7d', '30d', '90d', '1y'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="text-sm font-medium opacity-90">Total Investment</div>
            <div className="text-3xl font-bold mt-2">{formatCurrency(metrics.totalInvestment)}</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="text-sm font-medium opacity-90">Total Value Generated</div>
            <div className="text-3xl font-bold mt-2">{formatCurrency(metrics.totalValue)}</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="text-sm font-medium opacity-90">ROI</div>
            <div className="text-3xl font-bold mt-2">{metrics.roiPercentage.toFixed(1)}%</div>
          </div>

          <div className={`bg-gradient-to-br ${metrics.paybackAchieved ? 'from-emerald-500 to-emerald-600' : 'from-orange-500 to-orange-600'} rounded-lg p-4 text-white`}>
            <div className="text-sm font-medium opacity-90">Payback Period</div>
            <div className="text-3xl font-bold mt-2">
              {metrics.paybackAchieved ? '✓ Achieved' : `${metrics.paybackMonth}mo`}
            </div>
          </div>
        </div>
      </div>

      {/* ROI Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">ROI Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={metrics.trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#F3F4F6'
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="costs" stroke="#EF4444" strokeWidth={2} name="Costs" />
            <Line type="monotone" dataKey="benefits" stroke="#10B981" strokeWidth={2} name="Benefits" />
            <Line type="monotone" dataKey="roi" stroke="#3B82F6" strokeWidth={3} name="ROI %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cost and Value Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cost Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={costData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {costData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Value Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={valueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <Bar dataKey="value" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Benchmarks */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance vs Benchmarks</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">vs Industry Average</div>
            <div className={`text-2xl font-bold mt-2 ${metrics.benchmarks.vsIndustryAvg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.benchmarks.vsIndustryAvg > 0 ? '+' : ''}{metrics.benchmarks.vsIndustryAvg.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {metrics.benchmarks.vsIndustryAvg >= 0 ? 'Above' : 'Below'} industry standard
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">vs Baseline</div>
            <div className={`text-2xl font-bold mt-2 ${metrics.benchmarks.vsBaseline >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.benchmarks.vsBaseline > 0 ? '+' : ''}{metrics.benchmarks.vsBaseline.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Pre-implementation baseline</div>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">vs Projection</div>
            <div className={`text-2xl font-bold mt-2 ${metrics.benchmarks.vsProjection >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.benchmarks.vsProjection > 0 ? '+' : ''}{metrics.benchmarks.vsProjection.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {metrics.benchmarks.vsProjection >= 0 ? 'Exceeding' : 'Below'} projections
            </div>
          </div>
        </div>
      </div>

      {/* Export and Actions */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Print Report
        </button>
        <button
          onClick={() => {/* Export to Excel */}}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Export to Excel
        </button>
        <button
          onClick={() => {/* Export to PDF */}}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
};
