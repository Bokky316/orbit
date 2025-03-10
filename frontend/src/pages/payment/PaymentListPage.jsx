import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Card,
  CardContent,
  Tooltip,
  Snackbar,
  Alert,
  Breadcrumbs,
  Link
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  GetApp as DownloadIcon,
  Print as PrintIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as AccountBalanceIcon,
  ReceiptLong as ReceiptLongIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

// 목데이터 import (실제로는 API로 대체)
import { mockInvoices } from '../invoice/generateMockInvoices';

// 스타일 컴포넌트
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // 마우스 오버 효과
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: theme.shadows[2]
}));

// 금액 형식 변환 함수
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

// 날짜 형식 변환 함수
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// 결제 상태에 따른 Chip 색상
const getStatusColor = (status) => {
  switch (status) {
    case '완료':
      return 'success';
    case '실패':
      return 'error';
    case '취소':
      return 'warning';
    default:
      return 'default';
  }
};

// 결제 방법에 따른 아이콘
const getPaymentMethodIcon = (method) => {
  switch (method) {
    case '카드':
      return <CreditCardIcon fontSize="small" />;
    case '계좌이체':
      return <AccountBalanceIcon fontSize="small" />;
    case '수표':
      return <ReceiptLongIcon fontSize="small" />;
    default:
      return <ReceiptIcon fontSize="small" />;
  }
};

// 목데이터 - 결제 내역
const mockPayments = [
  {
    id: 1,
    invoice_id: 'INV-1',
    invoiceNumber: mockInvoices[0]?.invoiceNumber || 'INV-20250301-0001',
    total_amount: 1500000,
    payment_date: '2025-03-01',
    payment_method: '카드',
    payment_status: '완료',
    transaction_id: 'TRX-1678234567-123456',
    notes: '신한카드 결제',
    created_at: '2025-03-01T09:30:00',
    updated_at: '2025-03-01T09:30:00',
    supplier: {
      name: mockInvoices[0]?.supplier?.name || '테크솔루션 주식회사'
    }
  },
  {
    id: 2,
    invoice_id: 'INV-2',
    invoiceNumber: mockInvoices[1]?.invoiceNumber || 'INV-20250302-0002',
    total_amount: 2700000,
    payment_date: '2025-03-02',
    payment_method: '계좌이체',
    payment_status: '완료',
    transaction_id: 'TRX-1678245678-234567',
    notes: '국민은행 이체',
    created_at: '2025-03-02T10:15:00',
    updated_at: '2025-03-02T10:15:00',
    supplier: {
      name: mockInvoices[1]?.supplier?.name || '글로벌 IT 서비스'
    }
  },
  {
    id: 3,
    invoice_id: 'INV-3',
    invoiceNumber: mockInvoices[2]?.invoiceNumber || 'INV-20250303-0003',
    total_amount: 900000,
    payment_date: '2025-03-03',
    payment_method: '수표',
    payment_status: '완료',
    transaction_id: 'TRX-1678256789-345678',
    notes: '하나은행 발행 수표',
    created_at: '2025-03-03T11:00:00',
    updated_at: '2025-03-03T11:00:00',
    supplier: {
      name: mockInvoices[2]?.supplier?.name || '하이테크 솔루션즈'
    }
  },
  {
    id: 4,
    invoice_id: 'INV-4',
    invoiceNumber: mockInvoices[3]?.invoiceNumber || 'INV-20250304-0004',
    total_amount: 1200000,
    payment_date: '2025-03-04',
    payment_method: '카드',
    payment_status: '취소',
    transaction_id: 'TRX-1678267890-456789',
    notes: '결제 후 취소됨',
    created_at: '2025-03-04T09:45:00',
    updated_at: '2025-03-04T14:30:00',
    supplier: {
      name: mockInvoices[3]?.supplier?.name || '스마트 시스템즈'
    }
  },
  {
    id: 5,
    invoice_id: 'INV-5',
    invoiceNumber: mockInvoices[4]?.invoiceNumber || 'INV-20250305-0005',
    total_amount: 3500000,
    payment_date: '2025-03-05',
    payment_method: '계좌이체',
    payment_status: '실패',
    transaction_id: 'TRX-1678278901-567890',
    notes: '잔액 부족으로 인한 이체 실패',
    created_at: '2025-03-05T13:20:00',
    updated_at: '2025-03-05T13:25:00',
    supplier: {
      name: mockInvoices[4]?.supplier?.name || '디지털 솔루션'
    }
  }
];

const PaymentListPage = () => {
  const navigate = useNavigate();

  // 상태 관리
  const [payments, setPayments] = useState(mockPayments);
  const [filteredPayments, setFilteredPayments] = useState(mockPayments);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // 요약 통계 계산
  const totalPaymentsCount = payments.length;
  const completedPaymentsCount = payments.filter(payment => payment.payment_status === '완료').length;
  const failedPaymentsCount = payments.filter(payment => payment.payment_status === '실패').length;
  const cancelledPaymentsCount = payments.filter(payment => payment.payment_status === '취소').length;

  const totalAmount = payments.filter(payment => payment.payment_status === '완료')
    .reduce((sum, payment) => sum + payment.total_amount, 0);

  // 날짜 변경 핸들러
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  // 검색 및 필터링 적용
  useEffect(() => {
    let result = [...payments];

    if (searchTerm) {
      result = result.filter(payment =>
        payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.transaction_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      result = result.filter(payment => payment.payment_status === statusFilter);
    }

    if (methodFilter) {
      result = result.filter(payment => payment.payment_method === methodFilter);
    }

    if (startDate) {
      result = result.filter(payment => new Date(payment.payment_date) >= new Date(startDate));
    }

    if (endDate) {
      result = result.filter(payment => new Date(payment.payment_date) <= new Date(endDate));
    }

    setFilteredPayments(result);
    setPage(0);
  }, [payments, searchTerm, statusFilter, methodFilter, startDate, endDate]);

  // 페이지 변경 핸들러
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경 핸들러
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // 필터 다이얼로그 열기/닫기 핸들러
  const handleFilterDialogOpen = () => {
    setOpenFilterDialog(true);
  };

  const handleFilterDialogClose = () => {
    setOpenFilterDialog(false);
  };

  // 필터 적용 핸들러
  const applyFilters = () => {
    handleFilterDialogClose();
  };

  // 필터 초기화 핸들러
  const resetFilters = () => {
    setStatusFilter('');
    setMethodFilter('');
    setStartDate('');
    setEndDate('');
    handleFilterDialogClose();
  };

  // 상세보기 다이얼로그 열기 핸들러
  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setOpenDetailDialog(true);
  };

  // 상세보기 다이얼로그 닫기 핸들러
  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
  };

  // 송장 상세보기로 이동 핸들러
  const handleViewInvoice = (invoiceId) => {
    navigate(`/invoices/${invoiceId}`);
  };

  // 스낵바 표시 함수
  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // 스낵바 닫기 핸들러
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // 송장 목록으로 이동
  const handleBackToInvoices = () => {
    navigate('/invoices');
  };

  // 영수증/명세서 다운로드
  const handleDownloadReceipt = (paymentId) => {
    // 실제 구현에서는 API 호출로 처리
    showSnackbar('영수증 다운로드가 시작되었습니다.', 'info');
  };

  // 결제 내역 인쇄
  const handlePrintPayment = (paymentId) => {
    // 실제 구현에서는 인쇄 기능 호출
    window.print();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* 제목과 이전 버튼 */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            color="inherit"
            onClick={handleBackToInvoices}
            sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ArrowBackIcon fontSize="small" sx={{ mr: 0.5 }} />
            송장 목록
          </Link>
          <Typography color="textPrimary">결제 내역</Typography>
        </Breadcrumbs>
        <Typography variant="h4" gutterBottom>
          결제 내역
        </Typography>
      </Box>

      {/* 요약 카드 섹션 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                총 결제
              </Typography>
              <Typography variant="h4">{totalPaymentsCount}건</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                총액: {formatCurrency(totalAmount)}
              </Typography>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                완료
              </Typography>
              <Typography variant="h4" color="success.main">{completedPaymentsCount}건</Typography>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                실패
              </Typography>
              <Typography variant="h4" color="error.main">{failedPaymentsCount}건</Typography>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                취소
              </Typography>
              <Typography variant="h4" color="warning.main">{cancelledPaymentsCount}건</Typography>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* 검색 및 필터 섹션 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={1} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder="송장번호, 공급업체, 거래ID로 검색"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>상태</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="상태"
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="완료">완료</MenuItem>
                <MenuItem value="실패">실패</MenuItem>
                <MenuItem value="취소">취소</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>결제 방법</InputLabel>
              <Select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                label="결제 방법"
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="카드">카드</MenuItem>
                <MenuItem value="계좌이체">계좌이체</MenuItem>
                <MenuItem value="수표">수표</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleFilterDialogOpen}
              sx={{ ml: 1 }}
            >
              상세 필터
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 결제 내역 테이블 */}
      <Paper variant="outlined">
        <TableContainer>
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell>송장 번호</TableCell>
                <TableCell>결제일</TableCell>
                <TableCell>공급업체</TableCell>
                <TableCell>결제 방법</TableCell>
                <TableCell align="right">금액</TableCell>
                <TableCell>거래 ID</TableCell>
                <TableCell>상태</TableCell>
                <TableCell align="center">작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((payment) => (
                  <StyledTableRow key={payment.id} onClick={() => handleViewPayment(payment)} sx={{ cursor: 'pointer' }}>
                    <TableCell component="th" scope="row">{payment.invoiceNumber}</TableCell>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell>{payment.supplier.name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getPaymentMethodIcon(payment.payment_method)}
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {payment.payment_method}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{formatCurrency(payment.total_amount)}</TableCell>
                    <TableCell>{payment.transaction_id}</TableCell>
                    <TableCell>
                      <Chip label={payment.payment_status} color={getStatusColor(payment.payment_status)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title="상세보기">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewPayment(payment);
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="영수증 다운로드">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadReceipt(payment.id);
                            }}
                            disabled={payment.payment_status !== '완료'}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="인쇄">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintPayment(payment.id);
                            }}
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </StyledTableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredPayments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행 수"
        />
      </Paper>

      {/* 필터 다이얼로그 */}
      <Dialog open={openFilterDialog} onClose={handleFilterDialogClose}>
        <DialogTitle>상세 필터</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="status-filter-dialog-label">상태</InputLabel>
                <Select
                  labelId="status-filter-dialog-label"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="상태"
                >
                  <MenuItem value="">전체</MenuItem>
                  <MenuItem value="완료">완료</MenuItem>
                  <MenuItem value="실패">실패</MenuItem>
                  <MenuItem value="취소">취소</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="method-filter-dialog-label">결제 방법</InputLabel>
                <Select
                  labelId="method-filter-dialog-label"
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  label="결제 방법"
                >
                  <MenuItem value="">전체</MenuItem>
                  <MenuItem value="카드">카드</MenuItem>
                  <MenuItem value="계좌이체">계좌이체</MenuItem>
                  <MenuItem value="수표">수표</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="시작일"
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="종료일"
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetFilters} color="inherit">
            초기화
          </Button>
          <Button onClick={applyFilters} color="primary" variant="contained">
            필터 적용
          </Button>
        </DialogActions>
      </Dialog>

      {/* 결제 상세 다이얼로그 */}
      <Dialog
        open={openDetailDialog}
        onClose={handleCloseDetailDialog}
        fullWidth
        maxWidth="md"
      >
        {selectedPayment && (
          <>
            <DialogTitle>
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid item>
                  결제 상세 정보
                </Grid>
                <Grid item>
                  <Chip
                    label={selectedPayment.payment_status}
                    color={getStatusColor(selectedPayment.payment_status)}
                  />
                </Grid>
              </Grid>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    기본 정보
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">거래 ID</Typography>
                      <Typography variant="body1">{selectedPayment.transaction_id}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">송장 번호</Typography>
                      <Typography variant="body1">{selectedPayment.invoiceNumber}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">결제일</Typography>
                      <Typography variant="body1">{formatDate(selectedPayment.payment_date)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">공급업체</Typography>
                      <Typography variant="body1">{selectedPayment.supplier.name}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">결제 방법</Typography>
                      <Typography variant="body1">{selectedPayment.payment_method}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">결제 금액</Typography>
                      <Typography variant="h6" color="primary.main">
                        {formatCurrency(selectedPayment.total_amount)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>

                {selectedPayment.notes && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      메모
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1">
                      {selectedPayment.notes}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    시스템 정보
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">생성일시</Typography>
                      <Typography variant="body1">
                        {new Date(selectedPayment.created_at).toLocaleString('ko-KR')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">수정일시</Typography>
                      <Typography variant="body1">
                        {new Date(selectedPayment.updated_at).toLocaleString('ko-KR')}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button
                startIcon={<VisibilityIcon />}
                color="primary"
                onClick={() => {
                  handleCloseDetailDialog();
                  handleViewInvoice(selectedPayment.invoice_id);
                }}
              >
                송장 상세보기
              </Button>
              {selectedPayment.payment_status === '완료' && (
                <Button startIcon={<DownloadIcon />} onClick={() => handleDownloadReceipt(selectedPayment.id)}>
                  영수증 다운로드
                </Button>
              )}
              <Button startIcon={<PrintIcon />} onClick={() => handlePrintPayment(selectedPayment.id)}>
                인쇄
              </Button>
              <Button onClick={handleCloseDetailDialog}>
                닫기
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* 알림 스낵바 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PaymentListPage;