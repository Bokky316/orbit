// src/pages/procurement/ProjectDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteProject } from '@/redux/projectSlice';
import {
    Box,
    Typography,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer,
    Chip,
    Grid
} from '@mui/material';

import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';
import { formatDate } from '@/utils/dateUtils'; // 날짜 포맷 유틸리티 추가

// 상태 표시용 칩 스타일
const statusChipStyle = {
    margin: '2px',
    fontWeight: 'bold',
    minWidth: '80px'
};

function ProjectDetailPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [purchaseRequests, setPurchaseRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. 프로젝트 상세 정보 조회
                const projectRes = await fetchWithAuth(`${API_URL}projects/${id}`);
                if (!projectRes.ok) throw new Error('프로젝트 조회 실패');
                const projectData = await projectRes.json();

                // 2. 연관 구매 요청 조회
                const prRes = await fetchWithAuth(
                    `${API_URL}purchase-requests?projectId=${projectData.id}`
                );
                if (!prRes.ok) throw new Error('구매 요청 조회 실패');

                setProject(projectData);
                setPurchaseRequests(await prRes.json());
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;

        try {
            const res = await fetchWithAuth(`${API_URL}projects/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('삭제 실패');
            dispatch(deleteProject(id));
            navigate('/projects');
        } catch (err) {
            alert(`삭제 오류: ${err.message}`);
        }
    };

    if (loading) return <Typography>로딩 중...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Box sx={{ p: 4 }}>
            {/* 기본 정보 섹션 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>기본 정보</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={4}>
                        <Typography><strong>프로젝트 ID:</strong> {project.id}</Typography>
                        <Typography><strong>프로젝트명:</strong> {project.projectName}</Typography>
                        <Typography><strong>담당자:</strong> {project.businessManager}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography><strong>시작일:</strong> {formatDate(project.projectPeriod.startDate)}</Typography>
                        <Typography><strong>종료일:</strong> {formatDate(project.projectPeriod.endDate)}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography><strong>기본 상태:</strong></Typography>
                        <Chip
                            label={project.basicStatus.split('-')[2]}
                            sx={{...statusChipStyle, backgroundColor: '#e3f2fd'}}
                        />
                        <Typography sx={{ mt: 1 }}><strong>조달 상태:</strong></Typography>
                        <Chip
                            label={project.procurementStatus.split('-')[2]}
                            sx={{...statusChipStyle, backgroundColor: '#f0f4c3'}}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* 상세 정보 섹션 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>상세 정보</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Typography><strong>고객사:</strong> {project.clientCompany}</Typography>
                        <Typography><strong>계약 유형:</strong> {project.contractType}</Typography>
                        <Typography><strong>총 예산:</strong> {project.totalBudget.toLocaleString()} 원</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography><strong>특이 사항:</strong></Typography>
                        <Typography sx={{ whiteSpace: 'pre-line' }}>
                            {project.specialNotes || '없음'}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* 연관 구매 요청 테이블 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>관련 구매 요청</Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>요청번호</TableCell>
                                <TableCell>유형</TableCell>
                                <TableCell>요청명</TableCell>
                                <TableCell>상태</TableCell>
                                <TableCell>액션</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {purchaseRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>{req.requestNumber}</TableCell>
                                    <TableCell>{req.businessType}</TableCell>
                                    <TableCell>{req.requestName}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={req.status.split('-')[2]}
                                            sx={statusChipStyle}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="small"
                                            onClick={() => navigate(`/purchase-requests/${req.id}`)}
                                        >
                                            상세보기
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* 액션 버튼 그룹 */}
            <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                <Button
                    variant="contained"
                    onClick={() => navigate(`/projects/edit/${id}`)}
                >
                    수정
                </Button>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDelete}
                >
                    삭제
                </Button>
            </Box>
        </Box>
    );
}

export default ProjectDetailPage;
