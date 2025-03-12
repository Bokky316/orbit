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
    Grid,
    List,
    ListItem,
    Link,
    Divider
} from '@mui/material';
import { AttachFile as AttachFileIcon } from '@mui/icons-material';

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

    // 첨부파일 다운로드 함수
    const downloadFile = async (attachmentId) => {
        try {
            const response = await fetchWithAuth(
                `${API_URL}projects/attachments/${attachmentId}/download`,
                { method: 'GET', responseType: 'blob' }
            );

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || `attachment-${attachmentId}`;
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } else {
                console.error('다운로드 실패:', await response.text());
                alert('파일 다운로드에 실패했습니다.');
            }
        } catch (error) {
            console.error('다운로드 오류:', error);
            alert('파일 다운로드 중 오류가 발생했습니다.');
        }
    };

    // 첨부파일 업로드 함수
    const uploadFiles = async (files) => {
        if (!files || files.length === 0) return;

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        try {
            const response = await fetchWithAuth(`${API_URL}projects/${id}/attachments`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                // 프로젝트 정보 다시 불러오기
                const projectRes = await fetchWithAuth(`${API_URL}projects/${id}`);
                if (projectRes.ok) {
                    setProject(await projectRes.json());
                    alert('첨부파일이 성공적으로 업로드되었습니다.');
                }
            } else {
                alert('첨부파일 업로드에 실패했습니다.');
            }
        } catch (error) {
            console.error('업로드 오류:', error);
            alert('첨부파일 업로드 중 오류가 발생했습니다.');
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
                        <Typography><strong>담당자:</strong> {project.requesterName}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography><strong>시작일:</strong> {formatDate(project.projectPeriod.startDate)}</Typography>
                        <Typography><strong>종료일:</strong> {formatDate(project.projectPeriod.endDate)}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography><strong>기본 상태:</strong></Typography>
                        <Chip
                            label={project.basicStatus ? project.basicStatus.split('-')[2] : '미설정'}
                            sx={{...statusChipStyle, backgroundColor: '#e3f2fd'}}
                        />
                        <Typography sx={{ mt: 1 }}><strong>조달 상태:</strong></Typography>
                        <Chip
                            label={project.procurementStatus ? project.procurementStatus.split('-')[2] : '미설정'}
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
                        <Typography><strong>고객사:</strong> {project.clientCompany || '정보 없음'}</Typography>
                        <Typography><strong>계약 유형:</strong> {project.contractType || '정보 없음'}</Typography>
                        <Typography><strong>총 예산:</strong> {project.totalBudget ? project.totalBudget.toLocaleString() + ' 원' : '정보 없음'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography><strong>특이 사항:</strong></Typography>
                        <Typography sx={{ whiteSpace: 'pre-line' }}>
                            {project.remarks || '없음'}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* 첨부 파일 섹션 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">첨부 파일</Typography>
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<AttachFileIcon />}
                    >
                        파일 추가
                        <input
                            type="file"
                            multiple
                            hidden
                            onChange={(e) => uploadFiles(e.target.files)}
                        />
                    </Button>
                </Box>

                {project.attachments && project.attachments.length > 0 ? (
                    <List>
                        {project.attachments.map((attachment, index) => (
                            <React.Fragment key={attachment.id}>
                                <ListItem>
                                    <Link
                                        component="button"
                                        onClick={() => downloadFile(attachment.id)}
                                        sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    >
                                        <AttachFileIcon sx={{ mr: 1 }} />
                                        {attachment.fileName}
                                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                            ({Math.round(attachment.fileSize / 1024)}KB) - {new Date(attachment.uploadedAt).toLocaleString()}
                                        </Typography>
                                    </Link>
                                </ListItem>
                                {index < project.attachments.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                ) : (
                    <Typography color="text.secondary">첨부 파일이 없습니다.</Typography>
                )}
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
                            {purchaseRequests.length > 0 ? (
                                purchaseRequests.map(req => (
                                    <TableRow key={req.id}>
                                        <TableCell>{req.requestNumber}</TableCell>
                                        <TableCell>{req.businessType}</TableCell>
                                        <TableCell>{req.requestName}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={req.status ? req.status.split('-')[2] : '미설정'}
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
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">관련 구매 요청이 없습니다.</TableCell>
                                </TableRow>
                            )}
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
                <Button
                    variant="outlined"
                    onClick={() => navigate('/projects')}
                >
                    목록
                </Button>
            </Box>
        </Box>
    );
}

export default ProjectDetailPage;