import React from 'react';
import { Link } from 'react-router-dom';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Typography
} from '@mui/material';

const RecentRequestsList = ({ requests }) => {
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

  if (requests.length === 0) {
    return (
      <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
        최근 구매요청이 없습니다.
      </Typography>
    );
  }

  return (
    <TableContainer sx={{ maxHeight: 350 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>요청번호</TableCell>
            <TableCell>요청명</TableCell>
            <TableCell>상태</TableCell>
            <TableCell align="right">예산</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.slice(0, 5).map((request) => (
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
                <Typography noWrap sx={{ maxWidth: 150 }}>
                  {request.requestName}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={request.statusDisplayName || request.status}
                  size="small"
                  sx={{
                    bgcolor: statusColors[request.status] || '#666',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </TableCell>
              <TableCell align="right">
                {request.businessBudget ?
                  `${request.businessBudget.toLocaleString()}원` :
                  '-'
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default RecentRequestsList;