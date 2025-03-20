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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
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

// 금액 형식 변환 함수
const formatCurrency = (amount) => {
  if (!amount) return '0원';
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

const InvoiceCreatePage = () => {
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
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [userDetail, setUserDetail] = useState(null);
  const [supplierDetailLoading, setSupplierDetailLoading] = useState(false);
  const [supplierDetail, setSupplierDetail] = useState(null);

  // 폼 필드
  const [formData, setFormData] = useState({
    orderNumber: '',
    issueDate: moment(),
    dueDate: moment().add(30, 'days'),
    notes: '',
    deliveryId: '',
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

  // 송장 등록 권한 확인
  const canCreateInvoice = () => {
    if (!isLoggedIn || !currentUser) return false;

    // 오직 SUPPLIER(공급업체)만 송장 발행 가능
    if (isSupplier()) return true;

    // 다른 역할은 불가능
    return false;
  };

  // 사용자 상세 정보를 가져오는 함수
  const fetchUserInfo = async () => {
    try {
      if (!currentUser || !currentUser.id) {
        console.error('현재 사용자 정보가 없거나 ID 값이 없습니다.', currentUser);
        return;
      }

      setUserDetailLoading(true);
      console.log('사용자 ID로 정보 API 호출 시작:', currentUser.id);

      // API_URL에 이미 /api/가 포함되어 있는지 확인하고 경로 구성
      const endpoint = `${API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL}members/${currentUser.id}`;
      console.log('API 호출 경로:', endpoint);

      // ID로 회원 정보 조회 API 호출
      const response = await fetchWithAuth(endpoint);

      if (!response.ok) {
        throw new Error(`사용자 정보 조회 실패: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('사용자 상세 정보 응답:', responseData);

      // API 응답이 { status: "success", data: {...} } 형태인 경우
      if (responseData.status === "success" && responseData.data) {
        console.log('API 응답에서 data 객체 추출:', responseData.data);
        setUserDetail(responseData.data);
      } else {
        // 응답 자체가 사용자 데이터인 경우
        console.log('API 응답을 그대로 사용:', responseData);
        setUserDetail(responseData);
      }
    } catch (error) {
      console.error('사용자 정보 조회 중 오류 발생:', error);

      // 오류 발생 시에도 더미 데이터 설정
      setUserDetail({
        email: `${currentUser.username}@example.com`,
        contactNumber: "010-1234-5678",
        roadAddress: "서울시 강남구 테헤란로 123",
        detailAddress: "456호",
        companyName: companyName || `${currentUser.name.replace(' 담당자', '')}`
      });
    } finally {
      setUserDetailLoading(false);
    }
  };

  // 공급자 상세 정보 가져오기
  const fetchSupplierInfo = async (supplierId) => {
    try {
      if (!supplierId) {
        console.error('공급자 ID가 없습니다.');
        return;
      }

      setSupplierDetailLoading(true);
      console.log('공급자 ID로 정보 API 호출 시작:', supplierId);

      // API_URL에 이미 /api/가 포함되어 있는지 확인하고 경로 구성
      const endpoint = `${API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL}members/${supplierId}`;
      console.log('공급자 정보 API 호출 경로:', endpoint);

      // ID로 회원 정보 조회 API 호출
      const response = await fetchWithAuth(endpoint);

      if (!response.ok) {
        throw new Error(`공급자 정보 조회 실패: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('공급자 상세 정보 응답:', responseData);

      // API 응답이 { status: "success", data: {...} } 형태인 경우
      if (responseData.status === "success" && responseData.data) {
        console.log('API 응답에서 data 객체 추출:', responseData.data);
        setSupplierDetail(responseData.data);
        return responseData.data;
      } else {
        // 응답 자체가 사용자 데이터인 경우
        console.log('API 응답을 그대로 사용:', responseData);
        setSupplierDetail(responseData);
        return responseData;
      }
    } catch (error) {
      console.error('공급자 정보 조회 중 오류 발생:', error);

      // 오류 발생 시에도 더미 데이터 설정
      const dummyData = {
        username: selectedDelivery?.supplierId || "-",
        name: selectedDelivery?.supplierName || "-",
        email: `${selectedDelivery?.supplierName?.replace(/\s+/g, '').toLowerCase()}@example.com`,
        contactNumber: "010-0000-0000",
        companyName: selectedDelivery?.supplierName || "-"
      };

      setSupplierDetail(dummyData);
      return dummyData;
    } finally {
      setSupplierDetailLoading(false);
    }
  };

  // 입고 목록 조회
  const fetchDeliveries = async () => {
    try {
      setLoading(true);

      // API 엔드포인트 수정 - 서플라이어 회사명 추가
      let endpoint = `${API_URL}deliveries/uninvoiced-with-contracts`;

      // 서플라이어인 경우 자사 데이터만 조회하도록 필터 추가
      if (isSupplier() && companyName) {
        endpoint += `?supplierName=${encodeURIComponent(companyName)}`;
      }

      console.log('API 요청 시작: ', endpoint);
      const response = await fetchWithAuth(endpoint);
      console.log('API 응답 상태: ', response.status);

      if (!response.ok) {
        throw new Error(`입고 목록 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('입고 데이터 원본:', data);

      // 페이징된 응답인 경우 content 필드를 확인하고, 아니면 data 자체를 사용
      const deliveriesData = data.content || data;

      // 데이터가 배열인지 확인
      if (!Array.isArray(deliveriesData)) {
        console.error('입고 데이터가 배열이 아닙니다:', deliveriesData);
        setDeliveries([]);  // 빈 배열로 설정
      } else {
        console.log('사용할 입고 데이터:', deliveriesData);

        // 서플라이어인 경우 자사 데이터만 필터링
        if (isSupplier() && companyName) {
          const filteredData = deliveriesData.filter(delivery =>
            delivery.supplierName === companyName
          );
          setDeliveries(filteredData);
        } else {
          setDeliveries(deliveriesData);
        }
      }
    } catch (error) {
      console.error('입고 목록을 불러오는 중 오류 발생:', error);
      setError('입고 정보를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
      setShowError(true);
      // 오류 발생 시 빈 배열로 설정
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      // 공급업체 사용자인 경우에만 사용자 정보 호출
      if (isSupplier()) {
        fetchUserInfo(); // 사용자 정보 호출 추가
      }

      if (isSupplier() && companyName) {
        fetchDeliveries();
      } else if (isSupplier()) {
        // 회사명이 설정되면 입고 목록을 가져오기 위해 기다림
      } else {
        fetchDeliveries();
      }

      // 권한 체크
      if (!canCreateInvoice()) {
        setError('송장 생성 권한이 없습니다. 서플라이어(공급업체)만 송장을 생성할 수 있습니다.');
        setShowError(true);
        // 권한 없으면 목록 페이지로 리다이렉트
        setTimeout(() => {
          navigate('/invoices');
        }, 2000);
      }
    }
  }, [isLoggedIn, currentUser]);

  // 회사명이 설정되면 입고 목록 조회
  useEffect(() => {
    if (isSupplier() && companyName) {
      fetchDeliveries();
    }
  }, [companyName]);

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

  // 입고 선택 핸들러 (수정된 버전)
  const handleDeliveryChange = async (event, newValue) => {
    setSelectedDelivery(newValue);
    if (newValue) {
      // 공급자 정보 일치 여부 확인
      if (newValue.supplierId && currentUser.id && newValue.supplierId !== currentUser.id) {
        console.warn(`입고 데이터의 공급자 ID(${newValue.supplierId})와 현재 사용자 ID(${currentUser.id})가 다릅니다.`);
      }

      setFormData({
        ...formData,
        deliveryId: newValue.id,
        orderNumber: newValue.orderNumber || '',
      });

      // 선택한 입고 데이터의 공급자 정보 추가 조회
      if (newValue.supplierId) {
        try {
          const endpoint = `${API_URL}members/${newValue.supplierId}`;
          console.log('공급자 정보 API 호출:', endpoint);

          const response = await fetchWithAuth(endpoint);

          if (response.ok) {
            const supplierData = await response.json();
            console.log('공급자 상세 정보:', supplierData);

            // 응답 구조에 따라 데이터 추출 (status.success 패턴 또는 직접 응답)
            const supplierDetails = supplierData.status === "success" ? supplierData.data : supplierData;

            // 선택된 입고 데이터에 공급자 정보 보강
            setSelectedDelivery({
              ...newValue,
              supplierUserName: supplierDetails.username || newValue.supplierUserName || newValue.supplierId,
              supplierContactPerson: supplierDetails.name || newValue.supplierContactPerson || '-',
              supplierEmail: supplierDetails.email || newValue.supplierEmail || '-',
              supplierPhone: supplierDetails.contactNumber || newValue.supplierPhone || '-',
              supplierAddress: supplierDetails.roadAddress ?
                `${supplierDetails.roadAddress} ${supplierDetails.detailAddress || ''}` :
                (newValue.supplierAddress || '등록된 주소 정보가 없습니다.')
            });
          }
        } catch (error) {
          console.error("공급자 정보 조회 중 오류 발생:", error);
        }
      }
    } else {
      setFormData({
        ...formData,
        deliveryId: '',
        orderNumber: '',
      });
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDelivery) {
      setError('발주 정보를 선택해주세요.');
      setShowError(true);
      return;
    }

    try {
      setSaving(true);

      // 송장 생성 API 호출
      const response = await fetchWithAuth(`${API_URL}invoices/from-delivery/${formData.deliveryId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`송장 생성 실패: ${response.status}`);
      }

      const createdInvoice = await response.json();

      // 추가 정보 업데이트 (계약번호, 거래번호, 메모 등)
      const updateData = {
        issueDate: formData.issueDate.format('YYYY-MM-DD'),
        dueDate: formData.dueDate.format('YYYY-MM-DD'),
        notes: formData.notes,
        status: 'WAITING',
      };

      // 공급자 정보가 있으면 업데이트 시도
      if (supplierDetail || userDetail) {
        Object.assign(updateData, {
          userName: selectedDelivery.supplierUserName || currentUser.username,
          supplierName: selectedDelivery.supplierName || companyName || userDetail?.companyName || currentUser.name,
          supplierContactPerson: selectedDelivery.supplierContactPerson || currentUser.name,
          supplierEmail: selectedDelivery.supplierEmail || userDetail?.email || currentUser.email,
          supplierPhone: selectedDelivery.supplierPhone || userDetail?.contactNumber || currentUser.contactNumber,
          supplierAddress: selectedDelivery.supplierAddress ||
            (userDetail?.roadAddress ?
              `${userDetail.roadAddress} ${userDetail.detailAddress || ''}` :
              (currentUser.roadAddress ? `${currentUser.roadAddress} ${currentUser.detailAddress || ''}` : ''))
        });
      }

      const updateResponse = await fetchWithAuth(`${API_URL}invoices/${createdInvoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!updateResponse.ok) {
        console.warn('송장 추가 정보 업데이트 실패');
      }

      // 성공 메시지 표시
      setSuccessMessage('송장이 성공적으로 생성되었습니다.');
      setShowSuccess(true);

      // 생성 후 상세 페이지로 이동 (타이머 설정)
      setTimeout(() => {
        navigate(`/invoices/${createdInvoice.id}`);
      }, 2000);
    } catch (error) {
      console.error('송장 생성 중 오류 발생:', error);
      setError('송장 생성 중 오류가 발생했습니다.');
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


  // 공급가액 계산
  const calculateSupplyPrice = (totalAmount) => {
    if (!totalAmount) return 0;
    return Math.round(parseFloat(totalAmount) / 1.1 * 100) / 100;
  };

  // 부가세 계산
  const calculateVAT = (totalAmount) => {
    if (!totalAmount) return 0;
    return Math.round((parseFloat(totalAmount) - calculateSupplyPrice(totalAmount)) * 100) / 100;
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

      {/* 취소 확인 다이얼로그 */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>생성 취소</DialogTitle>
        <DialogContent>
          <DialogContentText>
            송장 생성을 취소하시겠습니까? 입력한 정보는 저장되지 않습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} color="primary">
            계속 작성
          </Button>
          <Button onClick={() => navigate('/invoices')} color="error" autoFocus>
            취소하고 나가기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 상단 네비게이션 */}
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
      ) : (
        <form onSubmit={handleSubmit}>
          <Box className="invoice-detail-content">
            {/* 송장 제목 및 상태 */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" component="h1">
                  새 송장 등록
                </Typography>
                <Chip
                  label="작성 중"
                  color="default"
                  size="medium"
                  sx={{ fontSize: '1rem', fontWeight: 'bold' }}
                />
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                송장은 발주 정보를 기반으로 생성됩니다. 아래에서 발주 정보를 선택해주세요.
              </Alert>
              {/* 경고 메시지 추가 */}
              <Alert severity="warning" sx={{ mt: 1 }}>
                주의: 시스템 구조상 송장은 입고 데이터에 등록된 공급자 정보로 저장됩니다.
              </Alert>
            </Paper>

            {/* 디버깅 정보 (개발 환경에서만 표시) */}
            {process.env.NODE_ENV === 'development' && currentUser && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', fontSize: '0.75rem' }}>
                <Typography variant="h6" gutterBottom>디버깅 정보</Typography>
                <div>사용자: {currentUser.username} ({currentUser.roles?.join(', ') || currentUser.role})</div>
                <div>이름: {currentUser.name}</div>
                <div>회사명: {companyName || currentUser.companyName || '-'}</div>
                <div>송장 발행 권한: {canCreateInvoice() ? 'Yes' : 'No'}</div>
                <div>입고데이터 개수: {deliveries.length}</div>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>상세 정보:</Typography>
                <pre>{JSON.stringify(userDetail, null, 2)}</pre>
                {selectedDelivery && (
                  <>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>선택된 입고 정보:</Typography>
                    <div>입고 ID: {selectedDelivery.id}</div>
                    <div>입고 공급자 ID: {selectedDelivery.supplierId}</div>
                    <div>입고 공급자명: {selectedDelivery.supplierName}</div>
                  </>
                )}
                {supplierDetail && (
                  <>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>공급자 상세 정보:</Typography>
                    <pre>{JSON.stringify(supplierDetail, null, 2)}</pre>
                  </>
                )}
              </Paper>
            )}

            {/* 발주 정보 선택 */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <SectionTitle variant="h6">발주 정보 선택</SectionTitle>
              <Divider sx={{ mb: 2 }} />

              <Autocomplete
                options={deliveries}
                getOptionLabel={(option) =>
                  `[발주번호: ${option.orderNumber || '없음'}] [입고번호: ${option.deliveryNumber}] ${option.itemName}`
                }
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        발주번호: {option.orderNumber || '발주번호 없음'}
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
                            • 수량: {option.itemQuantity}개
                          </Typography>
                          <Typography variant="body2">
                            • 총액: {formatCurrency(option.totalAmount)}
                          </Typography>
                        </Grid>
                      </Grid>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        입고번호: {option.deliveryNumber}
                      </Typography>
                    </Box>
                  </li>
                )}
                value={selectedDelivery}
                onChange={handleDeliveryChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="입고된 발주 정보 선택"
                    required
                    fullWidth
                    margin="normal"
                    placeholder="발주번호 또는 입고번호로 검색하세요"
                  />
                )}
                noOptionsText="송장 발행 가능한 발주/입고 정보가 없습니다"
                sx={{ mb: 2 }}
              />

              {selectedDelivery && currentUser && selectedDelivery.supplierId !== currentUser.id && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  주의: 선택한 입고 데이터의 공급자({selectedDelivery.supplierName})가 현재 로그인 사용자({currentUser.name})와 다릅니다.
                  이 송장은 입고 데이터의 공급자 정보로 생성됩니다.
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
                    <Typography className="value">
                      {selectedDelivery ? selectedDelivery.orderNumber || '-' : '-'}
                    </Typography>
                  </InfoRow>
                  <InfoRow>
                    <Typography className="label">입고 번호:</Typography>
                    <Typography className="value">
                      {selectedDelivery ? selectedDelivery.deliveryNumber || '-' : '-'}
                    </Typography>
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
                            size: "small",
                            fullWidth: true,
                            required: true,
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
                            size: "small",
                            fullWidth: true,
                            required: true,
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </InfoRow>

                </Grid>
              </Grid>
            </Paper>

            {/* 공급자 정보 */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <SectionTitle variant="h6">공급자 정보</SectionTitle>
              <Divider sx={{ mb: 2 }} />

              {supplierDetailLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <InfoRow>
                      <Typography className="label">공급자 ID:</Typography>
                      <Typography className="value">
                        {selectedDelivery?.supplierUserName || selectedDelivery?.supplierId || "-"}
                      </Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography className="label">공급자명:</Typography>
                      <Typography className="value">
                        {selectedDelivery?.supplierName || "-"}
                      </Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography className="label">담당자:</Typography>
                      <Typography className="value">
                        {selectedDelivery?.supplierContactPerson || supplierDetail?.name || "-"}
                      </Typography>
                    </InfoRow>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <InfoRow>
                      <Typography className="label">이메일:</Typography>
                      <Typography className="value">
                        {selectedDelivery?.supplierEmail || supplierDetail?.email || "-"}
                      </Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography className="label">전화번호:</Typography>
                      <Typography className="value">
                        {selectedDelivery?.supplierPhone || supplierDetail?.contactNumber || "-"}
                      </Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography className="label">주소:</Typography>
                      <Typography className="value">
                        {selectedDelivery?.supplierAddress ||
                         (supplierDetail?.roadAddress ?
                          `${supplierDetail.roadAddress} ${supplierDetail.detailAddress || ''}` :
                          '등록된 주소 정보가 없습니다.')}
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
                    {selectedDelivery ? (
                      <TableRow>
                        <TableCell>
                          {selectedDelivery.itemName}
                          {selectedDelivery.itemSpecification && (
                            <Typography variant="caption" display="block" color="textSecondary">
                              {selectedDelivery.itemSpecification}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{selectedDelivery.itemQuantity} {selectedDelivery.itemUnit || '개'}</TableCell>
                        <TableCell>
                          {formatCurrency(selectedDelivery.unitPrice || (selectedDelivery.totalAmount / selectedDelivery.itemQuantity))}
                        </TableCell>
                        <TableCell>{formatCurrency(calculateSupplyPrice(selectedDelivery.totalAmount))}</TableCell>
                        <TableCell>{formatCurrency(calculateVAT(selectedDelivery.totalAmount))}</TableCell>
                        <TableCell>{formatCurrency(selectedDelivery.totalAmount)}</TableCell>
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">발주 정보를 선택하면 품목 정보가 표시됩니다.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* 결제 정보 */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <SectionTitle variant="h6">결제 정보</SectionTitle>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        공급가액
                      </Typography>
                      <Typography variant="h5">{formatCurrency(selectedDelivery ? calculateSupplyPrice(selectedDelivery.totalAmount) : 0)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        부가세
                      </Typography>
                      <Typography variant="h5">{formatCurrency(selectedDelivery ? calculateVAT(selectedDelivery.totalAmount) : 0)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        총액
                      </Typography>
                      <Typography variant="h4">{formatCurrency(selectedDelivery ? selectedDelivery.totalAmount : 0)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
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
                disabled={saving || !selectedDelivery}
              >
                송장 생성
              </Button>
            </Box>
          </Box>
        </form>
      )}
    </Container>
  );
};

export default InvoiceCreatePage;