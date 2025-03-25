// src/components/procurement/dashboard/StatusSummary.jsx
import React from 'react';
import { Table, Badge } from 'react-bootstrap';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const StatusSummary = ({ countByStatus, budgetByStatus }) => {
  // 상태 코드별 표시 이름 매핑
  const statusDisplayName = {
    'REQUESTED': '요청됨',
    'RECEIVED': '접수됨',
    'VENDOR_SELECTION': '업체선정',
    'CONTRACT_PENDING': '계약대기',
    'INSPECTION': '검수',
    'INVOICE_ISSUED': '인보이스발행',
    'PAYMENT_COMPLETED': '대금지급완료'
  };

  // 상태별 색상 매핑
  const statusColors = {
    'REQUESTED': '#ff9800',
    'RECEIVED': '#2196f3',
    'VENDOR_SELECTION': '#9c27b0',
    'CONTRACT_PENDING': '#f44336',
    'INSPECTION': '#4caf50',
    'INVOICE_ISSUED': '#795548',
    'PAYMENT_COMPLETED': '#3f51b5'
  };

  // 차트 데이터 준비
  const chartData = Object.entries(countByStatus).map(([status, count]) => ({
    name: statusDisplayName[status] || status,
    value: count,
    budget: budgetByStatus[status] || 0,
    color: statusColors[status] || '#999'
  }));

  return (
    <div className="status-summary">
      <div className="mb-4" style={{ height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [value, name]}
              labelFormatter={(label) => label}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>상태</th>
            <th>건수</th>
            <th>예산</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(countByStatus).map(([status, count]) => (
            <tr key={status}>
              <td>
                <Badge bg="secondary" style={{ backgroundColor: statusColors[status] }}>
                  {statusDisplayName[status] || status}
                </Badge>
              </td>
              <td className="text-end">{count.toLocaleString()}</td>
              <td className="text-end">
                {(budgetByStatus[status] || 0).toLocaleString()}원
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default StatusSummary;