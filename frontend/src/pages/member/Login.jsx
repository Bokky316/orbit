import React, { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Snackbar,
  IconButton,
  InputAdornment,
  Box,
  Typography,
  Link,
  FormHelperText,
  Grid,
  Card,
  CardContent
} from "@mui/material";
import { useDispatch } from "react-redux";
import { setUser, setLoading } from "@/redux/authSlice";
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Cancel,
  PersonAdd,
  Business
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { API_URL } from "@utils/constants";
import "/public/css/member/member.css";

export default function Login() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    hasRequiredChars: false,
    hasMinLength: false
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 비밀번호 유효성 검사
  useEffect(() => {
    const { password } = credentials;
    // 영문/숫자/특수문자 중 1가지 이상 포함 검사
    const hasRequiredChars =
      /^(?=.*[a-zA-Z])|(?=.*\d)|(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(
        password
      );
    // 4자 이상 검사
    const hasMinLength = password.length >= 4;

    setPasswordValidation({
      hasRequiredChars,
      hasMinLength
    });
  }, [credentials.password]);

  // 로그인 버튼 활성화 여부
  const isLoginEnabled =
    credentials.username.trim() !== "" && credentials.password.trim() !== "";

  const handleChange = (event) => {
    setCredentials((prev) => ({
      ...prev,
      [event.target.name]: event.target.value
    }));
  };

  const handleLogin = async () => {
    try {
      // 로딩 상태 시작
      dispatch(setLoading(true));

      console.log("로그인 요청 데이터:", credentials);

      const response = await fetch(`${API_URL}auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams(credentials),
        credentials: "include"
      });

      console.log("응답 상태:", response.status);

      // JSON으로 직접 파싱
      const parsedData = await response.json();
      console.log("파싱된 데이터:", parsedData);

      if (response.ok && parsedData.status === "success") {
        const userData = {
          id: parsedData.id,
          username: parsedData.username,
          name: parsedData.name,
          email: parsedData.email,
          companyName: parsedData.companyName,
          contactNumber: parsedData.contactNumber,
          postalCode: parsedData.postalCode,
          roadAddress: parsedData.roadAddress,
          detailAddress: parsedData.detailAddress,
          department: parsedData.department,
          roles: parsedData.roles || [],
          isLoggedIn: true
        };

        // 로컬 스토리지에 저장
        localStorage.setItem("user", JSON.stringify(userData));

        // Redux 스토어에 저장
        dispatch(setUser(userData));

        // 성공 메시지 표시
        setOpenSnackbar(true);
        setErrorMessage("로그인 성공");

        // 잠시 후 메인 페이지로 이동
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        // 로그인 실패
        // 비활성화된 계정 체크
        if (response.status === 401) {
          setErrorMessage("비활성화된 계정입니다. 관리자에게 문의하세요.");
        } else {
          setErrorMessage(parsedData.message || "로그인에 실패했습니다.");
        }
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error("로그인 요청 실패:", error);
      setErrorMessage("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      setOpenSnackbar(true);
    } finally {
      // 로딩 상태 종료
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter" && isLoginEnabled) {
        event.preventDefault();
        handleLogin();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [credentials, isLoginEnabled]);

  const handleMemberSignup = () => {
    navigate("/signup");
  };

  const handleSupplierSignup = () => {
    navigate("/signup/supplier");
  };

  return (
    <div className="login_container">
      <div></div>
      <div className="logo">
        <img src="/public/images/logo.png" alt="logo" />
      </div>

      <Box
        component="form"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          width: "100%",
          maxWidth: "400px"
        }}
        noValidate
        autoComplete="off">
        <TextField
          label="사용자 ID"
          name="username"
          type="text"
          value={credentials.username}
          onChange={handleChange}
          fullWidth
          required
        />

        <Box sx={{ width: "100%" }}>
          <TextField
            label="비밀번호"
            name="password"
            type={showPassword ? "text" : "password"}
            value={credentials.password}
            onChange={handleChange}
            fullWidth
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {credentials.password && (
            <Box sx={{ mt: 1 }}>
              <FormHelperText
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: passwordValidation.hasRequiredChars
                    ? "#4FC787"
                    : "#FA6B6B",
                  ml: 0
                }}>
                {passwordValidation.hasRequiredChars ? (
                  <CheckCircle
                    fontSize="small"
                    sx={{ mr: 0.5, color: "#4FC787" }}
                  />
                ) : (
                  <Cancel fontSize="small" sx={{ mr: 0.5, color: "#FA6B6B" }} />
                )}
                영문/숫자/특수문자 중 1가지 이상 포함
              </FormHelperText>

              <FormHelperText
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: passwordValidation.hasMinLength
                    ? "#4FC787"
                    : "#FA6B6B",
                  ml: 0
                }}>
                {passwordValidation.hasMinLength ? (
                  <CheckCircle
                    fontSize="small"
                    sx={{ mr: 0.5, color: "#4FC787" }}
                  />
                ) : (
                  <Cancel fontSize="small" sx={{ mr: 0.5, color: "#FA6B6B" }} />
                )}
                4자 이상
              </FormHelperText>
            </Box>
          )}
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={handleLogin}
          disabled={!isLoginEnabled}
          sx={{
            backgroundColor: isLoginEnabled ? "#FF7F3E" : "#BDBDBD"
          }}>
          로그인
        </Button>
      </Box>

      <div className="registration_section">
        <h4 style={{ marginBottom: '15px' }}>Join Our Network</h4>
        <Grid container spacing={2} sx={{ display: 'flex', justifyContent: 'center' }}>
          <Grid item xs={12} sm={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Card sx={{ height: '100%', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ textAlign: 'center', p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                <div>
                  <PersonAdd sx={{ fontSize: 40, color: '#FF7F3E', mb: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    일반회원으로 가입
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'normal', wordBreak: 'keep-all' }}>
                    일반 회원으로 가입하고 플랫폼의 서비스를 이용하세요!
                  </Typography>
                </div>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleMemberSignup}
                  sx={{
                    borderColor: '#FF7F3E',
                    color: '#FF7F3E',
                    '&:hover': {
                      backgroundColor: '#FFF0E8',
                      borderColor: '#FF7F3E'
                    },
                    mt: 'auto'
                  }}
                >
                  일반 회원가입
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Card sx={{ height: '100%', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ textAlign: 'center', p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                <div>
                  <Business sx={{ fontSize: 40, color: '#4284F3', mb: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    협력업체로 가입
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'normal', wordBreak: 'keep-all' }}>
                    협력업체로 가입하고 새로운 성장의 길을 열어보세요!
                  </Typography>
                </div>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleSupplierSignup}
                  sx={{
                    borderColor: '#4284F3',
                    color: '#4284F3',
                    '&:hover': {
                      backgroundColor: '#EBF2FF',
                      borderColor: '#4284F3'
                    },
                    mt: 'auto'
                  }}
                >
                  협력업체 가입
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </div>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        message={errorMessage}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      />
    </div>
  );
}