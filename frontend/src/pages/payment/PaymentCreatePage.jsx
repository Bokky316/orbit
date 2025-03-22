import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  TextField,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  Chip,
  Autocomplete,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  Paid as PaidIcon
} from "@mui/icons-material";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";
import moment from "moment";
import { styled } from '@mui/material/styles';

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

// 송장 상태에 따른 Chip 색상 및 라벨
const getStatusProps = (status) => {
  switch(status) {
    case 'WAITING':
      return { color: 'warning', label: '대기' };
    case 'APPROVED':
      return { color: 'success', label: '승인됨' };
    case 'REJECTED':
      return { color: 'error', label: '거부됨' };
    case 'PAID':
      return { color: 'success', label: '지불완료' };
    case 'OVERDUE':
      return { color: 'error', label: '연체' };
    default:
      return { color: 'default', label: status };
  }
};

// 금액 형식 변환 함수
const formatCurrency = (amount) => {
  if (!amount) return '0원';
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

const PaymentCreatePage = () => {
  const navigate = useNavigate();

  // Redux 상태에서 인증 정보 가져오기
  const auth = useSelector((state) => state.auth);
  const currentUser = auth?.user;
  const isLoggedIn = auth?.isLoggedIn;

  // 상태 관리
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // 폼 필드
  const [formData, setFormData] = useState({
    invoiceId: '',
    paymentDate: moment(),
    paymentMethod: '계좌이체',
    transactionId: '',
    notes: ''
  });

  // 역할 확인 유틸리티 함수
  const isAdmin = () => {
    return currentUser?.roles?.includes('ROLE_ADMIN') || currentUser?.role === 'ADMIN';
  };

  const isBuyer = () => {
    return currentUser?.roles?.includes('ROLE_BUYER') || currentUser?.role === 'BUYER';
  };

  const isSupplier = () => {
    return currentUser?.roles?.includes('ROLE_SUPPLIER') || currentUser?.role === 'SUPPLIER';
  };

  // 재무회계팀(004로 시작)인지 확인하는 함수
  const isFinanceDept = () => {
    if (!currentUser?.username) return false;
    return currentUser.username.startsWith('004');
  };

  // 결제 등록 권한 확인
  const canCreatePayment = () => {
    if (!isLoggedIn || !currentUser) return false;

    // 재무회계팀만 결제 생성 가능
    if (isFinanceDept()) return true;

    // 관리자도 결제 생성 가능
    if (isAdmin()) return true;

    return false;
  };

  // 미결제 송장 목록 조회
  const fetchUnpaidInvoices = async () => {
    try {
      setLoading(true);

      // 승인된 상태(APPROVED)의 송장만 조회
      const params = new URLSearchParams({
        status: 'APPROVED',
        page: 0,
        size: 100,
        sortBy: 'issueDate',
        sortDir: 'desc'
      });

      const response = await fetchWithAuth(`${API_URL}invoices/list?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`미결제 송장 목록 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('미결제 송장 데이터:', data);

      if (data && data.invoices) {
        setUnpaidInvoices(data.invoices);
      } else {
        setUnpaidInvoices([]);
      }
    } catch (error) {
      console.error('미결제 송장 목록을 불러오는 중 오류 발생:', error);
      setError('미결제 송장 정보를 불러오는 중 오류가 발생했습니다.');
      setShowError(true);
      setUnpaidInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      // 권한 체크
      if (!canCreatePayment()) {
        setError('결제 생성 권한이 없습니다. 재무회계팀 또는 관리자만 결제를 생성할 수 있습니다.');
        setShowError(true);
        // 권한 없으면 목록 페이지로 리다이렉트
        setTimeout(() => {
          navigate('/payments');
        }, 2000);
        return;
      }

      // 미결제 송장 목록 조회
      fetchUnpaidInvoices();

      // 거래 ID 자동 생성
      const randomId = 'TRX-' + Date.now().toString().slice(-8);
      setFormData(prev => ({
        ...prev,
        transactionId: randomId
      }));
    }
  }, [isLoggedIn, currentUser]);

  // 입력값 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // 날짜 변경 핸들러
  const handleDateChange = (name, date) => {
    setFormData({
      ...formData,
      [name]: date
    });
  };

  // 송장 선택 핸들러
  const handleInvoiceChange = (event, newValue) => {
    setSelectedInvoice(newValue);
    if (newValue) {
      setFormData({
        ...formData,
        invoiceId: newValue.id
      });
    } else {
      setFormData({
        ...formData,
        invoiceId: ''
      });
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedInvoice) {
      setError('송장을 선택해주세요.');
      setShowError(true);
      return;
    }

    try {
      setSaving(true);

      // 결제 생성 API 요청 데이터 준비
      const requestData = {
        invoiceId: formData.invoiceId,
        paymentDate: formData.paymentDate.format('YYYY-MM-DD'),
        paymentMethod: formData.paymentMethod,
        transactionId: formData.transactionId,
        notes: formData.notes
      };

      // 결제 생성 API 호출
      const response = await fetchWithAuth(`${API_URL}payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`결제 생성 실패: ${response.status}`);
      }

      const createdPayment = await response.json();

      // 성공 메시지 표시
      setSuccessMessage('결제가 성공적으로 생성되었습니다.');
      setShowSuccess(true);

      // 생성 후 상세 페이지로 이동 (타이머 설정)
      setTimeout(() => {
        navigate(`/payments/${createdPayment.id}`);
      }, 2000);
    } catch (error) {
      console.error('결제 생성 중 오류 발생:', error);
      setError('결제 생성 중 오류가 발생했습니다. 이미 결제된 송장일 수 있습니다.');
      setShowError(true);
    } finally {
      setSaving(false);
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    setCancelDialogOpen(true);
  };

  // 메시지 닫기 핸들러
  const handleCloseError = () => {
    setShowError(false);
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }} id="payment-create-container">
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

      {/* 취소 확인 다이얼로그 */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>생성 취소</DialogTitle>
        <DialogContent>
          <DialogContentText>
            결제 생성을 취소하시겠습니까? 입력한 정보는 저장되지 않습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} color="primary">
            계속 작성
          </Button>
          <Button onClick={() => navigate('/payments')} color="error" autoFocus>
            취소하고 나가기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 상단 네비게이션 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/payments')}
        >
          목록으로
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <form onSubmit={handleSubmit}>
          <Box className="payment-create-content">
            {/* 결제 제목 및 상태 */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h5" component="h1">
                    새 결제 등록
                  </Typography>
                </Box>
                <Chip
                  label="작성 중"
                  color="default"
                  size="medium"
                  sx={{ fontSize: '1rem', fontWeight: 'bold' }}
                />
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                결제는 승인된 송장 정보를 기반으로 생성됩니다. 아래에서 송장을 선택해주세요.
              </Alert>
            </Paper>

            {/* 송장 선택 */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <SectionTitle variant="h6">송장 선택</SectionTitle>
              <Divider sx={{ mb: 2 }} />

              <Autocomplete
                options={unpaidInvoices}
                getOptionLabel={(option) =>
                  `[${option.invoiceNumber}] ${option.supplierName} - ${formatCurrency(option.totalAmount)}`
                }
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        송장번호: {option.invoiceNumber}
                      </Typography>
                      <Grid container spacing={1} sx={{ mt: 0.5 }}>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            • 공급업체: {option.supplierName}
                          </Typography>
                          <Typography variant="body2">
                            • 품목: {option.itemName}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            • 발행일: {option.issueDate}
                          </Typography>
                          <Typography variant="body2">
                            • 금액: {formatCurrency(option.totalAmount)}
                          </Typography>
                        </Grid>
                      </Grid>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        상태: <Chip size="small" label={getStatusProps(option.status).label} color={getStatusProps(option.status).color} />
                      </Typography>
                    </Box>
                  </li>
                )}
                value={selectedInvoice}
                onChange={handleInvoiceChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="송장 선택"
                    required
                    fullWidth
                    margin="normal"
                    placeholder="송장번호 또는 공급업체명으로 검색하세요"
                  />
                )}
                noOptionsText="결제 가능한 송장이 없습니다"
                sx={{ mb: 2 }}
              />
            </Paper>

            {/* 선택된 송장 정보 */}
            {selectedInvoice && (
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <SectionTitle variant="h6">선택된 송장 정보</SectionTitle>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <InfoRow>
                      <Typography className="label">송장 번호:</Typography>
                      <Typography className="value">{selectedInvoice.invoiceNumber}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography className="label">공급업체:</Typography>
                      <Typography className="value">{selectedInvoice.supplierName}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography className="label">품목:</Typography>
                      <Typography className="value">{selectedInvoice.itemName}</Typography>
                    </InfoRow>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <InfoRow>
                      <Typography className="label">발행일:</Typography>
                      <Typography className="value">{selectedInvoice.issueDate}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography className="label">마감일:</Typography>
                      <Typography className="value">{selectedInvoice.dueDate}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography className="label">금액:</Typography>
                      <Typography className="value" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(selectedInvoice.totalAmount)}
                      </Typography>
                    </InfoRow>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* 결제 정보 */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <SectionTitle variant="h6">결제 정보</SectionTitle>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterMoment}>
                    <DatePicker
                      label="결제일"
                      value={formData.paymentDate}
                      onChange={(date) => handleDateChange('paymentDate', date)}
                      format="YYYY-MM-DD"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          margin: "normal",
                          required: true
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>결제 방법</InputLabel>
                    <Select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                      label="결제 방법"
                    >
                      <MenuItem value="계좌이체">계좌이체</MenuItem>
                      <MenuItem value="카드">카드</MenuItem>
                      <MenuItem value="수표">수표</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="거래 ID"
                    name="transactionId"
                    value={formData.transactionId}
                    onChange={handleInputChange}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* 금액 정보 */}
            {selectedInvoice && (
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <SectionTitle variant="h6">결제 금액</SectionTitle>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Card variant="outlined" sx={{ minWidth: 300, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        총 결제 금액
                      </Typography>
                      <Typography variant="h4">{formatCurrency(selectedInvoice.totalAmount)}</Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Paper>
            )}

            {/* 비고 */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <SectionTitle variant="h6">비고</SectionTitle>
              <Divider sx={{ mb: 2 }} />
              <TextField
                fullWidth
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                multiline
                rows={4}
                placeholder="추가 정보가 있으면 입력하세요"
              />
            </Paper>

            {/* 하단 버튼 영역 */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap', mt: 3 }}>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
              >
                취소
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                type="submit"
                disabled={saving || !selectedInvoice}
              >
                결제 생성
              </Button>
            </Box>
          </Box>
        </form>
      )}
    </Container>
  );
};

export default PaymentCreatePage;