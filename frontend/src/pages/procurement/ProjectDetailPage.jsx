// src/pages/procurement/ProjectDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteProject, updateProjectStatus } from '@/redux/projectSlice';
import { styled } from '@mui/material/styles';
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
    Divider,
    Card,
    CardHeader,
    CardContent,
    IconButton,
    Tooltip,
    Alert,
    Menu,
    MenuItem,
    Avatar,
    Stack,
    Tabs,
    Tab,
    Badge,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
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
    Apartment as ApartmentIcon,
    AccountBalance as AccountBalanceIcon,
    Notes as NotesIcon,
    Description as DescriptionIcon
} from '@mui/icons-material';

import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';
import { formatDate } from '@/utils/dateUtils';

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
    } else if (status.includes('registered') || status.includes('등록')) {
        color = theme.palette.info.light;
    } else if (status.includes('reregistered') || status.includes('정정등록')) {
        color = theme.palette.info.light;
    } else if (status.includes('in_progress') || status.includes('진행중')) {
        color = theme.palette.primary.main;
    } else if (status.includes('completed') || status.includes('완료')) {
        color = theme.palette.success.main;
    } else if (status.includes('terminated') || status.includes('종결')) {
        color = theme.palette.error.main;
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

function ProjectDetailPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [purchaseRequests, setPurchaseRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [availableStatuses, setAvailableStatuses] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. 프로젝트 상세 정보 조회
                const projectRes = await fetchWithAuth(`${API_URL}projects/${id}`);
                if (!projectRes.ok) throw new Error('프로젝트 조회 실패');
                const projectData = await projectRes.json();
                setProject(projectData);

                // 2. 사용 가능한 상태 코드 가져오기
                const statusRes = await fetchWithAuth(`${API_URL}common-codes/PROJECT/BASIC_STATUS`);
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    setAvailableStatuses(statusData);
                }

                console.log('프로젝트 정보:', projectData);

                // 3. 모든 구매 요청을 가져와서 클라이언트에서 필터링
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

    // 상태 코드 추출 함수 (프로젝트용)
    const extractProjectStatusCode = (project) => {
        if (!project || !project.basicStatus) return 'UNKNOWN';

        // 상태 코드 추출 (예: PROJECT-STATUS-REGISTERED => REGISTERED)
        const parts = project.basicStatus.split('-');
        if (parts.length >= 3) {
            return parts[2]; // 세 번째 부분이 실제 상태 코드
        }
        return project.basicStatus;
    };

    // 상태 코드 추출 함수 (구매요청용)
    const extractStatusCode = (request) => {
        // 1. prStatusChild가 있으면 그대로 사용
        if (request.prStatusChild) {
            return request.prStatusChild;
        }

        // 2. status_child_code가 있으면 사용
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

    // 프로젝트 상태 라벨 가져오기
    const getProjectStatusLabel = (statusCode) => {
        switch(statusCode) {
            case 'REGISTERED': return '등록';
            case 'REREGISTERED': return '정정등록';
            case 'IN_PROGRESS': return '진행중';
            case 'COMPLETED': return '완료';
            case 'CANCELLED': return '취소';
            default: return statusCode || '상태 정보 없음';
        }
    };

    // 구매요청 상태 라벨 가져오기
    const getPurchaseStatusLabel = (statusCode) => {
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

    // 비즈니스 유형 한글 표시
    const getBusinessTypeLabel = (type) => {
        switch(type) {
            case 'SI': return 'SI';
            case 'MAINTENANCE': return '유지보수';
            case 'IMPLEMENTATION': return '구축';
            case 'CONSULTING': return '컨설팅';
            case 'OUTSOURCING': return '아웃소싱';
            case 'OTHER': return '기타';
            default: return type || '정보 없음';
        }
    };

    // 예산 코드 한글 표시
    const getBudgetCodeLabel = (code) => {
        switch(code) {
            case 'R_AND_D': return '연구개발';
            case 'CAPEX': return '자본적지출';
            case 'OPEX': return '운영비용';
            case 'MARKETING': return '마케팅';
            case 'TRAINING': return '교육훈련';
            case 'OTHER': return '기타';
            default: return code || '정보 없음';
        }
    };

    // 프로젝트가 수정 가능한지 확인하는 함수
    const canEditProject = () => {
        if (!project || !project.basicStatus) return false;

        // 상태 코드 추출
        const statusCode = extractProjectStatusCode(project);

        // '등록' 또는 '정정등록' 상태일 때만 수정 가능
        return statusCode === 'REGISTERED' || statusCode === 'REREGISTERED';
    };

    // 프로젝트가 삭제 가능한지 확인하는 함수
    const canDeleteProject = () => {
        if (!project || !project.basicStatus) return false;

        // 상태 코드 추출
        const statusCode = extractProjectStatusCode(project);

        // '등록' 또는 '정정등록' 상태이고, 연결된 구매요청이 없을 때만 삭제 가능
        return (statusCode === 'REGISTERED' || statusCode === 'REREGISTERED') &&
               (!purchaseRequests || purchaseRequests.length === 0);
    };

    const handleDelete = async () => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;

        try {
            await dispatch(deleteProject(id)).unwrap();
            alert('프로젝트가 삭제되었습니다.');
            navigate('/projects');
        } catch (err) {
            alert(`삭제 오류: ${err}`);
        }
    };

    // 구매요청 상세 페이지로 이동하는 함수
    const navigateToPurchaseRequest = (requestId) => {
        navigate(`/purchase-requests/${requestId}`);
    };

    // 메뉴 열기
        const handleMenuOpen = (event) => {
            setMenuAnchorEl(event.currentTarget);
        };

        // 메뉴 닫기
        const handleMenuClose = () => {
            setMenuAnchorEl(null);
        };

        // 상태 변경 다이얼로그 열기
        const handleOpenStatusDialog = () => {
            setStatusDialogOpen(true);
            handleMenuClose();
        };

        // 상태 변경 다이얼로그 닫기
        const handleCloseStatusDialog = () => {
            setStatusDialogOpen(false);
            setSelectedStatus('');
        };

        // 상태 변경 처리
        const handleUpdateStatus = async () => {
            try {
                if (!selectedStatus) {
                    alert('변경할 상태를 선택해주세요.');
                    return;
                }

                // statusCode 형식: PROJECT-BASIC_STATUS-IN_PROGRESS
                const statusCode = `PROJECT-BASIC_STATUS-${selectedStatus}`;

                await dispatch(updateProjectStatus({ id, statusCode })).unwrap();

                // 성공 시 프로젝트 데이터 새로고침
                const response = await fetchWithAuth(`${API_URL}projects/${id}`);
                if (response.ok) {
                    const updatedProject = await response.json();
                    setProject(updatedProject);
                    alert('프로젝트 상태가 성공적으로 변경되었습니다.');
                }

                handleCloseStatusDialog();
            } catch (error) {
                console.error('상태 변경 오류:', error);
                alert(`상태 변경 중 오류가 발생했습니다: ${error.message}`);
            }
        };

        // 탭 변경 핸들러
        const handleTabChange = (event, newValue) => {
            setTabValue(newValue);
        };

        // 첨부파일 다운로드 함수
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

        if (loading) return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Typography variant="h6">프로젝트 정보를 불러오는 중...</Typography>
            </Box>
        );

        if (error) return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/projects')}
                >
                    프로젝트 목록으로 돌아가기
                </Button>
            </Box>
        );

        // 프로젝트 상태 코드 추출
        const projectStatusCode = extractProjectStatusCode(project);
        // 프로젝트 상태 라벨 가져오기
        const projectStatusLabel = getProjectStatusLabel(projectStatusCode);

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
                                    onClick={() => navigate('/projects')}
                                    sx={{ mr: 1 }}
                                >
                                    목록
                                </Button>
                                <Typography variant="h4" component="h1">{project.projectName}</Typography>
                                <StatusChip
                                    label={projectStatusLabel}
                                    statuscode={projectStatusCode}
                                    size="medium"
                                />
                            </Box>

                            <Box>
                                <Tooltip title="프로젝트 관리">
                                    <IconButton onClick={handleMenuOpen}>
                                        <MoreVertIcon />
                                    </IconButton>
                                </Tooltip>
                                <Menu
                                    anchorEl={menuAnchorEl}
                                    open={Boolean(menuAnchorEl)}
                                    onClose={handleMenuClose}
                                >
                                    {canEditProject() && (
                                        <MenuItem onClick={() => {
                                            handleMenuClose();
                                            navigate(`/projects/edit/${id}`);
                                        }}>
                                            <EditIcon fontSize="small" sx={{ mr: 1 }} />
                                            프로젝트 수정
                                        </MenuItem>
                                    )}
                                    <MenuItem onClick={handleOpenStatusDialog}>
                                        <EventIcon fontSize="small" sx={{ mr: 1 }} />
                                        상태 변경
                                    </MenuItem>
                                    {canDeleteProject() && (
                                        <MenuItem onClick={() => {
                                            handleMenuClose();
                                            handleDelete();
                                        }} sx={{ color: 'error.main' }}>
                                            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                                            프로젝트 삭제
                                        </MenuItem>
                                    )}
                                    <MenuItem onClick={() => {
                                        handleMenuClose();
                                        navigate('/purchase-requests/new', { state: { projectId: id } });
                                    }}>
                                        <AddIcon fontSize="small" sx={{ mr: 1 }} />
                                        구매 요청 생성
                                    </MenuItem>
                                </Menu>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <InfoItem>
                                    <DescriptionIcon />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">프로젝트 ID</Typography>
                                        <Typography variant="body1">{project.projectIdentifier || project.id}</Typography>
                                    </Box>
                                </InfoItem>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <InfoItem>
                                    <PersonIcon />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">담당자</Typography>
                                        <Typography variant="body1">{project.requesterName || '정보 없음'}</Typography>
                                    </Box>
                                </InfoItem>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <InfoItem>
                                    <BusinessIcon />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">사업 유형</Typography>
                                        <Typography variant="body1">{getBusinessTypeLabel(project.businessCategory)}</Typography>
                                    </Box>
                                </InfoItem>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <InfoItem>
                                    <ApartmentIcon />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">요청 부서</Typography>
                                        <Typography variant="body1">{project.requestDepartment || '정보 없음'}</Typography>
                                    </Box>
                                </InfoItem>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <InfoItem>
                                    <EventIcon />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">시작일</Typography>
                                        <Typography variant="body1">{formatDate(project.projectPeriod.startDate)}</Typography>
                                    </Box>
                                </InfoItem>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <InfoItem>
                                    <EventIcon />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">종료일</Typography>
                                        <Typography variant="body1">{formatDate(project.projectPeriod.endDate)}</Typography>
                                    </Box>
                                </InfoItem>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <InfoItem>
                                    <AccountBalanceIcon />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">총 예산</Typography>
                                        <Typography variant="body1">
                                            {project.totalBudget ? project.totalBudget.toLocaleString() + ' 원' : '정보 없음'}
                                        </Typography>
                                    </Box>
                                </InfoItem>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <InfoItem>
                                    <AccountBalanceIcon />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">예산 코드</Typography>
                                        <Typography variant="body1">{getBudgetCodeLabel(project.budgetCode)}</Typography>
                                    </Box>
                                </InfoItem>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* 탭 패널 */}
                <Card>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
                    >
                        <Tab label="특이 사항" />
                        <Tab label="첨부 파일"
                            icon={project.attachments && project.attachments.length > 0 ?
                                <Badge badgeContent={project.attachments.length} color="primary" sx={{ mr: 1 }} /> : null}
                            iconPosition="end"
                        />
                        <Tab label="관련 구매 요청"
                            icon={purchaseRequests && purchaseRequests.length > 0 ?
                                <Badge badgeContent={purchaseRequests.length} color="primary" sx={{ mr: 1 }} /> : null}
                            iconPosition="end"
                        />
                    </Tabs>

                    {/* 특이 사항 탭 */}
                    <Box role="tabpanel" hidden={tabValue !== 0} sx={{ p: 3 }}>
                        {tabValue === 0 && (
                            <>
                                <SectionTitle variant="h6">
                                    <NotesIcon />
                                    특이 사항
                                </SectionTitle>
                                <Typography sx={{ whiteSpace: 'pre-line', pl: 4 }}>
                                    {project.remarks || '특이 사항이 없습니다.'}
                                </Typography>
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

                                {project.attachments && project.attachments.length > 0 ? (
                                    <List sx={{ pl: 4 }}>
                                        {project.attachments.map((attachment, index) => (
                                            <FileItem key={attachment.id} disableGutters>
                                                <Link
                                                    component="button"
                                                    onClick={() => downloadFile(attachment.id)}
                                                    sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left' }}
                                                    underline="none"
                                                >
                                                    <AttachFileIcon sx={{ mr: 1 }} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="body1">{attachment.fileName}</Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            ({Math.round(attachment.fileSize / 1024)}KB) - {new Date(attachment.uploadedAt).toLocaleString()}
                                                        </Typography>
                                                    </Box>
                                                </Link>
                                            </FileItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography color="text.secondary" sx={{ pl: 4 }}>첨부 파일이 없습니다.</Typography>
                                )}
                            </>
                        )}
                    </Box>

                    {/* 관련 구매 요청 탭 */}
                    <Box role="tabpanel" hidden={tabValue !== 2} sx={{ p: 3 }}>
                        {tabValue === 2 && (
                            <>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <SectionTitle variant="h6" sx={{ mb: 0 }}>
                                        <DescriptionIcon />
                                        관련 구매 요청
                                    </SectionTitle>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => navigate('/purchase-requests/new', { state: { projectId: id } })}
                                    >
                                        구매 요청 생성
                                    </Button>
                                </Box>

                                {purchaseRequests && purchaseRequests.length > 0 ? (
                                    <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                                        <Table stickyHeader>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>요청번호</TableCell>
                                                    <TableCell>유형</TableCell>
                                                    <TableCell>요청명</TableCell>
                                                    <TableCell align="center">상태</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {purchaseRequests.map(req => {
                                                    // 상태 코드 추출
                                                    const statusCode = extractStatusCode(req);
                                                    // 상태 라벨 가져오기
                                                    const statusLabel = getPurchaseStatusLabel(statusCode);
                                                    // 비즈니스 유형 라벨 가져오기
                                                    const businessTypeLabel = getBusinessTypeLabel(req.businessType);

                                                    return (
                                                        <TableRow
                                                            key={req.id}
                                                            hover
                                                            sx={{ cursor: 'pointer' }}
                                                            onClick={() => navigateToPurchaseRequest(req.id)}
                                                        >
                                                            <TableCell>{req.requestNumber || req.id}</TableCell>
                                                            <TableCell>{businessTypeLabel}</TableCell>
                                                            <TableCell sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                                                                {req.requestName}
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <StatusChip
                                                                    label={statusLabel}
                                                                    statuscode={statusCode}
                                                                    size="small"
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                        관련 구매 요청이 없습니다. 새 구매 요청을 생성해보세요.
                                    </Alert>
                                )}
                            </>
                        )}
                    </Box>
                </Card>

                {/* 상태 변경 다이얼로그 */}
                <Dialog open={statusDialogOpen} onClose={handleCloseStatusDialog}>
                    <DialogTitle>프로젝트 상태 변경</DialogTitle>
                    <DialogContent>
                        <FormControl fullWidth sx={{ mt: 2, minWidth: 300 }}>
                            <InputLabel id="status-select-label">상태</InputLabel>
                            <Select
                                labelId="status-select-label"
                                value={selectedStatus}
                                label="상태"
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                {availableStatuses.map((status) => (
                                    <MenuItem key={status.id} value={status.codeValue}>
                                        {status.codeName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseStatusDialog}>취소</Button>
                        <Button onClick={handleUpdateStatus} variant="contained">변경</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    }

    export default ProjectDetailPage;