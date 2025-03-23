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
  CardContent,
  Link
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Print as PrintIcon,
  GetApp as DownloadIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';

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

// 결제 상태에 따른 Chip 색상 및 라벨
const getStatusProps = (status) => {
  switch(status) {
    case 'COMPLETED':
      return { color: 'success', label: '결제완료' };
    case '완료':
      return { color: 'success', label: '결제완료' };
    case '실패':
      return { color: 'error', label: '실패' };
    case '취소':
      return { color: 'warning', label: '취소' };
    default:
      return { color: 'default', label: status };
  }
};

// 금액 형식 변환 함수
const formatCurrency = (amount) => {
  if (!amount) return '0원';
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

// 0원 값을 대시(-)로 표시하는 형식 함수
const formatZeroableCurrency = (amount) => {
  if (!amount || amount === 0) {
    return '-';  // 0원 대신 '-' 표시
  }
  return formatCurrency(amount);
};

// 날짜 형식 변환 함수
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return dateString;
};

const PaymentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Redux 상태에서 인증 정보 가져오기
  const auth = useSelector((state) => state.auth);
  const currentUser = auth?.user;
  const isLoggedIn = auth?.isLoggedIn;

  // 상태 관리
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

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

  // 결제에 대한 수정 권한 확인
  const canEditPayment = () => {
    if (!isLoggedIn || !currentUser || !payment) return false;

    // 관리자 또는 재무회계팀만 수정 가능
    if (isAdmin() || isFinanceDept()) return true;

    return false;
  };

  // 결제에 대한 삭제 권한 확인
  const canDeletePayment = () => {
    if (!isLoggedIn || !currentUser || !payment) return false;

    // 관리자 또는 재무회계팀만 삭제 가능
    if (isAdmin() || isFinanceDept()) return true;

    return false;
  };

  // 데이터 로드 함수
  const fetchPayment = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${API_URL}payments/${id}`);

      if (!response.ok) {
        throw new Error(`결제 정보 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('결제 데이터:', data);

      // 관련 인보이스 정보 가져오기
      if (data.invoiceId) {
        try {
          const invoiceResponse = await fetchWithAuth(`${API_URL}invoices/${data.invoiceId}`);
          if (invoiceResponse.ok) {
            const invoiceData = await invoiceResponse.json();
            console.log('송장 데이터:', invoiceData);

            // 송장에서 단가, 수량, 계약번호 등 정보 가져오기
            if (invoiceData) {
              // 단가 정보 가져오기
              if ((!data.unitPrice || data.unitPrice === 0) && invoiceData.unitPrice) {
                data.unitPrice = invoiceData.unitPrice;
              }

              // 수량 정보 가져오기
              if ((!data.quantity || data.quantity === 0) && invoiceData.quantity) {
                data.quantity = invoiceData.quantity;
              }

              // 계약 번호 가져오기
              /* if (!data.contractNumber && invoiceData.contractNumber) {
                data.contractNumber = invoiceData.contractNumber;
              } */
            }
          }
        } catch (invoiceError) {
          console.error('송장 정보를 불러오는 중 오류 발생:', invoiceError);
          // 송장 정보 가져오기 실패해도 결제 정보는 계속 처리
        }
      }

      // 금액 정보 계산
      if (data.totalAmount) {
        // 공급가액이 없거나 0인 경우 계산 (10% 세율 가정)
        if (!data.supplyPrice || data.supplyPrice === 0) {
          data.supplyPrice = Math.round(data.totalAmount / 1.1);
          data.vat = data.totalAmount - data.supplyPrice;
        }
      }

      setPayment(data);
    } catch (error) {
      console.error('결제 정보를 불러오는 중 오류 발생:', error);
      setError('결제 정보를 불러오는 중 오류가 발생했습니다.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (isLoggedIn && currentUser && id) {
      fetchPayment();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, currentUser, id]);

  // 결제 정보 데이터가 업데이트되었을 때 UI를 최적화하는 기능
  useEffect(() => {
    if (payment && payment.totalAmount > 0) {
      // 모든 데이터가 정상적으로 로드됐는지 확인
      const dataComplete = payment.unitPrice && payment.supplyPrice && payment.vat;

      // 데이터가 불완전하면 fetchPayment()를 다시 실행
      if (!dataComplete && !loading) {
        console.log('데이터가 불완전하여 다시 로드합니다.');
        fetchPayment();
      }
    }
  }, [payment]);

  // 결제 삭제 함수
  const handleDeletePayment = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${API_URL}payments/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`결제 삭제 실패: ${response.status}`);
      }

      setSuccessMessage('결제 정보가 성공적으로 삭제되었습니다.');
      setShowSuccess(true);

      // 삭제 후 목록 페이지로 이동 (타이머 설정)
      setTimeout(() => {
        navigate('/payments');
      }, 2000);
    } catch (error) {
      console.error('결제 삭제 중 오류 발생:', error);
      setError('결제 삭제 중 오류가 발생했습니다.');
      setShowError(true);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  // 인쇄 함수
  const handlePrint = () => {
    // 1. 원본 내용 저장
    const originalBody = document.body.innerHTML;

    // 2. 결제 내용만 추출
    const paymentContent = document.querySelector('.payment-detail-content');

    // 3. 인쇄에 필요한 내용만 body에 설정
    if (paymentContent && payment) {
      // 내용 복제
      const contentClone = paymentContent.cloneNode(true);

      // 버튼 컨테이너 삭제 (마지막 Box 요소)
      const buttonContainer = contentClone.querySelector('.MuiBox-root:last-child');
      if (buttonContainer) {
        buttonContainer.remove();
      }

      // 모든 버튼 제거
      const buttons = contentClone.querySelectorAll('button, .MuiButton-root');
      buttons.forEach(button => button.remove());

      // 필요한 스타일 추가 - 한 페이지에 맞도록 최적화
      const printStyles = `
        <style>
          @page {
            size: A4;
            margin: 1.5cm;
          }

          body {
            padding: 0;
            margin: 0;
            font-family: Arial, sans-serif;
            font-size: 12px;
            width: 100%;
            box-sizing: border-box;
          }

          .payment-detail-content {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          /* 첫 번째 Paper 요소 제거 */
          .payment-detail-content > .MuiPaper-root:first-child {
            display: none !important;
          }

          .MuiPaper-root {
            padding: 15px !important;
            margin-bottom: 20px !important;
            page-break-inside: avoid !important;
            border: 1px solid #ddd !important;
            box-shadow: none !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          h1, h2, h3, h4, h5, h6, .MuiTypography-h5, .MuiTypography-h6 {
            margin: 10px 0 !important;
            font-size: 14px !important;
            font-weight: bold !important;
          }

          .MuiDivider-root {
            margin: 10px 0 !important;
            width: 100% !important;
          }

          .MuiGrid-container {
            margin: 0 !important;
            width: 100% !important;
            display: flex !important;
            flex-wrap: wrap !important;
          }

          .MuiGrid-item {
            padding: 8px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          .MuiGrid-item[class*="MuiGrid-grid-md-6"] {
            width: 50% !important;
            flex-basis: 50% !important;
            max-width: 50% !important;
          }

          .MuiGrid-item[class*="MuiGrid-grid-md-8"] {
            width: 66.666% !important;
            flex-basis: 66.666% !important;
            max-width: 66.666% !important;
            margin: 0 auto !important;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 12px !important;
          }

          th, td {
            padding: 5px 8px !important;
            border: 1px solid #ddd !important;
            font-size: 12px !important;
            line-height: 1.3 !important;
            font-weight: normal !important;
          }

          td[align="center"] {
            text-align: center !important;
          }

          td[style*="font-weight: bold"] {
            font-weight: bold !important;
            font-size: 12px !important;
          }

          .label, .value {
            font-size: 12px !important;
            margin: 5px 0 !important;
            line-height: 1.5 !important;
            display: inline-block !important;
          }

          .label {
            width: 30% !important;
            vertical-align: top !important;
          }

          .value {
            width: 70% !important;
            vertical-align: top !important;
          }

          p, span, div {
            margin: 3px 0 !important;
            line-height: 1.4 !important;
          }

          button, .MuiButton-root, .print-hide {
            display: none !important;
          }

          .MuiChip-root {
            display: inline-block !important;
            height: auto !important;
            padding: 2px 10px !important;
            background-color: #e0e0e0 !important;
            border-radius: 16px !important;
            margin: 2px 0 !important;
          }

          .MuiChip-root[color="success"] {
            background-color: #c8e6c9 !important;
            color: #2e7d32 !important;
          }

          .MuiChip-root[color="error"] {
            background-color: #ffcdd2 !important;
            color: #c62828 !important;
          }

          .MuiChip-root[color="warning"] {
            background-color: #fff9c4 !important;
            color: #f57f17 !important;
          }

          .MuiChip-label {
            padding: 0 !important;
            font-size: 12px !important;
          }

          .print-header {
            display: block !important;
            margin-bottom: 20px !important;
            text-align: center !important;
            font-size: 18px !important;
            font-weight: bold !important;
            border-bottom: 2px solid #000 !important;
            padding-bottom: 10px !important;
          }

          .print-footer {
            display: block !important;
            margin-top: 30px !important;
            text-align: center !important;
            font-size: 10px !important;
            color: #666 !important;
            border-top: 1px solid #ddd !important;
            padding-top: 10px !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        </style>
      `;

      // 인쇄 헤더와 푸터 추가
      const printHeader = `
        <div class="print-header">
          거래 ID: ${payment.transactionId || '-'}
        </div>
      `;

      const printFooter = `
        <div class="print-footer">
          <div>인쇄일자: ${new Date().toLocaleDateString()} | ORBIT 구매 관리 시스템</div>
        </div>
      `;

      // 순수 HTML로 교체 (헤더, 내용, 푸터 순서로 구성)
      document.body.innerHTML = printStyles + printHeader + contentClone.outerHTML + printFooter;
    }

    // 4. 인쇄 실행
    window.print();

    // 5. 원래 내용 복원
    setTimeout(() => {
      document.body.innerHTML = originalBody;
      window.location.reload(); // 완전한 상태 복원을 위해 페이지 새로고침
    }, 500);
  };

  // 메시지 닫기 핸들러
  const handleCloseError = () => {
    setShowError(false);
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }} id="payment-detail-container">
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
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>결제 삭제 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            이 결제 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 관련 송장의 상태가 '대기'로 변경됩니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            취소
          </Button>
          <Button onClick={handleDeletePayment} color="error" autoFocus>
            삭제
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
      ) : payment ? (
        <Box className="payment-detail-content">
          {/* 결제 제목 및 상태 */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" component="h1">
                  거래 번호 : {payment.transactionId || '-'}
                </Typography>
              </Box>
              <Chip
                label={getStatusProps(payment.paymentStatus).label}
                color={getStatusProps(payment.paymentStatus).color}
                size="medium"
                sx={{ fontSize: '1rem', fontWeight: 'bold' }}
              />
            </Box>
          </Paper>

          {/* 결제 정보 */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <SectionTitle variant="h6">결제 정보</SectionTitle>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <InfoRow>
                  <Typography className="label">결제 방법:</Typography>
                  <Typography className="value">{payment.paymentMethod}</Typography>
                </InfoRow>
                <InfoRow>
                  <Typography className="label">결제일:</Typography>
                  <Typography className="value">{formatDate(payment.paymentDate)}</Typography>
                </InfoRow>
                <InfoRow>
                  <Typography className="label">생성일:</Typography>
                  <Typography className="value">{payment.createdAt}</Typography>
                </InfoRow>
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoRow>
                  <Typography className="label">상태:</Typography>
                  <Typography className="value" sx={{ fontWeight: 'bold' }}>
                    {getStatusProps(payment.paymentStatus).label}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography className="label">결제 금액:</Typography>
                  <Typography className="value" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(payment.totalAmount)}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography className="label">최종 수정일:</Typography>
                  <Typography className="value">{payment.updatedAt}</Typography>
                </InfoRow>
              </Grid>
            </Grid>
          </Paper>

          {/* 송장 정보 */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <SectionTitle variant="h6">송장 정보</SectionTitle>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ReceiptIcon />}
                onClick={() => navigate(`/invoices/${payment.invoiceId}`)}
              >
                송장 상세보기
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <InfoRow>
                  <Typography className="label">송장 번호:</Typography>
                  <Typography className="value">{payment.invoiceNumber}</Typography>
                </InfoRow>
                <InfoRow>
                  <Typography className="label">공급업체:</Typography>
                  <Typography className="value">{payment.supplierName}</Typography>
                </InfoRow>

              </Grid>
              <Grid item xs={12} md={6}>
                {/* <InfoRow>
                  <Typography className="label">계약 번호:</Typography>
                  <Typography className="value">{payment.contractNumber || '-'}</Typography>
                </InfoRow> */}
                <InfoRow>
                  <Typography className="label">주문 번호:</Typography>
                  <Typography className="value">{payment.orderNumber || '-'}</Typography>
                </InfoRow>
                <InfoRow>
                  <Typography className="label">품목:</Typography>
                  <Typography className="value">{payment.itemName}</Typography>
                </InfoRow>
                <InfoRow>
                  <Typography className="label">수량:</Typography>
                  <Typography className="value">
                    {payment.quantity} {payment.unit || '개'}
                  </Typography>
                </InfoRow>
              </Grid>
            </Grid>
          </Paper>

          {/* 금액 정보 */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <SectionTitle variant="h6">금액 정보</SectionTitle>
            <Divider sx={{ mb: 2 }} />

            <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell align="center">단가</TableCell>
                    <TableCell align="center">공급가액</TableCell>
                    <TableCell align="center">부가세</TableCell>
                    <TableCell align="center">총액</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell align="center">{formatZeroableCurrency(payment.unitPrice)}</TableCell>
                    <TableCell align="center">{formatZeroableCurrency(payment.supplyPrice)}</TableCell>
                    <TableCell align="center">{formatZeroableCurrency(payment.vat)}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 'inherit' }}>{formatCurrency(payment.totalAmount)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* 결제 메모 */}
          {payment.notes && (
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <SectionTitle variant="h6">메모</SectionTitle>
              <Divider sx={{ mb: 2 }} />
              <Typography>{payment.notes}</Typography>
            </Paper>
          )}

          {/* 하단 버튼 영역 */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap', mt: 3 }}>
            <Button
              variant="text"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ color: 'text.primary' }}
            >
              인쇄
            </Button>
            {canDeletePayment() && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                삭제
              </Button>
            )}
          </Box>
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="h6">결제 정보를 찾을 수 없습니다.</Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/payments')}
            sx={{ mt: 2 }}
          >
            결제 목록으로
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default PaymentDetailPage;