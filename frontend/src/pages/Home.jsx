// src/pages/Home.js

import React from "react";
import { Link } from "react-router-dom";
import { Button, Box } from "@mui/material";

/**
 * Home 페이지 컴포넌트
 * @returns {JSX.Element}
 */
const Home = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: 2,
      }}
    >
      <h1 className="text-3xl font-bold mb-4">Home</h1>
      <Link to="/login" style={{ textDecoration: "none" }}>
        <Button variant="contained" color="primary">
          로그인
        </Button>
      </Link>
      <Link to="/biddings" style={{ textDecoration: "none" }}>
        <Button variant="contained" color="primary">
          입찰 공고 리스트
        </Button>
      </Link>
      <Link to="/projects" style={{ textDecoration: "none" }}>
        <Button variant="contained" color="primary">
          프로젝트 관리
        </Button>
      </Link>
      <Link to="/purchase-requests" style={{ textDecoration: "none" }}>
        <Button variant="contained" color="primary">
          구매 요청 관리
        </Button>
      </Link>
      <Link to="/approvals" style={{ textDecoration: "none" }}>
        <Button variant="contained" color="primary">
          결재 관리
        </Button>
      </Link>
    </Box>
  );
};

export default Home;
