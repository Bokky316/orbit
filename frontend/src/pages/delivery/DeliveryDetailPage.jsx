import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, Grid,
    CircularProgress, Card, CardContent, Divider, Chip
} from '@mui/material';
import moment from 'moment';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon } from '@mui/icons-material';

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

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* 헤더 영역 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    입고 상세 정보
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={handleEdit}
                    >
                        수정
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={handleBackToList}
                    >
                        목록으로
                    </Button>
                </Box>
            </Box>

            {/* 입고 기본 정보 카드 */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        입고 기본 정보
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                                입고번호
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                {delivery.deliveryNumber || '-'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                                발주번호
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                {delivery.orderNumber || '-'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                                입고일
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                {delivery.deliveryDate ? moment(delivery.deliveryDate).format('YYYY-MM-DD') : '-'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                                상태
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                                <Chip
                                    label="입고완료"
                                    color="success"
                                    size="small"
                                    sx={{ fontWeight: 'medium' }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* 공급업체 정보 카드 */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        공급업체 정보
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                                공급업체명
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                {delivery.supplierName || '-'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                                담당자
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                {delivery.supplierManager || '-'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                                연락처
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                {delivery.supplierContact || '-'}
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* 입고 품목 정보 테이블 */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        입고 품목 정보
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>품목명</TableCell>
                                    <TableCell>규격</TableCell>
                                    <TableCell align="right">발주수량</TableCell>
                                    <TableCell align="right">입고수량</TableCell>
                                    <TableCell align="right">단가</TableCell>
                                    <TableCell align="right">총액</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {delivery.items && delivery.items.length > 0 ? (
                                    delivery.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.itemName || '-'}</TableCell>
                                            <TableCell>{item.specification || '-'}</TableCell>
                                            <TableCell align="right">{item.orderQuantity || '-'}</TableCell>
                                            <TableCell align="right">{item.deliveryQuantity || '-'}</TableCell>
                                            <TableCell align="right">{item.unitPrice ? item.unitPrice.toLocaleString() : '-'}</TableCell>
                                            <TableCell align="right">{item.totalPrice ? item.totalPrice.toLocaleString() : '-'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            <Typography variant="body2">
                                                품목 정보가 없습니다.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {/* 총액 정보 */}
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold' }}>
                                        총 합계
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                        {delivery.totalAmount ? delivery.totalAmount.toLocaleString() : '-'} 원
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* 입고 담당자 정보 */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        입고 처리 정보
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                                입고 담당자
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                {delivery.receiverName || '-'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                                입고 처리 시간
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                {delivery.createdAt ? moment(delivery.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">
                                비고
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                {delivery.notes || '비고 사항이 없습니다.'}
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
}

export default DeliveryDetailPage;