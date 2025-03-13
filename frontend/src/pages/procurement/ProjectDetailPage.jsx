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

    // src/pages/procurement/ProjectDetailPage.jsx의 useEffect 부분 수정

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. 프로젝트 상세 정보 조회
                const projectRes = await fetchWithAuth(`${API_URL}projects/${id}`);
                if (!projectRes.ok) throw new Error('프로젝트 조회 실패');
                const projectData = await projectRes.json();
                setProject(projectData);

                console.log('프로젝트 정보:', projectData);

                // 2. 모든 구매 요청을 가져와서 클라이언트에서 필터링
                const allPrRes = await fetchWithAuth(`${API_URL}purchase-requests`);
                if (!allPrRes.ok) throw new Error('구매 요청 조회 실패');

                const allRequests = await allPrRes.json();
                console.log('모든 구매 요청 데이터:', allRequests);

                if (Array.isArray(allRequests)) {
                    // 현재 프로젝트 ID와 일치하는 요청만 필터링
                    const filteredRequests = allRequests.filter(req => {
                        // projectId를 문자열로 변환하여 비교 (숫자와 문자열 타입을 모두 처리)
                        return req.projectId && req.projectId.toString() === id.toString();
                    });

                    console.log(`총 ${allRequests.length}개의 구매 요청 중 ${filteredRequests.length}개가 프로젝트 ID(${id})와 일치합니다.`);
                    setPurchaseRequests(filteredRequests);
                } else {
                    console.warn('API가 배열을 반환하지 않음:', allRequests);
                    setPurchaseRequests([]);
                }
            } catch (err) {
                console.error('데이터 로드 오류:', err);
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
    // downloadFile 함수 부분만 수정
    const downloadFile = async (attachmentId) => {
        try {
            console.log("첨부파일 다운로드 시작, attachmentId:", attachmentId);

            const response = await fetchWithAuth(
                `${API_URL}projects/attachments/${attachmentId}/download`,
                {
                    method: 'GET',
                    // responseType: 'blob' - fetchWithAuth는 자동으로 Response 객체를 반환
                }
            );

            if (response.ok) {
                // Blob으로 응답 변환
                const blob = await response.blob();

                // 파일명 추출 시도
                let filename = 'download';
                const contentDisposition = response.headers.get('content-disposition');
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (filenameMatch && filenameMatch[1]) {
                        filename = filenameMatch[1].replace(/['"]/g, '');
                        // URL 디코딩이 필요할 수 있음
                        try {
                            filename = decodeURIComponent(filename);
                        } catch (e) {
                            console.warn('파일명 디코딩 실패:', e);
                        }
                    }
                }

                // 다운로드 링크 생성 및 클릭
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();

                // 정리
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 100);

                console.log("파일 다운로드 성공:", filename);
            } else {
                console.error('다운로드 실패:', await response.text());
                alert('파일 다운로드에 실패했습니다.');
            }
        } catch (error) {
            console.error('다운로드 오류:', error);
            alert('파일 다운로드 중 오류가 발생했습니다.');
        }
    };

//     // 첨부파일 업로드 함수
//     // uploadFiles 함수 부분만 수정
//     const uploadFiles = async (files) => {
//         if (!files || files.length === 0) return;
//
//         const formData = new FormData();
//         for (let i = 0; i < files.length; i++) {
//             formData.append('files', files[i]);
//         }
//
//         try {
//             // Content-Type 헤더를 명시적으로 지정하지 않음 (브라우저가 자동으로 설정)
//             const response = await fetchWithAuth(`${API_URL}projects/${id}/attachments`, {
//                 method: 'POST',
//                 body: formData,
//             });
//
//             if (response.ok) {
//                 // 프로젝트 정보 다시 불러오기
//                 const projectRes = await fetchWithAuth(`${API_URL}projects/${id}`);
//                 if (projectRes.ok) {
//                     setProject(await projectRes.json());
//                     alert('첨부파일이 성공적으로 업로드되었습니다.');
//                 }
//             } else {
//                 const errorData = await response.text();
//                 alert(`첨부파일 업로드에 실패했습니다: ${errorData}`);
//             }
//         } catch (error) {
//             console.error('업로드 오류:', error);
//             alert(`첨부파일 업로드 중 오류가 발생했습니다: ${error.message}`);
//         }
//     };

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
                        <Typography><strong>요청 부서:</strong> {project.requestDepartment || '정보 없음'}</Typography>
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
                        <Typography><strong>사업 유형:</strong> {project.businessCategory || '정보 없음'}</Typography>
                        <Typography><strong>총 예산:</strong> {project.totalBudget ? project.totalBudget.toLocaleString() + ' 원' : '정보 없음'}</Typography>
                        <Typography><strong>예산 코드:</strong> {project.budgetCode || '정보 없음'}</Typography>
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
{/*                     <Button */}
{/*                         variant="outlined" */}
{/*                         component="label" */}
{/*                         startIcon={<AttachFileIcon />} */}
{/*                     > */}
{/*                         파일 추가 */}
{/*                         <input */}
{/*                             type="file" */}
{/*                             multiple */}
{/*                             hidden */}
{/*                             onChange={(e) => uploadFiles(e.target.files)} */}
{/*                         /> */}
{/*                     </Button> */}
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