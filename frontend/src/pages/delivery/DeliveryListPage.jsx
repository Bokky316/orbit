import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, Button,
    Grid, CircularProgress, IconButton, InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from 'moment';
import { styled } from '@mui/material/styles';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';
import { Search as SearchIcon, Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    maxHeight: 440,
    '& .MuiTableHead-root': {
        position: 'sticky',
        top: 0,
        backgroundColor: theme.palette.background.paper,
        zIndex: 1,
    },
}));

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
    const [page, setPage] = useState(0);
    const [rowsPerPage] = useState(10);

    const fetchDeliveries = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchTerm) params.append('deliveryNumber', searchTerm);
            if (deliveryDate) params.append('startDate', moment(deliveryDate).format('YYYY-MM-DD'));
            if (supplier) params.append('supplierName', supplier);
            params.append('page', page);
            params.append('size', rowsPerPage);

            const response = await fetchWithAuth(`${API_URL}deliveries?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`입고 목록 조회 실패: ${response.status}`);
            }

            const data = await response.json();
            if (data) {
                setDeliveries(data);
            } else {
                throw new Error('입고 목록 조회 실패');
            }
        } catch (error) {
            console.error('입고 목록을 불러오는 중 오류 발생:', error);
        } finally {
            setLoading(false);
        }
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        fetchDeliveries();
    }, [searchTerm, deliveryDate, supplier, page, rowsPerPage]); // 검색 조건이 변경될 때마다 실행

    const handleSearch = () => {
        setPage(0);
    };

    const handleCreateDelivery = () => {
        navigate('/deliveries/new');
    };

    const filteredDeliveries = deliveries.filter(delivery => {
        const searchMatch = searchTerm
            ? delivery.deliveryNumber.includes(searchTerm) ||
            delivery.orderNumber.includes(searchTerm)
            : true;
        const dateMatch = !deliveryDate || moment(delivery.deliveryDate).isSame(deliveryDate, 'day');
        const supplierMatch = !supplier || delivery.supplierName.includes(supplier);
        return searchMatch && dateMatch && supplierMatch;
    });

    return (
        <Box sx={{ p: 3 }}>
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
                    <Grid item xs={12} sm={6} md={3}>
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
                    <Grid item xs={12} sm={6} md={3}>
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

            <StyledTableContainer component={Paper}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>입고번호</TableCell>
                                <TableCell>발주번호</TableCell>
                                <TableCell>공급업체명</TableCell>
                                <TableCell>입고일</TableCell>
                                <TableCell>입고 담당자</TableCell>
                                <TableCell>총 금액</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredDeliveries.map(delivery => (
                                <TableRow
                                    key={delivery.id}
                                    hover
                                    onClick={() => navigate(`/deliveries/${delivery.id}`)}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <TableCell>{delivery.deliveryNumber}</TableCell>
                                    <TableCell>{delivery.orderNumber}</TableCell>
                                    <TableCell>{delivery.supplierName}</TableCell>
                                    <TableCell>{moment(delivery.deliveryDate).format('YYYY-MM-DD')}</TableCell>
                                    <TableCell>{delivery.receiverName || '-'}</TableCell>
                                    <TableCell>{delivery.totalAmount?.toLocaleString() || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </StyledTableContainer>
        </Box>
    );
}

export default DeliveryListPage;
