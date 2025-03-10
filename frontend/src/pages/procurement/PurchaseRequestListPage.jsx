import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, Button,
    Grid, FormControl, InputLabel, Select, MenuItem, Link
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from 'moment';
import { styled } from '@mui/material/styles';

// Redux 액션 및 선택자 임포트
import {
    fetchPurchaseRequests,
    setSearchTerm,
    setRequestDate,
    setStatus
} from '@/redux/purchaseRequestSlice'; // Correct import path
import { API_URL } from '@/utils/constants';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    maxHeight: 440,
    '& .MuiTableHead-root': {
        position: 'sticky',
        top: 0,
        backgroundColor: theme.palette.background.paper,
        zIndex: 1,
    },
}));

function PurchaseRequestListPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Redux 상태에서 데이터 가져오기
    const { purchaseRequests, filters } = useSelector(state => state.purchaseRequest);

    useEffect(() => {
        // 컴포넌트 마운트 시 구매 요청 목록 가져오기
        dispatch(fetchPurchaseRequests());
    }, [dispatch]);

    // 필터링된 구매 요청 목록 계산
    const filteredRequests = purchaseRequests.filter(request => {
        const searchTermLower = filters.searchTerm.toLowerCase();
        const searchMatch = [
            request.requestName?.toLowerCase(),
            String(request.id),
            request.customer?.toLowerCase(),
            request.businessManager?.toLowerCase(),
        ].some(field => field?.includes(searchTermLower));

        const dateMatch = !filters.requestDate ||
            (request.requestDate && moment(request.requestDate).isSame(filters.requestDate, 'day'));

        const statusMatch = !filters.status || request.prStatusChild === filters.status;

        return searchMatch && dateMatch && statusMatch;
    });

    // 필터 변경 핸들러
    const handleFilterChange = (type, value) => {
        switch (type) {
            case 'searchTerm':
                dispatch(setSearchTerm(value));
                break;
            case 'requestDate':
                dispatch(setRequestDate(value));
                break;
            case 'status':
                dispatch(setStatus(value));
                break;
            default:
                break;
        }
    };

    const downloadFile = async (attachment) => {
        try {
            const response = await fetchWithAuth(`${API_URL}attachments/${attachment.id}/download`, {
                method: 'GET',
                responseType: 'blob', // Blob 형태로 받기
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = attachment.originalName; // 파일 이름 설정
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } else {
                console.error('파일 다운로드 실패:', response.status);
            }
        } catch (error) {
            console.error('파일 다운로드 중 오류 발생:', error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>구매 요청 목록</Typography>

            {/* 필터 섹션 */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            label="검색"
                            value={filters.searchTerm}
                            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                            variant="outlined"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <LocalizationProvider dateAdapter={AdapterMoment}>
                            <DatePicker
                                label="요청일"
                                    value={moment(filters.requestDate)} // moment 객체로 변환
                                    onChange={(date) => handleFilterChange('requestDate', date)}
                                    slotProps={{
                                      textField: {
                                        fullWidth: true,
                                        error: false } }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel>진행상태</InputLabel>
                            <Select
                                value={filters.status || ''}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                label="진행상태"
                            >
                                <MenuItem value="">전체</MenuItem>
                                <MenuItem value="REQUESTED">요청</MenuItem>
                                <MenuItem value="APPROVED">승인</MenuItem>
                                <MenuItem value="REJECTED">거절</MenuItem>
                                <MenuItem value="COMPLETED">완료</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* 구매 요청 목록 테이블 */}
            <StyledTableContainer component={Paper}>
                <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                        <TableRow>
                            <TableCell>진행상태</TableCell>
                            <TableCell>요청제목</TableCell>
                            <TableCell>요청번호</TableCell>
                            <TableCell>고객사</TableCell>
                            <TableCell>요청일</TableCell>
                            <TableCell>사업부서</TableCell>
                            <TableCell>첨부파일</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredRequests.map(request => (
                            <TableRow
                                key={request.id}
                                hover
                                onClick={() => navigate(`/purchase-requests/${request.id}`)}
                                sx={{ cursor: 'pointer' }}
                            >
                                <TableCell>{request.prStatusChild}</TableCell>
                                <TableCell>{request.requestName}</TableCell>
                                <TableCell>{request.id}</TableCell>
                                <TableCell>{request.customer}</TableCell>
                                <TableCell>{moment(request.requestDate).format('YYYY-MM-DD')}</TableCell>
                                <TableCell>{request.businessDepartment}</TableCell>
                                <TableCell>
                                    {request.attachments && request.attachments.length > 0 ? (
                                        request.attachments.map(attachment => (
                                            <Link
                                                key={attachment.id}
                                                component="button"
                                                variant="body2"
                                                onClick={() => downloadFile(attachment)}
                                            >
                                                {attachment.originalName}
                                            </Link>
                                        ))
                                    ) : '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </StyledTableContainer>

            {/* 신규 생성 버튼 */}
            <Button
                variant="contained"
                onClick={() => navigate('/purchase-requests/new')}
                sx={{ mt: 2 }}
            >
                신규 생성
            </Button>
        </Box>
    );
}

export default PurchaseRequestListPage;
