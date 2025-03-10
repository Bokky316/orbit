import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Paper, Grid, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Divider,
  Stepper, Step, StepLabel, Card, CardContent, Alert,
  Snackbar
} from '@mui/material';
import {
  PaymentOutlined,
  AccountBalanceOutlined,
  CreditCardOutlined,
  ReceiptOutlined,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

// 목데이터 import - 실제 구현에서는 API로 대체
import { mockInvoices } from '../invoice/generateMockInvoices';

// 금액 형식 변환 함수
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

const PaymentProcessPage = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [invoice, setInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    accountNumber: '',
    bankName: '',
    notes: ''
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // 실제 구현에서는 API로 송장 정보를 가져옴
  useEffect(() => {
    // fetchInvoiceById(invoiceId).then(data => setInvoice(data));
    // 목데이터 사용
    const mockInvoice = mockInvoices.find(inv => inv.id === invoiceId);
    setInvoice(mockInvoice);
  }, [invoiceId]);

  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value);
  };

  const handlePaymentDetailChange = (field, value) => {
    setPaymentDetails({
      ...paymentDetails,
      [field]: value
    });
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // 스낵바 표시 함수
  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // 스낵바 닫기 핸들러
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleSubmitPayment = () => {
    // 실제 구현에서는 API로 결제 정보 제출
    // const paymentData = {
    //   invoice_id: invoice.id,
    //   total_amount: invoice.totalAmount,
    //   payment_date: new Date().toISOString().split('T')[0],
    //   payment_method: convertPaymentMethod(paymentMethod),
    //   payment_status: '완료',
    //   transaction_id: generateTransactionId(),
    //   notes: paymentDetails.notes
    // };
    //
    // submitPayment(paymentData).then(response => {
    //   if (response.success) handleNext();
    // });

    // 목데이터 처리
    setTimeout(() => {
      handleNext();
      // 상태 업데이트 로직 (실제로는 API 호출 후 응답에 따라 처리)
      // const updatedInvoices = invoices.map(inv =>
      //   inv.id === invoice.id
      //     ? { ...inv, status: STATUS_TYPES.PAID, paymentDate: new Date().toISOString().split('T')[0] }
      //     : inv
      // );
      // setInvoices(updatedInvoices);
    }, 1500);
  };

  // 결제 방법 변환 (UI 표시값 -> DB 저장값)
  const convertPaymentMethod = (method) => {
    switch(method) {
      case 'bankTransfer': return '계좌이체';
      case 'creditCard': return '카드';
      case 'check': return '수표';
      default: return '계좌이체';
    }
  };

  // 거래 ID 생성
  const generateTransactionId = () => {
    const timestamp = new Date().getTime().toString().substring(0, 10);
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `TRX-${timestamp}-${random}`;
  };

  const handleFinish = () => {
    navigate('/payments');
  };

  const handleBackToInvoices = () => {
    navigate('/invoices');
  };

  const steps = [
    '결제 방법 선택',
    '결제 정보 입력',
    '결제 확인',
    '결제 완료'
  ];

  // 결제 단계별 컨텐츠 렌더링
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              결제 방법을 선택하세요
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>결제 방법</InputLabel>
              <Select
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
                label="결제 방법"
              >
                <MenuItem value="creditCard">카드</MenuItem>
                <MenuItem value="bankTransfer">계좌이체</MenuItem>
                <MenuItem value="check">수표</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              결제 정보 입력
            </Typography>
            {paymentMethod === 'creditCard' && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="카드 번호"
                    value={paymentDetails.cardNumber}
                    onChange={(e) => handlePaymentDetailChange('cardNumber', e.target.value)}
                    fullWidth
                    inputProps={{ maxLength: 19 }}
                    placeholder="1234 5678 9012 3456"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="유효기간"
                    value={paymentDetails.expiryDate}
                    onChange={(e) => handlePaymentDetailChange('expiryDate', e.target.value)}
                    fullWidth
                    placeholder="MM/YY"
                    inputProps={{ maxLength: 5 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="CVV"
                    value={paymentDetails.cvv}
                    onChange={(e) => handlePaymentDetailChange('cvv', e.target.value)}
                    fullWidth
                    type="password"
                    inputProps={{ maxLength: 3 }}
                  />
                </Grid>
              </Grid>
            )}

            {paymentMethod === 'bankTransfer' && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="은행명"
                    value={paymentDetails.bankName}
                    onChange={(e) => handlePaymentDetailChange('bankName', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="계좌번호"
                    value={paymentDetails.accountNumber}
                    onChange={(e) => handlePaymentDetailChange('accountNumber', e.target.value)}
                    fullWidth
                  />
                </Grid>
              </Grid>
            )}

            {paymentMethod === 'check' && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="수표 발행 은행"
                    value={paymentDetails.bankName}
                    onChange={(e) => handlePaymentDetailChange('bankName', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="수표 번호"
                    value={paymentDetails.checkNumber}
                    onChange={(e) => handlePaymentDetailChange('checkNumber', e.target.value)}
                    fullWidth
                  />
                </Grid>
              </Grid>
            )}

            {/* 모든 결제 방법에 공통으로 표시되는 메모 필드 */}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="결제 메모"
                  value={paymentDetails.notes}
                  onChange={(e) => handlePaymentDetailChange('notes', e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="결제와 관련된 메모를 입력하세요. (선택사항)"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              결제 정보 확인
            </Typography>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary">
                  송장 번호
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {invoice?.invoiceNumber}
                </Typography>

                <Typography variant="subtitle2" color="textSecondary">
                  공급자
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {invoice?.supplier.name}
                </Typography>

                <Typography variant="subtitle2" color="textSecondary">
                  결제 금액
                </Typography>
                <Typography variant="h6" color="primary" gutterBottom>
                  {invoice ? formatCurrency(invoice.totalAmount) : ''}
                </Typography>

                <Typography variant="subtitle2" color="textSecondary">
                  결제 방법
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {paymentMethod === 'creditCard' ? '카드' :
                   paymentMethod === 'bankTransfer' ? '계좌이체' : '수표'}
                </Typography>

                {paymentMethod === 'creditCard' && (
                  <>
                    <Typography variant="subtitle2" color="textSecondary">
                      카드 정보
                    </Typography>
                    <Typography variant="body1">
                      {`${paymentDetails.cardNumber.substring(0, 4)} **** **** ${paymentDetails.cardNumber.substring(paymentDetails.cardNumber.length - 4)}`}
                    </Typography>
                  </>
                )}

                {paymentMethod === 'bankTransfer' && (
                  <>
                    <Typography variant="subtitle2" color="textSecondary">
                      은행 정보
                    </Typography>
                    <Typography variant="body1">
                      {`${paymentDetails.bankName} ${paymentDetails.accountNumber}`}
                    </Typography>
                  </>
                )}

                {paymentMethod === 'check' && (
                  <>
                    <Typography variant="subtitle2" color="textSecondary">
                      수표 정보
                    </Typography>
                    <Typography variant="body1">
                      {`${paymentDetails.bankName} / 수표번호: ${paymentDetails.checkNumber}`}
                    </Typography>
                  </>
                )}

                {paymentDetails.notes && (
                  <>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>
                      메모
                    </Typography>
                    <Typography variant="body1">
                      {paymentDetails.notes}
                    </Typography>
                  </>
                )}

                <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>
                  결제일
                </Typography>
                <Typography variant="body1">
                  {new Date().toLocaleDateString('ko-KR')}
                </Typography>
              </CardContent>
            </Card>
            <Alert severity="warning">
              결제를 진행하시면 취소할 수 없습니다. 정보를 확인 후 결제를 진행하세요.
            </Alert>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h5" color="primary" gutterBottom>
              결제가 완료되었습니다!
            </Typography>
            <Typography variant="body1" paragraph>
              송장 번호: {invoice?.invoiceNumber}에 대한 결제가 성공적으로 처리되었습니다.
            </Typography>
            <Typography variant="body2" color="textSecondary">
              거래 ID: {generateTransactionId()}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              결제 확인은 결제 내역에서 확인하실 수 있습니다.
            </Typography>
          </Box>
        );

      default:
        return '알 수 없는 단계';
    }
  };

  if (!invoice) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>송장을 불러오는 중...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToInvoices}
          sx={{ mr: 2 }}
        >
          송장 목록
        </Button>
        <Typography variant="h4">
          송장 결제
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1" color="textSecondary">
                송장 번호: {invoice.invoiceNumber}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                공급자: {invoice.supplier.name}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Typography variant="h6" color="primary">
                결제 금액: {formatCurrency(invoice.totalAmount)}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 4, mb: 4 }}>
          {getStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0 || activeStep === steps.length - 1}
            onClick={handleBack}
          >
            이전
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleFinish}
              >
                결제 내역으로 이동
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={activeStep === steps.length - 2 ? handleSubmitPayment : handleNext}
                disabled={
                  (activeStep === 0 && !paymentMethod) ||
                  (activeStep === 1 && (
                    (paymentMethod === 'creditCard' &&
                     (!paymentDetails.cardNumber ||
                      !paymentDetails.expiryDate ||
                      !paymentDetails.cvv)) ||
                    (paymentMethod === 'bankTransfer' &&
                     (!paymentDetails.bankName ||
                      !paymentDetails.accountNumber)) ||
                    (paymentMethod === 'check' &&
                     (!paymentDetails.bankName ||
                      !paymentDetails.checkNumber))
                  ))
                }
              >
                {activeStep === steps.length - 2 ? '결제하기' : '다음'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* 알림 스낵바 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PaymentProcessPage;