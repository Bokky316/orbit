// src/components/procurement/dashboard/BudgetSummary.jsx
import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
  Chip,
  Grid
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

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
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }
      }}
    >
      <CardContent>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            총 예산
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {formatCurrency(totalBudget)}
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            {/* 왼쪽 파이 차트 - 전체 예산 차트 */}
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: '진행중인 예산', value: pendingBudget, color: '#ff9800' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="#2196f3" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#2196f3' }}></Box>
                <Typography variant="caption">완료된 예산</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff9800' }}></Box>
                <Typography variant="caption">오청된</Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={6}>
            {/* 오른쪽 파이 차트 - 진행 예산 차트 */}
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: '완료된 예산', value: completedBudget, color: '#2196f3' },
                      { name: '진행중인 예산', value: pendingBudget, color: '#ff9800' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
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
                <Typography variant="caption">완수됨</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff9800' }}></Box>
                <Typography variant="caption">요청됨</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* 예산 테이블 */}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>상태</TableCell>
              <TableCell align="center">건수</TableCell>
              <TableCell align="right">예산</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                <Chip
                  label="완수됨"
                  size="small"
                  sx={{ bgcolor: '#2196f3', color: 'white' }}
                />
              </TableCell>
              <TableCell align="center">2</TableCell>
              <TableCell align="right">2원</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Chip
                  label="요청됨"
                  size="small"
                  sx={{ bgcolor: '#ff9800', color: 'white' }}
                />
              </TableCell>
              <TableCell align="center">7</TableCell>
              <TableCell align="right">{formatCurrency(pendingBudget)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default BudgetSummary;