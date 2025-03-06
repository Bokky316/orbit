// src/components/PurchaseRequestListPage.js

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setPurchaseRequests,
  setSearchTerm,
  setRequestDate,
  setStatus
} from '@redux/purchaseRequestSlice';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
 * 구매 요청 목록 페이지 컴포넌트
 * @returns {JSX.Element}
 */
function PurchaseRequestListPage() {
  const dispatch = useDispatch();
  const purchaseRequests = useSelector(state => state.purchaseRequest.purchaseRequests);
  const filters = useSelector(state => state.purchaseRequest.filters);
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    // API 호출 및 데이터 로딩 (예시)
    const mockData = [
      { id: 'REQ-001', project: 'A 프로젝트', requester: '홍길동', amount: 500000, requestDate: '2025-03-05', status: '대기중' },
      { id: 'REQ-002', project: 'B 프로젝트', requester: '김철수', amount: 1000000, requestDate: '2025-03-03', status: '승인됨' }
    ];
    dispatch(setPurchaseRequests(mockData));
  }, [dispatch]);

  /**
   * 검색 및 필터링된 구매 요청 목록을 반환합니다.
   * @returns {array} 필터링된 구매 요청 목록
   */
  const getFilteredPurchaseRequests = () => {
    return purchaseRequests.filter(request => {
      const searchTermMatch = request.id.includes(localFilters.searchTerm) || request.requester.includes(localFilters.searchTerm) || request.project.includes(localFilters.searchTerm);
      const requestDateMatch = !localFilters.requestDate || request.requestDate === localFilters.requestDate;
      const statusMatch = !localFilters.status || request.status === localFilters.status;
      return searchTermMatch && requestDateMatch && statusMatch;
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
   * 상태 변경 핸들러
   * @param {object} event - 이벤트 객체
   */
  const handleStatusChange = (event) => {
    setLocalFilters({ ...localFilters, status: event.target.value });
  };

  /**
   * 필터 적용 핸들러
   */
  const handleApplyFilters = () => {
    dispatch(setSearchTerm(localFilters.searchTerm));
    dispatch(setRequestDate(localFilters.requestDate));
    dispatch(setStatus(localFilters.status));
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>구매 요청 목록</Typography>

      {/* 검색 및 필터 섹션 */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="요청번호/요청자/프로젝트명"
            variant="outlined"
            value={localFilters.searchTerm}
            onChange={handleSearchTermChange}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="요청일"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={localFilters.requestDate}
            onChange={handleRequestDateChange}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel id="status-label">상태</InputLabel>
            <Select
              labelId="status-label"
              value={localFilters.status}
              onChange={handleStatusChange}
              label="상태"
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="대기중">대기중</MenuItem>
              <MenuItem value="승인됨">승인됨</MenuItem>
              <MenuItem value="반려됨">반려됨</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
          <Button variant="contained" color="primary" onClick={handleApplyFilters}>
            검색
          </Button>
        </Grid>
      </Grid>

      {/* 구매 요청 목록 테이블 */}
      <Paper>
        <StyledTableContainer>
          <Table stickyHeader aria-label="구매 요청 목록 테이블">
            <TableHead>
              <TableRow>
                <TableCell>요청번호</TableCell>
                <TableCell>프로젝트명</TableCell>
                <TableCell>요청자</TableCell>
                <TableCell>총금액</TableCell>
                <TableCell>요청일</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>액션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredPurchaseRequests().map(request => (
                <TableRow key={request.id} hover>
                  <TableCell>{request.id}</TableCell>
                  <TableCell>{request.project}</TableCell>
                  <TableCell>{request.requester}</TableCell>
                  <TableCell>{request.amount.toLocaleString()}원</TableCell>
                  <TableCell>{request.requestDate}</TableCell>
                  <TableCell>{request.status}</TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined">
                      상세보기
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </StyledTableContainer>
      </Paper>

      {/* 새 구매 요청 버튼 */}
      <Box sx={{ mt: 4 }}>
        <Button variant="contained" color="primary">
          새 구매 요청
        </Button>
      </Box>
    </Box>
  );
}

export default PurchaseRequestListPage;
