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
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Payments as PaymentsIcon
} from '@mui/icons-material';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';

// 스타일 컴포넌트
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

// 결제 상태에 따른 Chip 색상 및 라벨
const getStatusProps = (status) => {
  switch(status) {
    case '완료':
    case 'COMPLETED':
      return { color: 'success', label: '지급완료' };
    case '실패':
    case 'FAILED':
      return { color: 'error', label: '지급실패' };
    case '취소':
    case 'CANCELED':
      return { color: 'warning', label: '지급취소' };
    default:
      return { color: 'default', label: status };
  }
};

// 결제 방법에 따른 Chip 색상 및 라벨
const getMethodProps = (method) => {
  switch(method) {
    case '계좌이체':
      return { color: 'info', label: '계좌이체' };
    case '카드':
      return { color: 'secondary', label: '카드' };
    case '수표':
      return { color: 'primary', label: '수표' };
    default:
      return { color: 'default', label: method };
  }
};

// 금액 형식 변환 함수
const formatCurrency = (amount) => {
  if (!amount) return '0원';
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

// 날짜 형식 변환 함수
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return dateString;
};

const PaymentsListPage = () => {
  const navigate = useNavigate();

  // Redux 상태에서 인증 정보 가져오기
  const auth = useSelector((state) => state.auth);
  const currentUser = auth?.user;
  const isLoggedIn = auth?.isLoggedIn;

  // 상태 관리
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('paymentDate');
  const [sortDir, setSortDir] = useState('desc');
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  // 통계 정보
  const [statistics, setStatistics] = useState({
    totalCount: 0,
    completedCount: 0,
    failedCount: 0,
    canceledCount: 0,
    transferCount: 0,
    cardCount: 0,
    checkCount: 0,
    totalAmount: 0,
    completedAmount: 0,
    failedAmount: 0,
    canceledAmount: 0,
    transferAmount: 0,
    cardAmount: 0,
    checkAmount: 0
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

  // 재무회계팀(004로 시작)인지 확인하는 함수
  const isFinanceDept = () => {
    if (!currentUser?.username) return false;
    return currentUser.username.startsWith('004');
  };

  // 결제 정보에 대한 접근 권한 확인
  const canAccessPayment = (payment) => {
    if (!currentUser) return false;

    // ADMIN은 모든 데이터 접근 가능
    if (isAdmin()) return true;

    // 재무회계팀은 모든 결제 데이터 접근 가능
    if (isFinanceDept()) return true;

    // BUYER는 모든 결제 데이터 접근 가능
    if (isBuyer()) return true;

    // SUPPLIER는 자사 관련 데이터만 접근 가능
    if (isSupplier()) {
      const normalizeText = (text) => text?.replace(/\s+/g, '').toLowerCase();
      const normalizedCompanyName = normalizeText(currentUser.name || currentUser.companyName);
      const normalizedSupplierName = normalizeText(payment.supplierName);

      return normalizedSupplierName.includes(normalizedCompanyName) ||
             normalizedCompanyName.includes(normalizedSupplierName);
    }

    return false;
  };

  // 새 결제 만들기 권한 확인
  const canCreatePayment = () => {
    if (!isLoggedIn || !currentUser) return false;

    // 재무회계팀만 결제 생성 가능
    if (isFinanceDept()) return true;

    // 관리자도 결제 생성 가능
    if (isAdmin()) return true;

    return false;
  };

  // 데이터 로드 함수
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (methodFilter) params.append('method', methodFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('searchTerm', searchTerm);
      params.append('page', page);
      params.append('size', rowsPerPage);
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDir);

      // SUPPLIER인 경우 자사 데이터만 조회하도록 필터 추가
      if (isSupplier() && currentUser?.id) {
        params.append('supplierId', currentUser.id);
      }

      const apiUrl = `${API_URL}payments/list?${params.toString()}`;
      console.log('API 호출 URL:', apiUrl);

      const response = await fetchWithAuth(apiUrl);

      if (!response.ok) {
        throw new Error(`결제 목록 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('API 응답 데이터:', data);

      if (data) {
        // 결제 데이터 설정
        if (data.payments) {
          setPayments(data.payments);
        } else {
          setPayments([]);
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
        throw new Error('결제 목록 조회 실패');
      }
    } catch (error) {
      console.error('결제 목록을 불러오는 중 오류 발생:', error);
      setPayments([]);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      fetchPayments();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, currentUser, page, rowsPerPage, sortBy, sortDir]);

  // 이벤트 핸들러
  const handleSearch = () => {
    setPage(0);
    fetchPayments();
  };

  const handleCreatePayment = () => {
    navigate('/payments/create');
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMethodFilterChange = (event) => {
    setMethodFilter(event.target.value);
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

  // 결제 상세 페이지로 이동
  const handleViewPayment = (payment) => {
    if (!canAccessPayment(payment)) {
      setError('접근 권한이 없습니다.');
      setShowError(true);
      return;
    }
    navigate(`/payments/${payment.id}`);
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

      {/* 제목과 결제 생성 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
            결제 목록
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {canCreatePayment() && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreatePayment}
            >
              새 결제 등록
            </Button>
          )}
        </Box>
      </Box>

      {/* 요약 카드 섹션 */}
      <Box sx={{ mb: 3, overflowX: 'auto' }}>
        <Grid container spacing={1}>
          <Grid item xs={4} sm={2}>
            <Box sx={{ p: 1.5, textAlign: 'center', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
              <Typography variant="body2" color="text.secondary">총 결제</Typography>
              <Typography variant="h6" sx={{ my: 1 }}>{statistics.totalCount}</Typography>
              <Typography variant="caption" display="block">
                {formatCurrency(statistics.totalAmount)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4} sm={2}>
            <Box sx={{ p: 1.5, textAlign: 'center', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
              <Typography variant="body2" color="text.secondary">완료</Typography>
              <Typography variant="h6" color="success.main" sx={{ my: 1 }}>{statistics.completedCount}</Typography>
              <Typography variant="caption" display="block">
                {formatCurrency(statistics.completedAmount)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4} sm={2}>
            <Box sx={{ p: 1.5, textAlign: 'center', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
              <Typography variant="body2" color="text.secondary">실패</Typography>
              <Typography variant="h6" color="error.main" sx={{ my: 1 }}>{statistics.failedCount}</Typography>
              <Typography variant="caption" display="block">
                {formatCurrency(statistics.failedAmount)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4} sm={2}>
            <Box sx={{ p: 1.5, textAlign: 'center', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
              <Typography variant="body2" color="text.secondary">계좌이체</Typography>
              <Typography variant="h6" color="info.main" sx={{ my: 1 }}>{statistics.transferCount}</Typography>
              <Typography variant="caption" display="block">
                {formatCurrency(statistics.transferAmount)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4} sm={2}>
            <Box sx={{ p: 1.5, textAlign: 'center', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
              <Typography variant="body2" color="text.secondary">카드</Typography>
              <Typography variant="h6" color="secondary.main" sx={{ my: 1 }}>{statistics.cardCount}</Typography>
              <Typography variant="caption" display="block">
                {formatCurrency(statistics.cardAmount)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4} sm={2}>
            <Box sx={{ p: 1.5, textAlign: 'center', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
              <Typography variant="body2" color="text.secondary">수표</Typography>
              <Typography variant="h6" color="primary.main" sx={{ my: 1 }}>{statistics.checkCount}</Typography>
              <Typography variant="caption" display="block">
                {formatCurrency(statistics.checkAmount)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* 검색 및 필터 섹션 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="거래번호, 송장번호, 공급업체명으로 검색"
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
          <Grid item xs={12} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>결제 방법</InputLabel>
              <Select
                value={methodFilter}
                onChange={handleMethodFilterChange}
                label="결제 방법"
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="계좌이체">계좌이체</MenuItem>
                <MenuItem value="카드">카드</MenuItem>
                <MenuItem value="수표">수표</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>상태</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="상태"
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="완료">지급완료</MenuItem>
                <MenuItem value="실패">지급실패</MenuItem>
                <MenuItem value="취소">지급취소</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
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
                <MenuItem value="paymentDate-desc">결제일 (최신순)</MenuItem>
                <MenuItem value="paymentDate-asc">결제일 (오래된순)</MenuItem>
                <MenuItem value="totalAmount-desc">금액 (높은순)</MenuItem>
                <MenuItem value="totalAmount-asc">금액 (낮은순)</MenuItem>
                <MenuItem value="updatedAt-desc">수정일 (최신순)</MenuItem>
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

      {/* 결제 목록 테이블 */}
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
                  <TableCell align="center">거래번호</TableCell>
                  <TableCell align="center">송장번호</TableCell>
                  <TableCell align="center">공급업체</TableCell>
                  <TableCell align="center">금액</TableCell>
                  <TableCell align="center">결제방법</TableCell>
                  <TableCell align="center">결제일</TableCell>
                  <TableCell align="center">상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.length > 0 ? (
                  payments.map((payment) => (
                    <StyledTableRow
                      key={payment.id}
                      hover
                      sx={{
                        cursor: canAccessPayment(payment) ? 'pointer' : 'not-allowed',
                        opacity: canAccessPayment(payment) ? 1 : 0.5
                      }}
                      onClick={() => handleViewPayment(payment)}
                    >
                      <TableCell align="center">
                          {payment.transactionId || '-'}
                      </TableCell>
                      <TableCell align="center">{payment.invoiceNumber}</TableCell>
                      <TableCell align="center">{payment.supplierName}</TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(payment.totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{formatDate(payment.paymentMethod)} </TableCell>
                      <TableCell align="center">{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getStatusProps(payment.paymentStatus).label}
                          color={getStatusProps(payment.paymentStatus).color}
                          size="small"
                        />
                      </TableCell>
                    </StyledTableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      표시할 결제가 없습니다.
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
    </Container>
  );
};

export default PaymentsListPage;