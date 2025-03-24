import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Link, Chip,
    Grid, List, ListItem, ListItemText, Divider, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
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
import { styled } from '@mui/material/styles';
import { deletePurchaseRequest } from '@/redux/purchaseRequestSlice';
import useWebSocket from '@hooks/useWebSocket';


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
    } else if (status.includes('received') || status.includes('접수')) {
        color = theme.palette.primary.main;
    } else if (status.includes('vendor_selection') || status.includes('업체')) {
        color = theme.palette.secondary.main;
    } else if (status.includes('contract_pending') || status.includes('계약')) {
        color = theme.palette.warning.light;
    } else if (status.includes('inspection') || status.includes('검수')) {
        color = theme.palette.warning.main;
    } else if (status.includes('invoice') || status.includes('인보이스')) {
        color = theme.palette.info.dark;
    } else if (status.includes('payment') || status.includes('지급')) {
        color = theme.palette.success.dark;
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
    const dispatch = useDispatch();
    const currentUser = useSelector(state => state.auth.user);
    const { sendStatusChange } = useWebSocket(currentUser);

    // 로컬 상태
    const [request, setRequest] = useState(null);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [approvalLines, setApprovalLines] = useState([]);
    const [hasApprovalAuthority, setHasApprovalAuthority] = useState(false);
    const extractStatusCode = (request) => {
        // 1. prStatusChild가 있으면 그대로 사용
        if (request.prStatusChild) {
            return request.prStatusChild;
        }

        // 2. status_child_code가 있으면 사용 (이 부분 추가)
        if (request.status_child_code) {
            return request.status_child_code;
        }

        // 3. status 문자열이 있으면 파싱해서 childCode 부분 추출
        if (request.status) {
            const parts = request.status.split('-');
            // 마지막 부분이 상태 코드일 가능성이 높음
            if (parts.length >= 2) {
                return parts[parts.length - 1]; // 마지막 부분 반환
            }
        }

        // 4. 기본값 반환
        return "REQUESTED"; // 기본 상태
    };
// 상태 라벨 가져오기
    const getStatusLabel = (statusCode) => {
        switch(statusCode) {
            case 'REQUESTED': return '구매 요청';
            case 'RECEIVED': return '요청 접수';
            case 'VENDOR_SELECTION': return '업체 선정';
            case 'CONTRACT_PENDING': return '계약 대기';
            case 'INSPECTION': return '검수 진행';
            case 'INVOICE_ISSUED': return '인보이스 발행';
            case 'PAYMENT_COMPLETED': return '대금지급 완료';
            default: return statusCode || '상태 정보 없음';
        }
    };

    // useEffect 안에 상태 정보 디버깅 추가
    useEffect(() => {
         if (request) {
             console.log('==== 구매요청 상태 정보 디버깅 ====');
             console.log('request.status:', request.status);
             console.log('request.prStatusChild:', request.prStatusChild);
             console.log('추출된 상태 코드:', extractStatusCode(request));
             console.log('상태 라벨:', getStatusLabel(extractStatusCode(request)));
         }
     }, [request]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (id && !loading) {
                const refreshData = async () => {
                    try {
                        const response = await fetchWithAuth(`${API_URL}purchase-requests/${id}`);
                        if (response.ok) {
                            const data = await response.json();
                            setRequest(data);
                        }
                    } catch (error) {
                        console.error('데이터 갱신 중 오류:', error);
                    }
                };
                refreshData();
            }
        }, 60000); // 1분마다 갱신

        return () => clearInterval(interval);
    }, [id, loading]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // 1. 구매 요청 데이터 가져오기
                const response = await fetchWithAuth(`${API_URL}purchase-requests/${id}`);
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`데이터 로드 실패: ${errorText}`);
                }

                const data = await response.json();
                console.log('API 응답 데이터:', data);

                // 만약 GOODS 타입인데 items가 없으면 빈 배열로 초기화
                if (data.businessType === 'GOODS' && !Array.isArray(data.items)) {
                    console.log('GOODS 타입인데 items가 배열이 아니므로 초기화합니다');
                    data.items = [];
                }

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
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, currentUser]);

    // 결재 처리 완료 핸들러
    const handleApprovalComplete = () => {
        // 구매요청 정보 다시 조회
        const fetchUpdatedData = async () => {
            try {
                console.log("결재 처리 완료 후 데이터 다시 로드");
                const response = await fetchWithAuth(`${API_URL}purchase-requests/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    console.log("업데이트된 구매요청 데이터:", data);
                    setRequest(data);

                    // 결재선 정보 다시 조회
                    const approvalResponse = await fetchWithAuth(`${API_URL}approvals/${id}`);
                    if (approvalResponse.ok) {
                        const approvalData = await approvalResponse.json();
                        setApprovalLines(approvalData);

                        // 결재 권한 업데이트
                        if (currentUser) {
                            const hasAuthority = approvalData.some(line =>
                                (line.statusCode === 'IN_REVIEW' || line.statusCode === 'PENDING' || line.statusCode === 'REQUESTED') &&
                                (line.approverId === currentUser.id || line.approver_id === currentUser.id)
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
            alert(`다운로드 중 오류 발생: ${error.message}`);
        }
    };

    // 구매요청이 수정/삭제 가능한지 확인하는 함수 (개선된 버전)
    const canModifyRequest = () => {
      // 상태 코드 추출
      const statusCode = extractStatusCode(request);

      // 현재 사용자가 요청자인지 확인
      const isRequester = currentUser && request.memberId === currentUser.id;
      const isAdmin = currentUser && currentUser.role === 'ADMIN';

      // 결재 상태 확인
      const approvalStatus = getApprovalStatus();

      // 1. '구매 요청' 상태이거나
      // 2. 결재가 진행 중이지만 최종 승인되지 않은 상태이고
      // 3. 사용자가 요청자이거나 관리자인 경우
      const isInReviewStatus = approvalStatus.includes('REVIEW') || approvalStatus === 'FIRST_LEVEL';
      const isNotFullyApproved = approvalStatus !== 'FULLY_APPROVED';

      return (statusCode === 'REQUESTED' ||
              (isInReviewStatus && isNotFullyApproved)) &&
             (isRequester || isAdmin);
    };

    // 결재 상태 확인 함수 - 유연한 결재 단계를 지원하도록 수정
    const getApprovalStatus = () => {
      if (!approvalLines || approvalLines.length === 0) {
        return 'NO_APPROVAL';
      }

      // 단계별로 정렬된 결재선
      const sortedLines = [...approvalLines].sort((a, b) => a.step - b.step);

      // 첫 번째 단계 결재 상태 확인
      const firstLevel = sortedLines[0];
      if (!firstLevel || firstLevel.statusCode !== 'APPROVED') {
        return 'FIRST_LEVEL';
      }

      // 마지막 단계 결재 상태 확인 (최종 승인 여부)
      const lastLevel = sortedLines[sortedLines.length - 1];
      if (lastLevel.statusCode === 'APPROVED') {
        return 'FULLY_APPROVED';
      }

      // 현재 검토 중인 단계 찾기
      const currentReviewIndex = sortedLines.findIndex(line =>
        line.statusCode === 'IN_REVIEW' ||
        line.statusCode === 'PENDING' ||
        line.statusCode === 'REQUESTED'
      );

      if (currentReviewIndex !== -1) {
        return `LEVEL_${currentReviewIndex + 1}_REVIEW`;
      }

      // 반려된 단계 찾기
      const rejectedIndex = sortedLines.findIndex(line => line.statusCode === 'REJECTED');
      if (rejectedIndex !== -1) {
        return `LEVEL_${rejectedIndex + 1}_REJECTED`;
      }

      return 'UNKNOWN';
    };

    // 상태 변경 핸들러
    const handleStatusChange = (newStatus) => {
        if (window.confirm(`상태를 '${getStatusLabel(newStatus)}'로 변경하시겠습니까?`)) {
            const currentStatus = extractStatusCode(request);
            sendStatusChange(id, currentStatus, newStatus);
        }
    };




    // 구매요청 삭제 처리 함수
    const handleDeleteRequest = () => {
        if (window.confirm('정말 삭제하시겠습니까?')) {
            dispatch(deletePurchaseRequest(id))
                .unwrap()
                .then(() => {
                    alert('구매요청이 삭제되었습니다.');
                    navigate('/purchase-requests');
                })
                .catch((err) => {
                    alert(`삭제 실패: ${err}`);
                });
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* 상단 헤더 및 상태 표시 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4">{request.requestName}</Typography>
                    <StatusChip
                         label={getStatusLabel(extractStatusCode(request))}
                         statuscode={extractStatusCode(request)}
                         variant="outlined"
                     />
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    {canModifyRequest() && (
                        <>
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
                                onClick={handleDeleteRequest}
                            >
                                삭제
                            </Button>
                        </>
                    )}
                </Box>
            </Box>

            {/* 결재선 표시 */}
            {approvalLines.length > 0 && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <ApprovalLineComponent
                        purchaseRequestId={Number(id)}
                        currentUserId={currentUser?.id}
                        onApprovalComplete={handleApprovalComplete}
                    />
                </Paper>
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
                            <Typography>
                                <strong>시작일:</strong> {request.projectStartDate ? moment(request.projectStartDate).format('YYYY-MM-DD') : '정보 없음'}
                            </Typography>
                            <Typography>
                                <strong>종료일:</strong> {request.projectEndDate ? moment(request.projectEndDate).format('YYYY-MM-DD') : '정보 없음'}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography><strong>프로젝트 내용:</strong></Typography>
                            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{request.projectContent || '내용 없음'}</Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {request.businessType === 'MAINTENANCE' && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>유지보수 정보</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography>
                                <strong>계약기간:</strong> {
                                    request.contractStartDate && request.contractEndDate ?
                                    `${moment(request.contractStartDate).format('YYYY-MM-DD')} ~ ${moment(request.contractEndDate).format('YYYY-MM-DD')}` :
                                    '정보 없음'
                                }
                            </Typography>
                            <Typography>
                                <strong>계약금액:</strong> {request.contractAmount ? `${request.contractAmount.toLocaleString()}원` : '정보 없음'}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography><strong>계약내용:</strong></Typography>
                            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{request.contractDetails || '내용 없음'}</Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* 물품 구매 정보 (GOODS 타입일 때만 표시) */}
            {request.businessType === 'GOODS' && (
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
            {request.attachments && request.attachments.length > 0 ? (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>첨부 파일</Typography>
                    <List>
                        {request.attachments.map((attachment) => (
                           <ListItem key={attachment.id}>
                             <Link
                               component="button"
                               onClick={() => downloadFile(attachment)}
                               sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                             >
                               <AttachFileIcon sx={{ mr: 1 }} />
                               {attachment.fileName || '파일명 없음'}
                               <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                 ({Math.round((attachment.fileSize || 0) / 1024)}KB)
                               </Typography>
                             </Link>
                           </ListItem>
                        ))}
                    </List>
                </Paper>
            ) : (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>첨부 파일</Typography>
                    <Typography variant="body2" color="text.secondary">첨부된 파일이 없습니다.</Typography>
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
            </Box>
        </Box>
    );
};

export default PurchaseRequestDetailPage;