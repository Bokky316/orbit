import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, Grid,
    CircularProgress, Card, CardContent, Divider, Chip
} from '@mui/material';
import moment from 'moment';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon } from '@mui/icons-material';

function DeliveryDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [delivery, setDelivery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 입고 상세 정보 조회
    useEffect(() => {
        const fetchDeliveryDetail = async () => {
            try {
                setLoading(true);
                const response = await fetchWithAuth(`${API_URL}deliveries/${id}`);

                if (!response.ok) {
                    throw new Error(`입고 상세 조회 실패: ${response.status}`);
                }

                const data = await response.json();
                console.log('입고 상세 데이터:', data);
                setDelivery(data);
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