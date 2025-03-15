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
  FormHelperText
} from "@mui/material";
import { useDispatch } from "react-redux";
import { setUser, setLoading } from "@/redux/authSlice";
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Cancel
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { API_URL } from "@utils/constants";

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
  // useEffect(() => {
  //   const { password } = credentials;
  //   // 영문/숫자/특수문자 중 1가지 이상 포함 검사
  //   const hasRequiredChars =
  //     /^(?=.*[a-zA-Z])|(?=.*\d)|(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(
  //       password
  //     );
  //   // 6자 이상 검사
  //   const hasMinLength = password.length >= 6;

  //   setPasswordValidation({
  //     hasRequiredChars,
  //     hasMinLength
  //   });
  // }, [credentials.password]);

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

      const text = await response.text();
      console.log("응답 본문:", text);

      // 직접 파싱
      const parsedData = {
        message: text.match(/"message":"(.*?)"/)?.[1],
        status: text.match(/"status":"(.*?)"/)?.[1],
        id: parseInt(text.match(/"id":(\d+)/)?.[1]),
        username: text.match(/"username":"(.*?)"/)?.[1],
        name: text.match(/"name":"(.*?)"/)?.[1],
        roles: text
          .match(/"roles":\[(.*?)\]/)?.[1]
          ?.split(",")
          .map((role) => role.replace(/"/g, ""))
      };

      console.log("파싱된 데이터:", parsedData);

      if (response.ok && parsedData.status === "success") {
        // 사용자 정보 Redux 스토어에 저장
        dispatch(
          setUser({
            id: parsedData.id,
            username: parsedData.username,
            name: parsedData.name,
            roles: parsedData.roles,
            isLoggedIn: true,
            isSocialLogin: false
          })
        );

        // 성공 메시지 표시
        setOpenSnackbar(true);
        setErrorMessage("로그인 성공");

        // 잠시 후 메인 페이지로 이동
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        // 로그인 실패
        setErrorMessage(parsedData.message || "로그인에 실패했습니다.");
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

  const handleSignupNavigation = () => {
    navigate("/signup");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#f9f9f9",
        p: 2
      }}>
      <img src="/public/images/logo.png" alt="logo" />

      <Box
        component="form"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
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
          sx={{
            "& .MuiOutlinedInput-root": {
              "&:hover fieldset": {
                borderColor: "#4FC787", // success 컬러
                borderWidth: "1px"
              }
            }
          }}
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
            sx={{
              "& .MuiOutlinedInput-root": {
                "&:hover fieldset": {
                  borderColor: "#4FC787", // success 컬러
                  borderWidth: "1px"
                }
              }
            }}
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
                6자 이상
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
            mt: 2,
            backgroundColor: isLoginEnabled ? "#5d0000" : "#BDBDBD"
          }}>
          로그인
        </Button>
      </Box>

      <Box sx={{ mt: 3, textAlign: "center", width: "100%" }}>
        <Typography variant="body2">
          지금 바로 협력사 가입하고, <br />
          새로운 성장의 길을 열어보세요!{" "}
          <Link
            component="button"
            onClick={handleSignupNavigation}
            sx={{
              color: "primary.main",
              textDecoration: "underline",
              "&:hover": {
                color: "primary.dark"
              }
            }}>
            회원가입
          </Link>
        </Typography>
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        message={errorMessage}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      />
    </Box>
  );
}
