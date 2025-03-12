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
    if (user) {
      setFormData(prev => ({
        ...prev,
        supplierId: user.id
      }));

      // 로그인된 사용자가 있을 때 토큰 확인 및 저장
      const token = localStorage.getItem('token');
      if (!token && authState.token) {
        console.log('토큰을 로컬 스토리지에 저장합니다.');
        localStorage.setItem('token', authState.token);
      }
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
  }, [user, success, dispatch, navigate, message, authState.token]);

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

      if (!validateForm()) {
          return;
      }

      // 🔹 1. 로그인 토큰 가져오기
      const token = localStorage.getItem("token");
      if (!token) {
          setSnackbarMessage("인증 정보가 없습니다. 다시 로그인해주세요.");
          setOpenSnackbar(true);
          return;
      }

      // 🔹 2. 파일 먼저 업로드
      let uploadedFilePath = null;
      if (businessFile) {
          const fileData = new FormData();
          fileData.append("businessFile", businessFile);

          const fileResponse = await fetch("/api/files/upload", {
              method: "POST",
              headers: {
                  Authorization: `Bearer ${token}`, // 🔹 인증 토큰 추가
              },
              body: fileData,
          });

          if (fileResponse.ok) {
              uploadedFilePath = await fileResponse.text(); // 파일 경로 받기
          } else {
              setSnackbarMessage("파일 업로드 실패");
              setOpenSnackbar(true);
              return;
          }
      }

      // 🔹 3. 협력업체 등록 요청 (파일 경로 포함)
      const requestData = {
          ...formData,
          businessFilePath: uploadedFilePath, // 업로드된 파일 경로 추가
      };

      const response = await fetch("/api/supplier-registrations", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, // 🔹 협력업체 등록 요청에도 인증 추가
          },
          body: JSON.stringify(requestData),
      });

      if (response.ok) {
          setSnackbarMessage("협력업체 등록이 완료되었습니다.");
          setOpenSnackbar(true);
      } else {
          setSnackbarMessage("등록 요청 실패");
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
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {showAdminWarning && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          관리자는 협력업체 등록을 할 수 없습니다. 공급업체 계정으로 로그인하세요.
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          협력업체 등록
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {errors.general && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.general}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* 기본 정보 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="사업자등록번호"
                name="businessNo"
                value={formData.businessNo}
                onChange={handleChange}
                placeholder="숫자만 입력하세요"
                required
                error={!!errors.businessNo}
                helperText={errors.businessNo}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="대표자명"
                name="ceoName"
                value={formData.ceoName}
                onChange={handleChange}
                required
                error={!!errors.ceoName}
                helperText={errors.ceoName}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="업태"
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="업종"
                name="businessCategory"
                value={formData.businessCategory}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            {/* 소싱 정보 (한 줄에 표시) */}
            <Grid item xs={12}>
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  label="소싱대분류"
                  name="sourcingCategory"
                  value={formData.sourcingCategory}
                  onChange={handleChange}
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  label="소싱중분류"
                  name="sourcingSubCategory"
                  value={formData.sourcingSubCategory}
                  onChange={handleChange}
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  label="소싱소분류"
                  name="sourcingDetailCategory"
                  value={formData.sourcingDetailCategory}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Box>
            </Grid>

            {/* 회사 연락처 및 주소 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="회사 연락처"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="숫자만 입력하세요"
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="본사 주소"
                name="headOfficeAddress"
                value={formData.headOfficeAddress}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            {/* 담당자 정보 */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="담당자"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="담당자 연락처"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="숫자만 입력하세요"
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="담당자 이메일"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="example@email.com"
                disabled={loading}
                error={!!errors.contactEmail}
                helperText={errors.contactEmail}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="비고"
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                multiline
                rows={3}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <Box>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="business-file-upload"
                  disabled={loading}
                />
                <label htmlFor="business-file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    disabled={loading}
                  >
                    사업자등록증 업로드
                  </Button>
                </label>
                {fileName && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    선택된 파일: {fileName}
                  </Typography>
                )}
                {errors.businessFile && (
                  <FormHelperText error>{errors.businessFile}</FormHelperText>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
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
                  disabled={loading || showAdminWarning}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? '등록 중...' : '등록하기'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage || message || '협력업체 등록이 완료되었습니다.'}
      />
    </Container>
  );
};

export default SupplierRegistrationPage;