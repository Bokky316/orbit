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
 * 프로젝트 상세 페이지 컴포넌트
 * @returns {JSX.Element}
 */
function ProjectDetailPage() {
  // 임시 데이터 (실제로는 API에서 가져올 예정)
  const project = {
    id: 'PRJ-001',
    name: 'A 프로젝트',
    manager: '홍길동',
    startDate: '2025-03-01',
    endDate: '2025-06-30',
    status: '진행중',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.'
  };

  const purchaseRequests = [
    { id: 'REQ-001', name: '장비 구매', status: '승인 대기' },
    { id: 'REQ-002', name: '소프트웨어 라이선스', status: '승인됨' }
  ];

  return (
    <Box sx={{ p: 4 }}>
      {/* 프로젝트 기본 정보 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>프로젝트 정보</Typography>
        <Typography>프로젝트 ID: {project.id}</Typography>
        <Typography>프로젝트명: {project.name}</Typography>
        <Typography>담당자: {project.manager}</Typography>
        <Typography>시작일: {project.startDate}</Typography>
        <Typography>종료일: {project.endDate}</Typography>
        <Typography>상태: {project.status}</Typography>
      </Paper>

      {/* 프로젝트 설명 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>프로젝트 설명</Typography>
        <Typography>{project.description}</Typography>
      </Paper>

      {/* 관련 구매 요청 목록 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>관련 구매 요청</Typography>
        <TableContainer>
          <Table aria-label="관련 구매 요청 테이블">
            <TableHead>
              <TableRow>
                <TableCell>요청번호</TableCell>
                <TableCell>요청명</TableCell>
                <TableCell>상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseRequests.map(request => (
                <TableRow key={request.id}>
                  <TableCell>{request.id}</TableCell>
                  <TableCell>{request.name}</TableCell>
                  <TableCell>{request.status}</TableCell>
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
        <Button variant="outlined" color="error">
          삭제
        </Button>
      </Box>
    </Box>
  );
}

export default ProjectDetailPage;
