import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    setPurchaseRequests,
    setSearchTerm,
    setRequestDate,
    setStatus
} from '@redux/purchaseRequestSlice';
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
import { fetchWithAuth } from '@/utils/fetchWithAuth'; // 인증이 필요한 API 호출 함수
import { API_URL } from '@/utils/constants';

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

    useEffect(() => {
        // 컴포넌트 마운트 시 구매 요청 목록 데이터 로딩
        fetchPurchaseRequests();
    }, [dispatch]);

    /**
     * 구매 요청 목록 데이터 API 호출 함수
     */
    const fetchPurchaseRequests = async () => {
        try {
            const response = await fetchWithAuth(`${API_URL}purchase-requests`);
            if (!response.ok) {
                throw new Error(`구매 요청 목록 로딩 실패: ${response.status}`);
            }

            const data = await response.json();
            dispatch(setPurchaseRequests(data)); // Redux 스토어에 구매 요청 목록 저장
        } catch (error) {
            console.error('구매 요청 목록 로딩 중 오류 발생:', error);
            // 오류 처리 로직 (예: 사용자에게 오류 메시지 표시)
        }
    };

    /**
     * 검색 및 필터링된 구매 요청 목록을 반환합니다.
     * @returns {array} 필터링된 구매 요청 목록
     */
    const getFilteredPurchaseRequests = () => {
        return purchaseRequests.filter(request => {
            const searchTerm = localFilters.searchTerm || ''; // searchTerm이 undefined일 경우 빈 문자열로 초기화
            const searchTermMatch = String(request.id)?.includes(searchTerm) ||
                String(request.project?.projectName)?.includes(searchTerm) ||
                String(request.requester?.name)?.includes(searchTerm);
            const requestDateMatch = !localFilters.requestDate || request.requestDate === localFilters.requestDate;
            const statusMatch = !localFilters.status || request.status === localFilters.status;

            return searchTermMatch && requestDateMatch && statusMatch;
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
        dispatch(setSearchTerm(localFilters.searchTerm));
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
        // TODO: 새 구매 요청 생성 페이지로 이동
        console.log('새 구매 요청 생성');
        alert('새 구매 요청 생성 페이지로 이동합니다.');
    };

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                구매 요청 목록
            </Typography>

            {/* 검색 및 필터 섹션 */}
            <Paper elevation={2} sx={{ padding: 2, marginBottom: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                            <InputLabel id="status-select-label">상태</InputLabel>
                            <Select
                                labelId="status-select-label"
                                id="status-select"
                                value={localFilters.status || ''}
                                label="상태"
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
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="검색"
                            value={localFilters.searchTerm || ''}
                            onChange={handleSearchTermChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleApplyFilters}
                            fullWidth
                        >
                            검색
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* 구매 요청 목록 테이블 */}
            <StyledTableContainer component={Paper}>
                <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                        <TableRow>
                            <TableCell>요청번호</TableCell>
                            <TableCell>프로젝트명</TableCell>
                            <TableCell>요청자</TableCell>
                            <TableCell>총금액</TableCell>
                            <TableCell>요청일</TableCell>
                            <TableCell>상태</TableCell>
                            <TableCell>액션</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {getFilteredPurchaseRequests().map(request => (
                            <TableRow key={request.id} hover>
                                <TableCell>{request.id}</TableCell>
                                <TableCell>{request.project?.projectName}</TableCell>
                                <TableCell>{request.requester?.name}</TableCell>
                                <TableCell>{request.totalAmount?.toLocaleString()}원</TableCell>
                                <TableCell>{request.requestDate}</TableCell>
                                <TableCell>{request.status}</TableCell>
                                <TableCell>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="primary"
                                        onClick={() => handleViewDetail(request.id)}
                                    >
                                        상세보기
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </StyledTableContainer>

            {/* 새 구매 요청 버튼 */}
            <Button
                variant="contained"
                color="secondary"
                onClick={handleCreatePurchaseRequest}
                sx={{ mt: 2 }}
            >
                새 구매 요청
            </Button>
        </Box>
    );
}

export default PurchaseRequestListPage;
