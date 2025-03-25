import React from 'react';
import {
  Box,
  Typography,
  TableContainer,
  Table,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const PurchaseRequestStats = ({ stats }) => {
  // 상태별 색상 매핑
  const statusColors = {
    'TOTAL': '#1976d2',
    'IN_PROGRESS': '#ff9800',
    'COMPLETED': '#4caf50',
    'REJECTED': '#f44336'
  };

  // 차트 데이터 준비
  const chartData = [
    { 
      name: '진행중', 
      value: stats.inProgressRequests || 0, 
      color: statusColors.IN_PROGRESS 
    },
    { 
      name: '완료', 
      value: stats.completedRequests || 0, 
      color: statusColors.COMPLETED 
    },
    { 
      name: '반려', 
      value: stats.rejectedRequests || 0, 
      color: statusColors.REJECTED 
    }
  ].filter(item => item.value > 0);

  return (
    <>
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
                `${value.toLocaleString()}건`,
                name
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell>총 요청</TableCell>
              <TableCell align="right">
                {(stats.totalRequests || 0).toLocaleString()}건
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: statusColors.IN_PROGRESS }}>진행중</TableCell>
              <TableCell align="right" sx={{ color: statusColors.IN_PROGRESS }}>
                {(stats.inProgressRequests || 0).toLocaleString()}건
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: statusColors.COMPLETED }}>완료</TableCell>
              <TableCell align="right" sx={{ color: statusColors.COMPLETED }}>
                {(stats.completedRequests || 0).toLocaleString()}건
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: statusColors.REJECTED }}>반려</TableCell>
              <TableCell align="right" sx={{ color: statusColors.REJECTED }}>
                {(stats.rejectedRequests || 0).toLocaleString()}건
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default PurchaseRequestStats;