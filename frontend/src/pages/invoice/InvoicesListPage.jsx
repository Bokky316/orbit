import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 네비게이션 훅 추가
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
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  GetApp as DownloadIcon,
  Print as PrintIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ReceiptLong as ReceiptIcon,
  Payment as PaymentIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Add as AddIcon // 추가 아이콘 import
} from '@mui/icons-material';

// 목데이터 import
import { mockInvoices, STATUS_TYPES } from './generateMockInvoices';

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

// 송장 상태에 따른 Chip 색상
const getStatusColor = (status) => {
  switch (status) {
    case STATUS_TYPES.WAITING:
      return 'warning';
    case STATUS_TYPES.PAID:
      return 'success';
    case STATUS_TYPES.OVERDUE:
      return 'error';
    default:
      return 'default';
  }
};

// 금액 형식 변환 함수
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

// 금액 형식 제거 함수 (원 제거)
const unformatCurrency = (formattedAmount) => {
  if (!formattedAmount) return 0;
  const numericString = formattedAmount.replace(/[^0-9]/g, '');
  return numericString ? parseInt(numericString, 10) : 0;
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

// ISO 형식 날짜로 변환
const toISODateString = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const InvoiceListPage = () => {
  // useNavigate 훅 사용
  const navigate = useNavigate();

  // 상태 관리
  const [invoices, setInvoices] = useState(mockInvoices);
  const [filteredInvoices, setFilteredInvoices] = useState(mockInvoices);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // 요약 통계 계산
  const totalInvoicesCount = invoices.length;
  const waitingInvoicesCount = invoices.filter(invoice => invoice.status === STATUS_TYPES.WAITING).length;
  const paidInvoicesCount = invoices.filter(invoice => invoice.status === STATUS_TYPES.PAID).length;
  const overdueInvoicesCount = invoices.filter(invoice => invoice.status === STATUS_TYPES.OVERDUE).length;

  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const waitingAmount = invoices.filter(invoice => invoice.status === STATUS_TYPES.WAITING)
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const paidAmount = invoices.filter(invoice => invoice.status === STATUS_TYPES.PAID)
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const overdueAmount = invoices.filter(invoice => invoice.status === STATUS_TYPES.OVERDUE)
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  // 날짜 변경 핸들러
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  // 검색 및 필터링 적용
  useEffect(() => {
      let result = [...invoices];

      if (searchTerm) {
        result = result.filter(invoice =>
          invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.contractId.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (statusFilter) {
        result = result.filter(invoice => invoice.status === statusFilter);
      }

      if (startDate) {
        result = result.filter(invoice => new Date(invoice.issueDate) >= new Date(startDate));
      }

      if (endDate) {
        result = result.filter(invoice => new Date(invoice.issueDate) <= new Date(endDate));
      }

      setFilteredInvoices(result);
      setPage(0);
    }, [invoices, searchTerm, statusFilter, startDate, endDate]);

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

// ✅ 정렬 상태 추가
const [issueSort, setIssueSort] = useState('desc'); // 기본: 발행일 최신순
const [dueSort, setDueSort] = useState('desc'); // 기본: 마감일 최신순

// ✅ 정렬 옵션 리스트
const sortOptions = [
  { value: 'desc', label: '최신순' },
  { value: 'asc', label: '오래된순' }
];

// ✅ 정렬 변경 핸들러
const handleIssueSortChange = (event) => {
  setIssueSort(event.target.value);
};

const handleDueSortChange = (event) => {
  setDueSort(event.target.value);
};

// ✅ 정렬된 데이터 생성
const sortedInvoices = [...filteredInvoices]
  .sort((a, b) => {
    const valueA = new Date(a.issueDate);
    const valueB = new Date(b.issueDate);
    return issueSort === 'asc' ? valueA - valueB : valueB - valueA;
  })
  .sort((a, b) => {
    const valueA = new Date(a.dueDate);
    const valueB = new Date(b.dueDate);
    return dueSort === 'asc' ? valueA - valueB : valueB - valueA;
  });


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
    setStartDate('');
    setEndDate('');
    handleFilterDialogClose();
  };

  // 상세보기 다이얼로그 열기 핸들러
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setOpenDetailDialog(true);
  };

  // 상세보기 다이얼로그 닫기 핸들러
  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
  };

  // 결제 완료 표시 핸들러
  const handleMarkAsPaid = (invoiceId) => {
    setInvoices(invoices.map(invoice =>
      invoice.id === invoiceId
        ? { ...invoice, status: STATUS_TYPES.PAID, paymentDate: new Date().toISOString().split('T')[0] }
        : invoice
    ));
    setSelectedInvoice(null);
    handleCloseDetailDialog();
    showSnackbar('송장이 결제 완료 처리되었습니다.', 'success');
  };

  // 송장 편집 다이얼로그 열기 핸들러
  const handleEditInvoice = (invoice) => {
    // 지불완료 상태인 경우 수정 불가능
    if (invoice.status === STATUS_TYPES.PAID) {
      showSnackbar('결제 완료된 송장은 수정할 수 없습니다.', 'error');
      return;
    }

    // 기존 송장 정보를 복사하여 편집 상태로 설정
    setEditedInvoice({
      ...invoice,
      dueDate: toISODateString(invoice.dueDate),
      items: [...invoice.items.map(item => ({ ...item }))]
    });

    setOpenEditDialog(true);
    if (openDetailDialog) {
      handleCloseDetailDialog();
    }
  };

  // 편집 다이얼로그 닫기 핸들러
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditedInvoice(null);
  };

  // 편집 송장 필드 변경 핸들러
  const handleEditChange = (field, value) => {
    setEditedInvoice(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 공급자 정보 변경 핸들러
  const handleSupplierChange = (field, value) => {
    setEditedInvoice(prev => ({
      ...prev,
      supplier: {
        ...prev.supplier,
        [field]: value
      }
    }));
  };

  // 품목 정보 변경 핸들러
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...editedInvoice.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // 단가나 수량이 변경되면 공급가액 재계산
    if (field === 'unitPrice' || field === 'quantity') {
      const quantity = field === 'quantity' ? value : updatedItems[index].quantity;
      const unitPrice = field === 'unitPrice' ? value : updatedItems[index].unitPrice;
      const supplyAmount = quantity * unitPrice;
      const vatAmount = Math.round(supplyAmount * 0.1); // 부가세 10%
      const totalAmount = supplyAmount + vatAmount;

      updatedItems[index] = {
        ...updatedItems[index],
        supplyAmount,
        vatAmount,
        totalAmount
      };
    }

    // 총 금액 계산
    const totalSupplyAmount = updatedItems.reduce((sum, item) => sum + item.supplyAmount, 0);
    const totalVatAmount = updatedItems.reduce((sum, item) => sum + item.vatAmount, 0);
    const totalAmount = totalSupplyAmount + totalVatAmount;

    setEditedInvoice(prev => ({
      ...prev,
      items: updatedItems,
      supplyAmount: totalSupplyAmount,
      vatAmount: totalVatAmount,
      totalAmount: totalAmount
    }));
  };

  // 송장 저장 핸들러
  const handleSaveInvoice = () => {
    // 기본 검증
    if (!editedInvoice.dueDate) {
      showSnackbar('마감일을 입력해주세요.', 'error');
      return;
    }

    if (new Date(editedInvoice.dueDate) <= new Date(editedInvoice.issueDate)) {
      showSnackbar('마감일은 발행일보다 이후여야 합니다.', 'error');
      return;
    }

    // 송장 업데이트
    const updatedInvoices = invoices.map(invoice =>
      invoice.id === editedInvoice.id ? {
        ...editedInvoice,
        updatedAt: new Date().toISOString()
      } : invoice
    );

    setInvoices(updatedInvoices);
    handleCloseEditDialog();
    showSnackbar('송장이 성공적으로 수정되었습니다.', 'success');
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

  // 송장 발행 페이지로 이동하는 핸들러
  const handleCreateInvoice = () => {
    navigate('/invoices/create'); // 송장 발행 페이지로 이동
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* 제목과 송장 발행 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          송장 목록
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateInvoice}
        >
          새 송장 발행
        </Button>
      </Box>

      {/* 요약 카드 섹션 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                총 송장
              </Typography>
              <Typography variant="h4">{totalInvoicesCount}건</Typography>
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
                대기 중
              </Typography>
              <Typography variant="h4" color="warning.main">{waitingInvoicesCount}건</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                총액: {formatCurrency(waitingAmount)}
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
              <Typography variant="h4" color="success.main">{paidInvoicesCount}건</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                총액: {formatCurrency(paidAmount)}
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
              <Typography variant="h4" color="error.main">{overdueInvoicesCount}건</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                총액: {formatCurrency(overdueAmount)}
              </Typography>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* 검색 및 필터 섹션 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={1} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="송장번호, 공급업체, 계약번호로 검색"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                <MenuItem value={STATUS_TYPES.WAITING}>대기</MenuItem>
                <MenuItem value={STATUS_TYPES.PAID}>지불완료</MenuItem>
                <MenuItem value={STATUS_TYPES.OVERDUE}>연체</MenuItem>
              </Select>
            </FormControl>
          </Grid>

           {/* 📅 발행일 정렬 (드롭다운) */}
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>발행일 정렬</InputLabel>
              <Select value={issueSort} onChange={handleIssueSortChange} label="발행일 정렬">
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    발행일 ({option.label})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* 📅 마감일 정렬 (드롭다운) */}
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>마감일 정렬</InputLabel>
              <Select value={dueSort} onChange={handleDueSortChange} label="마감일 정렬">
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    마감일 ({option.label})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

        </Grid>
      </Paper>


      {/* 송장 목록 테이블 */}
      <Paper variant="outlined">
        <TableContainer>
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell>송장 번호</TableCell>
                <TableCell>발행일</TableCell>
                <TableCell>마감일</TableCell>
                <TableCell>공급업체</TableCell>
                <TableCell align="right">공급가액</TableCell>
                <TableCell align="right">부가세</TableCell>
                <TableCell align="right">총액</TableCell>
                <TableCell>상태</TableCell>
                <TableCell align="center">작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((invoice) => (
                  <StyledTableRow key={invoice.id} onClick={() => handleViewInvoice(invoice)} sx={{ cursor: 'pointer' }}>
                    <TableCell component="th" scope="row">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>{invoice.supplier.name}</TableCell>
                    <TableCell align="right">{formatCurrency(invoice.supplyAmount)}</TableCell>
                    <TableCell align="right">{formatCurrency(invoice.vatAmount)}</TableCell>
                    <TableCell align="right">{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>
                      <Chip label={invoice.status} color={getStatusColor(invoice.status)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {/* 🔥 "상세보기" 버튼 제거됨! */}

                        {/* ✏ 수정 버튼 */}
                        <Tooltip title="수정">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation(); // 행 클릭과 구분
                              handleEditInvoice(invoice);
                            }}
                            disabled={invoice.status === STATUS_TYPES.PAID}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* 💳 결제 페이지로 이동하는 버튼 */}
                        {invoice.status === STATUS_TYPES.WAITING && (
                          <Tooltip title="결제하기">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation(); // 행 클릭과 구분
                                navigate(`/payments/${invoice.id}`);
                              }}
                            >
                              <PaymentIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* 💳 결제 처리 버튼 */}
                        {invoice.status === STATUS_TYPES.WAITING && (
                          <Tooltip title="결제 처리">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={(e) => {
                                e.stopPropagation(); // 행 클릭과 구분
                                handleMarkAsPaid(invoice.id);
                              }}
                            >
                              <PaymentIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
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
          count={filteredInvoices.length}
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
                  <MenuItem value={STATUS_TYPES.WAITING}>대기</MenuItem>
                  <MenuItem value={STATUS_TYPES.PAID}>지불완료</MenuItem>
                  <MenuItem value={STATUS_TYPES.OVERDUE}>연체</MenuItem>
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

      {/* 송장 상세 다이얼로그 */}
      <Dialog
        open={openDetailDialog}
        onClose={handleCloseDetailDialog}
        fullWidth
        maxWidth="md"
      >
        {selectedInvoice && (
          <>
            <DialogTitle>
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid item>
                  송장 상세 정보: {selectedInvoice.invoiceNumber}
                </Grid>
                <Grid item>
                  <Chip
                    label={selectedInvoice.status}
                    color={getStatusColor(selectedInvoice.status)}
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
                      <Typography variant="subtitle2" color="textSecondary">계약 번호</Typography>
                      <Typography variant="body1">{selectedInvoice.contractId}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">거래 번호</Typography>
                      <Typography variant="body1">{selectedInvoice.transactionNumber}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">발행일</Typography>
                      <Typography variant="body1">{formatDate(selectedInvoice.issueDate)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">마감일</Typography>
                      <Typography variant="body1">{formatDate(selectedInvoice.dueDate)}</Typography>
                    </Grid>
                    {selectedInvoice.paymentDate && (
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="textSecondary">결제일</Typography>
                        <Typography variant="body1">{formatDate(selectedInvoice.paymentDate)}</Typography>
                      </Grid>
                    )}
                    {selectedInvoice.status === STATUS_TYPES.OVERDUE && (
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="textSecondary">연체일</Typography>
                        <Typography variant="body1" color="error.main">{selectedInvoice.overdueDays}일</Typography>
                      </Grid>
                    )}
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    공급자 정보
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">공급자 ID</Typography>
                      <Typography variant="body1">{selectedInvoice.supplier.id}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">공급자명</Typography>
                      <Typography variant="body1">{selectedInvoice.supplier.name}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">담당자</Typography>
                      <Typography variant="body1">{selectedInvoice.supplier.contactPerson}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">이메일</Typography>
                      <Typography variant="body1">{selectedInvoice.supplier.email}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">전화번호</Typography>
                      <Typography variant="body1">{selectedInvoice.supplier.phone}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">주소</Typography>
                      <Typography variant="body1">{selectedInvoice.supplier.address}</Typography>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    품목 정보
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>품목명</TableCell>
                          <TableCell align="right">수량</TableCell>
                          <TableCell align="right">단가</TableCell>
                          <TableCell align="right">공급가액</TableCell>
                          <TableCell align="right">부가세</TableCell>
                          <TableCell align="right">총액</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedInvoice.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.itemName}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell align="right">{formatCurrency(item.supplyAmount)}</TableCell>
                            <TableCell align="right">{formatCurrency(item.vatAmount)}</TableCell>
                            <TableCell align="right">{formatCurrency(item.totalAmount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    금액 정보
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="textSecondary">공급가액</Typography>
                      <Typography variant="body1">{formatCurrency(selectedInvoice.supplyAmount)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="textSecondary">부가세</Typography>
                      <Typography variant="body1">{formatCurrency(selectedInvoice.vatAmount)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="textSecondary">총액</Typography>
                      <Typography variant="h6" color="primary.main">
                        {formatCurrency(selectedInvoice.totalAmount)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button startIcon={<EditIcon />} color="primary"
                onClick={() => handleEditInvoice(selectedInvoice)}
                disabled={selectedInvoice.status === STATUS_TYPES.PAID}>
                수정
              </Button>
              <Button startIcon={<PrintIcon />} onClick={() => alert('인쇄 기능')}>
                인쇄
              </Button>
              <Button startIcon={<DownloadIcon />} onClick={() => alert('다운로드 기능')}>
                다운로드
              </Button>
              {selectedInvoice.status === STATUS_TYPES.WAITING && (
                <Button
                  startIcon={<PaymentIcon />}
                  color="success"
                  variant="contained"
                  onClick={() => handleMarkAsPaid(selectedInvoice.id)}
                >
                  결제 완료 처리
                </Button>
              )}
              <Button onClick={handleCloseDetailDialog}>
                닫기
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* 송장 수정 다이얼로그 */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        fullWidth
        maxWidth="md"
      >
        {editedInvoice && (
          <>
            <DialogTitle>
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid item>
                  송장 수정: {editedInvoice.invoiceNumber}
                </Grid>
                <Grid item>
                  <Chip
                    label={editedInvoice.status}
                    color={getStatusColor(editedInvoice.status)}
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
                      <TextField
                        label="계약 번호"
                        value={editedInvoice.contractId}
                        InputProps={{ readOnly: true }}
                        fullWidth
                        margin="normal"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        label="거래 번호"
                        value={editedInvoice.transactionNumber}
                        InputProps={{ readOnly: true }}
                        fullWidth
                        margin="normal"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        label="발행일"
                        value={toISODateString(editedInvoice.issueDate)}
                        InputProps={{ readOnly: true }}
                        fullWidth
                        margin="normal"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        label="마감일"
                        type="date"
                        value={editedInvoice.dueDate}
                        onChange={(e) => handleEditChange('dueDate', e.target.value)}
                        fullWidth
                        margin="normal"
                        size="small"
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    공급자 정보
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        label="공급자 ID"
                        value={editedInvoice.supplier.id}
                        InputProps={{ readOnly: true }}
                        fullWidth
                        margin="normal"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        label="공급자명"
                        value={editedInvoice.supplier.name}
                        InputProps={{ readOnly: true }}
                        fullWidth
                        margin="normal"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        label="담당자"
                        value={editedInvoice.supplier.contactPerson}
                        onChange={(e) => handleSupplierChange('contactPerson', e.target.value)}
                        fullWidth
                        margin="normal"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        label="이메일"
                        value={editedInvoice.supplier.email}
                        onChange={(e) => handleSupplierChange('email', e.target.value)}
                        fullWidth
                        margin="normal"
                        size="small"
                        type="email"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        label="전화번호"
                        value={editedInvoice.supplier.phone}
                        onChange={(e) => handleSupplierChange('phone', e.target.value)}
                        fullWidth
                        margin="normal"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        label="주소"
                        value={editedInvoice.supplier.address}
                        onChange={(e) => handleSupplierChange('address', e.target.value)}
                        fullWidth
                        margin="normal"
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    품목 정보
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>품목명</TableCell>
                          <TableCell align="right">수량</TableCell>
                          <TableCell align="right">단가</TableCell>
                          <TableCell align="right">공급가액</TableCell>
                          <TableCell align="right">부가세</TableCell>
                          <TableCell align="right">총액</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {editedInvoice.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <TextField
                                value={item.itemName}
                                onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                                size="small"
                                variant="standard"
                                fullWidth
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                                size="small"
                                variant="standard"
                                type="number"
                                sx={{ width: '80px' }}
                                InputProps={{ inputProps: { min: 1 } }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(index, 'unitPrice', parseInt(e.target.value) || 0)}
                                size="small"
                                variant="standard"
                                type="number"
                                sx={{ width: '120px' }}
                                InputProps={{ inputProps: { min: 0 } }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(item.supplyAmount)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(item.vatAmount)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(item.totalAmount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    금액 정보
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="textSecondary">공급가액</Typography>
                      <Typography variant="body1">{formatCurrency(editedInvoice.supplyAmount)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="textSecondary">부가세</Typography>
                      <Typography variant="body1">{formatCurrency(editedInvoice.vatAmount)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="textSecondary">총액</Typography>
                      <Typography variant="h6" color="primary.main">
                        {formatCurrency(editedInvoice.totalAmount)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseEditDialog} startIcon={<CloseIcon />}>
                취소
              </Button>
              <Button
                onClick={handleSaveInvoice}
                color="primary"
                variant="contained"
                startIcon={<SaveIcon />}
              >
                저장
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

export default InvoiceListPage;