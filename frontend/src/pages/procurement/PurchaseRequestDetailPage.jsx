// src/components/PurchaseRequestDetailPage.js

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';

/**
 * 구매 요청 상세 페이지 컴포넌트
 * @returns {JSX.Element}
 */
function PurchaseRequestDetailPage() {
  // 임시 데이터 (실제로는 API에서 가져올 예정)
  const request = {
    id: 'REQ-001',
    project: 'A 프로젝트',
    requester: '홍길동',
    amount: 500000,
    requestDate: '2025-03-05',
    status: '대기중'
  };

  const items = [
    { name: '품목 A', quantity: 2, unitPrice: 100000, amount: 200000 },
    { name: '품목 B', quantity: 3, unitPrice: 100000, amount: 300000 }
  ];

  const approvals = [
    { approver: '김부장', status: '대기중' },
    { approver: '이사장', status: '대기중' }
  ];

  return (
    <Box sx={{ p: 4 }}>
      {/* 구매 요청 기본 정보 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>구매 요청 정보</Typography>
        <Typography>요청번호: {request.id}</Typography>
        <Typography>프로젝트명: {request.project}</Typography>
        <Typography>요청자: {request.requester}</Typography>
        <Typography>총금액: {request.amount.toLocaleString()}원</Typography>
        <Typography>요청일: {request.requestDate}</Typography>
        <Typography>상태: {request.status}</Typography>
      </Paper>

      {/* 요청 품목 목록 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>요청 품목</Typography>
        <TableContainer>
          <Table aria-label="요청 품목 테이블">
            <TableHead>
              <TableRow>
                <TableCell>품목명</TableCell>
                <TableCell>수량</TableCell>
                <TableCell>단가</TableCell>
                <TableCell>금액</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.name}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.unitPrice.toLocaleString()}원</TableCell>
                  <TableCell>{item.amount.toLocaleString()}원</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 결재 정보 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>결재 정보</Typography>
        <TableContainer>
          <Table aria-label="결재 정보 테이블">
            <TableHead>
              <TableRow>
                <TableCell>결재자</TableCell>
                <TableCell>상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {approvals.map(approval => (
                <TableRow key={approval.approver}>
                  <TableCell>{approval.approver}</TableCell>
                  <TableCell>{approval.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 액션 버튼 */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" color="primary">
          수정
        </Button>
        <Button variant="contained" color="primary">
          결재 요청
        </Button>
      </Box>
    </Box>
  );
}

export default PurchaseRequestDetailPage;
