// src/components/procurement/dashboard/PendingRequestsList.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Card,
  CardContent,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Box
} from '@mui/material';

const PendingRequestsList = ({ requests }) => {
  // 상태 코드별 색상 매핑
  const statusColors = {
    'REQUESTED': '#ff9800',
    'RECEIVED': '#2196f3',
    'VENDOR_SELECTION': '#9c27b0',
    'CONTRACT_PENDING': '#f44336',
    'INSPECTION': '#4caf50',
    'INVOICE_ISSUED': '#795548',
    'PAYMENT_COMPLETED': '#3f51b5'
  };

  // 요청일로부터 경과일 계산 및 표시 스타일
  const getElapsedDaysStyle = (days) => {
    if (days > 7) {
      return { color: '#f44336', fontWeight: 'bold' };
    } else if (days > 3) {
      return { color: '#ff9800', fontWeight: 'bold' };
    }
    return { color: '#4caf50' };
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: '1px solid #e0e0e0',
        borderRadius: 2
      }}
    >
      <CardContent>
        <Typography variant="h6" gutterBottom color="primary">
          처리 대기 중인 요청
        </Typography>
        <TableContainer sx={{ overflow: 'auto', maxHeight: 350 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>요청번호</TableCell>
                <TableCell>요청명</TableCell>
                <TableCell>부서</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>요청일</TableCell>
                <TableCell>경과</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.length > 0 ? (
                requests.map((request) => {
                  // 요청일로부터 경과일 계산
                  const requestDate = new Date(request.requestDate);
                  const today = new Date();
                  const diffTime = Math.abs(today - requestDate);
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  return (
                    <TableRow
                      key={request.id}
                      hover
                      component={Link}
                      to={`/purchase-requests/${request.id}`}
                      sx={{
                        cursor: 'pointer',
                        textDecoration: 'none',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <TableCell>{request.requestNumber}</TableCell>
                      <TableCell>
                        <Typography noWrap sx={{ maxWidth: 120 }}>
                          {request.requestName}
                        </Typography>
                      </TableCell>
                      <TableCell>{request.businessDepartment}</TableCell>
                      <TableCell>
                        <Chip
                          label={request.statusDisplayName}
                          size="small"
                          sx={{
                            bgcolor: statusColors[request.status],
                            color: '#fff',
                            fontWeight: 'bold'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {request.requestDate && format(new Date(request.requestDate), 'yyyy-MM-dd', { locale: ko })}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={getElapsedDaysStyle(diffDays)}>
                          {diffDays}일 경과
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">처리 대기중인 요청이 없습니다.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default PendingRequestsList;