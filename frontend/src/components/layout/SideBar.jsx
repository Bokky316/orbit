import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "@/redux/authSlice";
import "/public/css/layout/Layout.css";

// 구매자(BUYER) 및 관리자(ADMIN) 메뉴
const buyerAdminMenuItems = [
  { label: "대시보드", path: "/dashboard" },
  { label: "사용자관리", path: "/members", roles: ["ROLE_ADMIN"] },
  { label: "협력업체관리", path: "/supplier" },
  { label: "품목관리", path: "/items" },
  { label: "프로젝트관리", path: "/projects" },
  { label: "구매요청관리", path: "/purchase-requests" },
  { label: "결재관리", path: "/approvals" },
  { label: "입찰공고관리", path: "/biddings" },
  { label: "계약관리", path: "/contracts" },
  { label: "발주관리", path: "/orders" },
  { label: "입고 관리", path: "/deliveries" },
  { label: "송장 관리", path: "/invoices" },
  { label: "자금 관리", path: "/payments" },
  { label: "보고서생성/관리", path: "/reports" },
  { label: "시스템 설정", path: "/system", roles: ["ROLE_ADMIN"] }
];

// 공급업체(SUPPLIER) 메뉴
const supplierMenuItems = [
  { label: "대시보드", path: "/supplierDashboard" },
  { label: "입찰 정보", path: "/suppliers/biddings" },
  { label: "계약 정보", path: "/suppliers/contracts" },
  { label: "주문 정보", path: "/suppliers/orders" },
  { label: "송장 관리", path: "/suppliers/invoices" },
  { label: "내 정보 관리", path: "/supplier/registrations" }
];

function SideBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  // Redux 스토어에서 사용자 정보 확인
  // 1. 직접 auth.roles 사용
  // 2. auth.user?.roles 사용 (user 객체 내부에 있을 경우)
  const userRoles = auth.roles || auth.user?.roles || [];

  // 역할이 문자열인 경우 배열로 변환하여 처리
  const normalizedRoles = Array.isArray(userRoles)
    ? userRoles
    : [userRoles].filter(Boolean);

  // SUPPLIER 역할 여부 확인
  const isSupplier = normalizedRoles.some(
    (role) => role === "SUPPLIER" || role === "ROLE_SUPPLIER"
  );

  // 역할에 따라 메뉴 선택
  const menuItems = isSupplier ? supplierMenuItems : buyerAdminMenuItems;

  // 현재 활성화된 메뉴 확인
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  // 사용자 역할에 따른 메뉴 접근 권한 확인
  const hasAccess = (item) => {
    // roles 속성이 없으면 모든 사용자가 접근 가능
    if (!item.roles) return true;

    // roles 속성이 있으면 해당 역할을 가진 사용자만 접근 가능
    return normalizedRoles.some((role) => item.roles.includes(role));
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      // 서버에 로그아웃 요청 (옵션)
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });

      // 로컬 스토리지 데이터 삭제
      localStorage.removeItem("loggedInUser");

      // Redux 상태 초기화
      dispatch(clearUser());

      // 로그인 페이지로 리다이렉트
      navigate("/login");
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);

      // 에러 발생해도 클라이언트 상태는 초기화
      localStorage.removeItem("loggedInUser");
      dispatch(clearUser());
      navigate("/login");
    }
  };

  return (
    <div className="sidebar_container">
      {/* 메뉴 항목 */}
      <ul className="sidebar_menu">
        {menuItems.map(
          (item, index) =>
            // 접근 권한이 있는 메뉴만 표시
            hasAccess(item) && (
              <li key={index} className="sidebar_menu_item">
                <Link
                  to={item.path}
                  className={`sidebar_menu_link ${
                    isActive(item.path) ? "active" : ""
                  }`}>
                  {item.label}
                </Link>
              </li>
            )
        )}
      </ul>

      <div className="sidebar_bottom">
        <button
          onClick={handleLogout}
          className="sidebar_logout"
          style={{ cursor: "pointer" }}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H9V2H2V16H9V18H2ZM13 14L11.625 12.55L14.175 10H6V8H14.175L11.625 5.45L13 4L18 9L13 14Z"
              fill="#666666"
            />
          </svg>
          로그아웃
        </button>
      </div>
    </div>
  );
}

export default SideBar;
