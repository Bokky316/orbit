import { SERVER_URL } from "@/utils/constants";
import { getUserFromLocalStorage } from "@/utils/authUtil";

/**
 * 액세스 토큰 갱신 함수
 * - 리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급받는 함수
 * @returns {Promise<boolean>} 토큰 갱신 성공 여부
 */
export const refreshAccessToken = async () => {
  try {
    const response = await fetch(`${SERVER_URL}refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(
      "refreshAccessToken /refresh 요청후 받은 응답 response: ",
      response
    );

    if (!response.ok) {
      console.log("리프레시 토큰 갱신 실패", response.status);
      return false;
    }

    console.log("refreshAccessToken 리프레시 토큰 발급 성공");
    return true; // 성공 시 true 반환
  } catch (error) {
    console.error("리프레시 토큰 처리 오류:", error.message);
    return false; // 실패 시 false 반환
  }
};

/**
 * API 요청을 보내는 함수
 * - 요청을 보낼 때 헤더와 JWT 토큰을 포함하여 요청
 * @param {string} url 요청할 URL
 * @param {Object} options fetch API의 두 번째 인자로 전달할 옵션 객체
 * @returns {Promise<Response>} fetch 응답 객체
 */
export const fetchWithAuth = async (url, options = {}) => {
  console.log("fetchWithAuth called with:", { url, options });

  // 로컬 스토리지에서 토큰 가져오기
  const token = localStorage.getItem("token");

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}), // JWT 토큰 추가
      ...options.headers, // 기존 헤더 유지
    },
    credentials: "include",
  };

  if (config.method) {
    config.method = config.method.toUpperCase();
  }

  console.log("Sending request with config:", config);

  try {
    const response = await fetch(url, config);
    console.log("Response received:", response);

    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (response.status === 401) {
      console.log(
        "fetchWithAuth.js: 액세스 토큰 만료되어 refreshAccessToken() 호출 - 1"
      );
      const refreshSuccess = await refreshAccessToken();

      if (refreshSuccess) {
        console.log("리프레시 토큰 성공, 기존 요청 재시도");
        // 갱신된 토큰을 사용하여 재시도
        const newToken = localStorage.getItem("token");
        const newConfig = {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}), // 갱신된 JWT 토큰 사용
            ...options.headers, // 기존 헤더 유지
          },
          credentials: "include",
        };
        const newResponse = await fetch(url, newConfig);
        return newResponse;
      } else {
        console.error("리프레시 토큰 갱신 실패, 로그인 페이지로 리다이렉트");
        window.location.href = "/login"; // 로그인 페이지 URL을 적절히 수정하세요
        throw new Error("Unauthorized: 리프레시 토큰 갱신 실패");
      }
    }

    return response;
  } catch (error) {
    console.error("API 요청 실패:", error.message);
    throw error;
  }
};

/**
 * 인증이 필요 없는 API 요청을 보내는 함수
 * - JWT 토큰을 포함하지 않고 요청
 * - 예를들면 회원가입, 로그인 등
 * @param {string} url 요청할 URL
 * @param {Object} options fetch API의 두 번째 인자로 전달할 옵션 객체
 * @returns {Promise<Response>} fetch 응답 객체
 */
export const fetchWithoutAuth = async (url, options = {}) => {
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers, // 기존 헤더 유지
    },
    credentials: "include",
  };

  // HTTP 메소드를 대문자로 변환
  if (config.method) {
    config.method = config.method.toUpperCase();
  }

  console.log("Request config:", config);

  try {
    const response = await fetch(url, config); // 비동기 요청
    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }
    return response; // 서버 응답 반환
  } catch (error) {
    console.error("API 요청 실패:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    throw error;
  }
};
