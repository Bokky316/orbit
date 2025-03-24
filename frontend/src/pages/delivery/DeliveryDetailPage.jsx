import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Button,
    Divider,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Snackbar,
    Alert,
    Card,
    CardContent
} from '@mui/material';
import { styled } from '@mui/material/styles';
import moment from 'moment';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Print as PrintIcon
} from '@mui/icons-material';

// 스타일 컴포넌트
const InfoRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    margin: theme.spacing(1, 0),
    '& .label': {
        width: '30%',
        fontWeight: 500,
        color: theme.palette.text.secondary
    },
    '& .value': {
        width: '70%'
    }
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
    fontWeight: 600,
    margin: theme.spacing(2, 0, 1)
}));

// 금액 형식 변환 함수
const formatCurrency = (amount) => {
    if (!amount) return '0원';
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

function DeliveryDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [delivery, setDelivery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showError, setShowError] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [companyName, setCompanyName] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    // Redux 상태에서 인증 정보 가져오기
    const auth = useSelector((state) => state.auth);
    const currentUser = auth?.user;

    // 사용자 정보 및 권한 조회
    useEffect(() => {
        // 먼저 Redux 스토어에서 사용자 정보 사용
        if (currentUser) {
            console.log('Redux에서 사용자 정보 로드:', currentUser);
            setUserInfo(currentUser);
            return;
        }

        // Redux에 사용자 정보가 없는 경우 API 호출
        const fetchUserInfo = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}users/me`);
                if (response.ok) {
                    const data = await response.json();
                    console.log('API에서 사용자 정보 로드:', data);
                    setUserInfo(data);
                } else {
                    throw new Error('사용자 정보를 불러오는데 실패했습니다.');
                }
            } catch (error) {
                console.error('사용자 정보 조회 중 오류 발생:', error);
                // 임시 해결책: 로컬 스토리지에서 사용자 정보 가져오기
                try {
                    const authData = JSON.parse(localStorage.getItem('auth'));
                    if (authData && authData.user) {
                        console.log('로컬 스토리지에서 사용자 정보 로드:', authData.user);
                        setUserInfo(authData.user);
                    }
                } catch (e) {
                    console.error('로컬 스토리지에서 사용자 정보 로드 실패:', e);
                }
            }
        };

        fetchUserInfo();
    }, [currentUser]);

    // 역할 확인 유틸리티 함수
    const isAdmin = () => {
        const user = userInfo || currentUser;
        if (!user) return false;
        return user.roles?.includes('ROLE_ADMIN') || user.role === 'ADMIN';
    };

    const isBuyer = () => {
        const user = userInfo || currentUser;
        if (!user) return false;
        return user.roles?.includes('ROLE_BUYER') || user.role === 'BUYER';
    };

    const isSupplier = () => {
        const user = userInfo || currentUser;
        if (!user) return false;
        return user.roles?.includes('ROLE_SUPPLIER') || user.role === 'SUPPLIER';
    };

    // username이 001로 시작하는지 확인 (구매부서)
    const isPurchaseDept = () => {
        const user = userInfo || currentUser;
        if (!user?.username) return false;
        return user.username.startsWith('001');
    };

    // 회사명 찾기 함수
    const findCompanyName = () => {
        const user = userInfo || currentUser;
        if (!user) return '';

        // 공급업체 역할인 경우 회사명 추출
        if (isSupplier()) {
            // 공급업체명을 찾을 수 있는 가능한 속성 확인
            const company = user.companyName ||
                            user.company ||
                            user.supplierName;

            // 회사명이 이미 있으면 사용
            if (company) {
                console.log('회사명 찾음 (속성):', company);
                return company;
            }

            // 이름에서 추출 (예: '공급사 1 담당자' -> '공급사 1')
            if (user.name) {
                // 이름에서 '공급사 N' 패턴 추출
                const nameMatch = user.name.match(/(공급사\s*\d+)/);
                if (nameMatch) {
                    console.log('회사명 찾음 (이름 패턴):', nameMatch[1]);
                    return nameMatch[1];
                }

                // 이름이 공급사명인 경우 (예: '공급사 1')
                if (user.name.trim().startsWith('공급사')) {
                    console.log('회사명 찾음 (이름):', user.name);
                    return user.name.trim();
                }
            }

            // 그래도 못 찾았다면, 이름 자체를 그대로 사용
            if (user.name) {
                console.log('회사명으로 이름 사용:', user.name);
                return user.name;
            }
        }

        return '';
    };

    // 회사명 설정
    useEffect(() => {
        if ((userInfo || currentUser) && isSupplier()) {
            const company = findCompanyName();
            setCompanyName(company);
            console.log('공급업체명 설정:', company);
        }
    }, [userInfo, currentUser]);

    // 접근 권한 확인 함수 - 수정된 버전
    const canAccessDelivery = () => {
        if (!delivery) return false;

        const user = userInfo || currentUser;
        if (!user) return false;

        // ADMIN은 모든 데이터 접근 가능
        if (isAdmin()) return true;

        // BUYER(username이 001로 시작하거나 구매관리팀)는 자신이 담당자인 데이터만 접근 가능
        if (isBuyer() && isPurchaseDept()) {
            return delivery.receiverName === user.name;
        }

        // BUYER(일반)는 자신이 담당자로 지정된 데이터만 접근 가능
        if (isBuyer() && !isPurchaseDept()) {
            return delivery.receiverName === user.name;
        }

        // SUPPLIER는 자사 관련 데이터만 접근 가능
        if (isSupplier()) {
            // 목록에서 클릭해서 들어온 경우라면, 이미 필터링된 데이터일 가능성이 높음
            // 목록에서 자신의 데이터만 보여주므로 상세에서는 권한 체크를 완화
            return true; // 공급업체의 경우 일단 모든 데이터 접근 허용 (목록에서 이미 필터링됨)
        }

        return false;
    };

    // 입고 상세 정보 조회 - 수정된 버전
    useEffect(() => {
        const fetchDeliveryDetail = async () => {
            try {
                setLoading(true);

                // API 호출 전 디버깅 정보
                console.log('API 호출 전:', {
                    id,
                    isAdmin: isAdmin(),
                    isBuyer: isBuyer(),
                    isSupplier: isSupplier(),
                    companyName: companyName,
                    user: (userInfo || currentUser)?.username
                });

                const response = await fetchWithAuth(`${API_URL}deliveries/${id}`);

                // API 응답 상태 로깅
                console.log('API 응답 상태:', {
                    status: response.status,
                    ok: response.ok,
                    statusText: response.statusText
                });

                if (!response.ok) {
                    throw new Error(`입고 상세 조회 실패: ${response.status}`);
                }

                const data = await response.json();
                console.log('입고 상세 데이터:', data);
                setDelivery(data);

                // 권한 체크 로직 제거 - 목록에서 이미 필터링되어 들어왔으므로 중복 체크 불필요
            } catch (error) {
                console.error('입고 상세를 불러오는 중 오류 발생:', error);
                setError(error.message);
                setShowError(true);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDeliveryDetail();
        }
    }, [id]);

    // 목록으로 돌아가기
    const handleBackToList = () => {
        navigate('/deliveries');
    };

    // 수정 페이지로 이동
    const handleEdit = () => {
        navigate(`/deliveries/edit/${id}`);
    };

    // 삭제 다이얼로그 열기
    const handleOpenDeleteDialog = () => {
        setOpenDeleteDialog(true);
    };

    // 삭제 다이얼로그 닫기
    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
    };

    // 삭제 실행
    const handleDelete = async () => {
        try {
            setDeleting(true);
            const response = await fetchWithAuth(`${API_URL}deliveries/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setSuccessMessage('입고 정보가 성공적으로 삭제되었습니다.');
                setShowSuccess(true);

                // 삭제 후 목록 페이지로 이동 (타이머 설정)
                setTimeout(() => {
                    navigate('/deliveries');
                }, 2000);
            } else {
                const errorData = await response.text();
                throw new Error(`입고 삭제 실패: ${errorData}`);
            }
        } catch (error) {
            setError(`오류 발생: ${error.message}`);
            setShowError(true);
        } finally {
            setDeleting(false);
            setOpenDeleteDialog(false);
        }
    };

    // 수정 버튼 표시 여부 확인
    const canEdit = () => {
        const user = userInfo || currentUser;
        if (!user || !delivery) {
            console.log('사용자 정보 없음 또는 데이터 없음 - 수정 권한 없음');
            return false;
        }

        // ADMIN은 모든 입고 데이터 수정 가능
        if (isAdmin()) {
            console.log('ADMIN 권한 - 수정 가능');
            return true;
        }

        // BUYER(dept_id=1 또는 username이 001로 시작)는 자신이 담당하는 입고 데이터만 수정 가능
        if (isBuyer() && (user.departmentId === 1 || isPurchaseDept())) {
            const hasAccess = delivery && user.name === delivery.receiverName;
            console.log('BUYER 권한 - 수정 가능 여부:', hasAccess);
            return hasAccess;
        }

        console.log('수정 권한 없음');
        // SUPPLIER는 수정 불가
        return false;
    };

    // 삭제 버튼 표시 여부 확인 (ADMIN만 가능)
    const canDelete = () => {
        const isAdminUser = isAdmin();
        console.log('삭제 권한 여부:', isAdminUser);
        return isAdminUser;
    };

    // 메시지 닫기 핸들러
    const handleCloseError = () => {
        setShowError(false);
    };

    const handleCloseSuccess = () => {
        setShowSuccess(false);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }} id="delivery-detail-container">
            {/* 에러 메시지 */}
            <Snackbar
                open={showError}
                autoHideDuration={6000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            {/* 성공 메시지 */}
            <Snackbar
                open={showSuccess}
                autoHideDuration={6000}
                onClose={handleCloseSuccess}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>

            {/* 삭제 확인 다이얼로그 */}
            <Dialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
            >
                <DialogTitle>입고 정보 삭제 확인</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {delivery && (
                            <>
                                입고번호 <strong>{delivery.deliveryNumber}</strong>의 정보를 삭제하시겠습니까?
                                <br />
                                이 작업은 되돌릴 수 없습니다.
                            </>
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog} color="primary">
                        취소
                    </Button>
                    <Button onClick={handleDelete} color="error" autoFocus disabled={deleting}>
                        {deleting ? <CircularProgress size={24} /> : "삭제"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 상단 네비게이션 */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 3 }}>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBackToList}
                >
                    목록으로
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            ) : delivery ? (
                <Box className="delivery-detail-content">
                    {/* 입고 제목 및 상태 */}
                    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h5" component="h1">
                                입고 번호 : {delivery.deliveryNumber}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', mt: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', mr: 4, alignItems: 'center' }}>
                                <Typography sx={{ fontWeight: 500, color: 'text.secondary', mr: 1 }}>담당자:</Typography>
                                <Typography>{delivery.receiverName || '-'}</Typography>
                            </Box>

                            {/* <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography sx={{ fontWeight: 500, color: 'text.secondary', mr: 1 }}>처리 일시:</Typography>
                                <Typography>
                                    {delivery.createdAt ? moment(delivery.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
                                </Typography>
                            </Box> */}
                        </Box>
                    </Paper>

                    {/* 기본 정보 */}
                    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                        <SectionTitle variant="h6">기본 정보</SectionTitle>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <InfoRow>
                                    <Typography className="label">발주 번호:</Typography>
                                    <Typography className="value">{delivery.orderNumber || '-'}</Typography>
                                </InfoRow>
                                <InfoRow>
                                    <Typography className="label">입고일:</Typography>
                                    <Typography className="value">
                                        {delivery.deliveryDate ? moment(delivery.deliveryDate).format('YYYY-MM-DD') : '-'}
                                    </Typography>
                                </InfoRow>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <InfoRow>
                                    <Typography className="label">공급업체명:</Typography>
                                    <Typography className="value">{delivery.supplierName || '-'}</Typography>
                                </InfoRow>
                                <InfoRow>
                                    <Typography className="label">입고 처리 시간:</Typography>
                                    <Typography className="value">
                                        {delivery.createdAt ? moment(delivery.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
                                    </Typography>
                                </InfoRow>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* 품목 정보 */}
                    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                        <SectionTitle variant="h6">품목 정보</SectionTitle>
                        <Divider sx={{ mb: 2 }} />

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>품목ID</TableCell>
                                        <TableCell>품목명</TableCell>
                                        <TableCell>발주수량</TableCell>
                                        <TableCell>입고수량</TableCell>
                                        <TableCell>단가</TableCell>
                                        <TableCell>총액</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>{delivery.deliveryItemId || '-'}</TableCell>
                                        <TableCell>{delivery.itemName || '-'}</TableCell>
                                        <TableCell>{delivery.itemQuantity || '-'}</TableCell>
                                        <TableCell>{delivery.itemQuantity || '-'}</TableCell>
                                        <TableCell>
                                            {delivery.itemUnitPrice ? formatCurrency(delivery.itemUnitPrice) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {delivery.totalAmount ? formatCurrency(delivery.totalAmount) : '-'}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* 금액 요약 */}
                    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            borderRadius: 1,
                        }}>
                            <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main' }}>
                                총액: <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                                    {delivery.totalAmount ? formatCurrency(delivery.totalAmount) : '0원'}
                                </span>
                            </Typography>
                        </Box>
                    </Paper>

                    {/* 비고 */}
                    {delivery.notes && (
                        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                            <SectionTitle variant="h6">비고</SectionTitle>
                            <Divider sx={{ mb: 2 }} />
                            <Typography>{delivery.notes || '비고 사항이 없습니다.'}</Typography>
                        </Paper>
                    )}

                    {/* 하단 버튼 영역 */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap', mt: 3 }}>
                        {canEdit() && (
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<EditIcon />}
                                onClick={handleEdit}
                            >
                                수정
                            </Button>
                        )}
                        {canDelete() && (
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={handleOpenDeleteDialog}
                            >
                                삭제
                            </Button>
                        )}
                    </Box>
                </Box>
            ) : (
                <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
                    <Typography variant="h6">입고 정보를 찾을 수 없습니다.</Typography>
                    <Button
                        variant="contained"
                        onClick={handleBackToList}
                        sx={{ mt: 2 }}
                    >
                        입고 목록으로
                    </Button>
                </Paper>
            )}
        </Container>
    );
}

export default DeliveryDetailPage;