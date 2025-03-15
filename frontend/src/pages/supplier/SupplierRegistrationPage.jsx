import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom'; // useParams 추가
import KakaoAddressSearch from "@pages/member/KakaoAddressSearch";
import { registerSupplier, resetSupplierState, fetchSupplierById, updateSupplier } from '@/redux/supplier/supplierSlice';
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
  const { id } = useParams(); // URL에서 id 파라미터 가져오기 (수정 모드)

  // 수정 모드 여부 확인
  const isEditMode = !!id;

  // 재승인 요청 모드인지 확인 (수정 모드이면서 REJECTED 상태일 때)
  const [isReapplyMode, setIsReapplyMode] = useState(false);

  const supplierState = useSelector((state) => state.supplier) || {
    loading: false,
    error: null,
    success: false,
    message: '',
    currentSupplier: null
  };
  const { loading = false, error = null, success = false, message = '', currentSupplier = null } = supplierState;
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
    comments: '',
    // 주소 관련 필드 초기값 추가
    postalCode: '',
    roadAddress: '',
    detailAddress: ''
  });

  // 📌 KakaoAddressSearch에서 선택된 주소 반영 (여기에 위치)
  const handleAddressSelect = (data) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      postalCode: data.zonecode || '',
      roadAddress: data.roadAddress || '',
      detailAddress: '', // 도로명 주소 선택 시 상세 주소 초기화
      headOfficeAddress: data.zonecode && data.roadAddress
      ? `[${data.zonecode}] ${data.roadAddress}`.trim()
      : ''
    }));
  };

  // 첨부 파일 상태 관리
  const [attachments, setAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]); // 기존 첨부파일 상태 추가
  const [errors, setErrors] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [pageTitle, setPageTitle] = useState('협력업체 등록'); // 페이지 제목 상태 추가

  useEffect(() => {
    // 수정 모드인 경우 데이터 불러오기
    if (isEditMode) {
      setPageTitle('협력업체 정보 수정');
      dispatch(fetchSupplierById(id));
    }

    // 사용자 정보가 있으면 supplier ID 설정
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
      setSnackbarMessage(message || (isEditMode ? '협력업체 정보가 수정되었습니다.' : '협력업체 등록이 완료되었습니다.'));
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
  }, [user, success, dispatch, navigate, message, isEditMode, id]);

  // 수정 모드에서 데이터 로드 시 폼 채우기
  useEffect(() => {
    if (isEditMode && currentSupplier) {
      console.log("현재 상태:", currentSupplier.status?.childCode);
      console.log("반려 사유:", currentSupplier.rejectionReason);

      // 반려 상태인 경우 재승인 모드로 설정
      if (currentSupplier.status?.childCode === 'REJECTED') {
        console.log("반려 상태 감지, 재승인 모드 활성화");
        setIsReapplyMode(true);
        setPageTitle('협력업체 정보 수정 및 재승인 요청');
      }

      // 전화번호 포맷팅 함수
      const formatPhoneNumber = (phoneNumber) => {
        if (!phoneNumber || phoneNumber.includes("-")) {
          return phoneNumber;
        }

        if (phoneNumber.length === 8) {
          return phoneNumber.replace(/(\d{4})(\d{4})/, "$1-$2");
        } else if (phoneNumber.length === 9) {
          return phoneNumber.replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3");
        } else if (phoneNumber.length === 10) {
          if (phoneNumber.startsWith("02")) {
            return phoneNumber.replace(/(\d{2})(\d{4})(\d{4})/, "$1-$2-$3");
          } else {
            return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
          }
        } else if (phoneNumber.length === 11) {
          return phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
        }

        return phoneNumber;
      };

      setFormData({
        supplierId: currentSupplier.supplierId || user?.id || '',
        businessNo: currentSupplier.businessNo || '',
        ceoName: currentSupplier.ceoName || '',
        businessType: currentSupplier.businessType || '',
        businessCategory: currentSupplier.businessCategory || '',
        sourcingCategory: currentSupplier.sourcingCategory || '',
        sourcingSubCategory: currentSupplier.sourcingSubCategory || '',
        sourcingDetailCategory: currentSupplier.sourcingDetailCategory || '',
        phoneNumber: formatPhoneNumber(currentSupplier.phoneNumber) || '',
        headOfficeAddress: currentSupplier.headOfficeAddress || '',
        contactPerson: currentSupplier.contactPerson || '',
        contactPhone: formatPhoneNumber(currentSupplier.contactPhone) || '',
        contactEmail: currentSupplier.contactEmail || '',
        comments: currentSupplier.comments || ''
      });

      // 기존 첨부파일 설정
      if (currentSupplier.attachments && currentSupplier.attachments.length > 0) {
        setExistingAttachments(currentSupplier.attachments);
      }
    }
  }, [currentSupplier, isEditMode, user]);

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

  // 기존 첨부파일 제거 처리 함수 추가
  const handleRemoveExistingFile = (index) => {
    setExistingAttachments(prev => prev.filter((_, i) => i !== index));
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
              supplierId: Number(formData.supplierId),
              businessNo: formData.businessNo,
              ceoName: formData.ceoName,
              businessType: formData.businessType || '',
              businessCategory: formData.businessCategory || '',
              sourcingCategory: formData.sourcingCategory || '',
              sourcingSubCategory: formData.sourcingSubCategory || '',
              sourcingDetailCategory: formData.sourcingDetailCategory || '',
              phoneNumber: formData.phoneNumber ? formData.phoneNumber.replace(/-/g, '') : '',
              postalCode: formData.postalCode || '',
              roadAddress: formData.roadAddress || '',
              detailAddress: formData.detailAddress || '',
              contactPerson: formData.contactPerson || '',
              contactPhone: formData.contactPhone ? formData.contactPhone.replace(/-/g, '') : '',
              contactEmail: formData.contactEmail || '',
              comments: formData.comments || ''
          };

          // 수정 모드인 경우 ID 추가
          if (isEditMode) {
              processedFormData.id = Number(id);

              // 남겨둘 첨부파일 ID 목록 추가
              if (existingAttachments.length > 0) {
                  processedFormData.remainingAttachmentIds = existingAttachments.map(attachment => attachment.id);
              }

              // headOfficeAddress 재구성 (수정 모드에서도 동일하게 처리)
              processedFormData.headOfficeAddress = processedFormData.roadAddress
                  ? `[${processedFormData.postalCode || ''}] ${processedFormData.roadAddress} ${processedFormData.detailAddress || ''}`.trim()
                  : '';
          }

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

      // API URL 설정 (수정/등록에 따라 다름)
      const apiUrl = isEditMode
        ? `${API_URL}supplier-registrations/${id}`
        : `${API_URL}supplier-registrations`;

      // HTTP 메서드 설정 (수정/등록에 따라 다름)
      const httpMethod = isEditMode ? 'PUT' : 'POST';

      console.log('API 요청 전송 URL:', apiUrl);
      console.log('HTTP Method:', httpMethod);

      // 토큰 가져오기
      const token = localStorage.getItem('token');
      console.log('토큰 존재 여부:', !!token);

      // 직접 fetch 호출 - 핸들링이 더 간단함
      const response = await fetch(apiUrl, {
        method: httpMethod,
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
      setSnackbarMessage(isEditMode ? '협력업체 정보가 수정되었습니다.' : '협력업체 등록이 완료되었습니다.');
      setOpenSnackbar(true);

      // 목록 페이지로 이동
      setTimeout(() => {
        navigate('/supplier');
      }, 2000);

    } catch (error) {
      console.error('등록/수정 오류:', error);
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

  // 로딩 중 표시
  if (isEditMode && loading && !currentSupplier) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

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
            {pageTitle}
          </Typography>
          {error && (
            <Alert severity="error">{error}</Alert>
          )}
          {errors.general && (
            <Alert severity="error">{errors.general}</Alert>
          )}
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error">{error}</Alert>
            )}
            {errors.general && (
              <Alert severity="error">{errors.general}</Alert>
            )}

            {/* 반려 상태일 때 반려 사유 표시 */}
            {console.log("isReapplyMode:", isReapplyMode)}
            {console.log("rejectionReason:", currentSupplier?.rejectionReason)}
            {isReapplyMode && currentSupplier?.rejectionReason && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold">반려 사유</Typography>
                  <Typography variant="body2">{currentSupplier.rejectionReason}</Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    위 사유로 반려된 신청입니다. 내용을 수정하여 재승인을 요청해주세요.
                  </Typography>
                </Alert>
            )}

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
                  disabled={isEditMode} // 수정 모드에서는 사업자번호 변경 불가
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
                  label="소싱 대분류"
                  name="sourcingCategory"
                  value={formData.sourcingCategory}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="소싱 중분류"
                  name="sourcingSubCategory"
                  value={formData.sourcingSubCategory}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="소싱 소분류"
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
              <Grid item xs={9}>
                <TextField fullWidth label="우편번호 *" name="postalCode" value={formData.postalCode} disabled />
              </Grid>
              <Grid item xs={3}>
                <KakaoAddressSearch onAddressSelect={handleAddressSelect} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="도로명 주소 *" name="roadAddress" value={formData.roadAddress} disabled />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="상세 주소 *" name="detailAddress" value={formData.detailAddress} onChange={handleChange} />
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

            {/* 기존 첨부 파일 목록 (수정 모드에서만 표시) */}
            {isEditMode && existingAttachments.length > 0 && (
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>기존 첨부 파일</Typography>
                  {existingAttachments.map((file, index) => (
                    <List key={index} sx={{ mt: 1 }}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar><AttachFileIcon /></Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={file.fileName}
                          secondary={file.fileSize ? `${(file.fileSize / 1024).toFixed(2)} KB` : ''}
                        />
                        {/* 삭제 버튼 */}
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleRemoveExistingFile(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItem>
                    </List>
                  ))}
                  <Divider sx={{ mt: 2, mb: 2 }} />
                </Grid>
              </Grid>
            )}

            {/* 파일 업로드 */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {isEditMode ? '새 첨부 파일 추가' : '파일 첨부'}
                </Typography>
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
                onClick={() => isEditMode ? navigate(`/supplier/review/${id}`) : navigate('/supplier')}
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
                    {isReapplyMode ? '재승인 요청 중...' : isEditMode ? '수정 중...' : '등록 중...'}
                  </>
                ) : isReapplyMode ? '재승인 요청하기' : isEditMode ? '수정하기' : '등록하기'}
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