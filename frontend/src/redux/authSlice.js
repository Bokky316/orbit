import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "@/utils/constants";

// 비동기 액션 생성
export const registerMember = createAsyncThunk(
  "auth/registerMember",
  async (memberData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}members/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData)
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        return rejectWithValue(errorMessage);
      }

      return await response.text();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loginMember = createAsyncThunk(
  "auth/loginMember",
  async (loginData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}members/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData)
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        return rejectWithValue(errorMessage);
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendVerificationCode = createAsyncThunk(
  "auth/sendVerificationCode",
  async (email, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}email/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include", // 중요: 크로스 오리진 요청 시 쿠키 포함
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        return rejectWithValue(errorMessage);
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const verifyEmailCode = createAsyncThunk(
  "auth/verifyEmailCode",
  async ({ email, code }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}email/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        return rejectWithValue(errorMessage);
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 초기 상태
const initialState = {
  user: null,
  isLoggedIn: false,
  status: "idle", // idle, loading, succeeded, failed
  error: null,
  registrationStatus: "idle", // idle, loading, succeeded, failed
  registrationError: null,
  emailVerification: {
    status: "idle", // idle, sending, sent, verifying, verified, failed
    error: null,
    countdown: 0 // 인증 코드 유효 시간 카운트다운
  }
};

// 슬라이스 생성
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isLoggedIn = false;
      // 로컬 스토리지의 토큰 정보 삭제
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    resetRegistrationStatus: (state) => {
      state.registrationStatus = "idle";
      state.registrationError = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.isLoggedIn = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    setLoading: (state, action) => {
      state.status = action.payload ? "loading" : "idle";
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isLoggedIn = !!action.payload;
    },
    resetEmailVerification: (state) => {
      state.emailVerification = {
        status: "idle",
        error: null,
        countdown: 0
      };
    },
    decrementCountdown: (state) => {
      if (state.emailVerification.countdown > 0) {
        state.emailVerification.countdown -= 1;
      }
    },
    setTokenFromLocalStorage: (state) => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");

      if (token && user) {
        state.isLoggedIn = true;
        state.user = JSON.parse(user);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // 회원가입 상태 관리
      .addCase(registerMember.pending, (state) => {
        state.registrationStatus = "loading";
      })
      .addCase(registerMember.fulfilled, (state) => {
        state.registrationStatus = "succeeded";
      })
      .addCase(registerMember.rejected, (state, action) => {
        state.registrationStatus = "failed";
        state.registrationError = action.payload;
      })

      // 로그인 상태 관리
      .addCase(loginMember.pending, (state) => {
        state.status = "loading";
      })
      .addCase(loginMember.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.isLoggedIn = true;
        state.user = action.payload;

        // 로컬 스토리지에 사용자 정보와 토큰 저장
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload));
      })
      .addCase(loginMember.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // 이메일 인증 코드 전송 상태 관리
      .addCase(sendVerificationCode.pending, (state) => {
        state.emailVerification.status = "sending";
      })
      .addCase(sendVerificationCode.fulfilled, (state) => {
        state.emailVerification.status = "sent";
        state.emailVerification.countdown = 180; // 3분
      })
      .addCase(sendVerificationCode.rejected, (state, action) => {
        state.emailVerification.status = "failed";
        state.emailVerification.error = action.payload;
      })

      // 이메일 인증 코드 확인 상태 관리
      .addCase(verifyEmailCode.pending, (state) => {
        state.emailVerification.status = "verifying";
      })
      .addCase(verifyEmailCode.fulfilled, (state) => {
        state.emailVerification.status = "verified";
      })
      .addCase(verifyEmailCode.rejected, (state, action) => {
        state.emailVerification.status = "failed";
        state.emailVerification.error = action.payload;
      });
  }
});

// 액션 내보내기
export const {
  logout,
  resetRegistrationStatus,
  resetEmailVerification,
  decrementCountdown,
  setTokenFromLocalStorage,
  clearUser,
  setLoading,
  setUser,
} = authSlice.actions;

// 선택자 (Selector) 함수
export const selectUser = (state) => state.auth.user;
export const selectIsLoggedIn = (state) => state.auth.isLoggedIn;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
export const selectRegistrationStatus = (state) => state.auth.registrationStatus;
export const selectRegistrationError = (state) => state.auth.registrationError;
export const selectEmailVerificationStatus = (state) => state.auth.emailVerification;

export default authSlice.reducer;