// src/components/procurement/dashboard/StatusSummary.jsx
import React from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Box,
  Typography
} from '@mui/material';
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

  // 전체 건수 계산
  const totalCount = Object.values(countByStatus).reduce((sum, count) => sum + count, 0);

  return (
    <div className="status-summary">
      <Box sx={{ height: 250, mb: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${value.toLocaleString()}건 (${(value/totalCount*100).toFixed(1)}%)`,
                name
              ]}
            />
            <Legend layout="vertical" verticalAlign="middle" align="right" />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>상태</TableCell>
              <TableCell align="right">건수</TableCell>
              <TableCell align="right">예산</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(countByStatus).map(([status, count]) => (
              <TableRow key={status}>
                <TableCell>
                  <Chip
                    label={statusDisplayName[status] || status}
                    size="small"
                    sx={{
                      bgcolor: statusColors[status],
                      color: '#fff',
                      fontWeight: 'bold'
                    }}
                  />
                </TableCell>
                <TableCell align="right">{count.toLocaleString()}</TableCell>
                <TableCell align="right">
                  {(budgetByStatus[status] || 0).toLocaleString()}원
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default StatusSummary;