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
    Link,
    styled,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    maxHeight: 440,
    '& .MuiTableHead-root': {
        position: 'sticky',
        top: 0,
        backgroundColor: theme.palette.background.paper,
        zIndex: 1,
    },
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

    useEffect(() => {
        dispatch(fetchProjects());
    }, [dispatch]);

    const getFilteredProjects = () => {
        return projects.filter(project => {
            const searchTermLower = localFilters.searchTerm?.toLowerCase() || '';
            const searchMatch = [
                project.projectName?.toLowerCase(),
                String(project.id),
                project.requesterName?.toLowerCase(),
                project.businessCategory?.toLowerCase()
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

    const handleApplyFilters = () => {
        dispatch(setSearchTerm(localFilters.searchTerm));
        dispatch(setStartDate(localFilters.startDate));
        dispatch(setEndDate(localFilters.endDate));
        dispatch(setStatus(localFilters.status));
    };

    const handleCreateProject = () => {
        navigate('/projects/new');
    };

    const handleViewDetail = (id) => {
        navigate(`/projects/${id}`);
    };

    if (loading) {
        return <Typography>로딩 중...</Typography>;
    }

    if (error) {
        return <Typography color="error">오류: {error}</Typography>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>프로젝트 목록</Typography>

            {/* 필터 섹션 */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            label="검색"
                            value={localFilters.searchTerm}
                            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                            variant="outlined"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <LocalizationProvider dateAdapter={AdapterMoment}>
                            <DatePicker
                                label="시작일"
                                value={localFilters.startDate ? moment(localFilters.startDate) : null}
                                onChange={(date) => handleFilterChange('startDate', date ? date.format('YYYY-MM-DD') : null)}
                                renderInput={(params) => <TextField {...params} fullWidth />}
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
                                <MenuItem value="PROJECT-STATUS-REQUESTED">요청</MenuItem>
                                <MenuItem value="PROJECT-STATUS-RECEIVED">접수</MenuItem>
                                <MenuItem value="PROJECT-STATUS-REJECTED">반려</MenuItem>
                                <MenuItem value="PROJECT-STATUS-TERMINATED">중도 종결</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="contained" color="primary" onClick={handleApplyFilters}>
                            검색
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* 프로젝트 목록 테이블 */}
            <StyledTableContainer component={Paper}>
                <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                        <TableRow>
                            <TableCell>프로젝트 ID</TableCell>
                            <TableCell>프로젝트명</TableCell>
                            <TableCell>담당자</TableCell>
                             <TableCell>고객사</TableCell>
                            <TableCell>계약 유형</TableCell>
                            <TableCell>기본 상태</TableCell>
                            <TableCell>조달 상태</TableCell>
                            <TableCell>액션</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {getFilteredProjects().map(project => (
                            <TableRow
                                key={project.id}
                                hover
                                onClick={() => handleViewDetail(project.id)}
                                sx={{ cursor: 'pointer' }}
                            >
                                <TableCell>{project.id}</TableCell>
                                <TableCell>{project.projectName}</TableCell>
                                <TableCell>{project.businessManager}</TableCell>
                                 <TableCell>{project.clientCompany}</TableCell>
                                <TableCell>{project.contractType}</TableCell>
                                <TableCell>{project.basicStatus}</TableCell>
                                <TableCell>{project.procurementStatus}</TableCell>
                                <TableCell>
                                    <Button size="small" variant="outlined" onClick={() => handleViewDetail(project.id)}>
                                        상세보기
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </StyledTableContainer>

            {/* 신규 생성 버튼 */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCreateProject}
                >
                    신규 생성
                </Button>
            </Box>
        </Box>
    );
}

export default ProjectListPage;