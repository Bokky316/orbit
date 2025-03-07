/**
    * authUtil.js
    *
    * 로컬 스토리지에 토큰과 사용자 정보 저장
    * - 로그인 성공 시 호출
    * - 토큰과 사용자 정보를 로컬 스토리지에 저장
    * - 로그인 후에도 새로고침 시에도 로그인 상태를 유지하기 위해 사용
 */
export const setTokenAndUser = (token, user) => {
    // 1. localStorage에 토큰 저장
    localStorage.setItem("token", token);
    // localStorage에 저장한 토큰을 확인
    console.log("localStorage token:", localStorage.getItem("token"));

    // 2. localStorage에 사용자 정보 저장
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    // localStorage에 저장한 사용자 정보를 확인
    console.log("localStorage loggedInUser:", localStorage.getItem("loggedInUser"));
};

//export const getUserFromLocalStorage = () => {
//    const storedUser = localStorage.getItem("loggedInUser");
//    return storedUser ? JSON.parse(storedUser) : null;
//};

// [수정]
    /*
    * 로컬 스토리지에서 사용자 정보 가져오기
    * - 로그인 상태를 유지하기 위해 사용
    */
    export const getUserFromLocalStorage = () => {
        const storedUser = localStorage.getItem("loggedInUser");
        if (!storedUser) return null;

        const parsedUser = JSON.parse(storedUser);

        // authorities 문자열을 배열로 변환
        if (parsedUser.authorities && typeof parsedUser.authorities === "string") {
            // "[ROLE_ADMIN]" 형식의 문자열을 배열로 변환
            parsedUser.roles = parsedUser.authorities
                .replace(/[\[\]]/g, "") // 대괄호 제거
                .split(",") // 쉼표로 나누기
                .map((role) => role.trim()); // 앞뒤 공백 제거
        } else {
            parsedUser.roles = []; // authorities가 없으면 빈 배열로 초기화
        }

        return parsedUser;
    };

/**
 * 로컬 스토리지에서 데이터 제거
 * - 토큰과 사용자 정보를 로컬 스토리지에서 제거
 * - 로그아웃 시 호출
 * - 하지만 애플리케이션에서 상태를 변경한 이후, localStorage 데이터를 동기화하지 못하거나 캐시된 데이터를 다시 읽어올 가능성이 있습니다.
 * - 웹브라우저 애플리케이션 탭에는 삭제된 내용이 보인다.
 * - 로그아웃 후에도 useEffect나 다른 비동기 처리 코드가 동작하면서 localStorage에 이전 데이터를 다시 쓰고 있을 수 있습니다.
 */
export const removeAuthData = () => {
    console.log("Before removal:", localStorage.getItem("token"));

    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");

    console.log("After removal:", localStorage.getItem("token"));

    console.log("localStorage cleared.")
};
