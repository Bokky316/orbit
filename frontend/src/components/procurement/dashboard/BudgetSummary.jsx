// src/components/procurement/dashboard/BudgetSummary.jsx
import React from 'react';
import { Card, ProgressBar } from 'react-bootstrap';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const BudgetSummary = ({ totalBudget, completedBudget, pendingBudget }) => {
  const formatCurrency = (value) => {
    return value.toLocaleString() + '원';
  };

  // 완료율 계산
  const completionRate = totalBudget > 0 ? (completedBudget / totalBudget) * 100 : 0;

  // 차트 데이터
  const chartData = [
    { name: '완료된 예산', value: completedBudget, color: '#4caf50' },
    { name: '진행중인 예산', value: pendingBudget, color: '#2196f3' }
  ];

  return (
    <div className="budget-summary">
      <div className="text-center mb-4">
        <div className="fs-4 fw-bold">총 예산</div>
        <div className="fs-2 fw-bold">{formatCurrency(totalBudget)}</div>
      </div>

      <div className="mb-4" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              paddingAngle={5}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span>완료된 예산</span>
            <span className="fw-bold">{formatCurrency(completedBudget)}</span>
          </div>
          <ProgressBar
            variant="success"
            now={completionRate}
            label={`${completionRate.toFixed(1)}%`}
            className="mb-3"
          />

          <div className="d-flex justify-content-between align-items-center mb-2">
            <span>진행중인 예산</span>
            <span className="fw-bold">{formatCurrency(pendingBudget)}</span>
          </div>
          <ProgressBar
            variant="info"
            now={totalBudget > 0 ? (pendingBudget / totalBudget) * 100 : 0}
            label={`${totalBudget > 0 ? ((pendingBudget / totalBudget) * 100).toFixed(1) : 0}%`}
          />
        </Card.Body>
      </Card>
    </div>
  );
};

export default BudgetSummary;