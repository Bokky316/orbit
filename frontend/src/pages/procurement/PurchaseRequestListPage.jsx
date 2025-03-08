import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    fetchPurchaseRequests,
    setSearchTerm,
    setRequestDate,
    setStatus
} from '@/redux/purchaseRequestSlice';
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
    Grid,
    Checkbox,
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
    const navigate = useNavigate();
    const purchaseRequests = useSelector(state => state.purchaseRequest.purchaseRequests);
    const filters = useSelector(state => state.purchaseRequest.filters);
    const [localFilters, setLocalFilters] = useState(filters);

    // 검색어 상태
    const [requestNameSearchTerm, setRequestNameSearchTerm] = useState('');
    const [requestNumberSearchTerm, setRequestNumberSearchTerm] = useState('');
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [businessManagerSearchTerm, setBusinessManagerSearchTerm] = useState('');

    useEffect(() => {
        // 컴포넌트 마운트 시 구매 요청 목록 데이터 로딩
        dispatch(fetchPurchaseRequests());
    }, [dispatch]);

    /**
     * 검색 및 필터링된 구매 요청 목록을 반환합니다.
     * @returns {array} 필터링된 구매 요청 목록
     */
    const getFilteredPurchaseRequests = () => {
        return purchaseRequests.filter(request => {
            const requestNameMatch = String(request.requestName)?.includes(requestNameSearchTerm);
            const requestNumberMatch = String(request.id)?.includes(requestNumberSearchTerm);
            const customerMatch = String(request.customer)?.includes(customerSearchTerm);
            const businessManagerMatch = String(request.businessManager)?.includes(businessManagerSearchTerm);

            const requestDateMatch = !localFilters.requestDate || request.requestDate === localFilters.requestDate;
            const statusMatch = !localFilters.status || request.status === localFilters.status;

            return requestNameMatch && requestNumberMatch && customerMatch && businessManagerMatch && requestDateMatch && statusMatch;
        });
    };

    /**
     * 각 검색어 변경 핸들러
     */
    const handleRequestNameSearchTermChange = (event) => {
        setRequestNameSearchTerm(event.target.value);
    };

    const handleRequestNumberSearchTermChange = (event) => {
        setRequestNumberSearchTerm(event.target.value);
    };

    const handleCustomerSearchTermChange = (event) => {
        setCustomerSearchTerm(event.target.value);
    };

    const handleBusinessManagerSearchTermChange = (event) => {
        setBusinessManagerSearchTerm(event.target.value);
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
        dispatch(setSearchTerm({
            requestName: requestNameSearchTerm,
            requestNumber: requestNumberSearchTerm,
            customer: customerSearchTerm,
            businessManager: businessManagerSearchTerm
        }));
        dispatch(setRequestDate(localFilters.requestDate));
        dispatch(setStatus(localFilters.status));
    };

    /**
     * 상세보기 핸들러
     * @param {string} id - 구매 요청 ID
     */
    const handleViewDetail = (id) => {
        navigate(`/purchase-requests/${id}`); // 구매 요청 상세 페이지로 이동
    };

    /**
     * 새 구매 요청 생성 핸들러
     */
    const handleCreatePurchaseRequest = () => {
        navigate('/purchase-requests/new'); // 구매 요청 생성 페이지로 이동
    };

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                구매 요청 목록
            </Typography>
            {/* 검색 및 필터 섹션 */}
            <Paper elevation={2} sx={{ padding: 2, marginBottom: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    {/* 요청명 검색 필드 */}
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth
                            label="요청명"
                            value={requestNameSearchTerm}
                            onChange={handleRequestNameSearchTermChange}
                        />
                    </Grid>
                    {/* 요청번호 검색 필드 */}
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth
                            label="요청번호"
                            value={requestNumberSearchTerm}
                            onChange={handleRequestNumberSearchTermChange}
                        />
                    </Grid>
                    {/* 고객사 검색 필드 */}
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth
                            label="고객사"
                            value={customerSearchTerm}
                            onChange={handleCustomerSearchTermChange}
                        />
                    </Grid>
                    {/* 사업담당자 필터 */}
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth
                            label="사업담당자"
                            value={businessManagerSearchTerm}
                            onChange={handleBusinessManagerSearchTermChange}
                        />
                    </Grid>
                    {/* 요청일 검색 필드 (DatePicker 대신 텍스트 필드 사용) */}
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth
                            label="요청일"
                            value={localFilters.requestDate || ''}
                            onChange={handleRequestDateChange}
                        />
                    </Grid>
                    {/* 진행상태 필터 */}
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                            <InputLabel id="status-select-label">진행상태</InputLabel>
                            <Select
                                labelId="status-select-label"
                                id="status-select"
                                value={localFilters.status || ''}
                                label="진행상태"
                                onChange={handleStatusChange}
                            >
                                <MenuItem value="">전체</MenuItem>
                                <MenuItem value="초안">초안</MenuItem>
                                <MenuItem value="제출">제출</MenuItem>
                                <MenuItem value="승인">승인</MenuItem>
                                <MenuItem value="거절">거절</MenuItem>
                                <MenuItem value="완료">완료</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    {/* 조회 버튼 */}
                    <Grid item xs={12} sm={3}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleApplyFilters}
                            fullWidth
                        >
                            조회
                        </Button>
                    </Grid>
                    {/* 신규, 수정, 삭제 버튼 */}
                    <Grid item xs={12} sm={3} container justifyContent="flex-end">
                        {/* "신규" 버튼 클릭 시 새 구매 요청 생성 페이지로 이동 */}
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleCreatePurchaseRequest} // 이 부분을 수정
                            sx={{ mr: 1 }}
                        >
                            신규
                        </Button>
                        <Button variant="contained" color="info" onClick={handleCreatePurchaseRequest} sx={{ mr: 1 }}>
                            수정
                        </Button>
                        <Button variant="contained" color="error" onClick={handleCreatePurchaseRequest}>
                            삭제
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
            {/* 구매 요청 목록 테이블 */}
            <StyledTableContainer component={Paper}>
                <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                        <TableRow>
                            <TableCell><Checkbox /></TableCell>
                            <TableCell>진행상태</TableCell>
                            <TableCell>요청제목</TableCell>
                            <TableCell>요청번호</TableCell>
                            <TableCell>고객사</TableCell>
                            <TableCell>요청일</TableCell>
                            <TableCell>사업부서</TableCell>
                            <TableCell>사업담당자</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {getFilteredPurchaseRequests().map(request => (
                            <TableRow key={request.id} hover>
                                <TableCell><Checkbox /></TableCell>
                                <TableCell>{request.status}</TableCell>
                                {/* 요청제목 클릭 시 상세보기 이동 */}
                                <TableCell>
                                    <Typography
                                        component="a"
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault(); // 기본 링크 동작 방지
                                            handleViewDetail(request.id); // 상세보기 핸들러 호출
                                        }}
                                        sx={{
                                            textDecoration: 'none',
                                            color: 'blue',
                                            '&:hover': {
                                                textDecoration: 'underline',
                                            },
                                        }}
                                    >
                                        {request.requestName}
                                    </Typography>
                                </TableCell>
                                <TableCell>{request.id}</TableCell>
                                <TableCell>{request.customer}</TableCell>
                                <TableCell>{request.requestDate}</TableCell>
                                <TableCell>{request.businessDepartment}</TableCell>
                                <TableCell>{request.businessManager}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </StyledTableContainer>
        </Box>
    );
}

export default PurchaseRequestListPage;
