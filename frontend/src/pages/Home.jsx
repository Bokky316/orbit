import React from "react";
import { Outlet } from "react-router-dom";
import SideBar from "../components/layout/SideBar";
import TopBar from "../components/layout/TopBar";
import { Box } from "@mui/material";
import "/public/css/layout/Layout.css";

const Home = () => {
  return (
    <div>
      {/* 상단 탑바 (소카테고리) */}
      <TopBar />

      <Box sx={{ display: "flex" }}>
        {/* 왼쪽 사이드바 (대카테고리) */}
        <SideBar />

        {/* 메인 콘텐츠 */}
        <main className="main_content">
          <Outlet />
        </main>
      </Box>
    </div>
  );
};

export default Home;
