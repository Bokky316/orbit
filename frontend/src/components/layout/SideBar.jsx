import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearUser } from "@/redux/authSlice";
import "/public/css/layout/Layout.css";

// 대카테고리 메뉴 데이터
const mainMenuItems = [
  { label: "대시보드", path: "/dashboard" },
  { label: "사용자관리", path: "/members" },
  { label: "협력사관리", path: "/approvers" },
  { label: "품목관리", path: "/items" },
  { label: "프로젝트관리", path: "/projects" },
  { label: "구매요청관리", path: "/purchase-requests" },
  { label: "입찰공고관리", path: "/biddings" },
  { label: "계약관리", path: "/contracts" },
  { label: "발주관리", path: "/orders" },
  { label: "입고 관리", path: "/deliveries" },
  { label: "검수 관리", path: "/inspections" },
  { label: "송장 관리", path: "/invoices" },
  { label: "자금 관리", path: "/funds" },
  { label: "보고서생성/관리", path: "/reports" }
];

function SideBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 현재 활성화된 메뉴 확인
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      // 서버에 로그아웃 요청 (옵션)
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });

      // Redux 상태 초기화
      dispatch(clearUser());

      // 로그인 페이지로 리다이렉트
      navigate("/login");
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);

      // 에러 발생해도 클라이언트 상태는 초기화
      dispatch(clearUser());
      navigate("/login");
    }
  };

  return (
    <div className="sidebar_container">
      {/* 대카테고리 메뉴 */}
      <ul className="sidebar_menu">
        {mainMenuItems.map((item, index) => (
          <li key={index} className="sidebar_menu_item">
            <Link
              to={item.path}
              className={`sidebar_menu_link ${
                isActive(item.path) ? "active" : ""
              }`}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="sidebar_bottom">
        <button onClick={handleLogout} className="sidebar_logout">
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
