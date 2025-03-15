import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import NotificationBadgeIcon from "../notification/NotificationBadgeIcon";
import "/public/css/layout/Layout.css";

function TopBar() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(0);

  // Redux에서 사용자 정보 가져오기
  const { user } = useSelector((state) => state.auth);

  // 소카테고리 메뉴 데이터 - URL 경로에 따라 정의
  const subCategories = {
    "/members": [
      { label: "부서관리", path: "/department" },
      { label: "직원관리", path: "/employee" },
      { label: "합의사관리", path: "/approver" },
      { label: "시스템설정", path: "/settings" }
    ],
    "/supplier": [
        { label: "협력업체리스트", path: "/supplier" },
        { label: "가입승인대기리스트", path: "/supplier/approval" },
    ],
    "/items": [{ label: "품목리스트", path: "/items/list" }],
    "/projects": [{ label: "프로젝트리스트", path: "/projects/list" }],
    "/purchase-requests": [
      { label: "구매요청리스트", path: "/purchase-requests/list" }
    ],
    "/approvals": [
      { label: "결재 목록", path: "/approvals" },
      { label: "결재선 관리", path: "/approval-lines" }
    ],
    "/biddings": [
      { label: "입찰공고리스트", path: "/biddings" },
      { label: "협력사평가리스트", path: "/biddings/evaluations" }
    ],
    "/contracts": [{ label: "계약리스트", path: "/contracts" }],
    "/orders": [{ label: "발주리스트", path: "/orders" }],
    "/invoices": [{ label: "송장리스트", path: "/invoices/list" }],
    "/funds": [{ label: "자금리스트", path: "/funds/list" }],
    "/reports": [{ label: "보고서리스트", path: "/reports/list" }],
    "/system": [
      { label: "공통 코드 관리", path: "/common-codes" },
      { label: "기타 설정", path: "/system/settings" }
    ],
    // 기본 탭
    default: []
  };

  // 현재 경로에 해당하는 소카테고리 가져오기
  const getCurrentSubCategories = () => {
    const path = location.pathname;
    for (const key in subCategories) {
      if (path.startsWith(key)) {
        return subCategories[key];
      }
    }
    return subCategories.default;
  };

  // 현재 활성화된 탭 결정하기
  useEffect(() => {
    const categories = getCurrentSubCategories();
    const path = location.pathname;

    for (let i = 0; i < categories.length; i++) {
      if (path.startsWith(categories[i].path)) {
        setActiveTab(i);
        break;
      }
    }
  }, [location.pathname]);

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const currentSubCategories = getCurrentSubCategories();

  return (
    <header className="top_container">
      <div className="top_toolbar">
        {/* 로고 영역 */}
        <Link to="/dashboard" className="logo">
          <img src="/public/images/logo.png" alt="logo" />
        </Link>
        {/* 소카테고리 탭 */}
        <nav className="sub_categories">
          {currentSubCategories.map((category, index) => (
            <Link
              key={index}
              to={category.path}
              className={`sub_category_tab ${
                activeTab === index ? "active" : ""
              }`}>
              {category.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="util_container">
        {/* 검색 바 */}
        <div className="search_container">
          <input
            type="text"
            className="search_input"
            placeholder="검색어를 입력해 주세요."
            aria-label="search"
          />
          <div className="search_icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M17.3 17.3C16.9134 17.6866 16.2866 17.6866 15.9 17.3L10.9329 12.3329C10.5726 11.9726 10.0025 11.9494 9.55934 12.2008C9.25295 12.3747 8.92484 12.5244 8.575 12.65C7.925 12.8833 7.23333 13 6.5 13C4.68333 13 3.14583 12.3708 1.8875 11.1125C0.629167 9.85417 0 8.31667 0 6.5C0 4.68333 0.629167 3.14583 1.8875 1.8875C3.14583 0.629167 4.68333 0 6.5 0C8.31667 0 9.85417 0.629167 11.1125 1.8875C12.3708 3.14583 13 4.68333 13 6.5C13 7.23333 12.8833 7.925 12.65 8.575C12.5244 8.92484 12.3747 9.25295 12.2008 9.55934C11.9494 10.0025 11.9726 10.5726 12.3329 10.9329L17.3 15.9C17.6866 16.2866 17.6866 16.9134 17.3 17.3ZM6.5 11C7.75 11 8.8125 10.5625 9.6875 9.6875C10.5625 8.8125 11 7.75 11 6.5C11 5.25 10.5625 4.1875 9.6875 3.3125C8.8125 2.4375 7.75 2 6.5 2C5.25 2 4.1875 2.4375 3.3125 3.3125C2.4375 4.1875 2 5.25 2 6.5C2 7.75 2.4375 8.8125 3.3125 9.6875C4.1875 10.5625 5.25 11 6.5 11Z"
                fill="#1C1B1F"
              />
            </svg>
          </div>
        </div>

        {/* 알림 아이콘 */}
        <NotificationBadgeIcon />

        {/* 로그인 정보 */}
        <div className="login_info">
          <span className="login_name">
            {user?.name ? `${user.name}님` : "사용자"}
          </span>
          <span className="login_position">마케팅팀</span>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
