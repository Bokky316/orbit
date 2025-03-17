import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<EditIcon />}
                                        onClick={handleEdit}
                                        sx={{ minWidth: 120 }}
                                    >
                                        수정
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={handleOpenDeleteDialog}
                                        sx={{ minWidth: 120 }}
                                    >
                                        삭제
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