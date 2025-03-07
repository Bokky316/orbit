import React from "react";
import { Box, styled } from "@mui/material";
import SideBar from "./SideBar";
import TopBar from "./TopBar";
import "/public/css/layout/Layout.css";

/**
 *
 *
 * 왼쪽의 Sidebar(대카테고리)와 상단의 TopBar(소카테고리)로 구성되며,
 * 중앙에 메인 콘텐츠가 표시
 *
 * @param {React.ReactNode} children - 메인 콘텐츠가 여기에 나옴
 */
function MainContainer({ children }) {
  return (
    <div>
      {/* 상단 탑바 (소카테고리) */}
      <TopBar />

      <Box sx={{ display: "flex" }}>
        {/* 왼쪽 사이드바 (대카테고리) */}
        <SideBar />

        {/* 메인 콘텐츠 */}
        <main className="main_content">{children}</main>
      </Box>
    </div>
  );
}

export default MainContainer;
