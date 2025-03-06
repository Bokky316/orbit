// src/components/ApprovalListPage.js

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    setApprovals,
    setSearchTerm,
    setRequestDate
} from '@redux/approvalSlice';
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
 * 결재 대기 목록 페이지 컴포넌트
 * @returns {JSX.Element}
 */
function ApprovalListPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const approvals = useSelector(state => state.approval.approvals);
    const filters = useSelector(state => state.approval.filters);
    const [localFilters, setLocalFilters] = useState(filters);

    useEffect(() => {
        // 컴포넌트 마운트 시 결재 목록 데이터 로딩
        fetchApprovals();
    }, [dispatch]);

    /**
     * 결재 목록 데이터 API 호출 함수
     */
    const fetchApprovals = async () => {
        try {
            const response = await fetchWithAuth(`${API_URL}approvals`);
            if (!response.ok) {
                throw new Error(`결재 목록 로딩 실패: ${response.status}`);
            }
            const data = await response.json();
            dispatch(setApprovals(data)); // Redux 스토어에 결재 목록 저장
        } catch (error) {
            console.error('결재 목록 로딩 중 오류 발생:', error);
        }
    };

    /**
     * 검색 및 필터링된 결재 대기 목록을 반환합니다.
     * @returns {array} 필터링된 결재 대기 목록
     */
    const getFilteredApprovals = () => {
        return approvals.filter(approval => {
            const searchTermMatch = approval.id?.includes(localFilters.searchTerm) || approval.purchaseRequest?.project?.projectName?.includes(localFilters.searchTerm) || approval.purchaseRequest?.requester?.name?.includes(localFilters.searchTerm);
            const requestDateMatch = !localFilters.requestDate || approval.purchaseRequest?.requestDate === localFilters.requestDate;
            return searchTermMatch && requestDateMatch;
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
     * 필터 적용 핸들러
     */
    const handleApplyFilters = () => {
        dispatch(setSearchTerm(localFilters.searchTerm));
        dispatch(setRequestDate(localFilters.requestDate));
    };

    /**
     * 상세보기 핸들러
     * @param {string} id - 결재 ID
     */
    const handleViewDetail = (id) => {
        navigate(`/approvals/${id}`); // 결재 상세 페이지로 이동
    };

    /**
     * 승인 핸들러
     * @param {string} id - 결재 ID
     */
    const handleApprove = async (id) => {
        // TODO: 승인 API 호출 (API 엔드포인트 및 요청 바디는 백엔드에 따라 달라질 수 있음)
        try {
            // const response = await fetchWithAuth(`${API_URL}approvals/${id}/approve`, {
            //     method: 'POST',
            // });
            // if (!response.ok) {
            //     throw new Error(`승인 실패: ${response.status}`);
            // }
            // console.log('승인 성공');
            // alert('승인되었습니다.');
            // fetchApprovals(); // 결재 목록 갱신

            // ** 가짜로 승인 처리 **
            alert('승인되었습니다.');
            fetchApprovals(); // 결재 목록 갱신

        } catch (error) {
            console.error('승인 중 오류 발생:', error);
            alert('승인 중 오류가 발생했습니다.');
        }
    };

    /**
     * 반려 핸들러
     * @param {string} id - 결재 ID
     */
    const handleReject = async (id) => {
        // TODO: 반려 API 호출 (API 엔드포인트 및 요청 바디는 백엔드에 따라 달라질 수 있음)
        try {
            // const response = await fetchWithAuth(`${API_URL}approvals/${id}/reject`, {
            //     method: 'POST',
            // });
            // if (!response.ok) {
            //     throw new Error(`반려 실패: ${response.status}`);
            // }
            // console.log('반려 성공');
            // alert('반려되었습니다.');
            // fetchApprovals(); // 결재 목록 갱신

            // ** 가짜로 반려 처리 **
            alert('반려되었습니다.');
            fetchApprovals(); // 결재 목록 갱신

        } catch (error) {
            console.error('반려 중 오류 발생:', error);
            alert('반려 중 오류가 발생했습니다.');
        }
    };

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" sx={{ mb: 4 }}>결재 대기 목록</Typography>

            {/* 검색 및 필터 섹션 */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        label="요청번호/요청자/프로젝트명"
                        variant="outlined"
                        value={localFilters.searchTerm}
                        onChange={handleSearchTermChange}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        label="요청일"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={localFilters.requestDate}
                        onChange={handleRequestDateChange}
                    />
                </Grid>
                <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button variant="contained" color="primary" onClick={handleApplyFilters}>
                        검색
                    </Button>
                </Grid>
            </Grid>

            {/* 결재 대기 목록 테이블 */}
            <Paper>
                <StyledTableContainer>
                    <Table stickyHeader aria-label="결재 대기 목록 테이블">
                        <TableHead>
                            <TableRow>
                                <TableCell>요청번호</TableCell>
                                <TableCell>프로젝트명</TableCell>
                                <TableCell>요청자</TableCell>
                                <TableCell>총금액</TableCell>
                                <TableCell>요청일</TableCell>
                                <TableCell>액션</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {getFilteredApprovals().map(approval => (
                                <TableRow key={approval.id} hover>
                                    <TableCell>{approval.id}</TableCell>
                                    <TableCell>{approval.purchaseRequest?.project?.projectName}</TableCell>
                                    <TableCell>{approval.purchaseRequest?.requester?.name}</TableCell>
                                    <TableCell>{approval.purchaseRequest?.totalAmount?.toLocaleString()}원</TableCell>
                                    <TableCell>{approval.purchaseRequest?.requestDate}</TableCell>
                                    <TableCell>
                                        <Button size="small" variant="contained" color="success" onClick={() => handleApprove(approval.id)}>
                                            승인
                                        </Button>
                                        <Button size="small" variant="contained" color="error" onClick={() => handleReject(approval.id)}>
                                            반려
                                        </Button>
                                        <Button size="small" variant="outlined" onClick={() => handleViewDetail(approval.id)}>
                                            상세보기
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </StyledTableContainer>
            </Paper>
        </Box>
    );
}

export default ApprovalListPage;
