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
  FormHelperText,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton
} from '@mui/material';
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_URL } from '@/utils/constants';

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

  // 첨부 파일 상태 관리
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    // 컴포넌트가 마운트될 때 토큰 확인 - 기존 로직 제거(fetchWithAuth가 처리)

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
    const files = Array.from(e.target.files);
    if (files && files.length > 0) {
      setAttachments(prev => [...prev, ...files]);
      if (errors.attachments) {
        setErrors(prev => ({
          ...prev,
          attachments: null
        }));
      }
    }
  };

  const handleRemoveFile = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // FormData 객체 생성
      const formDataToSend = new FormData();

      // 전화번호에서 하이픈 제거
      const processedFormData = {
        supplierId: Number(formData.supplierId),  // 숫자로 확실하게 변환
        businessNo: formData.businessNo,
        ceoName: formData.ceoName,
        businessType: formData.businessType,
        businessCategory: formData.businessCategory,
        sourcingCategory: formData.sourcingCategory,
        sourcingSubCategory: formData.sourcingSubCategory,
        sourcingDetailCategory: formData.sourcingDetailCategory,
        phoneNumber: formData.phoneNumber.replace(/-/g, ''),  // 하이픈 제거
        headOfficeAddress: formData.headOfficeAddress,
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone.replace(/-/g, ''),  // 하이픈 제거
        contactEmail: formData.contactEmail,
        comments: formData.comments
      };

      // JSON 문자열로 변환하여 추가
      const supplierDTO = JSON.stringify(processedFormData);
      // 문자열 형태로 전송 (백엔드 컨트롤러 로직과 일치)
      formDataToSend.append("supplierRegistrationDTO", supplierDTO);

      // 콘솔에서 확인
      console.log('JSON 데이터:', supplierDTO);

      // 첨부 파일 추가
      if (attachments.length > 0) {
        attachments.forEach((file, index) => {
          formDataToSend.append(`files`, file);
          console.log(`파일 ${index + 1} 추가:`, file.name, file.size);
        });
      }

      // FormData 내용 검사
      console.log('FormData 내용:');
      for (let pair of formDataToSend.entries()) {
        console.log(`- ${pair[0]}: ${typeof pair[1] === 'string' ? pair[1] : '(파일)'}`);
      }

      // PurchaseRequestCreatePage 참고하여 직접 fetch 호출로 변경
      console.log('API 요청 전송 URL:', `${API_URL}supplier-registrations`);

      // 토큰 가져오기
      const token = localStorage.getItem('token');
      console.log('토큰 존재 여부:', !!token);

      // 직접 fetch 호출 - 핸들링이 더 간단함
      const response = await fetch(`${API_URL}supplier-registrations`, {
        method: 'POST',
        credentials: 'include', // 쿠키 포함
        headers: {
          // 토큰이 있으면 Authorization 헤더 추가
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formDataToSend, // FormData는 Content-Type 헤더를 자동으로 설정
      });

      if (!response.ok) {
        // 응답 클론 생성 (스트림을 두 번 읽을 수 있도록)
        const errorResponse = response.clone();

        try {
          // JSON 파싱 시도
          const errorData = await response.json();
          const errorText = errorData.message || JSON.stringify(errorData) || '알 수 없는 오류';
          console.error('서버 응답 에러 (JSON):', errorText);
          throw new Error(`서버 오류: ${errorText}`);
        } catch (parseError) {
          // JSON 파싱 실패 시 텍스트로 처리 (클론된 응답 사용)
          const errorText = await errorResponse.text();
          console.error('서버 응답 에러 (텍스트):', errorText || '응답 내용 없음');
          throw new Error(`서버 오류: ${errorText || '내부 서버 오류가 발생했습니다. 관리자에게 문의하세요.'}`);
        }
      }

      // 성공 처리 시도
      let responseData;
      try {
        responseData = await response.json();
        console.log('서버 응답 데이터:', responseData);
      } catch (parseError) {
        console.log('응답을 JSON으로 파싱할 수 없습니다:', parseError);
        // JSON이 아니어도 성공으로 처리
      }

      // 성공 메시지 표시
      setSnackbarMessage('협력업체 등록이 완료되었습니다.');
      setOpenSnackbar(true);

      // 목록 페이지로 이동
      setTimeout(() => {
        navigate('/supplier');
      }, 2000);

    } catch (error) {
      console.error('등록 오류:', error);
      setSnackbarMessage(`오류가 발생했습니다: ${error.message}`);
      setOpenSnackbar(true);
    }
  };

  // 스낵바 닫기 핸들러
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
                <input
                  type="file"
                  accept=".pdf, .jpg, .jpeg, .png"
                  onChange={handleFileChange}
                  id="file-upload"
                  multiple
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<AttachFileIcon />}
                  >
                    파일 첨부
                  </Button>
                </label>
                {attachments.length > 0 && (
                  <>
                    {attachments.map((file, index) => (
                      <List key={index} sx={{ mt: 2 }}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar><AttachFileIcon /></Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={file.name}
                            secondary={`${(file.size / 1024).toFixed(2)} KB`}
                          />
                          {/* 삭제 버튼 */}
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleRemoveFile(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItem>
                      </List>
                    ))}
                  </>
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
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    등록 중...
                  </>
                ) : '등록하기'}
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