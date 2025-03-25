// src/components/procurement/dashboard/DepartmentSummary.jsx
import React from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Box
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DepartmentSummary = ({ countByDepartment, budgetByDepartment }) => {
  // 차트 데이터 준비
  const chartData = Object.entries(countByDepartment)
    .map(([dept, count]) => ({
      name: dept,
      count: count,
      budget: budgetByDepartment[dept] || 0
    }))
    .sort((a, b) => b.count - a.count) // 건수 기준 내림차순 정렬
    .slice(0, 5); // 상위 5개 부서만 표시

  // 포맷터 함수
  const formatCurrency = (value) => {
    return value.toLocaleString() + '원';
  };

  return (
    <>
      <Box sx={{ height: 220, mb: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            barSize={20} // 바 두께 조절
            layout="vertical" // 수평 바 차트로 변경
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value, name) => [
                value.toLocaleString(),
                name === 'count' ? '건수' : '예산'
              ]}
              labelFormatter={(label) => `부서: ${label}`}
              contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
            />
            <Bar
              dataKey="count"
              name="건수"
              fill="#5B8FF9" // 세련된 파란색으로 변경
              radius={[0, 4, 4, 0]} // 바 모서리 둥글게
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <TableContainer sx={{ maxHeight: 220, overflow: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>부서</TableCell>
              <TableCell align="right">건수</TableCell>
              <TableCell align="right">예산</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(countByDepartment)
              .sort((a, b) => b[1] - a[1]) // 건수 기준 내림차순 정렬
              .map(([dept, count]) => (
                <TableRow key={dept} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">{dept}</TableCell>
                  <TableCell align="right">{count.toLocaleString()}</TableCell>
                  <TableCell align="right">{formatCurrency(budgetByDepartment[dept] || 0)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default DepartmentSummary;