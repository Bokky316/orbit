import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    fetchProjects,
    deleteProject,
    setSearchTerm,
    setStartDate,
    setEndDate,
    setStatus
} from '@/redux/projectSlice';
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
    Chip,
    IconButton,
    Tooltip,
    Card,
    CardContent,
    Divider,
    InputAdornment,
    styled,
    TablePagination
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';
import {
    Add as AddIcon,
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Refresh as RefreshIcon,
    Clear as ClearIcon
} from '@mui/icons-material';

// 스타일 컴포넌트 정의
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    maxHeight: 'calc(100vh - 320px)', // 화면 높이에 맞게 조정
    '& .MuiTableHead-root': {
        position: 'sticky',
        top: 0,
        backgroundColor: theme.palette.background.paper,
        zIndex: 1,
    },
    '& .MuiTableRow-root:hover': {
        backgroundColor: theme.palette.action.hover
    }
}));

const StatusChip = styled(Chip)(({ theme, statuscode }) => {
    // statuscode 소문자로 변환하여 비교
    const status = String(statuscode).toLowerCase();

    // 상태별 색상 지정
    let color = theme.palette.grey[500]; // 기본값

    if (status.includes('registered')) {
        color = theme.palette.info.light;
    } else if (status.includes('reregistered')) {
        color = theme.palette.info.light;
    } else if (status.includes('in_progress')) {
        color = theme.palette.primary.main;
    } else if (status.includes('completed')) {
        color = theme.palette.success.main;
    } else if (status.includes('terminated')) {
        color = theme.palette.error.main;
    }

    return {
        backgroundColor: color,
        color: theme.palette.getContrastText(color),
        fontWeight: 'bold',
        minWidth: '80px'
    };
});

const PageTitle = styled(Typography)(({ theme }) => ({
    margin: theme.spacing(3, 0, 2),
    fontWeight: 600,
    color: theme.palette.text.primary
}));

const ActionButton = styled(Button)(({ theme }) => ({
    margin: theme.spacing(1),
    boxShadow: 'none'
}));

function ProjectListPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { projects, filters, loading, error } = useSelector(state => state.project);
    const [localFilters, setLocalFilters] = useState({
        searchTerm: filters.searchTerm || '',
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
        status: filters.status || '',
    });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        dispatch(fetchProjects());

        // 자동 갱신 설정 - 5분마다 프로젝트 목록 갱신
        const intervalId = setInterval(() => {
            dispatch(fetchProjects());
            console.log('프로젝트 목록 자동 갱신됨');
        }, 300000); // 5분 = 300,000밀리초

        // 컴포넌트 언마운트 시 인터벌 제거
        return () => clearInterval(intervalId);
    }, [dispatch]);

    // 상태 코드를 한글 표시로 변환하는 함수
    const getStatusLabel = (statusCode) => {
        if (!statusCode) return '상태 없음';

        // PROJECT-BASIC_STATUS-REGISTERED 형식에서 마지막 부분 추출
        const parts = statusCode.split('-');
        const code = parts.length >= 3 ? parts[2] : statusCode;

        switch (code) {
            case 'REGISTERED': return '등록';
            case 'REREGISTERED': return '정정등록';
            case 'IN_PROGRESS': return '진행중';
            case 'TERMINATED': return '중도종결';
            case 'COMPLETED': return '완료';
            default: return code;
        }
    };

    // 사업 유형 코드를 한글 표시로 변환하는 함수
    const getBusinessTypeLabel = (typeCode) => {
        if (!typeCode) return '유형 없음';

        switch (typeCode) {
            case 'SI': return 'SI';
            case 'MAINTENANCE': return '유지보수';
            case 'IMPLEMENTATION': return '구축';
            case 'CONSULTING': return '컨설팅';
            case 'OUTSOURCING': return '아웃소싱';
            case 'OTHER': return '기타';
            default: return typeCode;
        }
    };

    const getFilteredProjects = () => {
        return projects.filter(project => {
            const searchTermLower = localFilters.searchTerm?.toLowerCase() || '';
            const searchMatch = [
                project.projectName?.toLowerCase(),
                project.projectIdentifier,
                project.requesterName?.toLowerCase(),
                project.businessCategory?.toLowerCase(),
                project.requestDepartment?.toLowerCase()
            ].some(field => field?.includes(searchTermLower));

            const startDateMatch = !localFilters.startDate ||
                (project.projectPeriod?.startDate && moment(project.projectPeriod.startDate).isSameOrAfter(localFilters.startDate, 'day'));

            const endDateMatch = !localFilters.endDate ||
                (project.projectPeriod?.endDate && moment(project.projectPeriod.endDate).isSameOrBefore(localFilters.endDate, 'day'));

            const statusMatch = !localFilters.status || project.basicStatus === localFilters.status;

            return searchMatch && startDateMatch && endDateMatch && statusMatch;
        });
    };

    const handleFilterChange = (type, value) => {
        setLocalFilters(prevFilters => ({
            ...prevFilters,
            [type]: value
        }));
    };

    const handleClearFilters = () => {
        setLocalFilters({
            searchTerm: '',
            startDate: null,
            endDate: null,
            status: '',
        });
        dispatch(setSearchTerm(''));
        dispatch(setStartDate(null));
        dispatch(setEndDate(null));
        dispatch(setStatus(''));
    };

    const handleApplyFilters = () => {
        dispatch(setSearchTerm(localFilters.searchTerm));
        dispatch(setStartDate(localFilters.startDate));
        dispatch(setEndDate(localFilters.endDate));
        dispatch(setStatus(localFilters.status));
    };

    const handleRefreshProjects = () => {
        dispatch(fetchProjects());
    };

    const handleCreateProject = () => {
        navigate('/projects/new');
    };

    const handleViewDetail = (id) => {
        navigate(`/projects/${id}`);
    };

    // 페이지 변경 핸들러
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    // 페이지당 행 수 변경 핸들러
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // PROJECT-BASIC_STATUS-REGISTERED 형식에서 마지막 부분 추출하는 함수
    const extractStatusCode = (statusCode) => {
        if (!statusCode) return '';

        const parts = statusCode.split('-');
        return parts.length >= 3 ? parts[2] : statusCode;
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Typography variant="h6">프로젝트 목록을 불러오는 중...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Typography variant="h6" color="error">오류가 발생했습니다: {error}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
                <PageTitle variant="h4">프로젝트 목록</PageTitle>
            </Box>

            {/* 필터 섹션 */}
            <Card sx={{ mb: 3, overflow: 'visible' }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="검색"
                                value={localFilters.searchTerm}
                                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                                variant="outlined"
                                placeholder="프로젝트명, ID, 담당자, 부서"
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
                                    label="시작일"
                                    value={localFilters.startDate ? moment(localFilters.startDate) : null}
                                    onChange={(date) => handleFilterChange('startDate', date ? date.format('YYYY-MM-DD') : null)}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            variant: 'outlined'
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                <DatePicker
                                    label="종료일"
                                    value={localFilters.endDate ? moment(localFilters.endDate) : null}
                                    onChange={(date) => handleFilterChange('endDate', date ? date.format('YYYY-MM-DD') : null)}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            variant: 'outlined'
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel>진행상태</InputLabel>
                                <Select
                                    value={localFilters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    label="진행상태"
                                >
                                    <MenuItem value="">전체</MenuItem>
                                    <MenuItem value="PROJECT-BASIC_STATUS-REGISTERED">등록</MenuItem>
                                    <MenuItem value="PROJECT-BASIC_STATUS-REREGISTERED">정정등록</MenuItem>
                                    <MenuItem value="PROJECT-BASIC_STATUS-IN_PROGRESS">진행중</MenuItem>
                                    <MenuItem value="PROJECT-BASIC_STATUS-TERMINATED">중도종결</MenuItem>
                                    <MenuItem value="PROJECT-BASIC_STATUS-COMPLETED">완료</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="outlined"
                                color="inherit"
                                onClick={handleClearFilters}
                                startIcon={<ClearIcon />}
                                sx={{ mr: 1 }}
                            >
                                필터 초기화
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleApplyFilters}
                                startIcon={<FilterListIcon />}
                            >
                                필터 적용
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
            {/* 프로젝트 목록 테이블 */}
            <Card>
             <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleCreateProject}
                    sx={{ m: 2 }}
                >
                    신규 생성
                </Button>
                </Box>
                <Divider />
                <StyledTableContainer>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell width="15%">프로젝트 ID</TableCell>
                                <TableCell width="25%">프로젝트명</TableCell>
                                <TableCell width="15%">담당자</TableCell>
                                <TableCell width="15%">사업 유형</TableCell>
                                <TableCell width="15%">요청 부서</TableCell>
                                <TableCell width="15%" align="center">진행 상태</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {getFilteredProjects().length > 0 ? (
                                getFilteredProjects()
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map(project => {
                                    // 상태 코드 추출
                                    const statusCode = extractStatusCode(project.basicStatus);

                                    return (
                                        <TableRow
                                            key={project.id}
                                            hover
                                            sx={{ cursor: 'pointer' }}
                                            onClick={() => handleViewDetail(project.id)}
                                        >
                                            <TableCell>{project.projectIdentifier || project.id}</TableCell>
                                            <TableCell sx={{
                                                fontWeight: 'bold',
                                                color: 'primary.main',
                                            }}>
                                                {project.projectName}
                                            </TableCell>
                                            <TableCell>{project.requesterName}</TableCell>
                                            <TableCell>{getBusinessTypeLabel(project.businessCategory)}</TableCell>
                                            <TableCell>{project.requestDepartment}</TableCell>
                                            <TableCell align="center">
                                                <StatusChip
                                                    label={getStatusLabel(project.basicStatus)}
                                                    statuscode={statusCode}
                                                    size="small"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Typography variant="body1" sx={{ py: 2 }}>
                                            검색 조건에 맞는 프로젝트가 없습니다.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </StyledTableContainer>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={getFilteredProjects().length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="페이지당 행 수:"
                        labelDisplayedRows={({from, to, count}) => `${from}-${to} / 총 ${count}개`}
                    />
                </Box>
            </Card>
        </Box>
    );
}

export default ProjectListPage;