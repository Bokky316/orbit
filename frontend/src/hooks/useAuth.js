import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserInfo, clearUser } from "@/redux/authSlice";
import { fetchWithoutAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";

/**
 * 사용자 인증 상태를 관리하는 커스텀 훅
 * - 로그인 상태를 확인하고 Redux 상태를 업데이트합니다.
 * - isLoading: 로그인 상태 확인 중 여부
 * - isLoggedIn: 로그인 여부
 * - user: 사용자 정보
 */
const useAuth = () => {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(true); // 로딩 상태
    const { isLoggedIn, user } = useSelector(state => state.auth); // Redux에서 인증 상태와 사용자 정보 가져오기

    useEffect(() => {
        const checkLoginStatus = async () => {
            setIsLoading(true); // 로딩 시작
            try {
                // 사용자 정보 확인 요청
                const response = await fetchWithoutAuth(`${API_URL}auth/userInfo`, {
                    method: 'GET',
                    credentials: 'include', // HttpOnly 쿠키 포함
                });
                const data = await response.json();

                if (response.ok && data.status === "success") {
                    // 로그인 성공 시 사용자 정보 Redux에 저장
                    dispatch(fetchUserInfo(data.data));
                } else {
                    // 로그인 실패 시 사용자 정보 초기화
                    dispatch(clearUser());
                }
            } catch (error) {
                console.error('Error checking login status:', error);
                dispatch(clearUser()); // 오류 발생 시 사용자 정보 초기화
            } finally {
                setIsLoading(false); // 로딩 종료
            }
        };

        checkLoginStatus();
    }, [dispatch]);

    return { isLoading, isLoggedIn, user }; // 로딩 상태, 로그인 여부, 사용자 정보 반환
};

export default useAuth;
