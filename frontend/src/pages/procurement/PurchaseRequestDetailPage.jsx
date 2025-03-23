import React, { useState, useEffect } from "react";
import {
    Box, Typography, Paper, Button, Link, Chip,
    Grid, List, ListItem, ListItemText, Divider, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Card, CardContent, CardHeader, Tabs, Tab, IconButton, Badge,
    Tooltip, Avatar, Stack
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
    Delete as DeleteIcon,
    ArrowBack as ArrowBackIcon,
    MoreVert as MoreVertIcon,
    Event as EventIcon,
    Business as BusinessIcon,
    Person as PersonIcon,
    AccountBalance as AccountBalanceIcon,
    Notes as NotesIcon,
    Description as DescriptionIcon,
    Phone as PhoneIcon,
    CheckCircle as CheckCircleIcon
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

  if (status.includes("approved") || status.includes("승인")) {
    color = theme.palette.success.main;
  } else if (status.includes("rejected") || status.includes("반려")) {
    color = theme.palette.error.main;
  } else if (status.includes("requested") || status.includes("요청")) {
    color = theme.palette.info.main;
  } else if (status.includes("received") || status.includes("접수")) {
    color = theme.palette.primary.main;
  } else if (status.includes("vendor_selection") || status.includes("업체")) {
    color = theme.palette.secondary.main;
  } else if (status.includes("contract_pending") || status.includes("계약")) {
    color = theme.palette.warning.light;
  } else if (status.includes("inspection") || status.includes("검수")) {
    color = theme.palette.warning.main;
  } else if (status.includes("invoice") || status.includes("인보이스")) {
    color = theme.palette.info.dark;
  } else if (status.includes("payment") || status.includes("지급")) {
    color = theme.palette.success.dark;
  }

    return {
        backgroundColor: color,
        color: theme.palette.getContrastText(color),
        fontWeight: 'bold',
        minWidth: '80px'
    };
});

// 클릭 가능한 텍스트 스타일링
const ClickableCell = styled(TableCell)(({ theme }) => ({
    cursor: 'pointer',
    '&:hover': {
        textDecoration: 'underline',
        color: theme.palette.primary.main,
    },
}));

// 세부 정보 그리드 아이템
const InfoItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    '& .MuiSvgIcon-root': {
        marginRight: theme.spacing(1),
        color: theme.palette.primary.main
    }
}));

// 섹션 제목
const SectionTitle = styled(Typography)(({ theme }) => ({
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    '& .MuiSvgIcon-root': {
        marginRight: theme.spacing(1)
    }
}));

// 파일 항목 스타일
const FileItem = styled(ListItem)(({ theme }) => ({
    borderRadius: theme.shape.borderRadius,
    transition: 'background-color 0.2s',
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    }
}));

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
    const [tabValue, setTabValue] = useState(0);

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

    // 비즈니스 유형 표시 변환
    const getBusinessTypeLabel = (type) => {
        switch(type) {
            case 'SI': return 'SI';
            case 'MAINTENANCE': return '유지보수';
            case 'GOODS': return '물품';
            default: return type || '정보 없음';
        }
    };

    // 탭 변경 핸들러
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
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
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Typography variant="h6">구매 요청 정보를 불러오는 중입니다...</Typography>
            </Box>
        );
    }

    // 에러 상태 처리
    if (error) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>오류 발생: {error}</Alert>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
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
            <Box sx={{ p: 4 }}>
                <Alert severity="info" sx={{ mb: 2 }}>구매 요청 정보가 없습니다.</Alert>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/purchase-requests')}
                >
                    목록으로 돌아가기
                </Button>
            </Box>
        );
    }

    // 첨부파일 다운로드 함수
    const downloadFile = async (attachment) => {
        try {
            console.log("[DEBUG] 첨부파일 객체:", attachment);

  // 비즈니스 유형 표시 변환
  const getBusinessTypeLabel = (type) => {
    switch (type) {
      case "SI":
        return "SI";
      case "MAINTENANCE":
        return "유지보수";
      case "GOODS":
        return "물품";
      default:
        return type || "정보 없음";
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // useEffect 안에 상태 정보 디버깅 추가
  useEffect(() => {
    if (request) {
      console.log("==== 구매요청 상태 정보 디버깅 ====");
      console.log("request.status:", request.status);
      console.log("request.prStatusChild:", request.prStatusChild);
      console.log("추출된 상태 코드:", extractStatusCode(request));
      console.log("상태 라벨:", getStatusLabel(extractStatusCode(request)));
    }
  }, [request]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (id && !loading) {
        const refreshData = async () => {
          try {
            const response = await fetchWithAuth(
              `${API_URL}purchase-requests/${id}`
            );
            if (response.ok) {
              const data = await response.json();
              setRequest(data);
            }
          } catch (error) {
            console.error("데이터 갱신 중 오류:", error);
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
        const response = await fetchWithAuth(
          `${API_URL}purchase-requests/${id}`
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`데이터 로드 실패: ${errorText}`);
        }

        const data = await response.json();
        console.log("API 응답 데이터:", data);

        // 만약 GOODS 타입인데 items가 없으면 빈 배열로 초기화
        if (data.businessType === "GOODS" && !Array.isArray(data.items)) {
          console.log("GOODS 타입인데 items가 배열이 아니므로 초기화합니다");
          data.items = [];
        }

        setRequest(data);

        // 2. 프로젝트 ID가 있으면 프로젝트 정보 가져오기
        if (data.projectId) {
          const projectResponse = await fetchWithAuth(
            `${API_URL}projects/${data.projectId}`
          );
          if (projectResponse.ok) {
            const projectData = await projectResponse.json();
            setProject(projectData);
          } else {
            console.warn("프로젝트 정보를 가져오는데 실패했습니다.");
          }
        }

        // 3. 결재선 정보 가져오기
        try {
          const approvalResponse = await fetchWithAuth(
            `${API_URL}approvals/${id}`
          );
          if (approvalResponse.ok) {
            const approvalData = await approvalResponse.json();
            setApprovalLines(approvalData);

            // 현재 사용자가 결재 권한이 있는지 확인
            if (currentUser) {
              const hasAuthority = approvalData.some(
                (line) =>
                  (line.statusCode === "IN_REVIEW" ||
                    line.statusCode === "PENDING" ||
                    line.statusCode === "REQUESTED") &&
                  (line.approverId === currentUser.id ||
                    line.approver_id === currentUser.id)
              );
              setHasApprovalAuthority(hasAuthority);
            }
          }
        } catch (approvalError) {
          console.warn("결재선 정보를 가져오는데 실패했습니다:", approvalError);
          // 결재선 정보가 없어도 페이지는 계속 로드
        }

        setError(null);
      } catch (error) {
        console.error("Error:", error);
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
        const response = await fetchWithAuth(
          `${API_URL}purchase-requests/${id}`
        );
        if (response.ok) {
          const data = await response.json();
          console.log("업데이트된 구매요청 데이터:", data);
          setRequest(data);

          // 결재선 정보 다시 조회
          const approvalResponse = await fetchWithAuth(
            `${API_URL}approvals/${id}`
          );
          if (approvalResponse.ok) {
            const approvalData = await approvalResponse.json();
            setApprovalLines(approvalData);

            // 결재 권한 업데이트
            if (currentUser) {
              const hasAuthority = approvalData.some(
                (line) =>
                  (line.statusCode === "IN_REVIEW" ||
                    line.statusCode === "PENDING" ||
                    line.statusCode === "REQUESTED") &&
                  (line.approverId === currentUser.id ||
                    line.approver_id === currentUser.id)
              );
              setHasApprovalAuthority(hasAuthority);
            }
          }
        }
      } catch (error) {
        console.error("데이터 업데이트 중 오류 발생:", error);
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
            const currentStatus = request.prStatusChild;
            sendStatusChange(id, currentStatus, newStatus);
        }
    };

    // 상태 라벨 가져오기
    const getStatusLabel = (statusCode) => {
        switch(statusCode) {
            case 'REQUESTED': return '구매 요청';
            case 'RECEIVED': return '구매요청 접수';
            case 'VENDOR_SELECTION': return '업체 선정';
            case 'CONTRACT_PENDING': return '계약 대기';
            case 'INSPECTION': return '검수 진행';
            case 'INVOICE_ISSUED': return '인보이스 발행';
            case 'PAYMENT_COMPLETED': return '대금지급 완료';
            default: return statusCode || '상태 정보 없음';
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
                        label={getStatusLabel(request.prStatusChild)}
                        statuscode={request.prStatusChild}
                        variant="outlined"
                    />
                </Box>

    return (
        <Box sx={{ p: 4 }}>
            {/* 상단 헤더 및 액션 버튼 */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Button
                                variant="outlined"
                                color="inherit"
                                size="small"
                                startIcon={<ArrowBackIcon />}
                                onClick={() => navigate('/purchase-requests')}
                                sx={{ mr: 1 }}
                            >
                                목록
                            </Button>
                            <Typography variant="h4" component="h1">{request.requestName}</Typography>
                            <StatusChip
                                label={statusLabel}
                                statuscode={statusCode}
                                size="medium"
                            />
                        </Box>

                        <Box>
                            {canModifyRequest() && (
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
                                        onClick={handleDeleteRequest}
                                    >
                                        삭제
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* 기본 정보 섹션 */}
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <InfoItem>
                                <DescriptionIcon />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">요청번호</Typography>
                                    <Typography variant="body1">{request.requestNumber || request.id}</Typography>
                                </Box>
                            </InfoItem>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <InfoItem>
                                <BusinessIcon />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">사업구분</Typography>
                                    <Typography variant="body1">{getBusinessTypeLabel(request.businessType)}</Typography>
                                </Box>
                            </InfoItem>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <InfoItem>
                                <EventIcon />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">요청일</Typography>
                                    <Typography variant="body1">{request.requestDate ? moment(request.requestDate).format('YYYY-MM-DD') : '정보 없음'}</Typography>
                                </Box>
                            </InfoItem>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <InfoItem>
                                <AccountBalanceIcon />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">예산</Typography>
                                    <Typography variant="body1">{request.businessBudget ? `${request.businessBudget.toLocaleString()}원` : '정보 없음'}</Typography>
                                </Box>
                            </InfoItem>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <InfoItem>
                                <PersonIcon />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">요청자</Typography>
                                    <Typography variant="body1">{request.memberName || '정보 없음'}</Typography>
                                </Box>
                            </InfoItem>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <InfoItem>
                                <BusinessIcon />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">소속</Typography>
                                    <Typography variant="body1">{request.memberCompany || '정보 없음'}</Typography>
                                </Box>
                            </InfoItem>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <InfoItem>
                                <BusinessIcon />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">사업부서</Typography>
                                    <Typography variant="body1">{request.businessDepartment || '정보 없음'}</Typography>
                                </Box>
                            </InfoItem>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <InfoItem>
                                <PersonIcon />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">담당자</Typography>
                                    <Typography variant="body1">{request.businessManager || '정보 없음'}</Typography>
                                </Box>
                            </InfoItem>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* 결재선 표시 */}
            {approvalLines.length > 0 && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <ApprovalLineComponent
                            purchaseRequestId={Number(id)}
                            currentUserId={currentUser?.id}
                            onApprovalComplete={handleApprovalComplete}
                        />
                    </CardContent>
                </Card>
            )}

            {/* 관련 프로젝트 정보 */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <SectionTitle variant="h6" gutterBottom>
                        <DescriptionIcon />
                        관련 프로젝트 정보
                    </SectionTitle>
                    {project ? (
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={4}>
                                <InfoItem>
                                    <DescriptionIcon />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">프로젝트명</Typography>
                                        <Typography variant="body1">{project.projectName}</Typography>
                                    </Box>
                                </InfoItem>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    sx={{ mt: 1, ml: 4 }}
                                    onClick={() => navigate(`/projects/${project.id}`)}
                                >
                                    프로젝트 상세보기
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <InfoItem>
                                    <DescriptionIcon />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">프로젝트 ID</Typography>
                                        <Typography variant="body1">{project.projectIdentifier || project.id}</Typography>
                                    </Box>
                                </InfoItem>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <InfoItem>
                                    <EventIcon />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">프로젝트 기간</Typography>
                                        <Typography variant="body1">{
                                            project.projectPeriod ?
                                            `${moment(project.projectPeriod.startDate).format('YYYY-MM-DD')} ~
                                            ${moment(project.projectPeriod.endDate).format('YYYY-MM-DD')}` :
                                            '정보 없음'
                                        }</Typography>
                                    </Box>
                                </InfoItem>
                            </Grid>
                        </Grid>
                    ) : (
                        <Alert severity="info">관련 프로젝트 정보가 없습니다.</Alert>
                    )}
                </CardContent>
            </Card>

            {/* 탭 패널 */}
            <Card>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="상세 정보" />
                    <Tab label="첨부 파일"
                        icon={request.attachments && request.attachments.length > 0 ?
                            <Badge badgeContent={request.attachments.length} color="primary" sx={{ mr: 1 }} /> : null}
                        iconPosition="end"
                    />
                </Tabs>

                {/* 상세 정보 탭 */}
                <Box role="tabpanel" hidden={tabValue !== 0} sx={{ p: 3 }}>
                    {tabValue === 0 && (
                        <>
                            {/* 특이사항 */}
                            <Box sx={{ mb: 4 }}>
                                <SectionTitle variant="h6">
                                    <NotesIcon />
                                    특이 사항
                                </SectionTitle>
                                <Typography sx={{ pl: 4, whiteSpace: 'pre-line' }}>
                                    {request.specialNotes || '특이 사항이 없습니다.'}
                                </Typography>
                            </Box>

                            {/* 사업 구분별 상세 정보 */}
                            {request.businessType === 'SI' && (
                                <Box sx={{ mb: 4 }}>
                                    <SectionTitle variant="h6">
                                        <BusinessIcon />
                                        SI 프로젝트 정보
                                    </SectionTitle>
                                    <Grid container spacing={2} sx={{ pl: 3 }}>
                                        <Grid item xs={12} sm={6}>
                                            <InfoItem>
                                                <EventIcon />
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">프로젝트 기간</Typography>
                                                    <Typography variant="body1">
                                                        {request.projectStartDate && request.projectEndDate
                                                        ? `${moment(request.projectStartDate).format('YYYY-MM-DD')} ~ ${moment(request.projectEndDate).format('YYYY-MM-DD')}`
                                                        : '정보 없음'}
                                                    </Typography>
                                                </Box>
                                            </InfoItem>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <InfoItem>
                                                <NotesIcon />
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">프로젝트 내용</Typography>
                                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                                        {request.projectContent || '내용 없음'}
                                                    </Typography>
                                                </Box>
                                            </InfoItem>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}

                            {request.businessType === 'MAINTENANCE' && (
                                <Box sx={{ mb: 4 }}>
                                    <SectionTitle variant="h6">
                                        <BusinessIcon />
                                        유지보수 정보
                                    </SectionTitle>
                                    <Grid container spacing={2} sx={{ pl: 3 }}>
                                        <Grid item xs={12} sm={6}>
                                            <InfoItem>
                                                <EventIcon />
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">계약기간</Typography>
                                                    <Typography variant="body1">
                                                        {request.contractStartDate && request.contractEndDate
                                                        ? `${moment(request.contractStartDate).format('YYYY-MM-DD')} ~ ${moment(request.contractEndDate).format('YYYY-MM-DD')}`
                                                        : '정보 없음'}
                                                    </Typography>
                                                </Box>
                                            </InfoItem>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <InfoItem>
                                                <AccountBalanceIcon />
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">계약금액</Typography>
                                                    <Typography variant="body1">
                                                        {request.contractAmount ? `${request.contractAmount.toLocaleString()}원` : '정보 없음'}
                                                    </Typography>
                                                </Box>
                                            </InfoItem>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <InfoItem>
                                                <NotesIcon />
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">계약내용</Typography>
                                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                                        {request.contractDetails || '내용 없음'}
                                                    </Typography>
                                                </Box>
                                            </InfoItem>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}

                            {/* 물품 구매 정보 (GOODS 타입일 때만 표시) */}
                            {request.businessType === 'GOODS' && (
                                <Box sx={{ mb: 4 }}>
                                    <SectionTitle variant="h6">
                                        <DescriptionIcon />
                                        구매 품목
                                    </SectionTitle>
                                    {Array.isArray(request.items) && request.items.length > 0 ? (
                                        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                                            <Table>
                                                <TableHead>
                                                    <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                                                        <TableCell align="center">No</TableCell>
                                                        <TableCell>품목명</TableCell>
                                                        <TableCell>사양</TableCell>
                                                        <TableCell align="center">단위</TableCell>
                                                        <TableCell align="right">수량</TableCell>
                                                        <TableCell align="right">단가</TableCell>
                                                        <TableCell align="right">금액</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {request.items.map((item, index) => (
                                                        <TableRow key={item.id || index}>
                                                            <TableCell align="center">{index + 1}</TableCell>
                                                            <TableCell>{item.itemName}</TableCell>
                                                            <TableCell>{item.specification || '-'}</TableCell>
                                                            <TableCell align="center">{item.unitChildCode || '-'}</TableCell>
                                                            <TableCell align="right">{item.quantity}</TableCell>
                                                            <TableCell align="right">
                                                                ₩{Number(item.unitPrice).toLocaleString()}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                ₩{Number(item.totalPrice).toLocaleString()}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}>
                                                        <TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold' }}>합계</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                            ₩{request.items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0).toLocaleString()}
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    ) : (
                                        <Alert severity="info" sx={{ mt: 2 }}>
                                            구매 품목 정보가 없습니다.
                                        </Alert>
                                    )}
                                </Box>
                            )}
                        </>
                    )}
                </Box>

                {/* 첨부 파일 탭 */}
                <Box role="tabpanel" hidden={tabValue !== 1} sx={{ p: 3 }}>
                    {tabValue === 1 && (
                        <>
                            <SectionTitle variant="h6">
                                <AttachFileIcon />
                                첨부 파일
                            </SectionTitle>

                            {request.attachments && request.attachments.length > 0 ? (
                                <List sx={{ pl: 4 }}>
                                    {request.attachments.map((attachment) => (
                                        <FileItem key={attachment.id} disableGutters>
                                            <Link
                                                component="button"
                                                onClick={() => downloadFile(attachment)}
                                                sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left' }}
                                                underline="none"
                                            >
                                                <AttachFileIcon sx={{ mr: 1 }} />
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="body1">{attachment.fileName || '파일명 없음'}</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        ({Math.round((attachment.fileSize || 0) / 1024)}KB)
                                                    </Typography>
                                                </Box>
                                            </Link>
                                        </FileItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography color="text.secondary" sx={{ pl: 4 }}>첨부된 파일이 없습니다.</Typography>
                            )}
                        </>
                    )}
                </Box>
            </Card>
        </Box>
    );
  };

  // 결재 상태 확인 함수 - 유연한 결재 단계를 지원하도록 수정
  const getApprovalStatus = () => {
    if (!approvalLines || approvalLines.length === 0) {
      return "NO_APPROVAL";
    }

    // 단계별로 정렬된 결재선
    const sortedLines = [...approvalLines].sort((a, b) => a.step - b.step);

    // 첫 번째 단계 결재 상태 확인
    const firstLevel = sortedLines[0];
    if (!firstLevel || firstLevel.statusCode !== "APPROVED") {
      return "FIRST_LEVEL";
    }

    // 마지막 단계 결재 상태 확인 (최종 승인 여부)
    const lastLevel = sortedLines[sortedLines.length - 1];
    if (lastLevel.statusCode === "APPROVED") {
      return "FULLY_APPROVED";
    }

    // 현재 검토 중인 단계 찾기
    const currentReviewIndex = sortedLines.findIndex(
      (line) =>
        line.statusCode === "IN_REVIEW" ||
        line.statusCode === "PENDING" ||
        line.statusCode === "REQUESTED"
    );

    if (currentReviewIndex !== -1) {
      return `LEVEL_${currentReviewIndex + 1}_REVIEW`;
    }

    // 반려된 단계 찾기
    const rejectedIndex = sortedLines.findIndex(
      (line) => line.statusCode === "REJECTED"
    );
    if (rejectedIndex !== -1) {
      return `LEVEL_${rejectedIndex + 1}_REJECTED`;
    }

    return "UNKNOWN";
  };

  // 상태 변경 핸들러
  const handleStatusChange = (newStatus) => {
    if (
      window.confirm(
        `상태를 '${getStatusLabel(newStatus)}'로 변경하시겠습니까?`
      )
    ) {
      const currentStatus = extractStatusCode(request);
      sendStatusChange(id, currentStatus, newStatus);
    }
  };

  // 구매요청 삭제 처리 함수
  const handleDeleteRequest = () => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      dispatch(deletePurchaseRequest(id))
        .unwrap()
        .then(() => {
          alert("구매요청이 삭제되었습니다.");
          navigate("/purchase-requests");
        })
        .catch((err) => {
          alert(`삭제 실패: ${err}`);
        });
    }
  };

  // 상태 코드 가져오기
  const statusCode = extractStatusCode(request);
  const statusLabel = getStatusLabel(statusCode);

  return (
    <Box sx={{ p: 4 }}>
      {/* 상단 헤더 및 액션 버튼 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start"
            }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate("/purchase-requests")}
                sx={{ mr: 1 }}>
                목록
              </Button>
              <Typography variant="h4" component="h1">
                {request.requestName}
              </Typography>
              <StatusChip
                label={statusLabel}
                statuscode={statusCode}
                size="medium"
              />
            </Box>

            <Box>
              {canModifyRequest() && (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/purchase-requests/edit/${id}`)}>
                    수정
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteRequest}>
                    삭제
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* 기본 정보 섹션 */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <InfoItem>
                <DescriptionIcon />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    요청번호
                  </Typography>
                  <Typography variant="body1">
                    {request.requestNumber || request.id}
                  </Typography>
                </Box>
              </InfoItem>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoItem>
                <BusinessIcon />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    사업구분
                  </Typography>
                  <Typography variant="body1">
                    {getBusinessTypeLabel(request.businessType)}
                  </Typography>
                </Box>
              </InfoItem>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoItem>
                <EventIcon />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    요청일
                  </Typography>
                  <Typography variant="body1">
                    {request.requestDate
                      ? moment(request.requestDate).format("YYYY-MM-DD")
                      : "정보 없음"}
                  </Typography>
                </Box>
              </InfoItem>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoItem>
                <AccountBalanceIcon />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    예산
                  </Typography>
                  <Typography variant="body1">
                    {request.businessBudget
                      ? `${request.businessBudget.toLocaleString()}원`
                      : "정보 없음"}
                  </Typography>
                </Box>
              </InfoItem>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoItem>
                <PersonIcon />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    요청자
                  </Typography>
                  <Typography variant="body1">
                    {request.memberName || "정보 없음"}
                  </Typography>
                </Box>
              </InfoItem>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoItem>
                <BusinessIcon />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    소속
                  </Typography>
                  <Typography variant="body1">
                    {request.memberCompany || "정보 없음"}
                  </Typography>
                </Box>
              </InfoItem>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoItem>
                <BusinessIcon />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    사업부서
                  </Typography>
                  <Typography variant="body1">
                    {request.businessDepartment || "정보 없음"}
                  </Typography>
                </Box>
              </InfoItem>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoItem>
                <PersonIcon />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    담당자
                  </Typography>
                  <Typography variant="body1">
                    {request.businessManager || "정보 없음"}
                  </Typography>
                </Box>
              </InfoItem>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 결재선 표시 */}
      {approvalLines.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <ApprovalLineComponent
              purchaseRequestId={Number(id)}
              currentUserId={currentUser?.id}
              onApprovalComplete={handleApprovalComplete}
            />
          </CardContent>
        </Card>
      )}

      {/* 관련 프로젝트 정보 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <SectionTitle variant="h6" gutterBottom>
            <DescriptionIcon />
            관련 프로젝트 정보
          </SectionTitle>
          {project ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <InfoItem>
                  <DescriptionIcon />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      프로젝트명
                    </Typography>
                    <Typography variant="body1">
                      {project.projectName}
                    </Typography>
                  </Box>
                </InfoItem>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1, ml: 4 }}
                  onClick={() => navigate(`/projects/${project.id}`)}>
                  프로젝트 상세보기
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <InfoItem>
                  <DescriptionIcon />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      프로젝트 ID
                    </Typography>
                    <Typography variant="body1">
                      {project.projectIdentifier || project.id}
                    </Typography>
                  </Box>
                </InfoItem>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <InfoItem>
                  <EventIcon />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      프로젝트 기간
                    </Typography>
                    <Typography variant="body1">
                      {project.projectPeriod
                        ? `${moment(project.projectPeriod.startDate).format(
                            "YYYY-MM-DD"
                          )} ~
                                            ${moment(
                                              project.projectPeriod.endDate
                                            ).format("YYYY-MM-DD")}`
                        : "정보 없음"}
                    </Typography>
                  </Box>
                </InfoItem>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="info">관련 프로젝트 정보가 없습니다.</Alert>
          )}
        </CardContent>
      </Card>

      {/* 탭 패널 */}
      <Card>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tab label="상세 정보" />
          <Tab
            label="첨부 파일"
            icon={
              request.attachments && request.attachments.length > 0 ? (
                <Badge
                  badgeContent={request.attachments.length}
                  color="primary"
                  sx={{ mr: 1 }}
                />
              ) : null
            }
            iconPosition="end"
          />
        </Tabs>

        {/* 상세 정보 탭 */}
        <Box role="tabpanel" hidden={tabValue !== 0} sx={{ p: 3 }}>
          {tabValue === 0 && (
            <>
              {/* 특이사항 */}
              <Box sx={{ mb: 4 }}>
                <SectionTitle variant="h6">
                  <NotesIcon />
                  특이 사항
                </SectionTitle>
                <Typography sx={{ pl: 4, whiteSpace: "pre-line" }}>
                  {request.specialNotes || "특이 사항이 없습니다."}
                </Typography>
              </Box>

              {/* 사업 구분별 상세 정보 */}
              {request.businessType === "SI" && (
                <Box sx={{ mb: 4 }}>
                  <SectionTitle variant="h6">
                    <BusinessIcon />
                    SI 프로젝트 정보
                  </SectionTitle>
                  <Grid container spacing={2} sx={{ pl: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <InfoItem>
                        <EventIcon />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            프로젝트 기간
                          </Typography>
                          <Typography variant="body1">
                            {request.projectStartDate && request.projectEndDate
                              ? `${moment(request.projectStartDate).format(
                                  "YYYY-MM-DD"
                                )} ~ ${moment(request.projectEndDate).format(
                                  "YYYY-MM-DD"
                                )}`
                              : "정보 없음"}
                          </Typography>
                        </Box>
                      </InfoItem>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoItem>
                        <NotesIcon />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            프로젝트 내용
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ whiteSpace: "pre-wrap" }}>
                            {request.projectContent || "내용 없음"}
                          </Typography>
                        </Box>
                      </InfoItem>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {request.businessType === "MAINTENANCE" && (
                <Box sx={{ mb: 4 }}>
                  <SectionTitle variant="h6">
                    <BusinessIcon />
                    유지보수 정보
                  </SectionTitle>
                  <Grid container spacing={2} sx={{ pl: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <InfoItem>
                        <EventIcon />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            계약기간
                          </Typography>
                          <Typography variant="body1">
                            {request.contractStartDate &&
                            request.contractEndDate
                              ? `${moment(request.contractStartDate).format(
                                  "YYYY-MM-DD"
                                )} ~ ${moment(request.contractEndDate).format(
                                  "YYYY-MM-DD"
                                )}`
                              : "정보 없음"}
                          </Typography>
                        </Box>
                      </InfoItem>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoItem>
                        <AccountBalanceIcon />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            계약금액
                          </Typography>
                          <Typography variant="body1">
                            {request.contractAmount
                              ? `${request.contractAmount.toLocaleString()}원`
                              : "정보 없음"}
                          </Typography>
                        </Box>
                      </InfoItem>
                    </Grid>
                    <Grid item xs={12}>
                      <InfoItem>
                        <NotesIcon />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            계약내용
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ whiteSpace: "pre-wrap" }}>
                            {request.contractDetails || "내용 없음"}
                          </Typography>
                        </Box>
                      </InfoItem>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* 물품 구매 정보 (GOODS 타입일 때만 표시) */}
              {request.businessType === "GOODS" && (
                <Box sx={{ mb: 4 }}>
                  <SectionTitle variant="h6">
                    <DescriptionIcon />
                    구매 품목
                  </SectionTitle>
                  {Array.isArray(request.items) && request.items.length > 0 ? (
                    <TableContainer
                      component={Paper}
                      variant="outlined"
                      sx={{ mt: 2 }}>
                      <Table>
                        <TableHead>
                          <TableRow
                            sx={{ backgroundColor: "rgba(0, 0, 0, 0.04)" }}>
                            <TableCell align="center">No</TableCell>
                            <TableCell>품목명</TableCell>
                            <TableCell>사양</TableCell>
                            <TableCell align="center">단위</TableCell>
                            <TableCell align="right">수량</TableCell>
                            <TableCell align="right">단가</TableCell>
                            <TableCell align="right">금액</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {request.items.map((item, index) => (
                            <TableRow key={item.id || index}>
                              <TableCell align="center">{index + 1}</TableCell>
                              <TableCell>{item.itemName}</TableCell>
                              <TableCell>{item.specification || "-"}</TableCell>
                              <TableCell align="center">
                                {item.unitChildCode || "-"}
                              </TableCell>
                              <TableCell align="right">
                                {item.quantity}
                              </TableCell>
                              <TableCell align="right">
                                ₩{Number(item.unitPrice).toLocaleString()}
                              </TableCell>
                              <TableCell align="right">
                                ₩{Number(item.totalPrice).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow
                            sx={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}>
                            <TableCell
                              colSpan={6}
                              align="right"
                              sx={{ fontWeight: "bold" }}>
                              합계
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontWeight: "bold" }}>
                              ₩
                              {request.items
                                .reduce(
                                  (sum, item) =>
                                    sum + Number(item.totalPrice || 0),
                                  0
                                )
                                .toLocaleString()}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      구매 품목 정보가 없습니다.
                    </Alert>
                  )}
                </Box>
              )}
            </>
          )}
        </Box>

        {/* 첨부 파일 탭 */}
        <Box role="tabpanel" hidden={tabValue !== 1} sx={{ p: 3 }}>
          {tabValue === 1 && (
            <>
              <SectionTitle variant="h6">
                <AttachFileIcon />
                첨부 파일
              </SectionTitle>

              {request.attachments && request.attachments.length > 0 ? (
                <List sx={{ pl: 4 }}>
                  {request.attachments.map((attachment) => (
                    <FileItem key={attachment.id} disableGutters>
                      <Link
                        component="button"
                        onClick={() => downloadFile(attachment)}
                        sx={{
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                          textAlign: "left"
                        }}
                        underline="none">
                        <AttachFileIcon sx={{ mr: 1 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1">
                            {attachment.fileName || "파일명 없음"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ({Math.round((attachment.fileSize || 0) / 1024)}KB)
                          </Typography>
                        </Box>
                      </Link>
                    </FileItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ pl: 4 }}>
                  첨부된 파일이 없습니다.
                </Typography>
              )}
            </>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default PurchaseRequestDetailPage;
