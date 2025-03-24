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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent
} from "@mui/material";
import { styled } from '@mui/material/styles';
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
  const [companyName, setCompanyName] = useState('');
  const [overdueStatus, setOverdueStatus] = useState(false);
  const [supplierInfo, setSupplierInfo] = useState(null);

  // 폼 필드
  const [formData, setFormData] = useState({
    orderNumber: '',
    deliveryNumber: '',
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

  // 송장에 대한 수정 권한 확인
  const canEditInvoice = () => {
    if (!isLoggedIn || !currentUser || !invoice) return false;

    // ADMIN은 항상 가능
    if (isAdmin()) return true;

    // BUYER(구매관리팀)도 가능
    if (isBuyer() && isPurchaseDept()) return true;

    // SUPPLIER는 자신의 회사 송장만 수정 가능
    if (isSupplier()) {
      // 회사명 정규화 (공백 제거 후 소문자 변환)
      const normalizeText = (text) => text?.replace(/\s+/g, '').toLowerCase();
      const normalizedCompanyName = normalizeText(companyName || currentUser.name || currentUser.companyName);
      const normalizedSupplierName = normalizeText(invoice.supplierName);

      // 정규화된 이름으로 비교
      if (normalizedCompanyName && normalizedSupplierName) {
        // 이름이 포함 관계인지 확인 (더 유연한 비교)
        return normalizedSupplierName.includes(normalizedCompanyName) ||
               normalizedCompanyName.includes(normalizedSupplierName);
      }
    }

    return false;
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

      // 폼 데이터 초기화
      setFormData({
        orderNumber: data.orderNumber || '',
        deliveryNumber: data.deliveryNumber || '',
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
  }, [isLoggedIn, currentUser, id]);

  // 데이터 로드 후 권한 체크
  useEffect(() => {
    if (invoice && !loading) {
      // 권한 체크
      if (!canEditInvoice()) {
        setError('송장 수정 권한이 없습니다.');
        setShowError(true);
        // 권한 없으면 상세 페이지로 리다이렉트
        setTimeout(() => {
          navigate(`/invoices/${id}`);
        }, 2000);
      }
    }
  }, [invoice, loading]);

  // 입력값 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    console.log(`필드 ${name} 값 변경: ${value}`);
  };

  // 날짜 변경 핸들러
  const handleDateChange = (name, date) => {
    setFormData({
      ...formData,
      [name]: date
    });
    console.log(`${name} 날짜 변경:`, date.format('YYYY-MM-DD'));
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("폼 제출 시작", formData);

    try {
      setSaving(true);

      // 날짜 형식 변환 (Date -> yyyy-MM-dd)
      const formatDateForApi = (date) => {
        if (!date) return null;
        return date.format('YYYY-MM-DD');
      };

      // API 요청 데이터 준비
      const requestData = {
        orderNumber: formData.orderNumber,
        deliveryNumber: formData.deliveryNumber,
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

      console.log("API 요청 데이터:", requestData);

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
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/invoices/${id}`)}
        >
          송장 상세로 돌아가기
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        발주 번호, 입고 번호, 발행일, 마감일, 비고, 상태 정보만 수정 가능합니다.
      </Alert>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : invoice ? (
        <form onSubmit={handleSubmit}>
          <Box className="invoice-detail-content">
            {/* 송장 제목 및 상태 */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" component="h1">
                  송장 번호 : {invoice.invoiceNumber}
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
              {overdueStatus && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  이 송장은 지불 기한이 지났습니다. 빠른 처리가 필요합니다.
                </Alert>
              )}

              <Box sx={{ display: 'flex', mt: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', mr: 4, alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 500, color: 'text.secondary', mr: 1 }}>담당자:</Typography>
                  <Typography>{invoice.approverName || '-'}</Typography>
                </Box>

                {invoice.approvedAt && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 500, color: 'text.secondary', mr: 1 }}>처리 일시:</Typography>
                    <Typography>{invoice.approvedAt}</Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* 기본 정보 */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <SectionTitle variant="h6">기본 정보</SectionTitle>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <InfoRow>
                    <Typography className="label">발주 번호:</Typography>
                    <TextField
                      fullWidth
                      name="orderNumber"
                      value={formData.orderNumber}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    />
                  </InfoRow>
                  <InfoRow>
                    <Typography className="label">입고 번호:</Typography>
                    <TextField
                      fullWidth
                      name="deliveryNumber"
                      value={formData.deliveryNumber}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    />
                  </InfoRow>
                  <InfoRow>
                    <Typography className="label">결제일:</Typography>
                    <Typography className="value">{invoice.paymentDate || '-'}</Typography>
                  </InfoRow>
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoRow>
                    <Typography className="label">발행일:</Typography>
                    <LocalizationProvider dateAdapter={AdapterMoment}>
                      <DatePicker
                        value={formData.issueDate}
                        onChange={(date) => handleDateChange('issueDate', date)}
                        format="YYYY-MM-DD"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                            variant: "outlined"
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </InfoRow>
                  <InfoRow>
                    <Typography className="label">마감일:</Typography>
                    <LocalizationProvider dateAdapter={AdapterMoment}>
                      <DatePicker
                        value={formData.dueDate}
                        onChange={(date) => handleDateChange('dueDate', date)}
                        format="YYYY-MM-DD"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                            variant: "outlined"
                          },
                        }}
                      />
                    </LocalizationProvider>
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
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                borderRadius: 1,
              }}>
                <Typography variant="body1" sx={{ mr: 3, fontWeight: 500 }}>
                  공급가액: <span style={{ fontWeight: 'normal' }}>{formatCurrency(invoice.supplyPrice)}</span>
                </Typography>
                <Typography variant="body1" sx={{ mr: 3, fontWeight: 500 }}>
                  부가세: <span style={{ fontWeight: 'normal' }}>{formatCurrency(invoice.vat)}</span>
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main' }}>
                  총액: <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{formatCurrency(invoice.totalAmount)}</span>
                </Typography>
              </Box>
            </Paper>

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
                minRows={4}
                maxRows={8}
                placeholder="추가 정보가 있으면 입력하세요"
                margin="normal"
              />
            </Paper>

            {/* 하단 버튼 영역 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
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
