package com.orbit.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

/**
 * 쿠키 유틸리티
 * - RefreshTokenController, RefreshTokenCheckFilter에서 사용
 * - 쿠키에서 토큰 추출 및 쿠키 추가
 */
public class CookieUtil {

    public static String getTokenFromCookies(Cookie[] cookies, String tokenName) {
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (tokenName.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    public static void addHttpOnlyCookie(HttpServletResponse response, String name, String value, boolean secure) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);
        cookie.setSecure(secure);
        cookie.setPath("/");
        response.addCookie(cookie);
    }
}
