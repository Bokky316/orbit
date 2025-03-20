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
    case 'APPROVED':
      return { color: 'success', label: '승인됨' };
    case 'REJECTED':
      return { color: 'error', label: '거부됨' };
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

// 필터링된 송장 데이터로 통계 계산하는 함수
const calculateStatistics = (invoices) => {
  const stats = {
    totalCount: invoices.length,
    waitingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    paidCount: 0,
    overdueCount: 0,
    totalAmount: 0,
    waitingAmount: 0,
    approvedAmount: 0,
    rejectedAmount: 0,
    paidAmount: 0,
    overdueAmount: 0
  };

  invoices.forEach(invoice => {
    const amount = invoice.totalAmount || 0;
    stats.totalAmount += amount;

    switch(invoice.status) {
      case 'WAITING':
        stats.waitingCount++;
        stats.waitingAmount += amount;
        break;
      case 'APPROVED':
        stats.approvedCount++;
        stats.approvedAmount += amount;
        break;
      case 'REJECTED':
        stats.rejectedCount++;
        stats.rejectedAmount += amount;
        break;
      case 'PAID':
        stats.paidCount++;
        stats.paidAmount += amount;
        break;
      case 'OVERDUE':
        stats.overdueCount++;
        stats.overdueAmount += amount;
        break;
    }
  });

  return stats;
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
  const [companyName, setCompanyName] = useState('');

  // 통계 정보
  const [statistics, setStatistics] = useState({
    totalCount: 0,
    waitingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    paidCount: 0,
    overdueCount: 0,
    totalAmount: 0,
    waitingAmount: 0,
    approvedAmount: 0,
    rejectedAmount: 0,
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

  // 회사명 찾기
  const findCompanyName = () => {
    if (!currentUser) return '';

    // 공급업체 역할인 경우 회사명 추출
    if (isSupplier()) {
      // 공급업체명을 찾을 수 있는 가능한 속성 확인
      const company = currentUser.companyName ||
                     currentUser.company ||
                     currentUser.supplierName;

      // 회사명이 이미 있으면 사용
      if (company) {
        console.log('회사명 찾음 (속성):', company);
        return company;
      }

      // 이름에서 추출 (예: '공급사 1 담당자' -> '공급사 1')
      if (currentUser.name) {
        // 이름에서 '공급사 N' 패턴 추출
        const nameMatch = currentUser.name.match(/(공급사\s*\d+)/);
        if (nameMatch) {
          console.log('회사명 찾음 (이름 패턴):', nameMatch[1]);
          return nameMatch[1];
        }

        // 이름이 공급사명인 경우 (예: '공급사 1')
        if (currentUser.name.trim().startsWith('공급사')) {
          console.log('회사명 찾음 (이름):', currentUser.name);
          return currentUser.name.trim();
        }
      }

      // 그래도 못 찾았다면, 이름 자체를 그대로 사용
      if (currentUser.name) {
        console.log('회사명으로 이름 사용:', currentUser.name);
        return currentUser.name;
      }
    }

    return '';
  };

  // 회사명 설정
  useEffect(() => {
    if (currentUser && isSupplier()) {
      const company = findCompanyName();
      setCompanyName(company);
      console.log('공급업체명 설정:', company);
    }
  }, [currentUser]);

  // 송장에 대한 접근 권한 확인
  const canAccessInvoice = (invoice) => {
    if (!currentUser) return false;

    // ADMIN은 모든 데이터 접근 가능
    if (isAdmin()) return true;

    // BUYER(구매관리팀)은 모든 데이터 접근 가능
    if (isBuyer() && isPurchaseDept()) return true;

    // SUPPLIER는 자사 관련 데이터만 접근 가능
    if (isSupplier()) {
      // 회사명이 있으면 정확히 매칭되는지 확인
      if (companyName) {
        return invoice.supplierName === companyName;
      }

      // 그 외에는 이름 기반으로 확인
      return invoice.supplierName === currentUser.companyName ||
             invoice.supplierName.includes(currentUser.name);
    }

    // 그 외 BUYER는 관련 데이터만 접근
    if (isBuyer()) {
      return true; // 일반적으로 BUYER는 모든 송장 접근 가능
    }

    return false;
  };

  // 역할 기반 데이터 필터링
  const filterInvoicesByRole = (data) => {
    if (!currentUser || !data || data.length === 0) return [];

    // ADMIN은 모든 데이터 접근 가능
    if (isAdmin()) return data;

    // BUYER(구매관리팀)은 모든 데이터 접근 가능
    if (isBuyer() && isPurchaseDept()) return data;

    // 일반 BUYER는 모든 데이터 접근 가능
    if (isBuyer() && !isPurchaseDept()) return data;

    // SUPPLIER는 자사 관련 데이터만 접근 가능
    if (isSupplier()) {
      // 회사명이 있으면 정확히 매칭되는지 확인
      if (companyName) {
        return data.filter(invoice => invoice.supplierName === companyName);
      }

      // 이름에서 공급사명 추출 시도 (예: "공급사 1")
      const userName = currentUser.name;
      const supplierMatch = userName ? userName.match(/(공급사\s*\d+)/) : null;
      const extractedName = supplierMatch ? supplierMatch[1] : null;

      if (extractedName) {
        return data.filter(invoice => invoice.supplierName === extractedName);
      }

      // 이름에서 숫자만 추출 시도 (최후의 수단)
      if (userName) {
        const numMatch = userName.match(/\d+/);
        if (numMatch) {
          const numPart = numMatch[0];
          console.log('숫자 추출 시도:', numPart);
          return data.filter(invoice =>
            invoice.supplierName && invoice.supplierName.includes(numPart)
          );
        }
      }

      // 그 외에는 이름 기반으로 필터링
      return data.filter(invoice =>
        invoice.supplierName === currentUser.companyName ||
        (currentUser.name && invoice.supplierName.includes(currentUser.name))
      );
    }

    return data;
  };

  // 송장 등록 권한 확인
  const canCreateInvoice = () => {
    if (!isLoggedIn || !currentUser) return false;

    // 오직 SUPPLIER(공급업체)만 송장 발행 가능
    if (isSupplier()) return true;

    // 다른 역할은 불가능
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

      // SUPPLIER인 경우 자사 데이터만 조회하도록 필터 추가
      if (isSupplier() && companyName) {
        params.append('supplierName', companyName);
      }

      const response = await fetchWithAuth(`${API_URL}invoices/list?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`송장 목록 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('API 응답 데이터:', data);

      if (data) {
        // 송장 데이터 설정
        if (data.invoices) {
          const allInvoices = data.invoices;
          setInvoices(allInvoices);

          // 역할 기반 필터링 적용
          const filtered = filterInvoicesByRole(allInvoices);
          setFilteredInvoices(filtered);

          // 필터링된 데이터 기준으로 총 항목 수 설정
          setTotalElements(filtered.length);

          // 필터링된 데이터로 통계 계산 (프론트엔드에서 직접 계산)
          const calculatedStats = calculateStatistics(filtered);
          setStatistics(calculatedStats);
        }

        // 페이지네이션 정보 설정
        if (data.totalPages) setTotalPages(data.totalPages);
        if (data.currentPage !== undefined) setPage(data.currentPage);
        if (data.totalItems && !isSupplier()) setTotalElements(data.totalItems);
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

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      fetchInvoices();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, currentUser, page, rowsPerPage, sortBy, sortDir]);

  // 필터링 변경 시 데이터 재필터링
  useEffect(() => {
    if (invoices.length > 0) {
      const filtered = filterInvoicesByRole(invoices);
      setFilteredInvoices(filtered);
      setTotalElements(filtered.length);

      // 필터링된 데이터로 통계 재계산
      const calculatedStats = calculateStatistics(filtered);
      setStatistics(calculatedStats);
    }
  }, [currentUser, companyName]);

  // 이벤트 핸들러
  const handleSearch = () => {
    setPage(0);
    fetchInvoices();
  };

  const handleRefresh = () => {
    fetchInvoices();
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

  // 페이지네이션된 데이터 계산
  const getCurrentPageData = () => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredInvoices.slice(startIndex, endIndex);
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
      <Box sx={{ mb: 3, overflowX: 'auto' }}>
        <Grid container spacing={1}>
          <Grid item xs={4} sm={2}>
            <Box sx={{ p: 1.5, textAlign: 'center', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
              <Typography variant="body2" color="text.secondary">총 송장</Typography>
              <Typography variant="h6" sx={{ my: 1 }}>{statistics.totalCount}</Typography>
              <Typography variant="caption" display="block">
                {formatCurrency(statistics.totalAmount)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4} sm={2}>
            <Box sx={{ p: 1.5, textAlign: 'center', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
              <Typography variant="body2" color="text.secondary">대기</Typography>
              <Typography variant="h6" color="warning.main" sx={{ my: 1 }}>{statistics.waitingCount}</Typography>
              <Typography variant="caption" display="block">
                {formatCurrency(statistics.waitingAmount)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4} sm={2}>
            <Box sx={{ p: 1.5, textAlign: 'center', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
              <Typography variant="body2" color="text.secondary">승인</Typography>
              <Typography variant="h6" color="success.main" sx={{ my: 1 }}>{statistics.approvedCount}</Typography>
              <Typography variant="caption" display="block">
                {formatCurrency(statistics.approvedAmount)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4} sm={2}>
            <Box sx={{ p: 1.5, textAlign: 'center', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
              <Typography variant="body2" color="text.secondary">거부</Typography>
              <Typography variant="h6" color="error.main" sx={{ my: 1 }}>{statistics.rejectedCount}</Typography>
              <Typography variant="caption" display="block">
                {formatCurrency(statistics.rejectedAmount)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4} sm={2}>
            <Box sx={{ p: 1.5, textAlign: 'center', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
              <Typography variant="body2" color="text.secondary">완료</Typography>
              <Typography variant="h6" color="info.main" sx={{ my: 1 }}>{statistics.paidCount}</Typography>
              <Typography variant="caption" display="block">
                {formatCurrency(statistics.paidAmount)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4} sm={2}>
            <Box sx={{ p: 1.5, textAlign: 'center', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
              <Typography variant="body2" color="text.secondary">연체</Typography>
              <Typography variant="h6" color="error.dark" sx={{ my: 1 }}>{statistics.overdueCount}</Typography>
              <Typography variant="caption" display="block">
                {formatCurrency(statistics.overdueAmount)}
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
                <MenuItem value="APPROVED">승인됨</MenuItem>
                <MenuItem value="REJECTED">거부됨</MenuItem>
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
                  <TableCell align="center">발주 번호</TableCell>
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
                {getCurrentPageData().length > 0 ? (
                  getCurrentPageData().map((invoice) => (
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
                      <TableCell>{invoice.orderNumber || '-'}</TableCell>
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
    </Container>
  );
};

export default InvoicesListPage;