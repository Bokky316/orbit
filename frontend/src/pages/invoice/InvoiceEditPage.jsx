import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Card,
  CardContent
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon
} from "@mui/icons-material";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";
import moment from "moment";

// 스타일 컴포넌트 (인라인으로 정의)
const SectionTitle = ({ children, ...props }) => (
  <Typography
    variant="h6"
    sx={{ fontWeight: 600, margin: (theme) => theme.spacing(2, 0, 1) }}
    {...props}
  >
    {children}
  </Typography>
);

// 금액 형식 변환 함수
const formatCurrency = (amount) => {
  if (!amount) return '0';
  return new Intl.NumberFormat('ko-KR').format(amount);
};

const InvoiceEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Redux 상태에서 인증 정보 가져오기
  const auth = useSelector((state) => state.auth);
  const currentUser = auth?.user;
  const isLoggedIn = auth?.isLoggedIn;

  // 상태 관리
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // 폼 필드
  const [formData, setFormData] = useState({
    contractNumber: '',
    transactionNumber: '',
    issueDate: moment(),
    dueDate: moment().add(30, 'days'),
    notes: '',
    status: '',
    supplyPrice: 0,
    vat: 0,
    totalAmount: 0,
    itemName: '',
    itemSpecification: '',
    quantity: 0,
    unitPrice: 0,
    unit: ''
  });

  // 역할 확인 유틸리티 함수
  const isAdmin = () => {
    return currentUser?.roles?.includes('ROLE_ADMIN') || currentUser?.role === 'ADMIN';
  };

  const isBuyer = () => {
    return currentUser?.roles?.includes('ROLE_BUYER') || currentUser?.role === 'BUYER';
  };

  // username이 001로 시작하는지 확인 (구매관리팀)
  const isPurchaseDept = () => {
    if (!currentUser?.username) return false;
    return currentUser.username.startsWith('001');
  };

  // 송장에 대한 수정 권한 확인
  const canEditInvoice = () => {
    if (!isLoggedIn || !currentUser) return false;

    // ADMIN은 항상 가능
    if (isAdmin()) return true;

    // BUYER(구매관리팀)도 가능
    if (isBuyer() && isPurchaseDept()) return true;

    return false;
  };

  // 데이터 로드 함수
  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${API_URL}invoices/${id}`);

      if (!response.ok) {
        throw new Error(`송장 정보 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('송장 데이터:', data);
      setInvoice(data);

      // 폼 데이터 초기화
      setFormData({
        contractNumber: data.contractNumber || '',
        transactionNumber: data.transactionNumber || '',
        issueDate: data.issueDate ? moment(data.issueDate, "YYYY. MM. DD.") : moment(),
        dueDate: data.dueDate ? moment(data.dueDate, "YYYY. MM. DD.") : moment().add(30, 'days'),
        notes: data.notes || '',
        status: data.status || '',
        supplyPrice: data.supplyPrice || 0,
        vat: data.vat || 0,
        totalAmount: data.totalAmount || 0,
        itemName: data.itemName || '',
        itemSpecification: data.itemSpecification || '',
        quantity: data.quantity || 0,
        unitPrice: data.unitPrice || 0,
        unit: data.unit || ''
      });
    } catch (error) {
      console.error('송장 정보를 불러오는 중 오류 발생:', error);
      setError('송장 정보를 불러오는 중 오류가 발생했습니다.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (isLoggedIn && currentUser && id) {
      fetchInvoice();
    } else {
      setLoading(false);
    }

    // 권한 체크
    if (!canEditInvoice()) {
      setError('송장 수정 권한이 없습니다.');
      setShowError(true);
      // 권한 없으면 상세 페이지로 리다이렉트
      setTimeout(() => {
        navigate(`/invoices/${id}`);
      }, 2000);
    }
  }, [isLoggedIn, currentUser, id]);

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

  // 숫자 입력 핸들러 (천 단위 쉼표 처리)
  const handleNumberInputChange = (e) => {
    const { name, value } = e.target;

    // 쉼표 제거하고 숫자만 추출
    const numericValue = value.replace(/[^\d]/g, '');

    setFormData({
      ...formData,
      [name]: numericValue
    });
  };

  // 공급가액 변경 시 부가세 및 총액 자동 계산
  useEffect(() => {
    if (formData.supplyPrice) {
      const supplyPrice = Number(formData.supplyPrice);
      const vat = Math.round(supplyPrice * 0.1); // 10% 부가세
      const totalAmount = supplyPrice + vat;

      setFormData((prev) => ({
        ...prev,
        vat,
        totalAmount
      }));
    }
  }, [formData.supplyPrice]);

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      // 날짜 형식 변환 (Date -> yyyy-MM-dd)
      const formatDateForApi = (date) => {
        if (!date) return null;
        return date.format('YYYY-MM-DD');
      };

      // API 요청 데이터 준비
      const requestData = {
        contractNumber: formData.contractNumber,
        transactionNumber: formData.transactionNumber,
        issueDate: formatDateForApi(formData.issueDate),
        dueDate: formatDateForApi(formData.dueDate),
        notes: formData.notes,
        status: formData.status,
        // 나머지 필드는 기존 값 유지 (수정 불가 필드)
        supplyPrice: Number(formData.supplyPrice),
        vat: Number(formData.vat),
        totalAmount: Number(formData.totalAmount),
        itemName: formData.itemName,
        itemSpecification: formData.itemSpecification,
        quantity: Number(formData.quantity),
        unitPrice: Number(formData.unitPrice),
        unit: formData.unit
      };

      // 상태 변경 API 호출
      const response = await fetchWithAuth(`${API_URL}invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`송장 상태 변경 실패: ${response.status}`);
      }

      // 성공 메시지 표시
      setSuccessMessage('송장이 성공적으로 수정되었습니다.');
      setShowSuccess(true);

      // 수정 후 상세 페이지로 이동 (타이머 설정)
      setTimeout(() => {
        navigate(`/invoices/${id}`);
      }, 2000);
    } catch (error) {
      console.error('송장 수정 중 오류 발생:', error);
      setError('송장 수정 중 오류가 발생했습니다.');
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

  // 상태 코드 옵션
  const statusOptions = [
    { value: 'WAITING', label: '대기' },
    { value: 'PAID', label: '지불완료' },
    { value: 'OVERDUE', label: '연체' }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
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
        <DialogTitle>수정 취소</DialogTitle>
        <DialogContent>
          <DialogContentText>
            수정을 취소하시겠습니까? 변경사항이 저장되지 않습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} color="primary">
            계속 수정
          </Button>
          <Button onClick={() => navigate(`/invoices/${id}`)} color="error" autoFocus>
            취소하고 나가기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 상단 네비게이션 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/invoices/${id}`)}
        >
          송장 상세로 돌아가기
        </Button>
        <Typography variant="h4" component="h1">
          송장 수정
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        계약번호, 거래번호, 발행일, 마감일, 비고, 상태 정보만 수정 가능합니다.
      </Alert>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : invoice ? (
        <form onSubmit={handleSubmit}>
          {/* 송장 정보 */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                송장 번호: {invoice.invoiceNumber}
              </Typography>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>상태</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  label="상태"
                  required
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="계약 번호"
                  name="contractNumber"
                  value={formData.contractNumber}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="거래 번호"
                  name="transactionNumber"
                  value={formData.transactionNumber}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    label="발행일"
                    value={formData.issueDate}
                    onChange={(date) => handleDateChange('issueDate', date)}
                    format="YYYY-MM-DD"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: "normal",
                        helperText: "송장 발행일을 선택하세요"
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    label="마감일"
                    value={formData.dueDate}
                    onChange={(date) => handleDateChange('dueDate', date)}
                    format="YYYY-MM-DD"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: "normal",
                        helperText: "송장 지불 마감일을 선택하세요"
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Paper>

          {/* 공급자 정보 (조회만 가능) */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <SectionTitle>공급자 정보</SectionTitle>
            <Divider sx={{ mb: 2 }} />

            <Card variant="outlined" sx={{ bgcolor: "#f9f9f9", mb: 2 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      공급자 ID
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {invoice.userName || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      공급자명
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {invoice.supplierName || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      담당자
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {invoice.supplierContactPerson || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      이메일
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {invoice.supplierEmail || "-"}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Paper>

          {/* 품목 정보 */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <SectionTitle>품목 정보</SectionTitle>
            <Divider sx={{ mb: 2 }} />

            <Card variant="outlined" sx={{ bgcolor: "#f9f9f9", mb: 2 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      품목명
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {invoice.itemName || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      사양
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {invoice.itemSpecification || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      수량
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {invoice.quantity} {invoice.unit || "개"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      단가
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {formatCurrency(invoice.unitPrice)}원
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      공급가액
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {formatCurrency(invoice.supplyPrice)}원
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* 금액 정보 */}
            <SectionTitle>금액 정보</SectionTitle>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      공급가액
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(invoice.supplyPrice)}원
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      부가세 (10%)
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(invoice.vat)}원
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      총액
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(invoice.totalAmount)}원
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* 비고 */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <SectionTitle>비고</SectionTitle>
            <Divider sx={{ mb: 2 }} />
            <TextField
              fullWidth
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              multiline
              rows={4}
              margin="normal"
              helperText="추가 정보가 있으면 입력하세요"
            />
          </Paper>

          {/* 하단 버튼 영역 */}
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              type="submit"
              disabled={saving}
              sx={{ minWidth: 120 }}
            >
              {saving ? <CircularProgress size={24} /> : "저장"}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              sx={{ minWidth: 120 }}
            >
              취소
            </Button>
          </Box>
        </form>
      ) : (
        <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="h6">송장 정보를 찾을 수 없습니다.</Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/invoices')}
            sx={{ mt: 2 }}
          >
            송장 목록으로
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default InvoiceEditPage;