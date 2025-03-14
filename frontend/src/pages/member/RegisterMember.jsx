import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Grid,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Snackbar,
  InputAdornment,
  IconButton,
  Box
} from "@mui/material";
import { Visibility, VisibilityOff, CheckCircle, Error } from "@mui/icons-material";
import { API_URL } from "@utils/constants";
import useDebounce from '@hooks/useDebounce';
import KakaoAddressSearch from "@pages/member/KakaoAddressSearch";

export default function RegisterMember() {
  // 회원가입 단계 관리
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['기본 정보 입력', '이메일 인증', '주소 정보 입력', '회원가입 완료'];

  // 회원가입 정보 상태
  const [member, setMember] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    contactNumber: "",
    postalCode: "",
    roadAddress: "",
    detailAddress: "",
  });

  // UI 상태 관리
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [email, setEmail] = useState("");
  const debouncedEmail = useDebounce(email, 500); // 500ms 디바운스 적용
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 유효성 검증 상태
  const [errors, setErrors] = useState({});
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // 이메일 인증 관련 상태
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

  // debounce된 이메일 값이 변경될 때마다 중복 체크
  useEffect(() => {
    if (debouncedEmail && debouncedEmail.length > 0) {
      checkEmail(debouncedEmail);
    }
  }, [debouncedEmail]);

  // 비밀번호 확인 체크
  useEffect(() => {
    if (member.confirmPassword) {
      if (member.password === member.confirmPassword) {
        setPasswordError("비밀번호가 일치합니다");
      } else {
        setPasswordError("비밀번호가 일치하지 않습니다");
      }
    } else {
      setPasswordError("");
    }
  }, [member.password, member.confirmPassword]);

  // 인증 코드 타이머
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (codeSent && countdown === 0) {
      setSnackbar({
        open: true,
        message: "인증 시간이 만료되었습니다. 다시 요청해주세요.",
        severity: "warning"
      });
      setCodeSent(false);
    }
    return () => clearTimeout(timer);
  }, [countdown, codeSent]);

  // 입력 필드 변경 처리
  const handleChange = (event) => {
    const { name, value } = event.target;
    setMember({ ...member, [name]: value });

    // 이메일 필드 변경 시 debounce를 위한 상태 업데이트
    if (name === "email") {
      setEmail(value);
    }

    // 필드별 유효성 검사
    validateField(name, value);
  };

  // 필드별 유효성 검사
  const validateField = (name, value) => {
    let newErrors = { ...errors };

    switch (name) {
      case "username":
        if (!value) newErrors.username = "아이디를 입력해주세요";
        else if (value.length < 4) newErrors.username = "아이디는 4자 이상이어야 합니다";
        else delete newErrors.username;
        break;
      case "name":
        if (!value) newErrors.name = "이름을 입력해주세요";
        else delete newErrors.name;
        break;
      case "password":
        if (!value) newErrors.password = "비밀번호를 입력해주세요";
        else if (value.length < 4 || value.length > 16)
          newErrors.password = "비밀번호는 4자 이상 16자 이하여야 합니다";
        else delete newErrors.password;
        break;
      case "email":
        const emailRegex = /^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,6}$/;
        if (!value) newErrors.email = "이메일을 입력해주세요";
        else if (!emailRegex.test(value)) newErrors.email = "올바른 이메일 형식이 아닙니다";
        else delete newErrors.email;
        break;
      case "companyName":
        if (!value) newErrors.companyName = "회사 이름을 입력해주세요";
        else delete newErrors.companyName;
        break;
      case "contactNumber":
        const phoneRegex = /^\d{2,3}-\d{3,4}-\d{4}$/;
        if (value && !phoneRegex.test(value))
          newErrors.contactNumber = "올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)";
        else delete newErrors.contactNumber;
        break;
      case "detailAddress":
        if (!value && member.postalCode) newErrors.detailAddress = "상세 주소를 입력해주세요";
        else delete newErrors.detailAddress;
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // username 중복 체크 함수 추가
  const checkUsername = async (username) => {
    try {
      const response = await fetch(`${API_URL}members/checkUsername?username=${username}`);
      const data = await response.json();

      if (data.status === "duplicate") {
        return {
          isValid: false,
          message: "이미 사용 중인 아이디입니다."
        };
      }

      return {
        isValid: true,
        message: ""
      };
    } catch (error) {
      console.error("Username 중복 체크 중 오류 발생:", error);
      return {
        isValid: false,
        message: "아이디 확인 중 오류가 발생했습니다"
      };
    }
  };

  // 이메일 중복 체크
  const checkEmail = (email) => {
    fetch(`${API_URL}members/checkEmail?email=${email}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "duplicate") {
          setEmailError(data.message);
        } else {
          setEmailError("");
        }
      })
      .catch((error) => {
        console.error("이메일 중복 체크 중 오류 발생:", error);
        setEmailError("이메일 확인 중 오류가 발생했습니다");
      });
  };

  // 이메일 인증 코드 요청
  const sendVerificationCode = () => {
    if (!member.email || emailError || errors.email) {
      setSnackbar({
        open: true,
        message: "유효한 이메일을 입력해주세요",
        severity: "error"
      });
      return;
    }

    setLoading(true);
    fetch(`${API_URL}email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: member.email })
    })
    .then((response) => response.json())
    .then((data) => {
      setLoading(false);
      if (data.error) {
        setSnackbar({
          open: true,
          message: `인증 코드 전송 실패: ${data.details || data.error}`,
          severity: "error"
        });
      } else {
        setSnackbar({
          open: true,
          message: "인증 코드가 이메일로 전송되었습니다",
          severity: "success"
        });
        setCodeSent(true);
        setCountdown(180); // 3분 타이머 설정
      }
    })
    .catch((error) => {
      setLoading(false);
      console.error("인증 코드 전송 오류:", error);
      setSnackbar({
        open: true,
        message: "서버 오류가 발생했습니다. 다시 시도해주세요",
        severity: "error"
      });
    });
  };

  // 인증 코드 확인
  const verifyCode = async () => {
    if (!verificationCode) {
      setSnackbar({
        open: true,
        message: "인증 코드를 입력해주세요",
        severity: "warning"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}email/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: member.email, code: verificationCode })
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        throw new Error(data.error || "인증 코드 확인 실패");
      }

      setSnackbar({
        open: true,
        message: "이메일 인증이 완료되었습니다",
        severity: "success"
      });
      setIsVerified(true);
      handleNext(); // 인증 완료 후 다음 단계로 자동 이동
    } catch (error) {
      setLoading(false);
      console.error("인증 코드 확인 오류:", error.message);
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error"
      });
    }
  };

  // 카카오 주소 검색 후 선택한 주소를 상태에 저장
  const handleAddressSelect = (data) => {
    setMember({
      ...member,
      postalCode: data.zonecode,
      roadAddress: data.roadAddress,
    });
  };

  // 각 단계별 유효성 검사
  const validateStep = (step) => {
    switch (step) {
      case 0: // 기본 정보 단계
        return (
          member.username &&
          member.name &&
          member.password &&
          member.confirmPassword &&
          member.password === member.confirmPassword &&
          member.email &&
          !emailError &&
          !errors.username &&
          !errors.name &&
          !errors.password &&
          !errors.email
        );
      case 1: // 이메일 인증 단계
        return isVerified;
      case 2: // 주소 정보 단계
        return (
          member.postalCode &&
          member.roadAddress &&
          member.detailAddress &&
          member.companyName &&
          (!member.contactNumber || !errors.contactNumber)
        );
      default:
        return true;
    }
  };

  // 다음 단계로 이동
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    } else {
      setSnackbar({
        open: true,
        message: "필수 항목을 모두 입력해주세요",
        severity: "warning"
      });
    }
  };

  // 이전 단계로 이동
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // 회원가입 제출
 const handleSubmit = () => {
   // 백엔드 DTO와 일치하는 필드만 추출
   const { confirmPassword, ...memberData } = member;

   setLoading(true);
   fetch(`${API_URL}members/register`, {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify(member)
   })
   .then(async (response) => {
     const message = await response.text();
     setLoading(false);

     if (response.ok) {
       setSnackbar({
         open: true,
         message: "회원가입이 완료되었습니다",
         severity: "success"
       });
       setActiveStep(3);
       setTimeout(() => navigate("/login"), 3000);
     } else {
       setSnackbar({
         open: true,
         message: `회원가입 실패: ${message}`,
         severity: "error"
       });
     }
   })
   .catch((error) => {
     setLoading(false);
     console.error("회원가입 중 오류 발생:", error);
     setSnackbar({
       open: true,
       message: "서버 오류가 발생했습니다. 다시 시도해주세요",
       severity: "error"
     });
   });
 };

  // 스낵바 닫기
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // 폼 렌더링
  const renderForm = () => {
    switch (activeStep) {
      case 0: // 기본 정보 입력
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                기본 정보 입력
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="아이디(username) *"
                name="username"
                value={member.username}
                onChange={handleChange}
                error={!!errors.username}
                helperText={errors.username}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="이름 *"
                name="name"
                value={member.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="이메일 *"
                name="email"
                type="email"
                value={member.email}
                onChange={handleChange}
                error={!!emailError || !!errors.email}
                helperText={emailError || errors.email}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="비밀번호 *"
                name="password"
                type={showPassword ? "text" : "password"}
                value={member.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password || "비밀번호는 4자 이상 16자 이하로 입력해주세요"}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="비밀번호 확인 *"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={member.confirmPassword}
                onChange={handleChange}
                error={passwordError === "비밀번호가 일치하지 않습니다"}
                helperText={passwordError}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  "& .MuiFormHelperText-root": {
                    color: passwordError === "비밀번호가 일치합니다" ? "green" : undefined
                  }
                }}
              />
            </Grid>
          </Grid>
        );

      case 1: // 이메일 인증
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                이메일 인증
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="이메일"
                value={member.email}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center">
                <Button
                  variant="contained"
                  onClick={sendVerificationCode}
                  disabled={loading || codeSent && countdown > 0}
                  sx={{ mr: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : "인증 코드 전송"}
                </Button>
                {codeSent && countdown > 0 && (
                  <Typography color="primary">
                    {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
                  </Typography>
                )}
              </Box>
            </Grid>
            {codeSent && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="인증 코드"
                    name="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={isVerified}
                    InputProps={{
                      endAdornment: isVerified && (
                        <InputAdornment position="end">
                          <CheckCircle color="success" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={verifyCode}
                    disabled={loading || isVerified || !verificationCode}
                  >
                    {loading ? <CircularProgress size={24} /> : "인증 확인"}
                  </Button>
                </Grid>
              </>
            )}
            {isVerified && (
              <Grid item xs={12}>
                <Alert severity="success">이메일 인증이 완료되었습니다.</Alert>
              </Grid>
            )}
          </Grid>
        );

      case 2: // 주소 정보 입력
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                추가 정보 입력
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="회사명 *"
                name="companyName"
                value={member.companyName}
                onChange={handleChange}
                error={!!errors.companyName}
                helperText={errors.companyName}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="연락처 (예: 010-1234-5678)"
                name="contactNumber"
                value={member.contactNumber}
                onChange={handleChange}
                error={!!errors.contactNumber}
                helperText={errors.contactNumber}
              />
            </Grid>
            <Grid item xs={9}>
              <TextField
                fullWidth
                label="우편번호 *"
                name="postalCode"
                value={member.postalCode}
                disabled
              />
            </Grid>
            <Grid item xs={3}>
              <KakaoAddressSearch onAddressSelect={handleAddressSelect} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="도로명 주소 *"
                name="roadAddress"
                value={member.roadAddress}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="상세 주소 *"
                name="detailAddress"
                value={member.detailAddress}
                onChange={handleChange}
                error={!!errors.detailAddress}
                helperText={errors.detailAddress}
              />
            </Grid>
          </Grid>
        );

      case 3: // 회원가입 완료
        return (
          <Grid container spacing={2} justifyContent="center">
            <Grid item xs={12} textAlign="center">
              <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                회원가입이 완료되었습니다!
              </Typography>
              <Typography variant="body1" gutterBottom>
                잠시 후 로그인 페이지로 이동합니다...
              </Typography>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" align="center" gutterBottom>
          회원가입
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderForm()}

        {activeStep !== 3 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              이전
            </Button>

            {activeStep === steps.length - 2 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "회원가입"}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={activeStep === 1 && !isVerified}
              >
                다음
              </Button>
            )}
          </Box>
        )}
      </Paper>

      {/* 알림 메시지 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}