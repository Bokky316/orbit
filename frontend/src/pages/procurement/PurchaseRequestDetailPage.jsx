import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Link, Chip,
    Grid, List, ListItem, ListItemText, Divider, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';
import moment from 'moment';
import {
    AttachFile as AttachFileIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import ApprovalLineComponent from '@/pages/approval/ApprovalLineComponent';
import ApprovalLineSetupComponent from '@/pages/approval/ApprovalLineSetupComponent';
import { styled } from '@mui/material/styles';

// 상태 칩 스타일 커스터마이징
const StatusChip = styled(Chip)(({ theme, statuscode }) => {
    // statuscode 소문자로 변환하여 비교
    const status = String(statuscode).toLowerCase();

    // 상태별 색상 지정
    let color = theme.palette.grey[500]; // 기본값

    if (status.includes('approved') || status.includes('승인')) {
        color = theme.palette.success.main;
    } else if (status.includes('rejected') || status.includes('반려')) {
        color = theme.palette.error.main;
    } else if (status.includes('requested') || status.includes('요청')) {
        color = theme.palette.info.main;
    } else if (status.includes('in_review') || status.includes('검토')) {
        color = theme.palette.warning.main;
    } else if (status.includes('pending') || status.includes('대기')) {
        color = theme.palette.primary.light;
    }

    return {
        backgroundColor: color,
        color: theme.palette.getContrastText(color),
        fontWeight: 'bold'
    };
});

const PurchaseRequestDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // 리덕스에서 현재 사용자 정보 가져오기
    const currentUser = useSelector(state => state.auth.user);

    // 로컬 상태
    const [request, setRequest] = useState(null);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showApprovalSetup, setShowApprovalSetup] = useState(false);
    const [approvalLines, setApprovalLines] = useState([]);
    const [hasApprovalAuthority, setHasApprovalAuthority] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}purchase-requests/${id}`);
                if (!response.ok) throw new Error('데이터 로드 실패');
                const data = await response.json();
                setRequest(data);

                // 2. 프로젝트 ID가 있으면 프로젝트 정보 가져오기
                if (data.projectId) {
                    const projectResponse = await fetchWithAuth(`${API_URL}projects/${data.projectId}`);
                    if (projectResponse.ok) {
                        const projectData = await projectResponse.json();
                        setProject(projectData);
                    } else {
                        console.warn('프로젝트 정보를 가져오는데 실패했습니다.');
                    }
                }

                // 3. 결재선 정보 가져오기
                try {
                    const approvalResponse = await fetchWithAuth(`${API_URL}approvals/${id}`);
                    if (approvalResponse.ok) {
                        const approvalData = await approvalResponse.json();
                        setApprovalLines(approvalData);

                        // 현재 사용자가 결재 권한이 있는지 확인
                        if (currentUser) {
                          const hasAuthority = approvalData.some(line =>
                            (line.statusCode === 'IN_REVIEW' || line.statusCode === 'PENDING' || line.statusCode === 'REQUESTED') &&
                            (line.approverId === currentUser.id || line.approver_id === currentUser.id)
                          );
                          setHasApprovalAuthority(hasAuthority);
                        }
                    }
                } catch (approvalError) {
                    console.warn('결재선 정보를 가져오는데 실패했습니다:', approvalError);
                    // 결재선 정보가 없어도 페이지는 계속 로드
                }

                setError(null);
            } catch (error) {
                console.error('Error:', error);
            }
        };
        fetchData();
    }, [id, currentUser]);

    // 결재선 설정 완료 핸들러
    const handleApprovalSetupComplete = () => {
        setShowApprovalSetup(false);

        // 결재선 정보 다시 조회
        const fetchApprovalLines = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}approvals/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setApprovalLines(data);
                }
            } catch (error) {
                console.warn('결재선 정보를 가져오는데 실패했습니다:', error);
            }
        };

        fetchApprovalLines();
    };

    // 결재 처리 완료 핸들러
    const handleApprovalComplete = () => {
        // 구매요청 정보 다시 조회
        const fetchUpdatedData = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}purchase-requests/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setRequest(data);

                    // 결재선 정보 다시 조회
                    const approvalResponse = await fetchWithAuth(`${API_URL}approvals/${id}`);
                    if (approvalResponse.ok) {
                        const approvalData = await approvalResponse.json();
                        setApprovalLines(approvalData);

                        // 결재 권한 업데이트
                        if (currentUser) {
                            const hasAuthority = approvalData.some(line =>
                                line.statusCode === 'IN_REVIEW' &&
                                line.approverId === currentUser.id
                            );
                            setHasApprovalAuthority(hasAuthority);
                        }
                    }
                }
            } catch (error) {
                console.error('데이터 업데이트 중 오류 발생:', error);
            }
        };

        fetchUpdatedData();
    };

    // 로딩 상태 처리
    if (loading) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>데이터를 불러오는 중입니다...</Typography>
            </Box>
        );
    }

    // 에러 상태 처리
    if (error) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">오류 발생: {error}</Typography>
                <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/purchase-requests')}
                >
                    목록으로 돌아가기
                </Button>
            </Box>
        );
    }

    // 데이터가 없는 경우
    if (!request) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>구매 요청 정보가 없습니다.</Typography>
                <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/purchase-requests')}
                >
                    목록으로 돌아가기
                </Button>
            </Box>
        );
    }

    // 상태 표시 색상 설정
    const statusColor = {
        'REQUESTED': 'info',
        'APPROVED': 'success',
        'REJECTED': 'error',
        'COMPLETED': 'warning'
    }[request.prStatusChild] || 'default';

    // 첨부파일 다운로드 함수
    const downloadFile = async (attachment) => {
        try {
            console.log("[DEBUG] 첨부파일 객체:", attachment);

            if (!attachment?.id) {
                alert("유효하지 않은 첨부파일 ID입니다.");
                return;
            }

            const response = await fetchWithAuth(
                `${API_URL}purchase-requests/attachments/${attachment.id}/download`,
                { method: 'GET', responseType: 'blob' }
            );

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = attachment.fileName;
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
        }
    };

    // 결재선 설정 가능 여부 확인
    const canSetupApprovalLine = () => {
        if (approvalLines.length === 0) {
            return true;
        }

        // 이미 승인 또는 반려된 결재선이 있으면 설정 불가
        return !approvalLines.some(line =>
            line.statusCode === 'APPROVED' || line.statusCode === 'REJECTED'
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* 상단 헤더 및 상태 표시 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4">{request.requestName}</Typography>
                    <StatusChip
                        label={request.prStatusChild || '요청됨'}
                        statuscode={request.prStatusChild}
                        variant="outlined"
                    />
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/purchase-requests/edit/${id}`)}
                    >
                        수정
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => {
                            if (window.confirm('정말 삭제하시겠습니까?')) {
                                // 삭제 로직
                            }
                        }}
                    >
                        삭제
                    </Button>
                    {canSetupApprovalLine() && !showApprovalSetup && (
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<AddIcon />}
                            onClick={() => setShowApprovalSetup(true)}
                        >
                            결재선 설정
                        </Button>
                    )}
                </Box>
            </Box>

            {/* 결재선 설정 또는 결재선 표시 */}
            {showApprovalSetup ? (
                <ApprovalLineSetupComponent
                    purchaseRequestId={Number(id)}
                    onSetupComplete={handleApprovalSetupComplete}
                />
            ) : (
                approvalLines.length > 0 && (
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <ApprovalLineComponent
                            purchaseRequestId={Number(id)}
                            currentUserId={currentUser?.id}
                            onApprovalComplete={handleApprovalComplete}
                        />
                    </Paper>
                )
            )}

            {/* 관련 프로젝트 정보 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>관련 프로젝트 정보</Typography>
                {project ? (
                    <Grid container spacing={2}>
                        <Grid item xs={4}>
                            <Typography><strong>프로젝트명:</strong> {project.projectName}</Typography>
                            <Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    sx={{ mt: 1 }}
                                    onClick={() => navigate(`/projects/${project.id}`)}
                                >
                                    프로젝트 상세보기
                                </Button>
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography><strong>고객사:</strong> {project.clientCompany || '정보 없음'}</Typography>
                            <Typography><strong>계약 유형:</strong> {project.contractType || '정보 없음'}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography><strong>기간:</strong> {
                                project.projectPeriod ?
                                `${moment(project.projectPeriod.startDate).format('YYYY-MM-DD')} ~
                                ${moment(project.projectPeriod.endDate).format('YYYY-MM-DD')}` :
                                '정보 없음'
                            }</Typography>
                            <Typography><strong>예산:</strong> {
                                project.totalBudget ?
                                `${project.totalBudget.toLocaleString()}원` :
                                '정보 없음'
                            }</Typography>
                        </Grid>
                    </Grid>
                ) : (
                    <Typography color="text.secondary">관련 프로젝트 정보가 없습니다.</Typography>
                )}
            </Paper>

            {/* 기본 정보 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>기본 정보</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={4}>
                        <Typography><strong>요청번호:</strong> {request.id}</Typography>
                        <Typography><strong>사업구분:</strong> {request.businessType}</Typography>
                        <Typography><strong>요청일:</strong> {request.requestDate ? moment(request.requestDate).format('YYYY-MM-DD') : '정보 없음'}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography><strong>고객사:</strong> {request.customer || '정보 없음'}</Typography>
                        <Typography><strong>사업부서:</strong> {request.businessDepartment || '정보 없음'}</Typography>
                        <Typography><strong>담당자:</strong> {request.businessManager || '정보 없음'}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography><strong>예산:</strong> {request.businessBudget ? `${request.businessBudget.toLocaleString()}원` : '정보 없음'}</Typography>
                        <Typography><strong>연락처:</strong> {request.managerPhoneNumber || '정보 없음'}</Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* 요청자 정보 */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>요청자 정보</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Typography><strong>요청자:</strong> {request.memberName || '정보 없음'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography><strong>소속:</strong> {request.memberCompany || '정보 없음'}</Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* 사업 구분별 상세 정보 */}
            {request.businessType === 'SI' && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>SI 프로젝트 정보</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography><strong>시작일:</strong> {moment(request.projectStartDate).format('YYYY-MM-DD')}</Typography>
                            <Typography><strong>종료일:</strong> {moment(request.projectEndDate).format('YYYY-MM-DD')}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography><strong>프로젝트 내용:</strong></Typography>
                            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{request.projectContent}</Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {request.businessType === 'MAINTENANCE' && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>유지보수 정보</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography><strong>계약기간:</strong> {moment(request.contractStartDate).format('YYYY-MM-DD')} ~ {moment(request.contractEndDate).format('YYYY-MM-DD')}</Typography>
                            <Typography><strong>계약금액:</strong> {request.contractAmount?.toLocaleString()}원</Typography>
                            <Typography><strong>시작일:</strong> {moment(request.contractStartDate).format('YYYY-MM-DD')}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography><strong>계약내용:</strong></Typography>
                            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{request.contractDetails}</Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {request.businessType === 'GOODS' && request.items?.length > 0 && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>구매 품목</Typography>
                    {Array.isArray(request.items) && request.items.length > 0 ? (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>No</TableCell>
                                        <TableCell>품목명</TableCell>
                                        <TableCell>사양</TableCell>
                                        <TableCell>단위</TableCell>
                                        <TableCell align="right">수량</TableCell>
                                        <TableCell align="right">단가</TableCell>
                                        <TableCell align="right">금액</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {request.items.map((item, index) => (
                                        <TableRow key={item.id || index}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{item.itemName}</TableCell>
                                            <TableCell>{item.specification || '-'}</TableCell>
                                            <TableCell>{item.unitChildCode || '-'}</TableCell>
                                            <TableCell align="right">{item.quantity}</TableCell>
                                            <TableCell align="right">
                                                ₩{Number(item.unitPrice).toLocaleString()}
                                            </TableCell>
                                            <TableCell align="right">
                                                ₩{Number(item.totalPrice).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold' }}>합계</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                            ₩{request.items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            구매 품목 정보가 없습니다.
                        </Typography>
                    )}
                </Paper>
            )}

            {/* 첨부 파일 */}
            {request.attachments?.length > 0 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>첨부 파일</Typography>
                    <List>
                        {request.attachments.map((attachment, index) => (
                           <ListItem key={attachment.id}>
                             <Link
                               component="button"
                               onClick={() => downloadFile(attachment)}
                               sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                             >
                               📎 {attachment.fileName}
                               <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                 ({Math.round(attachment.fileSize / 1024)}KB)
                               </Typography>
                             </Link>
                           </ListItem>
                        ))}
                    </List>
                </Paper>
            )}

            {/* 하단 버튼 그룹 */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    variant="outlined"
                    onClick={() => navigate('/purchase-requests')}
                >
                    목록으로
                </Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {/* 필요한 액션 버튼들 */}
                </Box>
            </Box>
        </Box>
    );
};

export default PurchaseRequestDetailPage;