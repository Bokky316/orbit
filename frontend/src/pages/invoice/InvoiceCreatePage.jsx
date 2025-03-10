import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Breadcrumbs,
  Link,
  Autocomplete
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';

// 목데이터 import
import { mockInvoices, contracts, suppliers, STATUS_TYPES } from './generateMockInvoices';

// 스타일 컴포넌트
const FormSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

// 금액 형식 변환 함수
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

// 숫자만 추출하는 함수
const extractNumber = (formattedAmount) => {
  if (!formattedAmount) return 0;
  const numericString = formattedAmount.replace(/[^0-9]/g, '');
  return numericString ? parseInt(numericString, 10) : 0;
};

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// 특정 날짜로부터 n일 후의 날짜를 YYYY-MM-DD 형식으로 반환
const getDateAfterDays = (dateString, days) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// 송장 번호 생성 함수
const generateInvoiceNumber = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}${day}-${random}`;
};

const InvoiceCreatePage = () => {
  const navigate = useNavigate();

  // 송장 기본 상태
  const [invoice, setInvoice] = useState({
    invoiceNumber: generateInvoiceNumber(),
    issueDate: getTodayDate(),
    dueDate: getDateAfterDays(getTodayDate(), 30),
    contractId: '',
    transactionNumber: '',
    supplierId: '',
    supplyAmount: 0,
    vatAmount: 0,
    totalAmount: 0,
    status: STATUS_TYPES.WAITING
  });

  // 선택된 계약 정보
  const [selectedContract, setSelectedContract] = useState(null);
  // 선택된 공급자 정보
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // 품목 정보 (단일 품목만 허용)
  const [item, setItem] = useState(null);

  // 스낵바 상태
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // 미리보기 다이얼로그 상태
  const [previewOpen, setPreviewOpen] = useState(false);

  // 필드 변경 핸들러
  const handleChange = (field, value) => {
    setInvoice({ ...invoice, [field]: value });
  };

  // 계약 선택 핸들러
  const handleContractChange = (event, newValue) => {
    if (!newValue) {
      setSelectedContract(null);
      setSelectedSupplier(null);
      setItem(null);
      setInvoice({
        ...invoice,
        contractId: '',
        transactionNumber: '',
        supplierId: '',
        supplyAmount: 0,
        vatAmount: 0,
        totalAmount: 0
      });
      return;
    }

    const contract = contracts.find(c => c.id === newValue.id);
    setSelectedContract(contract);

    // 계약에 연결된 공급자 정보 가져오기
    const supplier = suppliers.find(s => s.id === contract.supplierId);
    setSelectedSupplier(supplier);

    // 계약 정보로 송장 정보 업데이트
    setInvoice({
      ...invoice,
      contractId: contract.id,
      transactionNumber: contract.transactionNumber,
      supplierId: contract.supplierId,
      supplyAmount: contract.items[0].supplyAmount,
      vatAmount: contract.items[0].vatAmount,
      totalAmount: contract.items[0].totalAmount
    });

    // 계약의 단일 품목 정보 설정
    setItem({ ...contract.items[0] });
  };

  // 품목 정보 변경 핸들러
  const handleItemChange = (field, value) => {
    if (!item) return;

    const updatedItem = { ...item, [field]: value };

    // 수량이나 단가 변경 시 금액 재계산
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? value : updatedItem.quantity;
      const unitPrice = field === 'unitPrice' ? value : updatedItem.unitPrice;

      updatedItem.supplyAmount = quantity * unitPrice;
      updatedItem.vatAmount = Math.round(updatedItem.supplyAmount * 0.1);
      updatedItem.totalAmount = updatedItem.supplyAmount + updatedItem.vatAmount;

      // 송장 금액도 함께 업데이트
      setInvoice({
        ...invoice,
        supplyAmount: updatedItem.supplyAmount,
        vatAmount: updatedItem.vatAmount,
        totalAmount: updatedItem.totalAmount
      });
    }

    setItem(updatedItem);
  };

  // 총액 계산 핸들러
  const calculateTotals = () => {
    if (!item) return;

    const supplyAmount = item.supplyAmount;
    const vatAmount = item.vatAmount;
    const totalAmount = supplyAmount + vatAmount;

    setInvoice({
      ...invoice,
      supplyAmount,
      vatAmount,
      totalAmount
    });
  };

  // 송장 저장 핸들러
  const handleSaveInvoice = () => {
    // 필수 필드 검증
    if (!invoice.contractId) {
      showSnackbar('계약을 선택해주세요.', 'error');
      return;
    }

    if (!item) {
      showSnackbar('품목 정보가 없습니다.', 'error');
      return;
    }

    // 품목 데이터 검증
    if (!item.itemName || item.quantity <= 0 || item.unitPrice <= 0) {
      showSnackbar('품목의 이름, 수량, 단가를 올바르게 입력해주세요.', 'error');
      return;
    }

    if (new Date(invoice.dueDate) <= new Date(invoice.issueDate)) {
      showSnackbar('마감일은 발행일보다 이후여야 합니다.', 'error');
      return;
    }

    // 실제로는 API 호출을 통해 송장 저장
    const newInvoice = {
      ...invoice,
      id: `INV-${mockInvoices.length + 1}`,
      supplier: selectedSupplier,
      item: item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 저장 성공 가정
    showSnackbar('송장이 성공적으로 발행되었습니다.', 'success');

    // 미리보기 다이얼로그 표시
    setPreviewOpen(true);
  };

  // 목록으로 돌아가기 핸들러
  const handleBackToList = () => {
    navigate('/invoices'); // 실제 라우팅 경로에 맞게 수정
  };

  // 미리보기 다이얼로그 닫기 핸들러
  const handleClosePreview = () => {
    setPreviewOpen(false);
    // 송장 목록 페이지로 이동
    navigate('/invoices');
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* 상단 네비게이션 */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            color="inherit"
            onClick={handleBackToList}
            sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ArrowBackIcon fontSize="small" sx={{ mr: 0.5 }} />
            송장 목록
          </Link>
          <Typography color="textPrimary">송장 발행</Typography>
        </Breadcrumbs>
        <Typography variant="h4" component="h1" gutterBottom>
          새 송장 발행
        </Typography>
      </Box>

      {/* 송장 정보 입력 폼 */}
      <FormSection>
        <Typography variant="h6" gutterBottom>
          기본 정보
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="송장 번호"
              value={invoice.invoiceNumber}
              onChange={(e) => handleChange('invoiceNumber', e.target.value)}
              fullWidth
              InputProps={{
                readOnly: true,
              }}
              helperText="자동 생성됨"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="발행일"
              type="date"
              value={invoice.issueDate}
              onChange={(e) => handleChange('issueDate', e.target.value)}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="마감일"
              type="date"
              value={invoice.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              helperText="발행일로부터 기본 30일"
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              options={contracts}
              getOptionLabel={(option) => `${option.id} (${option.items[0]?.itemName || '품목 없음'})`}
              onChange={handleContractChange}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => <TextField {...params} label="계약 선택" />}
              fullWidth
            />
          </Grid>
        </Grid>
      </FormSection>

      {/* 공급자 정보 */}
      <FormSection>
        <Typography variant="h6" gutterBottom>
          공급자 정보
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {selectedSupplier ? (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="공급자 ID"
                value={selectedSupplier.id}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="공급자명"
                value={selectedSupplier.name}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="담당자"
                value={selectedSupplier.contactPerson}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="전화번호"
                value={selectedSupplier.phone}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="이메일"
                value={selectedSupplier.email}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="주소"
                value={selectedSupplier.address}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
          </Grid>
        ) : (
          <Typography variant="body1" color="textSecondary">
            계약을 선택하면 공급자 정보가 자동으로 표시됩니다.
          </Typography>
        )}
      </FormSection>

      {/* 품목 정보 */}
      <FormSection>
        <Typography variant="h6" gutterBottom>
          품목 정보
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>품목명</TableCell>
                <TableCell align="right">수량</TableCell>
                <TableCell align="right">단가</TableCell>
                <TableCell align="right">공급가액</TableCell>
                <TableCell align="right">부가세</TableCell>
                <TableCell align="right">총액</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!item ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    계약을 선택하면 품목 정보가 자동으로 표시됩니다.
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell>
                    <TextField
                      value={item.itemName}
                      onChange={(e) => handleItemChange('itemName', e.target.value)}
                      variant="standard"
                      fullWidth
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange('quantity', parseInt(e.target.value) || 0)}
                      variant="standard"
                      InputProps={{ inputProps: { min: 1 } }}
                      sx={{ width: '100px' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange('unitPrice', parseInt(e.target.value) || 0)}
                      variant="standard"
                      InputProps={{ inputProps: { min: 0 } }}
                      sx={{ width: '120px' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(item.supplyAmount)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(item.vatAmount)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(item.totalAmount)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 총계 */}
        <Grid container sx={{ mt: 3, p: 2, backgroundColor: 'background.default' }}>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="textSecondary">공급가액 합계</Typography>
            <Typography variant="h6">{formatCurrency(invoice.supplyAmount)}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="textSecondary">부가세 합계</Typography>
            <Typography variant="h6">{formatCurrency(invoice.vatAmount)}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="textSecondary">총액</Typography>
            <Typography variant="h6" color="primary.main">{formatCurrency(invoice.totalAmount)}</Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={calculateTotals}
            startIcon={<CalculateIcon />}
            sx={{ mr: 1 }}
          >
            금액 재계산
          </Button>
        </Box>
      </FormSection>

      {/* 작업 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToList}
        >
          취소
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveInvoice}
        >
          송장 발행하기
        </Button>
      </Box>

      {/* 송장 발행 완료 미리보기 다이얼로그 */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>송장 발행 완료</DialogTitle>
        <DialogContent dividers>
          <Typography variant="h6" gutterBottom>
            송장 번호: {invoice.invoiceNumber}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">계약 번호</Typography>
              <Typography variant="body1">{invoice.contractId}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">거래 번호</Typography>
              <Typography variant="body1">{invoice.transactionNumber}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">발행일</Typography>
              <Typography variant="body1">{invoice.issueDate}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">마감일</Typography>
              <Typography variant="body1">{invoice.dueDate}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">공급자</Typography>
              <Typography variant="body1">{selectedSupplier?.name}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">총액</Typography>
              <Typography variant="body1" color="primary.main">{formatCurrency(invoice.totalAmount)}</Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body1" gutterBottom>
              송장이 성공적으로 발행되었습니다.
            </Typography>
            <Typography variant="body2" color="textSecondary">
              이제 송장 목록에서 이 송장을 확인할 수 있습니다.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview} color="primary">
            송장 목록으로 이동
          </Button>
        </DialogActions>
      </Dialog>

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

export default InvoiceCreatePage;