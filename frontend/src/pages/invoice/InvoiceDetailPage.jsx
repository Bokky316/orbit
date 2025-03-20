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
import {
  Print as PrintIcon,
  GetApp as DownloadIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon
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

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Redux 상태에서 인증 정보 가져오기
  const auth = useSelector((state) => state.auth);
  const currentUser = auth?.user;
  const isLoggedIn = auth?.isLoggedIn;

  // 상태 관리
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [overdueStatus, setOverdueStatus] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [supplierInfo, setSupplierInfo] = useState(null);

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

  // username이 001로 시작하는지 확인 (구매관리팀)
  const isPurchaseDept = () => {
    if (!currentUser?.username) return false;
    return currentUser.username.startsWith('001');
  };

  // 회사명 찾기
  const findCompanyName = () => {
    if (!currentUser) return '';

    // 공급업체 역할인 경우 회사명 추출
    if (isSupplier()) {
      // 공급업체명을 찾을 수 있는 가능한 속성 확인
      const company = currentUser.companyName ||
                     currentUser.company ||
                     currentUser.supplierName;

      // 회사명이 이미 있으면 사용
      if (company) {
        console.log('회사명 찾음 (속성):', company);
        return company;
      }

      // 이름에서 추출 (예: '공급사 1 담당자' -> '공급사 1')
      if (currentUser.name) {
        // 이름에서 '공급사 N' 패턴 추출
        const nameMatch = currentUser.name.match(/(공급사\s*\d+)/);
        if (nameMatch) {
          console.log('회사명 찾음 (이름 패턴):', nameMatch[1]);
          return nameMatch[1];
        }

        // 이름이 공급사명인 경우 (예: '공급사 1')
        if (currentUser.name.trim().startsWith('공급사')) {
          console.log('회사명 찾음 (이름):', currentUser.name);
          return currentUser.name.trim();
        }
      }

      // 그래도 못 찾았다면, 이름 자체를 그대로 사용
      if (currentUser.name) {
        console.log('회사명으로 이름 사용:', currentUser.name);
        return currentUser.name;
      }
    }

    return '';
  };

  // 회사명 설정
  useEffect(() => {
    if (currentUser && isSupplier()) {
      const company = findCompanyName();
      setCompanyName(company);
      console.log('공급업체명 설정:', company);
    }
  }, [currentUser]);

  // 송장에 저장된 공급자 정보를 사용합니다.
  // 별도의 API 호출이 필요 없음

  // 송장에 대한 수정 권한 확인
  const canEditInvoice = () => {
    if (!isLoggedIn || !currentUser || !invoice) return false;

    // 오직 SUPPLIER만 수정 가능하고, 자신의 회사 송장만 수정 가능
    if (isSupplier()) {
      // 회사명 기준으로 확인
      if (companyName && invoice.supplierName === companyName) {
        return true;
      }

      // 그 외에는 이름 기반으로 확인
      return invoice.supplierName === currentUser.companyName ||
             invoice.supplierName.includes(currentUser.name);
    }

    return false;
  };

  // 송장에 대한 삭제 권한 확인
  const canDeleteInvoice = () => {
    if (!isLoggedIn || !currentUser || !invoice) return false;

    // 대기 상태의 송장만 삭제 가능
    if (invoice.status !== 'WAITING') return false;

    // 오직 SUPPLIER만 삭제 가능하고, 자신의 회사 송장만 삭제 가능
    if (isSupplier()) {
      // 회사명 기준으로 확인
      if (companyName && invoice.supplierName === companyName) {
        return true;
      }

      // 그 외에는 이름 기반으로 확인
      return invoice.supplierName === currentUser.companyName ||
             invoice.supplierName.includes(currentUser.name);
    }

    return false;
  };

  // 송장 승인/거부 권한 확인
  const canApproveOrRejectInvoice = () => {
    if (!isLoggedIn || !currentUser || !invoice) return false;

    // 대기 상태의 송장만 승인/거부 가능
    if (invoice.status !== 'WAITING') return false;

    // ADMIN은 항상 가능
    if (isAdmin()) return true;

    // BUYER(구매관리팀)도 가능
    if (isBuyer() && isPurchaseDept()) return true;

    // 일반 BUYER도 가능
    if (isBuyer()) return true;

    return false;
  };

  // 송장 승인 함수
  const handleApproveInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${API_URL}invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'APPROVED'
        })
      });

      if (!response.ok) {
        throw new Error(`송장 승인 실패: ${response.status}`);
      }

      const updatedInvoice = await response.json();
      setInvoice(updatedInvoice);
      setSuccessMessage('송장이 성공적으로 승인되었습니다.');
      setShowSuccess(true);
    } catch (error) {
      console.error('송장 승인 중 오류 발생:', error);
      setError('송장 승인 중 오류가 발생했습니다.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  // 송장 거부 함수
  const handleRejectInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${API_URL}invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'REJECTED'
        })
      });

      if (!response.ok) {
        throw new Error(`송장 거부 실패: ${response.status}`);
      }

      const updatedInvoice = await response.json();
      setInvoice(updatedInvoice);
      setSuccessMessage('송장이 거부되었습니다.');
      setShowSuccess(true);
    } catch (error) {
      console.error('송장 거부 중 오류 발생:', error);
      setError('송장 거부 중 오류가 발생했습니다.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
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

      // 송장 데이터에서 공급자 정보 설정
      setupSupplierInfo(data);

      // 연체 여부 확인
      if (data.status === 'OVERDUE') {
        setOverdueStatus(true);
      }
    } catch (error) {
      console.error('송장 정보를 불러오는 중 오류 발생:', error);
      setError('송장 정보를 불러오는 중 오류가 발생했습니다.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  // 송장 데이터에서 공급자 정보 설정
  const setupSupplierInfo = (invoiceData) => {
    if (!invoiceData) return;

    setSupplierInfo({
      userName: invoiceData.userName || '-',
      supplierName: invoiceData.supplierName || '-',
      supplierContactPerson: invoiceData.supplierContactPerson || '-',
      supplierEmail: invoiceData.supplierEmail || '-',
      supplierPhone: invoiceData.supplierPhone || '-',
      supplierAddress: invoiceData.supplierAddress || '-'
    });
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (isLoggedIn && currentUser && id) {
      fetchInvoice();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, currentUser, id]);

  // 송장 삭제 함수
  const handleDeleteInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${API_URL}invoices/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`송장 삭제 실패: ${response.status}`);
      }

      setSuccessMessage('송장이 성공적으로 삭제되었습니다.');
      setShowSuccess(true);

      // 삭제 후 목록 페이지로 이동 (타이머 설정)
      setTimeout(() => {
        navigate('/invoices');
      }, 2000);
    } catch (error) {
      console.error('송장 삭제 중 오류 발생:', error);
      setError('송장 삭제 중 오류가 발생했습니다.');
      setShowError(true);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  // 인쇄 함수 - 완전히 개선된 버전
  const handlePrint = () => {
    // 1. 원본 내용 저장
    const originalBody = document.body.innerHTML;

    // 2. 송장 내용만 추출
    const invoiceContent = document.querySelector('.invoice-detail-content');

    // 3. 인쇄에 필요한 내용만 body에 설정
    if (invoiceContent && invoice) {
      // 내용 복제
      const contentClone = invoiceContent.cloneNode(true);

      // 버튼 컨테이너 삭제 (마지막 Box 요소)
      const buttonContainer = contentClone.querySelector('.MuiBox-root:last-child');
      if (buttonContainer) {
        buttonContainer.remove();
      }

      // 모든 버튼 제거
      const buttons = contentClone.querySelectorAll('button, .MuiButton-root');
      buttons.forEach(button => button.remove());

      // 아래쪽 금액 박스 3개 컨테이너를 찾습니다.
      const amountBoxesContainer = contentClone.querySelectorAll('.MuiPaper-root')[4];

      // 금액 정보를 추출합니다.
      const supplyPrice = invoice.supplyPrice;
      const vat = invoice.vat;
      const totalAmount = invoice.totalAmount;

      // 간소화된 금액 요약 HTML 생성
      const simplifiedAmountHTML = `
        <div style="margin-top: 12px; border: 1px solid #ddd; padding: 10px; background-color: #f9f9f9;">
          <div style="display: flex; justify-content: flex-end; align-items: center; font-size: 14px;">
            <div style="margin-right: 20px;">
              <span style="font-weight: bold; margin-right: 10px;">공급가액:</span>
              <span>${formatCurrency(supplyPrice)}</span>
            </div>
            <div style="margin-right: 20px;">
              <span style="font-weight: bold; margin-right: 10px;">부가세:</span>
              <span>${formatCurrency(vat)}</span>
            </div>
            <div>
              <span style="font-weight: bold; margin-right: 10px; color: #1976d2;">총액:</span>
              <span style="font-weight: bold; font-size: 16px; color: #1976d2;">${formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
      `;

      // 기존 금액 박스를 새로운 간소화된 버전으로 교체
      if (amountBoxesContainer) {
        amountBoxesContainer.outerHTML = simplifiedAmountHTML;
      }

      // 필요한 스타일 추가 - 한 페이지에 맞도록 최적화
      const printStyles = `
        <style>
          @page {
            size: A4;
            margin: 1cm; /* 여백 적당히 유지 */
          }

          body {
            padding: 0;
            margin: 0;
            font-family: Arial, sans-serif;
            font-size: 12px; /* 기본 폰트 크기 키움 */
          }

          /* 컨테이너 최적화 */
          .invoice-detail-content {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }

          /* 페이퍼 컴포넌트 여백 최적화 */
          .MuiPaper-root {
            padding: 12px !important;
            margin-bottom: 12px !important;
            page-break-inside: avoid !important;
            border: 1px solid #ddd !important;
            box-shadow: none !important;
          }

          /* 제목 및 섹션 타이틀 조정 */
          h1, h2, h3, h4, h5, h6, .MuiTypography-h5, .MuiTypography-h6 {
            margin: 8px 0 !important;
            font-size: 14px !important;
            font-weight: bold !important;
          }

          .MuiTypography-h4 {
            font-size: 16px !important;
          }

          /* Divider 간격 최적화 */
          .MuiDivider-root {
            margin: 8px 0 !important;
          }

          /* 그리드 간격 최적화 */
          .MuiGrid-container {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }

          .MuiGrid-item {
            padding: 6px !important;
          }

          /* 인포 행 최적화 */
          .label, .value {
            font-size: 12px !important;
            margin: 3px 0 !important;
            line-height: 1.5 !important;
          }

          /* 테이블 최적화 */
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
          }

          /* 카드 스타일 최적화 */
          .MuiCard-root {
            border: 1px solid #ddd !important;
            box-shadow: none !important;
          }

          .MuiCardContent-root {
            padding: 10px !important;
          }

          /* 항목 내 간격 축소 */
          p, span, div {
            margin: 2px 0 !important;
            line-height: 1.4 !important;
          }

          /* 버튼과 불필요한 요소 숨기기 */
          button, .MuiButton-root, .print-hide {
            display: none !important;
          }

          /* 칩 스타일 조정 */
          .MuiChip-root {
            height: auto !important;
            padding: 3px !important;
          }

          .MuiChip-label {
            padding: 3px !important;
            font-size: 12px !important;
          }

          /* 인쇄 헤더 추가 */
          .print-header {
            display: block !important;
            margin-bottom: 10px !important;
            text-align: center !important;
            font-size: 18px !important;
            font-weight: bold !important;
            border-bottom: 2px solid #000 !important;
            padding-bottom: 10px !important;
          }

          /* 인쇄 푸터 추가 */
          .print-footer {
            display: block !important;
            margin-top: 20px !important;
            text-align: center !important;
            font-size: 10px !important;
            color: #666 !important;
            border-top: 1px solid #ddd !important;
            padding-top: 10px !important;
          }

          /* 배경색 유지 */
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
          송장 번호: ${invoice.invoiceNumber}
        </div>
      `;

      const printFooter = `
        <div class="print-footer">
          인쇄일자: ${new Date().toLocaleDateString()} | ORBIT 구매 관리 시스템
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }} id="invoice-detail-container">
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
        <DialogTitle>송장 삭제 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            이 송장을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            취소
          </Button>
          <Button onClick={handleDeleteInvoice} color="error" autoFocus>
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* 상단 네비게이션 - 목록으로 버튼만 남기고 나머지 버튼은 하단으로 이동 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/invoices')}
        >
          목록으로
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : invoice ? (
        <Box className="invoice-detail-content">
          {/* 송장 제목 및 상태 */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" component="h1">
                송장 번호 : {invoice.invoiceNumber}
              </Typography>
              <Chip
                label={getStatusProps(invoice.status).label}
                color={getStatusProps(invoice.status).color}
                size="medium"
                sx={{ fontSize: '1rem', fontWeight: 'bold' }}
              />
            </Box>
            {overdueStatus && (
              <Alert severity="error" sx={{ mt: 2 }}>
                이 송장은 지불 기한이 지났습니다. 빠른 처리가 필요합니다.
              </Alert>
            )}
          </Paper>

          {/* 기본 정보 */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <SectionTitle variant="h6">기본 정보</SectionTitle>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <InfoRow>
                  <Typography className="label">발주 번호:</Typography>
                  <Typography className="value">{invoice.orderNumber || '-'}</Typography>
                </InfoRow>
                <InfoRow>
                  <Typography className="label">입고 번호:</Typography>
                  <Typography className="value">{invoice.deliveryNumber || '-'}</Typography>
                </InfoRow>
                <InfoRow>
                  <Typography className="label">결제일:</Typography>
                  <Typography className="value">{invoice.paymentDate || '-'}</Typography>
                </InfoRow>
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoRow>
                  <Typography className="label">발행일:</Typography>
                  <Typography className="value">{invoice.issueDate}</Typography>
                </InfoRow>
                <InfoRow>
                  <Typography className="label">마감일:</Typography>
                  <Typography className="value">{invoice.dueDate}</Typography>
                </InfoRow>

                <InfoRow>
                  <Typography className="label">연체 일수:</Typography>
                  <Typography className="value" color={overdueStatus ? 'error' : 'inherit'}>
                    {overdueStatus ? '48일' : '-'}
                  </Typography>
                </InfoRow>
              </Grid>
            </Grid>
          </Paper>

          {/* 공급자 정보 */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <SectionTitle variant="h6">공급자 정보</SectionTitle>
            <Divider sx={{ mb: 2 }} />

            {(
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <InfoRow>
                    <Typography className="label">공급자 ID:</Typography>
                    <Typography className="value">{supplierInfo?.userName || '-'}</Typography>
                  </InfoRow>
                  <InfoRow>
                    <Typography className="label">공급자명:</Typography>
                    <Typography className="value">{supplierInfo?.supplierName || '-'}</Typography>
                  </InfoRow>
                  <InfoRow>
                    <Typography className="label">담당자:</Typography>
                    <Typography className="value">{supplierInfo?.supplierContactPerson || '-'}</Typography>
                  </InfoRow>
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoRow>
                    <Typography className="label">이메일:</Typography>
                    <Typography className="value">{supplierInfo?.supplierEmail || '-'}</Typography>
                  </InfoRow>
                  <InfoRow>
                    <Typography className="label">전화번호:</Typography>
                    <Typography className="value">{supplierInfo?.supplierPhone || '-'}</Typography>
                  </InfoRow>
                  <InfoRow>
                    <Typography className="label">주소:</Typography>
                    <Typography className="value">
                      {(supplierInfo?.supplierAddress && supplierInfo.supplierAddress.trim() !== '')
                        ? supplierInfo.supplierAddress
                        : '등록된 주소 정보가 없습니다.'}
                    </Typography>
                  </InfoRow>
                </Grid>
              </Grid>
            )}
          </Paper>

          {/* 품목 정보 */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <SectionTitle variant="h6">품목 정보</SectionTitle>
            <Divider sx={{ mb: 2 }} />

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>품목명</TableCell>
                    <TableCell>수량</TableCell>
                    <TableCell>단가</TableCell>
                    <TableCell>공급가액</TableCell>
                    <TableCell>부가세</TableCell>
                    <TableCell>총액</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      {invoice.itemName}
                      {invoice.itemSpecification && (
                        <Typography variant="caption" display="block" color="textSecondary">
                          {invoice.itemSpecification}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{invoice.quantity} {invoice.unit || '개'}</TableCell>
                    <TableCell>{formatCurrency(invoice.unitPrice)}</TableCell>
                    <TableCell>{formatCurrency(invoice.supplyPrice)}</TableCell>
                    <TableCell>{formatCurrency(invoice.vat)}</TableCell>
                    <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* 금액 요약 */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      공급가액
                    </Typography>
                    <Typography variant="h5">{formatCurrency(invoice.supplyPrice)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      부가세
                    </Typography>
                    <Typography variant="h5">{formatCurrency(invoice.vat)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      총액
                    </Typography>
                    <Typography variant="h4">{formatCurrency(invoice.totalAmount)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* 비고 */}
          {invoice.notes && (
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <SectionTitle variant="h6">비고</SectionTitle>
              <Divider sx={{ mb: 2 }} />
              <Typography>{invoice.notes}</Typography>
            </Paper>
          )}

          {/* 하단 버튼 영역 */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap:1, flexWrap: 'wrap', mt: 3 }}>
              <Button
                variant="text"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{ color: 'text.primary' }}
              >
                인쇄
              </Button>
              {canApproveOrRejectInvoice() && (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleApproveInvoice}
                  >
                    승인
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleRejectInvoice}
                  >
                    거부
                  </Button>
                </>
              )}
              {canEditInvoice() && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/invoices/edit/${id}`)}
                >
                  수정
                </Button>
              )}
              {canDeleteInvoice() && (
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

export default InvoiceDetailPage;