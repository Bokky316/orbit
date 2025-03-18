import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';

// 스타일 컴포넌트
const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: theme.shadows[2]
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

// 송장 상태에 따른 Chip 색상 및 라벨
const getStatusProps = (status) => {
  switch(status) {
    case 'WAITING':
      return { color: 'warning', label: '대기' };
    case 'PAID':
      return { color: 'success', label: '지불완료' };
    case 'OVERDUE':
      return { color: 'error', label: '연체' };
    default:
      return { color: 'default', label: status };
  }
};

// 금액 형식 변환 함수
const formatCurrency = (amount) => {
  if (!amount) return '0원';
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

const InvoicesListPage = () => {
  const navigate = useNavigate();

  // Redux 상태에서 인증 정보 가져오기
  const auth = useSelector((state) => state.auth);
  const currentUser = auth?.user;
  const isLoggedIn = auth?.isLoggedIn;

  // 상태 관리
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('issueDate');
  const [sortDir, setSortDir] = useState('desc');
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  // 통계 정보
  const [statistics, setStatistics] = useState({
    totalCount: 0,
    waitingCount: 0,
    paidCount: 0,
    overdueCount: 0,
    totalAmount: 0,
    waitingAmount: 0,
    paidAmount: 0,
    overdueAmount: 0
  });

  // 역할 확인 유틸리티 함수
  const isAdmin = () => {
    return currentUser?.roles?.includes('ROLE_ADMIN') || currentUser?.role === 'ADMIN';
  };

  const isBuyer = () => {
    return currentUser?.roles?.includes('ROLE_BUYER') || currentUser?.role === 'BUYER';
  };

  const isSupplier = () => {
    return currentUser?.roles?.includes('ROLE_SUPPLIER') || currentUser?.role === 'SUPPLIER';
  };

  // username이 001로 시작하는지 확인 (구매관리팀)
  const isPurchaseDept = () => {
    if (!currentUser?.username) return false;
    return currentUser.username.startsWith('001');
  };

  // 송장에 대한 접근 권한 확인
  const canAccessInvoice = (invoice) => {
    if (!currentUser) return false;

    // ADMIN은 모든 데이터 접근 가능
    if (isAdmin()) return true;

    // BUYER(구매관리팀)은 모든 데이터 접근 가능
    if (isBuyer() && isPurchaseDept()) return true;

    // SUPPLIER는 자사 관련 데이터만 접근 가능
    if (isSupplier()) {
      return invoice.supplierName === currentUser.companyName ||
             invoice.supplierName.includes(currentUser.name);
    }

    // 그 외 BUYER는 관련 데이터만 접근
    if (isBuyer()) {
      return true; // 일반적으로 BUYER는 모든 송장 접근 가능
    }

    return false;
  };

  // 송장 등록 권한 확인
  const canCreateInvoice = () => {
    if (!isLoggedIn || !currentUser) return false;

    // ADMIN은 항상 가능
    if (isAdmin()) return true;

    // BUYER(구매관리팀)도 가능
    if (isBuyer() && isPurchaseDept()) return true;

    return false;
  };

  // 데이터 로드 함수
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('searchTerm', searchTerm);
      params.append('page', page);
      params.append('size', rowsPerPage);
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDir);

      const response = await fetchWithAuth(`${API_URL}invoices/list?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`송장 목록 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('API 응답 데이터:', data);

      if (data) {
        // 송장 데이터 설정
        if (data.invoices) {
          setInvoices(data.invoices);
          setFilteredInvoices(data.invoices);
        }

        // 페이지네이션 정보 설정
        if (data.totalPages) setTotalPages(data.totalPages);
        if (data.currentPage !== undefined) setPage(data.currentPage);
        if (data.totalItems) setTotalElements(data.totalItems);

        // 통계 정보 설정
        if (data.statistics) {
          setStatistics(data.statistics);
        }
      } else {
        throw new Error('송장 목록 조회 실패');
      }
    } catch (error) {
      console.error('송장 목록을 불러오는 중 오류 발생:', error);
      setInvoices([]);
      setFilteredInvoices([]);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  // 통계 정보 별도 로드 함수
  const fetchStatistics = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}invoices/statistics`);

      if (!response.ok) {
        throw new Error(`통계 조회 실패: ${response.status}`);
      }

      const stats = await response.json();
      setStatistics(stats);
    } catch (error) {
      console.error('통계를 불러오는 중 오류 발생:', error);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      fetchInvoices();
      fetchStatistics();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, currentUser, page, rowsPerPage, sortBy, sortDir]);

  // 이벤트 핸들러
  const handleSearch = () => {
    setPage(0);
    fetchInvoices();
  };

  const handleRefresh = () => {
    fetchInvoices();
    fetchStatistics();
  };

  const handleCreateInvoice = () => {
    navigate('/invoices/create');
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleSortChange = (field, direction) => {
    setSortBy(field);
    setSortDir(direction);
    setPage(0);
  };

  const handleCloseError = () => {
    setShowError(false);
  };

  // 송장 상세 페이지로 이동
  const handleViewInvoice = (invoice) => {
    if (!canAccessInvoice(invoice)) {
      setError('접근 권한이 없습니다.');
      setShowError(true);
      return;
    }

    navigate(`/invoices/${invoice.id}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* 에러 메시지 표시 */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* 제목과 송장 발행 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          송장 목록
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {canCreateInvoice() && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateInvoice}
            >
              새 송장 발행
            </Button>
          )}
        </Box>
      </Box>

      {/* 요약 카드 섹션 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                총 송장
              </Typography>
              <Typography variant="h4">{statistics.totalCount}건</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                총액: {formatCurrency(statistics.totalAmount)}
              </Typography>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                대기 중
              </Typography>
              <Typography variant="h4" color="warning.main">{statistics.waitingCount}건</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                총액: {formatCurrency(statistics.waitingAmount)}
              </Typography>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                지불 완료
              </Typography>
              <Typography variant="h4" color="success.main">{statistics.paidCount}건</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                총액: {formatCurrency(statistics.paidAmount)}
              </Typography>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                연체
              </Typography>
              <Typography variant="h4" color="error.main">{statistics.overdueCount}건</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                총액: {formatCurrency(statistics.overdueAmount)}
              </Typography>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* 검색 및 필터 섹션 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="송장번호, 공급업체명으로 검색"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>상태</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="상태"
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="WAITING">대기</MenuItem>
                <MenuItem value="PAID">지불완료</MenuItem>
                <MenuItem value="OVERDUE">연체</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>정렬</InputLabel>
              <Select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-');
                  handleSortChange(field, direction);
                }}
                label="정렬"
              >
                <MenuItem value="issueDate-desc">발행일 (최신순)</MenuItem>
                <MenuItem value="issueDate-asc">발행일 (오래된순)</MenuItem>
                <MenuItem value="dueDate-asc">마감일 (오래된순)</MenuItem>
                <MenuItem value="dueDate-desc">마감일 (최신순)</MenuItem>
                <MenuItem value="totalAmount-desc">금액 (높은순)</MenuItem>
                <MenuItem value="totalAmount-asc">금액 (낮은순)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              onClick={handleSearch}
              fullWidth
            >
              검색
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 송장 목록 테이블 */}
      <Paper variant="outlined">
        <TableContainer>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell align="center">송장 번호</TableCell>
                  <TableCell align="center">입고 번호</TableCell>
                  <TableCell align="center">발행일</TableCell>
                  <TableCell align="center">마감일</TableCell>
                  <TableCell align="center">공급업체</TableCell>
                  <TableCell align="center">공급가액</TableCell>
                  <TableCell align="center">부가세</TableCell>
                  <TableCell align="center">총액</TableCell>
                  <TableCell align="center">상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <StyledTableRow
                      key={invoice.id}
                      hover
                      onClick={() => handleViewInvoice(invoice)}
                      sx={{
                        cursor: canAccessInvoice(invoice) ? 'pointer' : 'not-allowed',
                        opacity: canAccessInvoice(invoice) ? 1 : 0.5
                      }}
                    >
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.deliveryNumber || '-'}</TableCell>
                      <TableCell>{invoice.issueDate}</TableCell>
                      <TableCell>{invoice.dueDate}</TableCell>
                      <TableCell>{invoice.supplierName}</TableCell>
                      <TableCell align="right">{formatCurrency(invoice.supplyPrice)}</TableCell>
                      <TableCell align="right">{formatCurrency(invoice.vat)}</TableCell>
                      <TableCell align="right">{formatCurrency(invoice.totalAmount)}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getStatusProps(invoice.status).label}
                          color={getStatusProps(invoice.status).color}
                          size="small"
                        />
                      </TableCell>
                    </StyledTableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      표시할 송장이 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행 수"
        />
      </Paper>

      {/* 디버깅 정보 (개발 환경에서만 표시) */}
      {process.env.NODE_ENV === 'development' && currentUser && (
        <Paper sx={{ p: 2, mt: 2, bgcolor: '#f5f5f5', fontSize: '0.75rem' }}>
          <Typography variant="h6" gutterBottom>디버깅 정보</Typography>
          <div>사용자: {currentUser.username} ({currentUser.roles?.join(', ') || currentUser.role})</div>
          <div>이름: {currentUser.name}</div>
          <div>회사명: {currentUser.companyName || '-'}</div>
          <div>구매관리팀: {isPurchaseDept() ? 'Yes' : 'No'}</div>
          <div>송장 발행 권한: {canCreateInvoice() ? 'Yes' : 'No'}</div>
          <div>검색어: {searchTerm || '-'}, 상태필터: {statusFilter || '-'}</div>
          <div>정렬: {sortBy} {sortDir}</div>
          <div>페이지: {page}, 행 수: {rowsPerPage}, 총 항목: {totalElements}</div>
        </Paper>
      )}
    </Container>
  );
};

export default InvoicesListPage;