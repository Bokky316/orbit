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
import { format } from 'date-fns';

const RecentRequestsList = ({ requests }) => {
  const statusColors = {
    REQUESTED: '#ff9800',
    RECEIVED: '#2196f3',
    VENDOR_SELECTION: '#9c27b0',
    CONTRACT_PENDING: '#f44336',
    INSPECTION: '#4caf50',
    INVOICE_ISSUED: '#795548',
    PAYMENT_COMPLETED: '#3f51b5',
    REJECTED: '#d32f2f'
  };

  if (requests.length === 0) {
    return (
      <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
        해당 상태의 구매요청이 없습니다.
      </Typography>
    );
  }

  return (
    <TableContainer sx={{ maxHeight: 350 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>요청일</TableCell>
            <TableCell>요청번호</TableCell>
            <TableCell>요청명</TableCell>
            <TableCell>상태</TableCell>
            <TableCell align="right">금액</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map((request) => (
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
              <TableCell>
                {request.requestDate ? format(new Date(request.requestDate), 'yyyy-MM-dd') : '-'}
              </TableCell>
              <TableCell>{request.requestNumber || '-'}</TableCell>
              <TableCell>{request.requestName || '-'}</TableCell>
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
                {request.businessBudget ? `${request.businessBudget.toLocaleString()}원` : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default RecentRequestsList;