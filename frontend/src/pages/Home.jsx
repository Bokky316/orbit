import React from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Paper,
  Stack,
  Divider
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PeopleIcon from "@mui/icons-material/People";
import InventoryIcon from "@mui/icons-material/Inventory";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import NotificationsIcon from "@mui/icons-material/Notifications";

/**
 * Home 컴포넌트
 *
 * 메인 대시보드, 관리자, 직원, 협력사 구분해야함
 */
const Home = () => {
  // 통계 데이터
  // const statsData = [
  //   {
  //     title: "총 입찰 공고",
  //     value: "24건",
  //     icon: <AssignmentIcon color="primary" />
  //   },
  //   {
  //     title: "진행중 계약",
  //     value: "12건",
  //     icon: <ReceiptIcon color="primary" />
  //   },
  //   {
  //     title: "예정 발주",
  //     value: "8건",
  //     icon: <TrendingUpIcon color="primary" />
  //   },
  //   {
  //     title: "신규 알림",
  //     value: "15개",
  //     icon: <NotificationsIcon color="primary" />
  //   }
  // ];

  // 바로가기 메뉴
  // const quickMenus = [
  //   {
  //     title: "입찰 공고 관리",
  //     description: "입찰 공고를 등록하고 관리합니다.",
  //     icon: <AssignmentIcon fontSize="large" color="primary" />,
  //     path: "/biddings"
  //   },
  //   {
  //     title: "계약 관리",
  //     description: "계약 정보를 관리합니다.",
  //     icon: <ReceiptIcon fontSize="large" color="primary" />,
  //     path: "/contracts"
  //   },
  //   {
  //     title: "사용자 관리",
  //     description: "사용자 권한을 설정하고 관리합니다.",
  //     icon: <PeopleIcon fontSize="large" color="primary" />,
  //     path: "/users"
  //   },
  //   {
  //     title: "품목 관리",
  //     description: "품목 정보를 등록하고 관리합니다.",
  //     icon: <InventoryIcon fontSize="large" color="primary" />,
  //     path: "/items"
  //   }
  // ];

  return (
    <Box>
      {/* 환영 메시지 */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          bgcolor: "#f8faff",
          borderRadius: 2,
          border: "1px solid #e0e7ff"
        }}>
        <Typography variant="h5" gutterBottom>
          안녕하세요, <strong>홍길동</strong>님!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          ORBIT 구매 관리 시스템에 오신 것을 환영합니다. 현재 진행 중인 입찰 및
          계약 현황을 확인하세요.
        </Typography>
      </Paper>

      {/* 통계 */}
      {/* <Typography variant="h6" gutterBottom fontWeight="bold">
        통계
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsData.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                height: "100%"
              }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {stat.value}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: "rgba(25, 118, 210, 0.1)"
                }}>
                {stat.icon}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid> */}

      {/* 로그인 완료되면 로그인 관련 코드 넣기 */}
      {/* 
      로그인 퍼블리싱 코드 넣으면 위에 코드는 대시보드 페이지로 이동
      */}
    </Box>
  );
};

export default Home;
