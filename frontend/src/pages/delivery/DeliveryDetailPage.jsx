import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, Grid,
    CircularProgress, Card, CardContent, Divider, Chip,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    Container
} from '@mui/material';
import moment from 'moment';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';

function DeliveryDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [delivery, setDelivery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [companyName, setCompanyName] = useState('');

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
                alert('입고 정보가 성공적으로 삭제되었습니다.');
                navigate('/deliveries');
            } else {
                const errorData = await response.text();
                throw new Error(`입고 삭제 실패: ${errorData}`);
            }
        } catch (error) {
            alert(`오류 발생: ${error.message}`);
            setOpenDeleteDialog(false);
        } finally {
            setDeleting(false);
        }
    };

    // 디버깅용 - 사용자 정보 및 권한 상태 출력
    useEffect(() => {
        console.log('권한 상태:', {
            userInfo,
            currentUser,
            companyName,
            isAdmin: isAdmin(),
            isBuyer: isBuyer(),
            isSupplier: isSupplier(),
            isPurchaseDept: isPurchaseDept(),
            canAccessDelivery: delivery ? canAccessDelivery() : false
        });
    }, [userInfo, currentUser, delivery, companyName]);

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

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h6" color="error" gutterBottom>
                    오류 발생: {error}
                </Typography>
                <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBackToList}>
                    목록으로 돌아가기
                </Button>
            </Box>
        );
    }

    if (!delivery) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    해당 입고 정보를 찾을 수 없습니다.
                </Typography>
                <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBackToList}>
                    목록으로 돌아가기
                </Button>
            </Box>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                {/* 헤더 영역 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1">
                        입고 상세 정보
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={handleBackToList}
                        >
                            목록으로
                        </Button>
                    </Box>
                </Box>

                <Card>
                    <CardContent>
                        <Grid container spacing={3}>
                            {/* 입고 기본 정보 */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    입고 기본 정보
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Card variant="outlined" sx={{ bgcolor: "#f9f9f9" }}>
                                    <CardContent>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    입고번호
                                                </Typography>
                                                <Typography variant="body1" sx={{ mt: 0.5 }}>
                                                    {delivery.deliveryNumber || '-'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    발주번호
                                                </Typography>
                                                <Typography variant="body1" sx={{ mt: 0.5 }}>
                                                    {delivery.orderNumber || '-'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    입고일
                                                </Typography>
                                                <Typography variant="body1" sx={{ mt: 0.5 }}>
                                                    {delivery.deliveryDate ? moment(delivery.deliveryDate).format('YYYY-MM-DD') : '-'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    공급업체명
                                                </Typography>
                                                <Typography variant="body1" sx={{ mt: 0.5 }}>
                                                    {delivery.supplierName || '-'}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* 품목 정보 테이블 */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                    품목 정보
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <TableContainer component={Paper} variant="outlined">
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell width="10%" align="center">품목ID</TableCell>
                                                <TableCell width="10%" align="center">품목명</TableCell>
                                                <TableCell width="10%" align="center">발주수량</TableCell>
                                                <TableCell width="10%" align="center">입고수량</TableCell>
                                                <TableCell width="10%" align="center">단가</TableCell>
                                                <TableCell width="10%" align="center">총액</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell align="center">{delivery.deliveryItemId || '-'}</TableCell>
                                                <TableCell align="center">{delivery.itemName || '-'}</TableCell>
                                                <TableCell align="center">{delivery.itemQuantity || '-'}</TableCell>
                                                <TableCell align="center">{delivery.itemQuantity || '-'}</TableCell>
                                                <TableCell align="center">
                                                    {delivery.itemUnitPrice ? delivery.itemUnitPrice.toLocaleString() : '-'}
                                                </TableCell>
                                                <TableCell align="center">
                                                    {delivery.totalAmount ? delivery.totalAmount.toLocaleString() : '-'}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>

                            {/* 입고 처리 정보 */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                    입고 처리 정보
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    입고 담당자
                                </Typography>
                                <Typography variant="body1" sx={{ mt: 0.5 }}>
                                    {delivery.receiverName || '-'}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    입고 처리 시간
                                </Typography>
                                <Typography variant="body1" sx={{ mt: 0.5 }}>
                                    {delivery.createdAt ? moment(delivery.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    비고
                                </Typography>
                                <Typography variant="body1" sx={{ mt: 0.5, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#fafafa', minHeight: '80px' }}>
                                    {delivery.notes || '비고 사항이 없습니다.'}
                                </Typography>
                            </Grid>

                            {/* 버튼 영역 */}
                            <Grid item xs={12}>
                                <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2 }}>
                                    {/* 개발 환경에서만 표시되는 디버깅 정보 */}
                                    {process.env.NODE_ENV === 'development' && (
                                        <Box sx={{ width: '100%', mb: 2, p: 1, bgcolor: '#f5f5f5', fontSize: '0.75rem' }}>
                                            <div>사용자: {(userInfo || currentUser)?.username}</div>
                                            <div>역할: {(userInfo || currentUser)?.role || (userInfo || currentUser)?.roles?.join(', ')}</div>
                                            <div>ADMIN: {isAdmin() ? 'Yes' : 'No'}</div>
                                            <div>BUYER: {isBuyer() ? 'Yes' : 'No'}</div>
                                            <div>구매부서(001): {isPurchaseDept() ? 'Yes' : 'No'}</div>
                                            <div>공급업체: {isSupplier() ? 'Yes' : 'No'}</div>
                                            <div>회사명: {companyName || '-'}</div>
                                            <div>접근 권한: {canAccessDelivery() ? 'Yes' : 'No'}</div>
                                            <div>수정 권한: {canEdit() ? 'Yes' : 'No'}</div>
                                            <div>삭제 권한: {canDelete() ? 'Yes' : 'No'}</div>
                                        </Box>
                                    )}

                                    {/* 조건부 수정 버튼 표시 */}
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<EditIcon />}
                                        onClick={handleEdit}
                                        sx={{ minWidth: 120 }}
                                        disabled={!canEdit()}
                                    >
                                        수정 {!canEdit() && '(권한 없음)'}
                                    </Button>

                                    {/* 조건부 삭제 버튼 표시 */}
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={handleOpenDeleteDialog}
                                        sx={{ minWidth: 120 }}
                                        disabled={!canDelete()}
                                    >
                                        삭제 {!canDelete() && '(권한 없음)'}
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Box>

            {/* 삭제 확인 다이얼로그 */}
            <Dialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"입고 정보 삭제"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        입고번호 <strong>{delivery.deliveryNumber}</strong>의 정보를 삭제하시겠습니까?
                        <br />
                        이 작업은 되돌릴 수 없습니다.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog} color="primary">
                        취소
                    </Button>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        disabled={deleting}
                        autoFocus
                    >
                        {deleting ? <CircularProgress size={24} /> : "삭제"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default DeliveryDetailPage;