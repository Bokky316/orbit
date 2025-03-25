// src/components/procurement/dashboard/BudgetSummary.jsx
import React from 'react';
import {
  Box,
  Typography,
  Divider,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const BudgetSummary = ({ totalBudget, completedBudget, pendingBudget }) => {
  const formatCurrency = (value) => {
    return value.toLocaleString() + '원';
  };

  // 완료율 계산
  const completionRate = totalBudget > 0 ? (completedBudget / totalBudget) * 100 : 0;
  const pendingRate = totalBudget > 0 ? (pendingBudget / totalBudget) * 100 : 0;

  // 차트 데이터
  const chartData = [
    { name: '완료된 예산', value: completedBudget, color: '#2196f3' },
    { name: '진행중인 예산', value: pendingBudget, color: '#ff9800' }
  ];

  return (
    <>
      {/* 제목 부분은 제거하고 대시보드에서 추가 */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold">
          {formatCurrency(totalBudget)}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, mt: 2 }}>
          <Typography variant="body2" color="text.secondary">완료된 예산</Typography>
          <Typography variant="body2" color="success.main" fontWeight="bold">
            {formatCurrency(completedBudget)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2">완료율</Typography>
          <Typography variant="body2" color="success.main">
            {completionRate.toFixed(1)}%
          </Typography>
        </Box>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">진행 예산</Typography>
          <Typography variant="body2" color="info.main" fontWeight="bold">
            {formatCurrency(pendingBudget)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2">진행률</Typography>
          <Typography variant="body2" color="info.main">
            {pendingRate.toFixed(1)}%
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          {/* 왼쪽 파이 차트 */}
          <Box sx={{ height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: '완료된 예산', value: completedBudget, color: '#2196f3' },
                    { name: '진행중인 예산', value: pendingBudget, color: '#ff9800' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#2196f3' }}></Box>
              <Typography variant="caption">완료됨</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff9800' }}></Box>
              <Typography variant="caption">진행중</Typography>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={6}>
          {/* 테이블 요약 정보 */}
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>
                  <Chip
                    label="완료됨"
                    size="small"
                    sx={{ bgcolor: '#2196f3', color: 'white' }}
                  />
                </TableCell>
                <TableCell align="right">{formatCurrency(completedBudget)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Chip
                    label="진행중"
                    size="small"
                    sx={{ bgcolor: '#ff9800', color: 'white' }}
                  />
                </TableCell>
                <TableCell align="right">{formatCurrency(pendingBudget)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Grid>
      </Grid>
    </>
  );
};

export default BudgetSummary;