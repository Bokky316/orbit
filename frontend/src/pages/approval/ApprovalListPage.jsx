import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    setApprovals,
    setSearchTerm,
    setRequestDate,
    fetchPendingApprovalsAction,
    fetchCompletedApprovalsAction
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
    Grid,
    CircularProgress,
    Tabs,
    Tab
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
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

// 탭 패널 컴포넌트
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`approval-tabpanel-${index}`}
            aria-labelledby={`approval-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

/**
 * 결재 대기 목록 페이지 컴포넌트
 * @returns {JSX.Element}
 */
function ApprovalListPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector(state => state.approval);
    const pendingApprovals = useSelector(state => state.approval.pendingApprovals || []);
    const completedApprovals = useSelector(state => state.approval.completedApprovals || []);
    const filters = useSelector(state => state.approval.filters);
    const [localFilters, setLocalFilters] = useState(filters);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        // 컴포넌트 마운트 시 결재 목록 데이터 로딩
        fetchApprovals();
    }, [dispatch]);

    /**
     * 결재 목록 데이터 API 호출 함수
     */
    const fetchApprovals = async () => {
        try {
            // Redux 액션으로 대기 중인 결재와 완료된 결재 목록 조회
            dispatch(fetchPendingApprovalsAction());
            dispatch(fetchCompletedApprovalsAction());
        } catch (error) {
            console.error('결재 목록 로딩 중 오류 발생:', error);
        }
    };

    /**
     * 검색 및 필터링된 결재 목록을 반환합니다.
     * @returns {array} 필터링된 결재 목록
     */
    const getFilteredApprovals = () => {
        const approvals = tabValue === 0 ? pendingApprovals : completedApprovals;
        return approvals.filter(approval => {
            const searchTerm = localFilters.searchTerm || '';
            const searchTermMatch = String(approval.id ?? '').includes(searchTerm) ||
                String(approval.purchaseRequest?.project?.projectName ?? '').includes(searchTerm) ||
                String(approval.purchaseRequest?.requester?.name ?? '').includes(searchTerm);
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
        const approval = tabValue === 0
            ? pendingApprovals.find(item => item.id === id)
            : completedApprovals.find(item => item.id === id);

        if (approval?.purchaseRequestId) {
            navigate(`/purchase-requests/${approval.purchaseRequestId}`);
        } else {
            alert('구매요청 정보를 찾을 수 없습니다.');
        }
    };

    /**
     * 탭 변경 핸들러
     */
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // 로딩 표시
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // 에러 표시
    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography color="error" variant="h6">
                    {error}
                </Typography>
                <Box sx={{ mt: 2 }}>
                    <Button variant="contained" onClick={fetchApprovals}>다시 시도</Button>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>결재 목록</Typography>

            {/* 검색 및 필터 섹션 */}
            <Paper elevation={2} sx={{ padding: 2, marginBottom: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="검색"
                            value={localFilters.searchTerm || ''}
                            onChange={handleSearchTermChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth
                            label="요청일"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={localFilters.requestDate || ''}
                            onChange={handleRequestDateChange}
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

            {/* 탭 메뉴 */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab label={`대기 (${pendingApprovals.length})`} />
                    <Tab label={`완료 (${completedApprovals.length})`} />
                </Tabs>

                {/* 대기 중인 결재 */}
                <TabPanel value={tabValue} index={0}>
                    {getFilteredApprovals().length === 0 ? (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography color="textSecondary">
                                대기 중인 결재가 없습니다.
                            </Typography>
                        </Box>
                    ) : (
                        <StyledTableContainer>
                            <Table stickyHeader aria-label="sticky table">
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
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="primary"
                                                    onClick={() => handleViewDetail(approval.id)}
                                                    sx={{ mr: 1 }}
                                                >
                                                    상세보기
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </StyledTableContainer>
                    )}
                </TabPanel>

                {/* 완료된 결재 */}
                <TabPanel value={tabValue} index={1}>
                    {getFilteredApprovals().length === 0 ? (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography color="textSecondary">
                                완료된 결재가 없습니다.
                            </Typography>
                        </Box>
                    ) : (
                        <StyledTableContainer>
                            <Table stickyHeader aria-label="sticky table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>요청번호</TableCell>
                                        <TableCell>프로젝트명</TableCell>
                                        <TableCell>요청자</TableCell>
                                        <TableCell>총금액</TableCell>
                                        <TableCell>요청일</TableCell>
                                        <TableCell>결재일</TableCell>
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
                                            <TableCell>{approval.approvedAt}</TableCell>
                                            <TableCell>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="primary"
                                                    onClick={() => handleViewDetail(approval.id)}
                                                >
                                                    상세보기
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </StyledTableContainer>
                    )}
                </TabPanel>
            </Paper>
        </Box>
    );
}

export default ApprovalListPage;