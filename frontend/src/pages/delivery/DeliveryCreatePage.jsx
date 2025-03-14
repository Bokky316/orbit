import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, TextField, Button, Grid, Alert,
    IconButton, FormControl, InputLabel, Select, MenuItem,
    InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from 'moment';
import { API_URL } from '@/utils/constants';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

/**
 * 입고 등록 페이지 컴포넌트
 */
function DeliveryCreatePage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Redux 상태 가져오기
    const { user } = useSelector(state => state.auth);

    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [selectedPO, setSelectedPO] = useState(null);
    const [poDetails, setPODetails] = useState(null);
    const [deliveryDate, setDeliveryDate] = useState(moment());
    const [managerName, setManagerName] = useState('');

    // 발주 목록 조회
    useEffect(() => {
        const fetchPurchaseOrders = async () => {
            setLoading(true);
            try {
                const response = await fetchWithAuth(`${API_URL}purchase-orders/available`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`발주 목록을 가져오는데 실패했습니다: ${response.status}`);
                }

                const data = await response.json();
                setPurchaseOrders(data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchPurchaseOrders();
    }, []);

    // 발주 선택 시 상세 정보 조회
    const handlePOSelection = async (poId) => {
        if (!poId) {
            setSelectedPO(null);
            setPODetails(null);
            return;
        }

        setLoading(true);
        try {
            const response = await fetchWithAuth(`${API_URL}purchase-orders/${poId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`발주 정보를 가져오는데 실패했습니다: ${response.status}`);
            }

            const data = await response.json();
            setSelectedPO(poId);
            setPODetails(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedPO || !poDetails) {
            setError('발주 정보를 선택해주세요.');
            return;
        }

        // 요청 데이터 구성
        const requestData = {
            purchaseOrderId: selectedPO,
            deliveryDate: deliveryDate.format('YYYY-MM-DD'),
            managerName: managerName,
            memberId: user?.id,
            memberName: user?.name,
            // 발주 수량을 그대로 입고 수량으로 설정 (입력 필드 없음)
            items: poDetails.items.map(item => ({
                itemId: item.itemId,
                quantityOrdered: item.quantity,
                quantityDelivered: item.quantity, // 발주 수량과 동일하게 설정
                unitPrice: item.unitPrice
            })),
            // 입고 상태 설정
            deliveryStatus: 'COMPLETED',
            autoInspectionComplete: true
        };

        try {
            const response = await fetchWithAuth(`${API_URL}deliveries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`입고 등록에 실패했습니다: ${errorText}`);
            }

            // 성공 시 목록 페이지로 이동
            alert('입고가 성공적으로 등록되었습니다.');
            navigate('/deliveries');
        } catch (err) {
            setError(err.message);
        }
    };

    // 로딩 중 표시
    if (loading && !purchaseOrders.length) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>데이터를 불러오는 중입니다...</Typography>
            </Box>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    입고 등록 (자동 검수 완료)
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Paper sx={{ p: 2 }}>
                    <Grid container spacing={3}>
                        {/* 발주 정보 선택 */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                                발주 정보 선택
                            </Typography>
                            <FormControl fullWidth>
                                <InputLabel id="po-select-label">발주번호 검색</InputLabel>
                                <Select
                                    labelId="po-select-label"
                                    id="po-select"
                                    value={selectedPO || ''}
                                    label="발주번호 검색"
                                    onChange={(e) => handlePOSelection(e.target.value)}
                                >
                                    {purchaseOrders.map(po => (
                                        <MenuItem key={po.id} value={po.id}>
                                            {po.poNumber} - {po.supplierName} - {po.itemName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* 발주 정보 표시 섹션 - 항상 표시 */}
                        <Grid item xs={12}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    발주 정보
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2">
                                            발주번호: {poDetails ? poDetails.poNumber : '-'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2">
                                            발주일: {poDetails ? moment(poDetails.orderDate).format('YYYY-MM-DD') : '-'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2">
                                            공급업체: {poDetails ? poDetails.supplierName : '-'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2">
                                            품목: {poDetails ? poDetails.itemName : '-'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        {/* 품목 목록 - 항상 표시 */}
                        <Grid item xs={12}>
                            <Box sx={{ mt: 2, overflowX: 'auto' }}>
                                <Grid container sx={{ bgcolor: '#e9ecef', py: 1, px: 2, fontWeight: 'bold' }}>
                                    <Grid item xs={3}>품목</Grid>
                                    <Grid item xs={3}>규격</Grid>
                                    <Grid item xs={2}>발주수량</Grid>
                                    <Grid item xs={2}>입고수량</Grid>
                                    <Grid item xs={2}>단가</Grid>
                                </Grid>

                                {poDetails && poDetails.items ? (
                                    poDetails.items.map((item, index) => (
                                        <Grid container key={index} sx={{ py: 1, px: 2, borderBottom: '1px solid #dee2e6' }}>
                                            <Grid item xs={3}>{item.itemName}</Grid>
                                            <Grid item xs={3}>{item.specification}</Grid>
                                            <Grid item xs={2}>{item.quantity}</Grid>
                                            <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                                                {item.quantity}
                                            </Grid>
                                            <Grid item xs={2}>
                                                {item.unitPrice.toLocaleString()}
                                            </Grid>
                                        </Grid>
                                    ))
                                ) : (
                                    // 데이터가 없을 때 표시할 빈 행
                                    <Grid container sx={{ py: 1, px: 2, borderBottom: '1px solid #dee2e6' }}>
                                        <Grid item xs={3}>-</Grid>
                                        <Grid item xs={3}>-</Grid>
                                        <Grid item xs={2}>-</Grid>
                                        <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                                            -
                                        </Grid>
                                        <Grid item xs={2}>-</Grid>
                                    </Grid>
                                )}
                            </Box>
                        </Grid>

                        {/* 입고 정보 / 담당자 정보 - 항상 표시 */}
                        <Grid item xs={6}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    입고 정보
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                    <Typography variant="body2" sx={{ width: '80px' }}>
                                        입고일
                                    </Typography>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        value={deliveryDate.format('YYYY-MM-DD')}
                                        InputProps={{
                                            readOnly: !selectedPO
                                        }}
                                        onClick={() => {
                                            if (selectedPO) {
                                                // DatePicker를 여기서 열 수 있는 로직
                                                // 실제 구현에서는 DatePicker 컴포넌트를 modal로 열거나 다른 방식으로 구현
                                            }
                                        }}
                                    />
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid item xs={6}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    담당자 정보
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                    <Typography variant="body2" sx={{ width: '80px' }}>
                                        담당자
                                    </Typography>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        value={managerName}
                                        onChange={(e) => setManagerName(e.target.value)}
                                    />
                                </Box>
                            </Paper>
                        </Grid>

                        {/* 버튼 */}
                        <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="success"
                                sx={{ minWidth: 120 }}
                                disabled={!selectedPO}
                            >
                                확인
                            </Button>
                            <Button
                                variant="contained"
                                color="inherit"
                                sx={{ minWidth: 120 }}
                                onClick={() => navigate('/deliveries')}
                            >
                                취소
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </LocalizationProvider>
    );
}

export default DeliveryCreatePage;