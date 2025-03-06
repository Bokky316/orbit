// src/components/ProjectListPage.js

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setProjects,
  setSearchTerm,
  setStartDate,
  setEndDate,
  setStatus
} from '@redux/projectSlice';
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

/**
 * 스티키 헤더를 위한 스타일링된 TableContainer
 */
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
 * 프로젝트 목록 페이지 컴포넌트
 * @returns {JSX.Element}
 */
function ProjectListPage() {
  const dispatch = useDispatch();
  const projects = useSelector(state => state.project.projects);
  const filters = useSelector(state => state.project.filters);
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    // API 호출 및 데이터 로딩 (예시)
    const mockData = [
      { id: 'PRJ-001', name: 'A 프로젝트', manager: '홍길동', startDate: '2025-03-01', endDate: '2025-06-30', status: '진행중' },
      { id: 'PRJ-002', name: 'B 프로젝트', manager: '김철수', startDate: '2025-02-01', endDate: '2025-05-31', status: '완료' }
    ];
    dispatch(setProjects(mockData));
  }, [dispatch]);

  /**
   * 검색 및 필터링된 프로젝트 목록을 반환합니다.
   * @returns {array} 필터링된 프로젝트 목록
   */
  const getFilteredProjects = () => {
    return projects.filter(project => {
      const searchTermMatch = project.name.includes(localFilters.searchTerm) || project.manager.includes(localFilters.searchTerm);
      const startDateMatch = !localFilters.startDate || project.startDate >= localFilters.startDate;
      const endDateMatch = !localFilters.endDate || project.endDate <= localFilters.endDate;
      const statusMatch = !localFilters.status || project.status === localFilters.status;
      return searchTermMatch && startDateMatch && endDateMatch && statusMatch;
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
   * 시작 날짜 변경 핸들러
   * @param {object} event - 이벤트 객체
   */
  const handleStartDateChange = (event) => {
    setLocalFilters({ ...localFilters, startDate: event.target.value });
  };

  /**
   * 종료 날짜 변경 핸들러
   * @param {object} event - 이벤트 객체
   */
  const handleEndDateChange = (event) => {
    setLocalFilters({ ...localFilters, endDate: event.target.value });
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
    dispatch(setStartDate(localFilters.startDate));
    dispatch(setEndDate(localFilters.endDate));
    dispatch(setStatus(localFilters.status));
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>프로젝트 목록</Typography>

      {/* 검색 및 필터 섹션 */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="프로젝트명/담당자"
            variant="outlined"
            value={localFilters.searchTerm}
            onChange={handleSearchTermChange}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            label="시작일"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={localFilters.startDate}
            onChange={handleStartDateChange}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            label="종료일"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={localFilters.endDate}
            onChange={handleEndDateChange}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel id="status-label">상태</InputLabel>
            <Select
              labelId="status-label"
              value={localFilters.status}
              onChange={handleStatusChange}
              label="상태"
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="진행중">진행중</MenuItem>
              <MenuItem value="완료">완료</MenuItem>
              <MenuItem value="보류">보류</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
          <Button variant="contained" color="primary" onClick={handleApplyFilters}>
            검색
          </Button>
        </Grid>
      </Grid>

      {/* 프로젝트 목록 테이블 */}
      <Paper>
        <StyledTableContainer>
          <Table stickyHeader aria-label="프로젝트 목록 테이블">
            <TableHead>
              <TableRow>
                <TableCell>프로젝트 ID</TableCell>
                <TableCell>프로젝트명</TableCell>
                <TableCell>담당자</TableCell>
                <TableCell>시작일</TableCell>
                <TableCell>종료일</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>액션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredProjects().map(project => (
                <TableRow key={project.id} hover>
                  <TableCell>{project.id}</TableCell>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>{project.manager}</TableCell>
                  <TableCell>{project.startDate}</TableCell>
                  <TableCell>{project.endDate}</TableCell>
                  <TableCell>{project.status}</TableCell>
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

      {/* 새 프로젝트 생성 버튼 */}
      <Box sx={{ mt: 4 }}>
        <Button variant="contained" color="primary">
          새 프로젝트 생성
        </Button>
      </Box>
    </Box>
  );
}

export default ProjectListPage;
