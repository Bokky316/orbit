import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, Button,
    Grid, CircularProgress, InputAdornment, TablePagination,
    Snackbar, Alert, Container, Chip, FormControl, InputLabel, Select, MenuItem, Card, CardContent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from 'moment';
import { styled } from '@mui/material/styles';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';
import { Search as SearchIcon, Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';

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

// 송장 발행 상태에 따른 Chip 색상 및 라벨
const getInvoiceStatusProps = (invoiceIssued) => {
  if (invoiceIssued === true) {
    return { color: 'success', label: '발행됨' };
  } else {
    return { color: 'warning', label: '미발행' };
  }
};

// 금액 형식 변환 함수
const formatCurrency = (amount) => {
  if (!amount) return '0원';
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

// 배송 상태에 따른 통계 계산
const calculateStatistics = (deliveries) => {
  const stats = {
    totalCount: deliveries.length,
    invoicedCount: 0,
    notInvoicedCount: 0,
    totalAmount: 0,
    invoicedAmount: 0,
    notInvoicedAmount: 0,
  };

  deliveries.forEach(delivery => {
    const amount = parseFloat(delivery.totalAmount) || 0;
    stats.totalAmount += amount;

    if (delivery.invoiceIssued) {
      stats.invoicedCount++;
      stats.invoicedAmount += amount;
    } else {
      stats.notInvoicedCount++;
      stats.notInvoicedAmount += amount;
    }
  });

  return stats;
};

function DeliveryListPage() {
    const navigate = useNavigate();

    // Redux 상태에서 인증 정보 가져오기
    const auth = useSelector((state) => state.auth);
    const currentUser = auth?.user;
    const isLoggedIn = auth?.isLoggedIn;

    const [deliveries, setDeliveries] = useState([]);
    const [filteredDeliveries, setFilteredDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deliveryDate, setDeliveryDate] = useState(null);
    const [supplier, setSupplier] = useState('');
    const [invoiceStatus, setInvoiceStatus] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [error, setError] = useState('');
    const [showError, setShowError] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [sortBy, setSortBy] = useState('regTime');
    const [sortDir, setSortDir] = useState('desc');

    // 통계 정보
    const [statistics, setStatistics] = useState({
      totalCount: 0,
      invoicedCount: 0,
      notInvoicedCount: 0,
      totalAmount: 0,
      invoicedAmount: 0,
      notInvoicedAmount: 0,
    });

    // 디버깅용 - 사용자 정보 출력
    useEffect(() => {
        if (currentUser) {
            console.log('현재 사용자 정보:', currentUser);
        }
    }, [currentUser]);

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

    // 회사명 설정 및 공급업체 검색 필터 설정
    useEffect(() => {
        if (currentUser && isSupplier()) {
            const company = findCompanyName();
            setCompanyName(company);

            if (company) {
                setSupplier(company);
                console.log('공급업체명 설정:', company);
            }
        }
    }, [currentUser]);

    // 행에 대한 접근 권한 확인
    const canAccessDelivery = (delivery) => {
        if (!currentUser) return false;

        // ADMIN은 모든 데이터 접근 가능
        if (isAdmin()) return true;

        // BUYER(username이 001로 시작하거나 구매관리팀)도 자신이 담당자인 데이터만 접근 가능
        if (isBuyer() && isPurchaseDept()) {
            return delivery.receiverName === currentUser.name;
        }

        // BUYER(일반)는 자신이 담당자로 지정된 데이터만 접근 가능
        if (isBuyer() && !isPurchaseDept()) {
            return delivery.receiverName === currentUser.name;
        }

        // SUPPLIER는 자사 관련 데이터만 접근 가능
        if (isSupplier()) {
            // 회사명이 있으면 정확히 매칭되는지 확인
            return companyName && delivery.supplierName === companyName;
        }

        return false;
    };

    // 역할 기반 데이터 필터링
    const filterDeliveriesByRole = (data) => {
        if (!currentUser || !data || data.length === 0) return [];

        // ADMIN은 모든 데이터 접근 가능
        if (isAdmin()) return data;

        // BUYER(username이 001로 시작하거나 구매관리팀)도 자신이 담당자인 데이터만 접근 가능
        if (isBuyer() && isPurchaseDept()) {
            return data.filter(delivery =>
                delivery.receiverName === currentUser.name
            );
        }

        // BUYER(일반)는 자신이 담당자로 지정된 데이터만 접근 가능
        if (isBuyer() && !isPurchaseDept()) {
            return data.filter(delivery =>
                delivery.receiverName === currentUser.name
            );
        }

        // SUPPLIER는 자사 관련 데이터만 접근 가능
        if (isSupplier()) {
            // 현재 사용자의 회사명과 정확히 일치하는 데이터만 필터링
            const userName = currentUser.name; // 예: "공급사 1 담당자"

            // userName에서 공급사명 추출 시도 (예: "공급사 1")
            const supplierMatch = userName.match(/(공급사\s*\d+)/);
            const extractedName = supplierMatch ? supplierMatch[1] : null;

            // 회사명 기준으로 필터링 (추출된 이름 또는 설정된 companyName 사용)
            const filterName = extractedName || companyName;

            console.log('공급업체 필터링:', filterName);

            if (filterName) {
                return data.filter(delivery =>
                    delivery.supplierName === filterName
                );
            }

            // 이름에서 숫자만 추출 시도 (최후의 수단)
            const numMatch = userName.match(/\d+/);
            if (numMatch) {
                const numPart = numMatch[0];
                console.log('숫자 추출 시도:', numPart);
                return data.filter(delivery =>
                    delivery.supplierName && delivery.supplierName.includes(numPart)
                );
            }

            return [];
        }

        return data;
    };

    // 데이터 로드 함수
    const fetchDeliveries = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchTerm) params.append('deliveryNumber', searchTerm);
            if (deliveryDate) params.append('startDate', moment(deliveryDate).format('YYYY-MM-DD'));
            if (supplier) params.append('supplierName', supplier);
            if (invoiceStatus !== '') {
                params.append('invoiceIssued', invoiceStatus === 'ISSUED' ? 'true' : 'false');
            }
            params.append('page', page);
            params.append('size', rowsPerPage);

            // 원래 API 엔드포인트 사용
            const apiEndpoint = `${API_URL}deliveries`;

            console.log('API 호출:', apiEndpoint, '역할:', currentUser?.roles || currentUser?.role);

            const response = await fetchWithAuth(`${apiEndpoint}?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`입고 목록 조회 실패: ${response.status}`);
            }

            const data = await response.json();
            console.log('API 응답 데이터:', data);

            if (data) {
                if (data.content) {
                    // 역할 기반 필터링 적용
                    const allDeliveries = data.content;
                    setDeliveries(allDeliveries);

                    const filtered = filterDeliveriesByRole(allDeliveries);
                    setFilteredDeliveries(filtered);

                    // 페이지네이션 정보 설정 (필터링된 데이터 기준)
                    setTotalElements(filtered.length);
                    setTotalPages(Math.ceil(filtered.length / rowsPerPage));

                    // 통계 계산
                    const calculatedStats = calculateStatistics(filtered);
                    setStatistics(calculatedStats);
                } else if (Array.isArray(data)) {
                    const allDeliveries = data;
                    setDeliveries(allDeliveries);

                    const filtered = filterDeliveriesByRole(allDeliveries);
                    setFilteredDeliveries(filtered);

                    setTotalElements(filtered.length);
                    setTotalPages(Math.ceil(filtered.length / rowsPerPage));

                    // 통계 계산
                    const calculatedStats = calculateStatistics(filtered);
                    setStatistics(calculatedStats);
                } else {
                    console.error('예상치 못한 응답 형식:', data);
                    setDeliveries([]);
                    setFilteredDeliveries([]);
                    setTotalElements(0);
                    setTotalPages(0);

                    // 빈 통계 설정
                    setStatistics({
                      totalCount: 0,
                      invoicedCount: 0,
                      notInvoicedCount: 0,
                      totalAmount: 0,
                      invoicedAmount: 0,
                      notInvoicedAmount: 0,
                    });
                }
            } else {
                throw new Error('입고 목록 조회 실패');
            }
        } catch (error) {
            console.error('입고 목록을 불러오는 중 오류 발생:', error);
            setDeliveries([]);
            setFilteredDeliveries([]);
            setTotalElements(0);
            setTotalPages(0);
            setError('데이터를 불러오는 중 오류가 발생했습니다.');
            setShowError(true);

            // 빈 통계 설정
            setStatistics({
              totalCount: 0,
              invoicedCount: 0,
              notInvoicedCount: 0,
              totalAmount: 0,
              invoicedAmount: 0,
              notInvoicedAmount: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        if (isLoggedIn && currentUser) {
            fetchDeliveries();
        } else {
            setLoading(false);
        }
    }, [isLoggedIn, currentUser, page, rowsPerPage]);

    // 필터링 변경 시 데이터 재필터링
    useEffect(() => {
        if (deliveries.length > 0) {
            const filtered = filterDeliveriesByRole(deliveries);
            setFilteredDeliveries(filtered);
            setTotalElements(filtered.length);
            setTotalPages(Math.ceil(filtered.length / rowsPerPage));

            // 통계 재계산
            const calculatedStats = calculateStatistics(filtered);
            setStatistics(calculatedStats);
        }
    }, [currentUser, companyName]);

    // 입고 등록 버튼 표시 권한 확인
    const canCreateDelivery = () => {
        if (!isLoggedIn || !currentUser) return false;

        // ADMIN은 항상 가능
        if (isAdmin()) return true;

        // BUYER이고 username이 001로 시작하는 경우만 가능
        if (isBuyer() && isPurchaseDept()) return true;

        // SUPPLIER는 불가능
        // 그 외에도 불가능
        return false;
    };

    // 이벤트 핸들러
    const handleSearch = () => {
        setPage(0);
        fetchDeliveries();
    };

    const handleCreateDelivery = () => {
        navigate('/deliveries/new');
    };

    const handleRefresh = () => {
        fetchDeliveries();
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleInvoiceStatusChange = (event) => {
        setInvoiceStatus(event.target.value);
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

    // 행 클릭 핸들러
    const handleRowClick = (deliveryId) => {
        const delivery = deliveries.find(d => d.id === deliveryId);

        // 접근 권한 확인
        if (!canAccessDelivery(delivery)) {
            setError('접근 권한이 없습니다. 담당자만 접근할 수 있습니다.');
            setShowError(true);
            return;
        }

        navigate(`/deliveries/${deliveryId}`);
    };

    // 페이지네이션된 데이터 계산
    const getCurrentPageData = () => {
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredDeliveries.slice(startIndex, endIndex);
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

            {/* 헤더 영역 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    입고 목록
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {/* 입고 등록 버튼은 ADMIN 또는 username이 001로 시작하는 BUYER만 표시 */}
                    {canCreateDelivery() && (
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleCreateDelivery}
                        >
                            신규 입고 등록
                        </Button>
                    )}
                </Box>
            </Box>

            {/* 요약 카드 섹션 */}
            <Box sx={{ mb: 3, overflowX: 'auto' }}>
                <Grid container spacing={1}>
                    <Grid item xs={4} sm={4}>
                        <Box sx={{ p: 1.5, textAlign: 'center', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
                            <Typography variant="body2" color="text.secondary">총 입고</Typography>
                            <Typography variant="h6" sx={{ my: 1 }}>{statistics.totalCount}</Typography>
                            <Typography variant="caption" display="block">
                                {formatCurrency(statistics.totalAmount)}
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={4} sm={4}>
                        <Box sx={{ p: 1.5, textAlign: 'center', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
                            <Typography variant="body2" color="text.secondary">송장 발행</Typography>
                            <Typography variant="h6" color="success.main" sx={{ my: 1 }}>{statistics.invoicedCount}</Typography>
                            <Typography variant="caption" display="block">
                                {formatCurrency(statistics.invoicedAmount)}
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={4} sm={4}>
                        <Box sx={{ p: 1.5, textAlign: 'center', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
                            <Typography variant="body2" color="text.secondary">송장 미발행</Typography>
                            <Typography variant="h6" color="warning.main" sx={{ my: 1 }}>{statistics.notInvoicedCount}</Typography>
                            <Typography variant="caption" display="block">
                                {formatCurrency(statistics.notInvoicedAmount)}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* 검색 필터 영역 */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            label="검색 (입고번호/발주번호)"
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
                    <Grid item xs={12} sm={6} md={3}>
                        <LocalizationProvider dateAdapter={AdapterMoment}>
                            <DatePicker
                                label="입고일"
                                value={deliveryDate ? moment(deliveryDate) : null}
                                onChange={(date) => setDeliveryDate(date)}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField
                            fullWidth
                            label="공급업체명"
                            value={supplier}
                            onChange={(e) => setSupplier(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            // SUPPLIER 역할은 자사 데이터만 볼 수 있어 수정 불가
                            disabled={isSupplier()}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel>송장 상태</InputLabel>
                            <Select
                                value={invoiceStatus}
                                onChange={handleInvoiceStatusChange}
                                label="송장 상태"
                            >
                                <MenuItem value="">전체</MenuItem>
                                <MenuItem value="ISSUED">발행됨</MenuItem>
                                <MenuItem value="NOT_ISSUED">미발행</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
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

            {/* 테이블 영역 */}
            <Paper variant="outlined">
                <TableContainer sx={{ maxHeight: 440 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center">입고번호</TableCell>
                                    <TableCell align="center">발주번호</TableCell>
                                    <TableCell align="center">공급업체명</TableCell>
                                    <TableCell align="center">입고일</TableCell>
                                    <TableCell align="center">입고 담당자</TableCell>
                                    <TableCell align="center">총 금액</TableCell>
                                    <TableCell align="center">송장 상태</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {getCurrentPageData().length > 0 ? (
                                    getCurrentPageData().map(delivery => (
                                        <StyledTableRow
                                            key={delivery.id}
                                            hover
                                            onClick={() => handleRowClick(delivery.id)}
                                            sx={{
                                                cursor: canAccessDelivery(delivery) ? 'pointer' : 'not-allowed',
                                                opacity: canAccessDelivery(delivery) ? 1 : 0.5
                                            }}
                                        >
                                            <TableCell align="center">{delivery.deliveryNumber}</TableCell>
                                            <TableCell align="center">{delivery.orderNumber}</TableCell>
                                            <TableCell align="center">{delivery.supplierName}</TableCell>
                                            <TableCell align="center">{delivery.deliveryDate ? moment(delivery.deliveryDate).format('YYYY-MM-DD') : '-'}</TableCell>
                                            <TableCell align="center">{delivery.receiverName || '-'}</TableCell>
                                            <TableCell align="center">{delivery.totalAmount ? delivery.totalAmount.toLocaleString() + '원' : '-'}</TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={getInvoiceStatusProps(delivery.invoiceIssued).label}
                                                    color={getInvoiceStatusProps(delivery.invoiceIssued).color}
                                                    size="small"
                                                />
                                            </TableCell>
                                        </StyledTableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            데이터가 없습니다.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </TableContainer>
                {!loading && (
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
                )}
            </Paper>
        </Container>
    );
}

export default DeliveryListPage;