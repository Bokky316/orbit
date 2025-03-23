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
      { label: "사용자목록", path: "/members" },
    ],
    "/supplier": [
      { label: "협력업체리스트", path: "/supplier" },
      { label: "가입승인대기리스트", path: "/supplier/approval" }
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
      { label: "협력사평가리스트", path: "/biddings/evaluations" },
      { label: "발주리스트", path: "/biddings/orders" }
    ],
    "/contracts": [{ label: "계약리스트", path: "/contracts/list" }],
    "/orders": [{ label: "발주리스트", path: "/orders/list" }],
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
    if (categories.length === 0) return;

    const path = location.pathname;
    let foundMatch = false;

    // 가장 정확한 매칭을 찾기 위해 가장 긴 경로부터 확인
    const sortedCategories = [...categories].sort(
      (a, b) => b.path.length - a.path.length
    );

    // 정확한 경로 일치 확인
    for (let i = 0; i < sortedCategories.length; i++) {
      const categoryPath = sortedCategories[i].path;
      if (path === categoryPath || path.startsWith(categoryPath + "/")) {
        // 원래 배열에서의 인덱스 찾기
        const originalIndex = categories.findIndex(
          (cat) => cat.path === categoryPath
        );
        setActiveTab(originalIndex);
        foundMatch = true;
        break;
      }
    }

    // 일치하는 탭이 없으면 첫 번째 탭을 활성화
    if (!foundMatch) {
      setActiveTab(0);
    }
  }, [location.pathname]);

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
