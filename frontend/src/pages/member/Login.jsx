import React, { useState, useEffect } from "react";
import {
    Button,
    TextField,
    Snackbar,
    IconButton,
    InputAdornment,
    Box,
    Typography
} from "@mui/material";
import { useDispatch } from 'react-redux';
import { setUser } from '@/redux/authSlice';
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { API_URL } from "@/utils/constants";
import { setTokenAndUser } from "@/utils/authUtil";

/**
 * @return {JSX.Element}
 */
export default function Login() {
    const [credentials, setCredentials] = useState({ username: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [showLoginFields, setShowLoginFields] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleChange = (event) => {
        setCredentials((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    };

    const handleLogin = async () => {
        try {
            const response = await fetch(API_URL + "auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams(credentials), // 폼 데이터 전송
                credentials: "include",
            });

            if (response.ok) {
                // 로그인 성공
                setOpenSnackbar(true);
                setTimeout(() => {
                    navigate("/");
                    window.location.reload();
                }, 1000);
            } else {
                // 로그인 실패
                const errorText = await response.text();
                setErrorMessage(`로그인 실패: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error("로그인 요청 실패:", error.message);
            setErrorMessage("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
        }
    };

   useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Enter" && showLoginFields) {
                event.preventDefault();
                handleLogin();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [credentials, showLoginFields]);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                backgroundColor: "#f9f9f9",
            }}
        >
            <Typography variant="h5" sx={{ mb: 2 }}>
                로그인
            </Typography>

            <Button
                variant="contained"
                color="primary"
                onClick={() => setShowLoginFields(!showLoginFields)}
                sx={{ mb: 2 }}
            >
                {showLoginFields ? "취소" : "아이디로 로그인"}
            </Button>

            {showLoginFields && (
                <Box
                    component="form"
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        width: "100%",
                        maxWidth: "400px",
                    }}
                    noValidate
                    autoComplete="off"
                >
                    <TextField
                        label="사용자 ID"
                        name="username"
                        type="text"
                        value={credentials.username}
                        onChange={handleChange}
                        fullWidth
                        required
                    />

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
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleLogin}
                    >
                        로그인
                    </Button>
                </Box>
            )}

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
