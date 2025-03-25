// src/components/procurement/dashboard/DepartmentSummary.jsx
import React from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardContent,
  Typography,
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
    .sort((a, b) => b.count - a.count); // 건수 기준 내림차순 정렬

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
        <Typography variant="h6" gutterBottom color="primary">
          부서별 현황
        </Typography>

        <Box sx={{ height: 220, mb: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  value.toLocaleString(),
                  name === 'count' ? '건수' : '예산'
                ]}
              />
              <Bar dataKey="count" name="건수" fill="#82ca9d" />
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
              {Object.entries(countByDepartment).map(([dept, count]) => (
                <TableRow key={dept} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">{dept}</TableCell>
                  <TableCell align="right">{count.toLocaleString()}</TableCell>
                  <TableCell align="right">{(budgetByDepartment[dept] || 0).toLocaleString()}원</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default DepartmentSummary;