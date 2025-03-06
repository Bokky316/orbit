import { createSlice } from "@reduxjs/toolkit";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";

/**
 * Redux Toolkit의 createSlice 함수를 사용하여 auth 슬라이스를 정의
 * 1. 슬라이스(Slice)는 Redux Toolkit에서 도입된 개념으로, Redux 상태의 한 부분을(사용자정보) 관리하기 위한 로직을 모아놓은 단위입니다.
 *    슬라이스는 다음 요소들을 포함합니다:
 *  - 이름 (name)
 *  - 초기 상태 (initialState)
 *  - 리듀서 함수들 (reducers)
 *  - 액션 생성자 함수들 (자동으로 생성됨)
 * 2. name: "auth" - 슬라이스 이름, 슬라이스는 리덕스 상태의 일부분을 나타냄, setUser 액션은 실제로는 "auth/setUser"라는 전체 액션 타입으로 생성됩니다. 이를 통해 각 슬라이스의 액션을 쉽게 구분하고 추적할 수 있습니다.
 *  - 이 슬라이스는 인증 관련 상태와 액션을 관리하지만, 직접적으로 스토어를 생성하지는 않습니다.
 *   대신, 이 슬라이스의 리듀서가 store.js에서 생성된 리덕스 스토어에  통합됩니다.
 * 3. initialState: 사용자 정보와 로그인 여부를 저장하는 상태 값
 *  - user: 사용자 정보 상태 값, 초기값은 null
 *  - isLoggedIn: 로그인 여부 상태 값, 초기값은 false
 * 4. reducers: 액션을 처리하는 함수를 정의
 *  - setUser: 사용자 정보를 저장하는 리듀서 함수
 *  - clearUser: 사용자 정보를 초기화하는 리듀서 함수
 *  - setUser, clearUser는 액션 생성자 함수로, 사용자 정보를 저장하거나 초기화하는 역할을 수행합니다.
 */
const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: null,
        isLoggedIn: false,
        isSocialLogin: false,
        isLoading: false,
    },
    reducers: {
        setUser(state, action) {
            state.user = action.payload;
            state.isLoggedIn = true;
            state.isSocialLogin = !!action.payload.provider;
        },
        clearUser(state) {
            state.user = null;
            state.isLoggedIn = false;
            state.isSocialLogin = false;
        },
        setLoading(state, action) {
            state.isLoading = action.payload;
        },
    },
});


/**
 * 사용자 정보를 가져오는 비동기 함수로 "청크" Thunk라고 부른다.
 * 1. 청크(떵크) Thunk
 * - Thunk는 비동기 함수이면서 동시에 액션을 디스패치하는 역할을 수행하는 함수를 반환하는 액션 생성자입니다
 * - 서버와의 비동기 통신을 처리하고, 결과에 따라 슬라이스의 액션을 호출하여 상태를 업데이트합니다.
 * - 비동기 작업이 완료된 후, 결과에 따라 새로운 액션을 디스패치할 수 있습니다
 * - Redux Toolkit의 createAsyncThunk 함수를 사용하여 비동기 액션을 생성합니다.
 * 2. fetchUserInfo 함수
 * - fetchWithAuth 함수를 사용하여 인증된 사용자 정보를 가져옵니다.
 * - fetchWithAuth 함수는 common/fetchWithAuth.js 파일에 정의되어 있습니다.
 * - API_URL 상수를 사용하여 API 서버 주소를 지정합니다.
 * - fetch 함수를 사용하여 API_URL/auth/userInfo 엔드포인트로 GET 요청을 보냅니다.
 * - 응답이 성공하면 사용자 정보를 JSON 형태로 변환하여 userData 변수에 저장합니다.
 * - 사용자 정보를 Redux 상태에 저장하기 위해 dispatch(setUser(userData)) 함수를 호출합니다.
 *   dispatch 함수는 액션을 리듀서로 보내는 역할을 합니다. 서버에서 받은 사용자 정보를 setUser
 *   액션 생성자 함수에 전달하여 사용자 정보를 저장합니다.
 */
export const fetchUserInfo = () => async (dispatch) => {
  try {
    const response = await fetchWithAuth(`${API_URL}auth/userInfo`);
    const userData = await response.json();

    if (userData && userData.status === "success") {
      dispatch(setUser({
        ...userData.data,
        isLoggedIn: true,
        isSocialLogin: !!userData.data.provider
      }));
    }
  } catch (error) {
    console.error("사용자 정보 가져오기 오류:", error);
  }
};




/**
 * 리프레시 토큰을 사용하여 액세스 토큰 갱신 및 사용자 정보 업데이트 (Thunk)
 */
export const refreshAccessToken = async () => {
    try {
        const response = await fetch(`${SERVER_URL}refresh`, {
            method: "POST",
            credentials: "include", // HttpOnly 쿠키를 포함해서 요청
            headers: {
                "Content-Type": "application/json",
            },
        });

        console.log("refreshAccessToken /refresh 요청후 받은 응답 response: ", response);

        if (!response.ok) {
            console.error("리프레시 토큰 갱신 실패", response.status);
            return null; // 실패 시 null 반환
        }

        const data = await response.json();
        console.log("새로운 액세스 토큰 발급 성공:", data.accessToken);

        return data.accessToken; // 성공 시 새로운 액세스 토큰 반환
    } catch (error) {
        console.error("리프레시 토큰 처리 오류:", error.message);
        return null; // 실패 시 null 반환
    }
};


/**
 * 자동 생성된 액션 생성자 함수 내보내기
 * - 액션 생성자 : Redux Toolkit의 createSlice가 reducers에 정의된 리듀서 함수(setUser, clearUser)를 기반으로 자동 생성한 액션 생성자 함수입니다.
 * - setUser: 사용자 정보를 payload로 받아 상태를 업데이트하는 액션 생성자.
 * - clearUser: 사용자 정보를 초기화하는 액션 생성자
 * - 액션 생성자 함수는 액션 객체를 생성하여 디스패치할 수 있도록 도와줍니다.
 * 다른 컴포넌트에서 사용 방법
 * - 외부에서 setUser와 clearUser를 import하면, 이를 통해 Redux 상태를 업데이트하는 액션을 쉽게 디스패치할 수 있습니다.
 * - dispatch(setUser({ name: "John", email: "john@example.com", provider: "kakao" }));
 *   이 코드는 다음과 같은 액션 객체를 생성하여 디스패치합니다:
 *   { type: "auth/setUser", payload: { name: "John", email: "john@example.com", provider: "kakao" } }
 * - 이 액션 객체는 Redux의 dispatch를 통해 리듀서가 실행되도록 전달됩니다.
 */
export const { setUser, clearUser, setLoading } = authSlice.actions;    // 액션 생성자 함수 내보내기

/**
 * authSlice 객체의 reducer 속성 내보내기
 * authSlice.reducer : Redux Toolkit의 createSlice() 함수로 생성된 리듀서 함수를 말한다.
 * authSlice.reducer는 Redux 상태를 변경하는 함수로, action.payload에 따라 상태를 변경한다.
 * 이렇게 내보내진 리듀서 함수를 사용하려면 store.js 파일에서 combineReducers 함수를 사용하여
 * 루트 리듀서를 생성할 때 포함해야 한다.
 */
export default authSlice.reducer;
