// src/components/procurement/dashboard/DepartmentSummary.jsx
import React from 'react';
import { Table } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DepartmentSummary = ({ countByDepartment, budgetByDepartment }) => {
  // 차트 데이터 준비
  const chartData = Object.entries(countByDepartment)
    .map(([dept, count]) => ({
      name: dept,
      count: count,
      budget: budgetByDepartment[dept] || 0
    }))
    .sort((a, b) => b.count - a.count); // 건수 기준 내림차순 정렬

  return (
    <div className="department-summary">
      <div className="mb-4" style={{ height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value, name) => [value.toLocaleString(), name === 'count' ? '건수' : '예산']} />
            <Bar dataKey="count" name="건수" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>부서</th>
            <th>건수</th>
            <th>예산</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(countByDepartment).map(([dept, count]) => (
            <tr key={dept}>
              <td>{dept}</td>
              <td className="text-end">{count.toLocaleString()}</td>
              <td className="text-end">
                {(budgetByDepartment[dept] || 0).toLocaleString()}원
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default DepartmentSummary;