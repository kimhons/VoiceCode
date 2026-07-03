/**
 * Cost Monitoring Dashboard
 * Track AI costs, set budgets, and receive alerts
 */

import React, { useState, useEffect } from 'react';
import { aiAuditLoggingService } from '../../services/aiAuditLogging.service';
import { reportExportService, ExportFormat } from '../../services/reportExport.service';

interface CostData {
  date: string;
  cost: number;
  operations: number;
  tokens: number;
}

interface BudgetAlert {
  type: 'warning' | 'danger';
  message: string;
  percentage: number;
}

export function CostMonitoringDashboard({ userId }: { userId: string }) {
  const [dailyCosts, setDailyCosts] = useState<CostData[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [budget, setBudget] = useState(100); // Default $100 budget
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const loadCostData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      const stats = await aiAuditLoggingService.getUsageStatistics(userId, startDate, endDate);
      
      // Get daily breakdown (simulated - you'd implement this in the service)
      const dailyData: CostData[] = [];
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyData.push({
          date: date.toISOString().split('T')[0],
          cost: Math.random() * (stats.totalCost / days) * 2, // Simulated
          operations: Math.floor(Math.random() * (stats.totalOperations / days) * 2),
          tokens: Math.floor(Math.random() * (stats.totalTokens / days) * 2),
        });
      }

      setDailyCosts(dailyData);
      setTotalCost(stats.totalCost);

      // Check budget alerts
      const percentage = (stats.totalCost / budget) * 100;
      const newAlerts: BudgetAlert[] = [];

      if (percentage >= 90) {
        newAlerts.push({
          type: 'danger',
          message: `You've used ${percentage.toFixed(1)}% of your budget!`,
          percentage,
        });
      } else if (percentage >= 75) {
        newAlerts.push({
          type: 'warning',
          message: `You've used ${percentage.toFixed(1)}% of your budget`,
          percentage,
        });
      }

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Error loading cost data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCostData();
  }, [timeRange, userId, budget]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const budgetUsed = (totalCost / budget) * 100;
  const budgetRemaining = budget - totalCost;
  const avgDailyCost = totalCost / dailyCosts.length;
  const projectedMonthlyCost = avgDailyCost * 30;

  const handleExport = async (format: ExportFormat) => {
    try {
      await reportExportService.exportCostReport(
        dailyCosts,
        { totalCost, avgDailyCost, projectedMonthlyCost, budget, budgetUsed },
        { start: new Date(Date.now() - (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000), end: new Date() },
        format
      );
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Cost Monitoring</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          {/* Export buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              title="Export as CSV"
            >
              📊 CSV
            </button>
            <button
              type="button"
              onClick={() => handleExport('json')}
              className="px-3 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
              title="Export as JSON"
            >
              📄 JSON
            </button>
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              title="Export as PDF"
            >
              📑 PDF
            </button>
          </div>

          {/* Time range selector */}
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setTimeRange('7d')}
              className={`px-3 lg:px-4 py-2 rounded-lg text-sm font-medium ${
                timeRange === '7d' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('30d')}
              className={`px-3 lg:px-4 py-2 rounded-lg text-sm font-medium ${
                timeRange === '30d' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('90d')}
              className={`px-3 lg:px-4 py-2 rounded-lg text-sm font-medium ${
                timeRange === '90d' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              90 Days
            </button>
          </div>
        </div>
      </div>

      {/* Budget Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border-2 ${
                alert.type === 'danger'
                  ? 'bg-red-50 border-red-300'
                  : 'bg-yellow-50 border-yellow-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{alert.type === 'danger' ? '🚨' : '⚠️'}</span>
                <span className="font-bold text-gray-900">{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budget Overview */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Budget Overview</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Monthly Budget:</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-24 px-3 py-1 border rounded-lg text-sm"
              min="0"
              step="10"
            />
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Used: ${totalCost.toFixed(2)}</span>
            <span className="text-gray-600">Remaining: ${budgetRemaining.toFixed(2)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-300 ${
                budgetUsed >= 90
                  ? 'bg-red-500'
                  : budgetUsed >= 75
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetUsed, 100)}%` }}
            />
          </div>
          <div className="text-center text-sm text-gray-600 mt-2">
            {budgetUsed.toFixed(1)}% of budget used
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">${totalCost.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Spent</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">${avgDailyCost.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Avg Daily Cost</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">${projectedMonthlyCost.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Projected Monthly</div>
          </div>
        </div>
      </div>

      {/* Daily Cost Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Daily Cost Trend</h2>
        <div className="h-64 flex items-end gap-1">
          {dailyCosts.map((day, idx) => {
            const maxCost = Math.max(...dailyCosts.map(d => d.cost));
            const height = (day.cost / maxCost) * 100;
            
            return (
              <div
                key={idx}
                className="flex-1 group relative"
                style={{ height: '100%' }}
              >
                <div
                  className="bg-green-500 hover:bg-green-600 transition-colors rounded-t cursor-pointer"
                  style={{ height: `${height}%`, marginTop: `${100 - height}%` }}
                >
                  {/* Tooltip */}
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
                    <div className="font-bold">{day.date}</div>
                    <div>Cost: ${day.cost.toFixed(4)}</div>
                    <div>Operations: {day.operations}</div>
                    <div>Tokens: {day.tokens.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{dailyCosts[0]?.date}</span>
          <span>{dailyCosts[dailyCosts.length - 1]?.date}</span>
        </div>
      </div>

      {/* Cost Breakdown Table */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Daily Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 px-4 text-sm font-bold text-gray-700">Date</th>
                <th className="text-right py-2 px-4 text-sm font-bold text-gray-700">Cost</th>
                <th className="text-right py-2 px-4 text-sm font-bold text-gray-700">Operations</th>
                <th className="text-right py-2 px-4 text-sm font-bold text-gray-700">Tokens</th>
                <th className="text-right py-2 px-4 text-sm font-bold text-gray-700">Cost/Op</th>
              </tr>
            </thead>
            <tbody>
              {dailyCosts.slice().reverse().slice(0, 10).map((day, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-4 text-sm text-gray-900">{day.date}</td>
                  <td className="py-2 px-4 text-sm text-right text-gray-900">
                    ${day.cost.toFixed(4)}
                  </td>
                  <td className="py-2 px-4 text-sm text-right text-gray-600">
                    {day.operations}
                  </td>
                  <td className="py-2 px-4 text-sm text-right text-gray-600">
                    {day.tokens.toLocaleString()}
                  </td>
                  <td className="py-2 px-4 text-sm text-right text-gray-600">
                    ${(day.cost / day.operations).toFixed(6)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Optimization Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-blue-900 flex items-center gap-2">
          <span>💡</span>
          Cost Optimization Tips
        </h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Use context management to reduce token usage by up to 40%</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Choose the right model: gpt-4o-mini for simple tasks, GPT-5 Pro for complex ones</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Implement caching for frequently used prompts</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Set up rate limiting to prevent unexpected cost spikes</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default CostMonitoringDashboard;

