import React from 'react';
import {
  Box,
  Typography,
  TableContainer,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Chip
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const StatusSummary = ({ stats }) => {
  // 상태별 색상 매핑
  const statusColors = {
    'TOTAL': '#1976d2',
    'IN_PROGRESS': '#ff9800',
    'COMPLETED': '#4caf50',
    'REJECTED': '#f44336'
  };

  // 상태 이름 매핑
  const statusNames = {
    'IN_PROGRESS': '진행중',
    'COMPLETED': '완료',
    'REJECTED': '반려'
  };

  // 차트 데이터 준비
  const chartData = [
    {
      name: statusNames.IN_PROGRESS,
      value: stats.inProgressRequests || 0,
      color: statusColors.IN_PROGRESS
    },
    {
      name: statusNames.COMPLETED,
      value: stats.completedRequests || 0,
      color: statusColors.COMPLETED
    },
    {
      name: statusNames.REJECTED,
      value: stats.rejectedRequests || 0,
      color: statusColors.REJECTED
    }
  ].filter(item => item.value > 0);

  // 총 요청 수 계산
  const totalRequests = (stats.totalRequests || 0);

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
                `${value.toLocaleString()}건 (${(value/totalRequests*100).toFixed(1)}%)`,
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
              <TableCell>
                <Chip
                  label="총 요청"
                  size="small"
                  sx={{
                    bgcolor: statusColors.TOTAL,
                    color: 'white'
                  }}
                />
              </TableCell>
              <TableCell align="right">
                {(stats.totalRequests || 0).toLocaleString()}건
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Chip
                  label={statusNames.IN_PROGRESS}
                  size="small"
                  sx={{
                    bgcolor: statusColors.IN_PROGRESS,
                    color: 'white'
                  }}
                />
              </TableCell>
              <TableCell
                align="right"
                sx={{ color: statusColors.IN_PROGRESS }}
              >
                {(stats.inProgressRequests || 0).toLocaleString()}건
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Chip
                  label={statusNames.COMPLETED}
                  size="small"
                  sx={{
                    bgcolor: statusColors.COMPLETED,
                    color: 'white'
                  }}
                />
              </TableCell>
              <TableCell
                align="right"
                sx={{ color: statusColors.COMPLETED }}
              >
                {(stats.completedRequests || 0).toLocaleString()}건
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Chip
                  label={statusNames.REJECTED}
                  size="small"
                  sx={{
                    bgcolor: statusColors.REJECTED,
                    color: 'white'
                  }}
                />
              </TableCell>
              <TableCell
                align="right"
                sx={{ color: statusColors.REJECTED }}
              >
                {(stats.rejectedRequests || 0).toLocaleString()}건
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default StatusSummary;