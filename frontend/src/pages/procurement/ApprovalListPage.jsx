// src/components/ApprovalListPage.js

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setApprovals,
  setSearchTerm,
  setRequestDate
} from '@redux/approvalSlice';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Box,
  Typography,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  maxHeight: 440,
  '& .MuiTableHead-root': {
    position: 'sticky',
    top: 0,
    backgroundColor: theme.palette.background.paper,
    zIndex: 1,
  }
}));

/**
 * 결재 대기 목록 페이지 컴포넌트
 * @returns {JSX.Element}
 */
function ApprovalListPage() {
  const dispatch = useDispatch();
  const approvals = useSelector(state => state.approval.approvals);
  const filters = useSelector(state => state.approval.filters);
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    // API 호출 및 데이터 로딩 (예시)
    const mockData = [
      { id: 'REQ-001', project: 'A 프로젝트', requester: '홍길동', amount: 500000, requestDate: '2025-03-05' },
      { id: 'REQ-003', project: 'C 프로젝트', requester: '이영희', amount: 750000, requestDate: '2025-03-06' }
    ];
    dispatch(setApprovals(mockData));
  }, [dispatch]);

  /**
   * 검색 및 필터링된 결재 대기 목록을 반환합니다.
   * @returns {array} 필터링된 결재 대기 목록
   */
  const getFilteredApprovals = () => {
    return approvals.filter(approval => {
      const searchTermMatch = approval.id.includes(localFilters.searchTerm) || approval.requester.includes(localFilters.searchTerm) || approval.project.includes(localFilters.searchTerm);
      const requestDateMatch = !localFilters.requestDate || approval.requestDate === localFilters.requestDate;
      return searchTermMatch && requestDateMatch;
    });
  };

  /**
   * 검색어 변경 핸들러
   * @param {object} event - 이벤트 객체
   */
  const handleSearchTermChange = (event) => {
    setLocalFilters({ ...localFilters, searchTerm: event.target.value });
  };

  /**
   * 요청일 변경 핸들러
   * @param {object} event - 이벤트 객체
   */
  const handleRequestDateChange = (event) => {
    setLocalFilters({ ...localFilters, requestDate: event.target.value });
  };

  /**
   * 필터 적용 핸들러
   */
  const handleApplyFilters = () => {
    dispatch(setSearchTerm(localFilters.searchTerm));
    dispatch(setRequestDate(localFilters.requestDate));
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>결재 대기 목록</Typography>

      {/* 검색 및 필터 섹션 */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="요청번호/요청자/프로젝트명"
            variant="outlined"
            value={localFilters.searchTerm}
            onChange={handleSearchTermChange}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="요청일"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={localFilters.requestDate}
            onChange={handleRequestDateChange}
          />
        </Grid>
        <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
          <Button variant="contained" color="primary" onClick={handleApplyFilters}>
            검색
          </Button>
        </Grid>
      </Grid>

      {/* 결재 대기 목록 테이블 */}
      <Paper>
        <StyledTableContainer>
          <Table stickyHeader aria-label="결재 대기 목록 테이블">
            <TableHead>
              <TableRow>
                <TableCell>요청번호</TableCell>
                <TableCell>프로젝트명</TableCell>
                <TableCell>요청자</TableCell>
                <TableCell>총금액</TableCell>
                <TableCell>요청일</TableCell>
                <TableCell>액션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredApprovals().map(approval => (
                <TableRow key={approval.id} hover>
                  <TableCell>{approval.id}</TableCell>
                  <TableCell>{approval.project}</TableCell>
                  <TableCell>{approval.requester}</TableCell>
                  <TableCell>{approval.amount.toLocaleString()}원</TableCell>
                  <TableCell>{approval.requestDate}</TableCell>
                  <TableCell>
                    <Button size="small" variant="contained" color="success">
                      승인
                    </Button>
                    <Button size="small" variant="contained" color="error">
                      반려
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </StyledTableContainer>
      </Paper>
    </Box>
  );
}

export default ApprovalListPage;
