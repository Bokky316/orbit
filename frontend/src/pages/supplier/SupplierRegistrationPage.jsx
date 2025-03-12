import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { registerSupplier, resetSupplierState } from '../../redux/supplier/supplierSlice';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Snackbar,
  Divider,
  FormHelperText
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';

const SupplierRegistrationPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const supplierState = useSelector((state) => state.supplier) || {
    loading: false,
    error: null,
    success: false,
    message: ''
  };
  const { loading = false, error = null, success = false, message = '' } = supplierState;
  const authState = useSelector((state) => state.auth) || { user: null };
  const { user = null } = authState;
  // ROLE 확인 (응답 형식: {"roles":["ROLE_SUPPLIER"]} 또는 {"roles":["ROLE_ADMIN"]})
  const isAdmin = user && user.roles && user.roles.includes('ROLE_ADMIN');
  const isSupplier = user && user.roles && user.roles.includes('ROLE_SUPPLIER');
  const [formData, setFormData] = useState({
    supplierId: '',
    businessNo: '',
    ceoName: '',
    businessType: '',
    businessCategory: '',
    sourcingCategory: '',
    sourcingSubCategory: '',
    sourcingDetailCategory: '',
    phoneNumber: '', // 회사 연락처 (필드명 변경: companyPhoneNumber → phoneNumber)
    headOfficeAddress: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    comments: ''
  });
  const [businessFile, setBusinessFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    // 컴포넌트가 마운트될 때 토큰 확인
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('🚨 인증 토큰이 없습니다! 다시 로그인해주세요.');
      setSnackbarMessage('인증 정보가 없습니다. 다시 로그인해주세요.');
      setOpenSnackbar(true);
      // navigate('/login'); // 로그인 페이지로 리디렉션
      return;
    }

    if (user) {
      setFormData(prev => ({
        ...prev,
        supplierId: user.id
      }));
    } else {
       setFormData(prev => ({
        ...prev,
        supplierId: '1'
      }));
    }

    if (success) {
      setSnackbarMessage(message || '협력업체 등록이 완료되었습니다.');
      setOpenSnackbar(true);
      const timer = setTimeout(() => {
        dispatch(resetSupplierState());
        navigate('/supplier');
      }, 2000);
      return () => clearTimeout(timer);
    }

    return () => {
      try {
        dispatch(resetSupplierState());
      } catch (err) {
        console.error('Error resetting supplier state:', err);
      }
    };
  }, [user, success, dispatch, navigate, message]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === "businessNo") {
      // 사업자등록번호 (000-00-00000)
      formattedValue = value
        .replace(/\D/g, "") // 숫자만 허용
        .replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3")
        .slice(0, 12);
    } else if (name === "phoneNumber" || name === "contactPhone") {
      // 전화번호 (다양한 경우의 수 처리)
      formattedValue = value.replace(/\D/g, ""); // 숫자만 허용
      if (formattedValue.length <= 8) {
        formattedValue = formattedValue.replace(/(\d{4})(\d{4})/, "$1-$2");
      } else if (formattedValue.length === 9) {
        formattedValue = formattedValue.replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3");
      } else if (formattedValue.length === 10) {
        formattedValue = formattedValue.replace(/(\d{2,3})(\d{3,4})(\d{4})/, "$1-$2-$3");
      } else {
        formattedValue = formattedValue.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3").slice(0, 13);
      }
    } else if (name === "contactEmail") {
      // 이메일 형식 검증
      if (value && !/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(value)) {
        setErrors(prev => ({
          ...prev,
          contactEmail: "올바른 이메일 형식이 아닙니다.",
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          contactEmail: null,
        }));
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue,
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBusinessFile(file);
      setFileName(file.name);
      if (errors.businessFile) {
        setErrors(prev => ({
          ...prev,
          businessFile: null
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.businessNo) {
      newErrors.businessNo = '사업자등록번호는 필수입니다.';
    } else if (!/^\d{3}-\d{2}-\d{5}$/.test(formData.businessNo)) {
      newErrors.businessNo = '사업자등록번호는 000-00-00000 형식이어야 합니다.';
    }

    if (!formData.ceoName) {
      newErrors.ceoName = '대표자명은 필수입니다.';
    }

    if (!businessFile) {
      newErrors.businessFile = '사업자등록증 파일은 필수입니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fileData = new FormData();
      fileData.append("businessFile", businessFile);

      let fileResponse = await fetchWithAuth("/api/files/upload", {
        method: "POST",
        body: fileData,
      });

      // 401 발생 시, 토큰 갱신 후 재요청
      if (fileResponse.status === 401) {
        fileResponse = await fetchWithAuth("/api/files/upload", {
          method: "POST",
          body: fileData,
        });
      }

      if (!fileResponse.ok) {
        throw new Error("파일 업로드 실패");
      }

      const uploadedFilePath = await fileResponse.text();
      const requestData = { ...formData, businessFilePath: uploadedFilePath };

      let response = await fetchWithAuth("/api/supplier-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      // 401 발생 시, 토큰 갱신 후 재요청
      if (response.status === 401) {
        response = await fetchWithAuth("/api/supplier-registrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });
      }

      if (!response.ok) {
        throw new Error("등록 요청 실패");
      }

      setSnackbarMessage("협력업체 등록이 완료되었습니다.");
      setOpenSnackbar(true);
    } catch (error) {
      setSnackbarMessage("오류가 발생했습니다. 다시 시도해주세요.");
      setOpenSnackbar(true);
    }
  };



  // ✅ `handleCloseSnackbar` 함수 추가 (에러 방지)
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // 관리자 경고 표시 여부
  const showAdminWarning = isAdmin && !isSupplier;

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        {showAdminWarning && (
          <Alert severity="warning">
            관리자는 협력업체 등록을 할 수 없습니다. 공급업체 계정으로 로그인하세요.
          </Alert>
        )}
        <Paper elevation={3} sx={{ padding: 3 }}>
          <Typography variant="h5" gutterBottom>
            협력업체 등록
          </Typography>
          {error && (
            <Alert severity="error">{error}</Alert>
          )}
          {errors.general && (
            <Alert severity="error">{errors.general}</Alert>
          )}
          <form onSubmit={handleSubmit}>
            {/* 기본 정보 */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="사업자등록번호"
                  name="businessNo"
                  value={formData.businessNo}
                  onChange={handleChange}
                  error={!!errors.businessNo}
                  helperText={errors.businessNo}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="대표자명"
                  name="ceoName"
                  value={formData.ceoName}
                  onChange={handleChange}
                  error={!!errors.ceoName}
                  helperText={errors.ceoName}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="업태"
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="업종"
                  name="businessCategory"
                  value={formData.businessCategory}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            {/* 소싱 정보 (한 줄에 표시) */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="소싱 카테고리"
                  name="sourcingCategory"
                  value={formData.sourcingCategory}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="소싱 하위 카테고리"
                  name="sourcingSubCategory"
                  value={formData.sourcingSubCategory}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="소싱 상세 카테고리"
                  name="sourcingDetailCategory"
                  value={formData.sourcingDetailCategory}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            {/* 회사 연락처 및 주소 */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="회사 연락처" // Changed from 사업장 전화번호
                  name="phoneNumber" // Changed from companyPhoneNumber
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="본사 주소"
                  name="headOfficeAddress"
                  value={formData.headOfficeAddress}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            {/* 담당자 정보 */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="담당자 이름"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="담당자 연락처"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="담당자 이메일"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  error={!!errors.contactEmail}
                  helperText={errors.contactEmail}
                />
              </Grid>
            </Grid>

            {/* 기타 정보 */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="비고"
                  name="comments"
                  multiline
                  rows={4}
                  value={formData.comments}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            <Divider sx={{ mt: 3, mb: 3 }} />

            {/* 파일 업로드 */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12}>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                >
                  사업자등록증 업로드
                  <input
                    type="file"
                    accept=".pdf, .jpg, .jpeg, .png"
                    onChange={handleFileChange}
                    hidden
                  />
                </Button>
                {fileName && (
                  <Typography variant="subtitle2" sx={{ ml: 1 }}>
                    선택된 파일: {fileName}
                  </Typography>
                )}
                {errors.businessFile && (
                  <FormHelperText error>{errors.businessFile}</FormHelperText>
                )}
              </Grid>
            </Grid>

            {/* 제출 버튼 */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/supplier')}
                disabled={loading}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? '등록 중...' : '등록하기'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default SupplierRegistrationPage;
