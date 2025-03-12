// src/pages/approval/ApprovalManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Paper, Tabs, Tab, TextField, Button, Grid, Chip, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import moment from 'moment';

import {
  fetchApprovals,
  processApproval,
  fetchPendingApprovalsAction,
  fetchCompletedApprovalsAction
} from '@/redux/approvalSlice';

// 탭 패널 컴포넌트
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`approval-tabpanel-${index}`}
      aria-labelledby={`approval-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// 상태별 스타일 지정
const StatusChip = styled(Chip)(({ theme, status }) => {
  const getStatusColor = () => {
    switch(status) {
      case 'APPROVED':
      case '승인완료':
        return theme.palette.success.main;
      case 'REJECTED':
      case '반려':
        return theme.palette.error.main;
      case 'IN_REVIEW':
      case '검토중':
        return theme.palette.warning.main;
      case 'PENDING':
      case '대기중':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return {
    backgroundColor: getStatusColor(),
    color: theme.palette.getContrastText(getStatusColor()),
    fontWeight: 'bold'
  };
});

/**
 * 결재 관리 페이지 컴포넌트
 * 사용자의 결재 대기/완료 목록을 조회하고 관리하는 페이지
 * @returns {JSX.Element}
 */
function ApprovalManagementPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 리덕스 상태
  const {
    approvals,
    pendingApprovals,
    completedApprovals,
    loading,
    error
  } = useSelector(state => state.approval);
  const currentUser = useSelector(state => state.auth.user);

  // 로컬 상태
  const [tabValue, setTabValue] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [businessType, setBusinessType] = useState('ALL');
  const [dateRange, setDateRange] = useState({
    startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD')
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [processing, setProcessing] = useState(false);

  // 컴포넌트 마운트 시 결재 목록 조회
  useEffect(() => {
    dispatch(fetchApprovals());
    dispatch(fetchPendingApprovalsAction());
    dispatch(fetchCompletedApprovalsAction());
  }, [dispatch]);

  // 결재 상태별 필터링
  const currentApprovals = tabValue === 0
    ? pendingApprovals.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : completedApprovals.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const totalApprovals = tabValue === 0
    ? pendingApprovals.length
    : completedApprovals.length;

  // 검색어 변경 핸들러
  const handleSearchChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  // 사업 구분 변경 핸들러
  const handleBusinessTypeChange = (e) => {
    setBusinessType(e.target.value);
  };

  // 날짜 범위 변경 핸들러
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value
    });
  };

  // 탭 변경 핸들러
  const handleTabChange = (e, newValue) => {
    setTabValue(newValue);
    setPage(0); // 탭 변경 시 페이지 초기화
  };

  // 페이지 변경 핸들러
  const handleChangePage = (e, newPage) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경 핸들러
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // 결재 승인 핸들러
  const handleApprove = async (lineId) => {
    try {
      setProcessing(true);
      await dispatch(processApproval({
        lineId,
        action: 'APPROVE',
        comment: '승인합니다.',
        nextStatusCode: 'APPROVAL-STATUS-APPROVED'
      })).unwrap();

      // 결재 목록 다시 조회
      dispatch(fetchApprovals());
      dispatch(fetchPendingApprovalsAction());
      dispatch(fetchCompletedApprovalsAction());
      setProcessing(false);
    } catch (err) {
      console.error('결재 승인 중 오류 발생:', err);
      setProcessing(false);
      alert('결재 승인 중 오류가 발생했습니다.');
    }
  };

  // 결재 반려 핸들러
  const handleReject = async (lineId) => {
    try {
      setProcessing(true);
      await dispatch(processApproval({
        lineId,
        action: 'REJECT',
        comment: '반려합니다.',
        nextStatusCode: 'APPROVAL-STATUS-REJECTED'
      })).unwrap();

      // 결재 목록 다시 조회
      dispatch(fetchApprovals());
      dispatch(fetchPendingApprovalsAction());
      dispatch(fetchCompletedApprovalsAction());
      setProcessing(false);
    } catch (err) {
      console.error('결재 반려 중 오류 발생:', err);
      setProcessing(false);
      alert('결재 반려 중 오류가 발생했습니다.');
    }
  };

  // 결재 상세 조회 핸들러
  const handleViewDetail = (requestId) => {
    navigate(`/purchase-requests/${requestId}`);
  };

  // 상태 코드에 따른 한글 상태명 반환
  const getStatusName = (statusCode) => {
    switch(statusCode) {
      case 'APPROVED': return '승인완료';
      case 'REJECTED': return '반려';
      case 'IN_REVIEW': return '검토중';
      case 'PENDING': return '대기중';
      default: return statusCode;
    }
  };

  // 날짜 형식 변환
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return moment(dateString).format('YYYY-MM-DD');
  };

  // 로딩 표시
  if (loading && approvals.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // 에러 표시
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        결재 관리
      </Typography>

      {/* 검색 및 필터 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              placeholder="검색어"
              value={searchKeyword}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="business-type-label">사업 구분</InputLabel>
              <Select
                labelId="business-type-label"
                value={businessType}
                label="사업 구분"
                onChange={handleBusinessTypeChange}
              >
                <MenuItem value="ALL">전체</MenuItem>
                <MenuItem value="SI">SI</MenuItem>
                <MenuItem value="MAINTENANCE">유지보수</MenuItem>
                <MenuItem value="GOODS">물품</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              type="date"
              label="시작일"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateRangeChange}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              type="date"
              label="종료일"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateRangeChange}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<FilterListIcon />}
              onClick={() => {
                dispatch(fetchApprovals());
                dispatch(fetchPendingApprovalsAction());
                dispatch(fetchCompletedApprovalsAction());
              }}
              disabled={processing}
            >
              필터 적용
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 탭 메뉴 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label={`대기 (${pendingApprovals.length})`} />
          <Tab label={`완료 (${completedApprovals.length})`} />
        </Tabs>

        {/* 대기 중인 결재 */}
        <TabPanel value={tabValue} index={0}>
          {currentApprovals.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="textSecondary">
                대기 중인 결재가 없습니다.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>요청일</TableCell>
                      <TableCell>요청자</TableCell>
                      <TableCell>제목</TableCell>
                      <TableCell>구분</TableCell>
                      <TableCell>상태</TableCell>
                      <TableCell>액션</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentApprovals.map((approval) => (
                      <TableRow key={approval.id} hover>
                        <TableCell>
                          {formatDate(approval.purchaseRequest?.requestDate)}
                        </TableCell>
                        <TableCell>
                          {approval.purchaseRequest?.memberName || '-'}
                        </TableCell>
                        <TableCell>
                          {approval.purchaseRequest?.requestName || '-'}
                        </TableCell>
                        <TableCell>
                          {approval.purchaseRequest?.businessType || '-'}
                        </TableCell>
                        <TableCell>
                          <StatusChip
                            label={getStatusName(approval.statusCode)}
                            status={approval.statusCode}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="상세보기">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleViewDetail(approval.purchaseRequest?.id)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {approval.statusCode === 'IN_REVIEW' && (
                              <>
                                <Tooltip title="승인">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleApprove(approval.id)}
                                    disabled={processing}
                                  >
                                    <CheckIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="반려">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleReject(approval.id)}
                                    disabled={processing}
                                  >
                                    <ClearIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={totalApprovals}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="페이지당 행 수"
              />
            </>
          )}
        </TabPanel>

        {/* 완료된 결재 */}
        <TabPanel value={tabValue} index={1}>
          {currentApprovals.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="textSecondary">
                완료된 결재가 없습니다.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>요청일</TableCell>
                      <TableCell>요청자</TableCell>
                      <TableCell>제목</TableCell>
                      <TableCell>구분</TableCell>
                      <TableCell>상태</TableCell>
                      <TableCell>결재일</TableCell>
                      <TableCell>액션</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentApprovals.map((approval) => (
                      <TableRow key={approval.id} hover>
                        <TableCell>
                          {formatDate(approval.purchaseRequest?.requestDate)}
                        </TableCell>
                        <TableCell>
                          {approval.purchaseRequest?.memberName || '-'}
                        </TableCell>
                        <TableCell>
                          {approval.purchaseRequest?.requestName || '-'}
                        </TableCell>
                        <TableCell>
                          {approval.purchaseRequest?.businessType || '-'}
                        </TableCell>
                        <TableCell>
                          <StatusChip
                            label={getStatusName(approval.statusCode)}
                            status={approval.statusCode}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {formatDate(approval.approvedAt)}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="상세보기">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewDetail(approval.purchaseRequest?.id)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={totalApprovals}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="페이지당 행 수"
              />
            </>
          )}
        </TabPanel>
      </Paper>

      {/* 통계 정보 */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          결재 통계
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Typography variant="h6">전체</Typography>
              <Typography variant="h4">{approvals.length}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
              <Typography variant="h6">대기중</Typography>
              <Typography variant="h4">
                {approvals.filter(a => a.statusCode === 'PENDING' || a.statusCode === 'IN_REVIEW').length}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
              <Typography variant="h6">승인</Typography>
              <Typography variant="h4">
                {approvals.filter(a => a.statusCode === 'APPROVED').length}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'error.contrastText' }}>
              <Typography variant="h6">반려</Typography>
              <Typography variant="h4">
                {approvals.filter(a => a.statusCode === 'REJECTED').length}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default ApprovalManagementPage;
