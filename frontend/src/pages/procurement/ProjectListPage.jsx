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
 * 프로젝트 목록 페이지 컴포넌트
 * @returns {JSX.Element}
 */
function ProjectListPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const projects = useSelector(state => state.project.projects);
    const filters = useSelector(state => state.project.filters);
    const loading = useSelector(state => state.project.loading);
    const error = useSelector(state => state.project.error);
    const [localFilters, setLocalFilters] = useState(filters);

    useEffect(() => {
        // 컴포넌트 마운트 시 프로젝트 목록 데이터 로딩
        dispatch(fetchProjects()); // 프로젝트 목록 가져오기
    }, [dispatch]);

    /**
     * 검색 및 필터링된 프로젝트 목록을 반환합니다.
     * @returns {array} 필터링된 프로젝트 목록
     */
    const getFilteredProjects = () => {
        return projects.filter(project => {
            const searchTerm = localFilters.searchTerm || ''; // searchTerm이 undefined일 경우 빈 문자열로 초기화
            const projectName = project.projectName || ''; // projectName이 undefined일 경우 빈 문자열로 초기화
            const managerName = project.managerName || ''; // managerName이 undefined일 경우 빈 문자열로 초기화
            const searchTermMatch = projectName.includes(searchTerm) || managerName.includes(searchTerm);
            const startDateMatch = !localFilters.startDate || project.startDate >= localFilters.startDate;
            const endDateMatch = !localFilters.endDate || project.endDate <= localFilters.endDate;
            const statusMatch = !localFilters.status || project.status === localFilters.status;
            return searchTermMatch && startDateMatch && endDateMatch && statusMatch;
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
     * 시작 날짜 변경 핸들러
     * @param {object} event - 이벤트 객체
     */
    const handleStartDateChange = (event) => {
        setLocalFilters({ ...localFilters, startDate: event.target.value });
    };

    /**
     * 종료 날짜 변경 핸들러
     * @param {object} event - 이벤트 객체
     */
    const handleEndDateChange = (event) => {
        setLocalFilters({ ...localFilters, endDate: event.target.value });
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
        dispatch(setStartDate(localFilters.startDate));
        dispatch(setEndDate(localFilters.endDate));
        dispatch(setStatus(localFilters.status));
    };

    /**
     * 새 프로젝트 생성 핸들러
     */
    const handleCreateProject = () => {
        navigate('/projects/new'); // 새 프로젝트 생성 페이지로 이동
    };

    /**
     * 상세보기 핸들러
     * @param {string} id - 프로젝트 ID
     */
    const handleViewDetail = (id) => {
        navigate(`/projects/${id}`); // 프로젝트 상세 페이지로 이동
    };

    /**
     * 삭제 핸들러
     * @param {string} id - 프로젝트 ID
     */
    const handleDeleteProject = async (id) => {
        try {
            // 프로젝트 삭제 API 호출
            const response = await fetchWithAuth(`${API_URL}projects/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error(`프로젝트 삭제 실패: ${response.status}`);
            }
            dispatch(deleteProject(id)); // Redux 스토어에서 프로젝트 삭제
        } catch (error) {
            console.error('프로젝트 삭제 중 오류 발생:', error);
            alert('프로젝트 삭제 중 오류가 발생했습니다.');
        }
    };

    if (loading) {
        return <Typography>Loading...</Typography>; // 데이터 로딩 중 표시
    }

    if (error) {
        return <Typography color="error">Error: {error}</Typography>; // 에러 발생 시 표시
    }

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" sx={{ mb: 4 }}>프로젝트 목록</Typography>

            {/* 검색 및 필터 섹션 */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                    <TextField
                        fullWidth
                        label="프로젝트명/담당자"
                        variant="outlined"
                        value={localFilters.searchTerm}
                        onChange={handleSearchTermChange}
                    />
                </Grid>
                <Grid item xs={12} md={2}>
                    <TextField
                        fullWidth
                        label="시작일"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={localFilters.startDate}
                        onChange={handleStartDateChange}
                    />
                </Grid>
                <Grid item xs={12} md={2}>
                    <TextField
                        fullWidth
                        label="종료일"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={localFilters.endDate}
                        onChange={handleEndDateChange}
                    />
                </Grid>
                <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                        <InputLabel id="status-label">상태</InputLabel>
                        <Select
                            labelId="status-label"
                            value={localFilters.status}
                            onChange={handleStatusChange}
                            label="상태"
                        >
                            <MenuItem value="">전체</MenuItem>
                            <MenuItem value="IN_PROGRESS">진행중</MenuItem>
                            <MenuItem value="COMPLETED">완료</MenuItem>
                            <MenuItem value="ON_HOLD">보류</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button variant="contained" color="primary" onClick={handleApplyFilters}>
                        검색
                    </Button>
                </Grid>
            </Grid>

            {/* 프로젝트 목록 테이블 */}
            <Paper>
                <StyledTableContainer>
                    <Table stickyHeader aria-label="프로젝트 목록 테이블">
                        <TableHead>
                            <TableRow>
                                <TableCell>프로젝트 ID</TableCell>
                                <TableCell>프로젝트명</TableCell>
                                <TableCell>담당자</TableCell>
                                <TableCell>시작일</TableCell>
                                <TableCell>종료일</TableCell>
                                <TableCell>상태</TableCell>
                                <TableCell>액션</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {getFilteredProjects().map(project => (
                                <TableRow key={project.id} hover>
                                    <TableCell>{project.projectId}</TableCell>
                                    <TableCell>{project.projectName}</TableCell>
                                    <TableCell>{project.managerName}</TableCell>
                                    <TableCell>{project.startDate}</TableCell>
                                    <TableCell>{project.endDate}</TableCell>
                                    <TableCell>{project.status}</TableCell>
                                    <TableCell>
                                        <Button size="small" variant="outlined" onClick={() => handleViewDetail(project.id)}>
                                            상세보기
                                        </Button>
                                        <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteProject(project.id)}>
                                            삭제
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </StyledTableContainer>
            </Paper>

            {/* 새 프로젝트 생성 버튼 */}
            <Box sx={{ mt: 4 }}>
                <Button variant="contained" color="primary" onClick={handleCreateProject}>
                    새 프로젝트 생성
                </Button>
            </Box>
        </Box>
    );
}

export default ProjectListPage;
