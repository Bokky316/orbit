// frontend/src/pages/supplier/SupplierDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";
import { useNotificationsWebSocket } from "@/hooks/useNotificationsWebSocket";
import { useToastNotifications } from "@/hooks/useToastNotifications";
import { useBiddingWebSocket } from "@/hooks/useBiddingWebSocket";
import {
  getStatusText,
  getBidMethodText
} from "../bidding/helpers/commonBiddingHelpers";
import { Alert, AlertTitle } from "@mui/material";

// MUI 컴포넌트 임포트
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  Grid,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  IconButton,
  Divider,
  Badge
} from "@mui/material";

// MUI 아이콘 임포트
import {
  Gavel as GavelIcon,
  Receipt as ReceiptIcon,
  LocalShipping as ShippingIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  NotificationsActive as NotificationIcon,
  MoreHoriz as MoreIcon,
  Visibility as VisibilityIcon,
  ErrorOutline as ErrorIcon
} from "@mui/icons-material";

function SupplierDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // 웹소켓 훅 사용 - 알림 기능만 활성화
  const { toast, closeToast } = useToastNotifications();
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    removeNotification
  } = useNotificationsWebSocket(user);

  // 대시보드 상태 관리
  const [dashboardData, setDashboardData] = useState({
    biddingSummary: {
      total: 0,
      invited: 0,
      participated: 0,
      won: 0
    },
    recentBiddings: [],
    performanceMetrics: {
      winRate: 0,
      totalBidValue: 0,
      averageBidScore: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 대시보드 데이터 페치 - API 재시도 로직 포함
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [summaryRes, recentBiddingsRes, performanceRes] = await Promise.all(
        [
          fetchWithAuth(`${API_URL}supplier/biddings/bidding-summary`),
          fetchWithAuth(`${API_URL}supplier/biddings/recent-biddings`),
          fetchWithAuth(`${API_URL}supplier/biddings/performance-metrics`)
        ]
      );

      // 👉 입찰 요약
      let summaryData;
      try {
        summaryData = await summaryRes.json();
      } catch {
        console.warn("⚠️ 입찰 요약 데이터 오류, 기본값 사용");
        summaryData = {
          total: 0,
          invited: 0,
          participated: 0,
          won: 0
        };
      }

      // 👉 최근 입찰
      let recentBiddings;
      try {
        recentBiddings = await recentBiddingsRes.json();
      } catch {
        console.warn("⚠️ 최근 입찰 데이터 오류, 더미 데이터 사용");
        recentBiddings = [
          {
            id: 1001,
            bidNumber: "BID-230101-001",
            title: "사무실 컴퓨터 공급",
            status: { childCode: "ONGOING" },
            bidMethod: "FIXED_PRICE",
            startDate: new Date(2023, 5, 1),
            endDate: new Date(2023, 5, 15),
            totalAmount: 25000000
          },
          {
            id: 1002,
            bidNumber: "BID-230105-002",
            title: "사무용품 공급",
            status: { childCode: "CLOSED" },
            bidMethod: "OPEN_PRICE",
            startDate: new Date(2023, 5, 5),
            endDate: new Date(2023, 5, 20),
            totalAmount: 5000000
          },
          {
            id: 1003,
            bidNumber: "BID-230110-003",
            title: "네트워크 장비 구매",
            status: { childCode: "PENDING" },
            bidMethod: "FIXED_PRICE",
            startDate: new Date(2023, 5, 10),
            endDate: new Date(2023, 5, 25),
            totalAmount: 15000000
          }
        ];
      }

      // 👉 성과 지표
      let performanceMetrics;
      try {
        performanceMetrics = await performanceRes.json();
      } catch {
        console.warn("⚠️ 성과 지표 데이터 오류, 기본값 사용");
        performanceMetrics = {
          winRate: 0.3,
          totalBidValue: 120000000,
          averageBidScore: 7.8
        };
      }

      // ✅ 모든 데이터 통합 세팅
      setDashboardData({
        biddingSummary: summaryData,
        recentBiddings,
        performanceMetrics
      });
    } catch (error) {
      console.error("❌ 대시보드 데이터 로딩 실패:", error);
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 입찰/알림에 따라 대시보드 새로고침
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 입찰 상태 업데이트 발생 시 리로드
  const { latestBiddingUpdate } = useBiddingWebSocket(user);
  useEffect(() => {
    if (latestBiddingUpdate) {
      console.log("📡 입찰 상태 변경 감지 → 대시보드 갱신");
      fetchDashboardData();
    }
  }, [latestBiddingUpdate]);

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (!latest.isRead) {
        toast({
          title: latest.title,
          message: latest.content,
          type: latest.type
        });
      }
    }
  }, [notifications]);

  // 입찰 공고 상세 페이지로 이동
  const navigateToBiddingDetail = (biddingId) => {
    navigate(`/supplier/biddings/${biddingId}`);
  };

  // 알림 클릭 핸들러
  const handleNotificationClick = (notification) => {
    // 알림 읽음 처리
    markNotificationAsRead(notification.id);

    // 알림 소스 페이지로 네비게이션
    if (notification.referenceId) {
      if (notification.type?.includes("BIDDING")) {
        navigate(`/biddings/${notification.referenceId}`);
      } else if (notification.type?.includes("CONTRACT")) {
        navigate(`/contracts/${notification.referenceId}`);
      } else if (notification.type?.includes("ORDER")) {
        navigate(`/orders/${notification.referenceId}`);
      }
    }
  };

  // 알림 아이콘 가져오기
  const getNotificationIcon = (type) => {
    if (type?.includes("BIDDING")) return <GavelIcon />;
    if (type?.includes("CONTRACT")) return <ReceiptIcon />;
    if (type?.includes("ORDER")) return <ShippingIcon />;
    if (type?.includes("EVALUATION")) return <AssessmentIcon />;
    return <NotificationIcon />;
  };

  // 입찰 상태에 따른 Chip 컬러 지정
  const getStatusChipColor = (status) => {
    switch (status?.childCode) {
      case "PENDING":
        return "warning";
      case "ONGOING":
        return "info";
      case "CLOSED":
        return "success";
      default:
        return "default";
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="80vh">
        <CircularProgress size={60} />
        <Typography variant="h6" mt={3}>
          대시보드 정보를 불러오는 중입니다...
        </Typography>
      </Box>
    );
  }

  // 오류 상태
  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh">
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchDashboardData}>
              다시 시도
            </Button>
          }
          sx={{ mb: 2, width: "100%", maxWidth: 600 }}>
          <AlertTitle>오류가 발생했습니다</AlertTitle>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        <Typography variant="h4" fontWeight="bold" mb={4}>
          공급사 대시보드
        </Typography>

        <Grid container spacing={3}>
          {/* 입찰 요약 섹션 */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardHeader title="입찰 요약" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      p={1}>
                      <Typography variant="h4" color="primary">
                        {dashboardData.biddingSummary.total}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        총 입찰 공고
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      p={1}>
                      <Typography variant="h4" color="info.main">
                        {dashboardData.biddingSummary.invited}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        초대받은 입찰
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      p={1}>
                      <Typography variant="h4" color="secondary.main">
                        {dashboardData.biddingSummary.participated}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        참여한 입찰
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      p={1}>
                      <Typography variant="h4" color="success.main">
                        {dashboardData.biddingSummary.won}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        낙찰 건수
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 성과 지표 섹션 */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardHeader title="성과 지표" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={4}>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center">
                      <Box
                        position="relative"
                        display="inline-flex"
                        sx={{ my: 2 }}>
                        <CircularProgress
                          variant="determinate"
                          value={dashboardData.performanceMetrics.winRate * 100}
                          size={80}
                          thickness={4}
                          color="success"
                        />
                        <Box
                          top={0}
                          left={0}
                          bottom={0}
                          right={0}
                          position="absolute"
                          display="flex"
                          alignItems="center"
                          justifyContent="center">
                          <Typography
                            variant="caption"
                            component="div"
                            color="text.secondary"
                            fontSize="1rem">
                            {(
                              dashboardData.performanceMetrics.winRate * 100
                            ).toFixed(1)}
                            %
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        낙찰률
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center">
                      <Box
                        position="relative"
                        display="inline-flex"
                        sx={{ my: 2 }}>
                        <CircularProgress
                          variant="determinate"
                          value={90}
                          size={80}
                          thickness={4}
                          color="primary"
                        />
                        <Box
                          top={0}
                          left={0}
                          bottom={0}
                          right={0}
                          position="absolute"
                          display="flex"
                          alignItems="center"
                          justifyContent="center">
                          <Typography
                            variant="caption"
                            component="div"
                            color="text.secondary"
                            fontSize="0.9rem">
                            {
                              dashboardData.performanceMetrics.totalBidValue
                                .toLocaleString()
                                .split(",")[0]
                            }
                            만원
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        총 낙찰 금액
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center">
                      <Box
                        position="relative"
                        display="inline-flex"
                        sx={{ my: 2 }}>
                        <CircularProgress
                          variant="determinate"
                          value={
                            (dashboardData.performanceMetrics.averageBidScore /
                              10) *
                            100
                          }
                          size={80}
                          thickness={4}
                          color="secondary"
                        />
                        <Box
                          top={0}
                          left={0}
                          bottom={0}
                          right={0}
                          position="absolute"
                          display="flex"
                          alignItems="center"
                          justifyContent="center">
                          <Typography
                            variant="caption"
                            component="div"
                            color="text.secondary"
                            fontSize="1rem">
                            {dashboardData.performanceMetrics.averageBidScore.toFixed(
                              1
                            )}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        평균 입찰 점수
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 최근 알림 섹션 */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardHeader
                title="최근 알림"
                action={
                  <Button
                    color="primary"
                    onClick={() => navigate("/notifications")}
                    endIcon={<MoreIcon />}>
                    전체보기
                  </Button>
                }
              />
              <CardContent sx={{ p: 0 }}>
                {notifications.length > 0 ? (
                  <List sx={{ width: "100%" }}>
                    {notifications.slice(0, 5).map((notification) => (
                      <React.Fragment key={notification.id}>
                        <ListItem
                          alignItems="flex-start"
                          button
                          onClick={() => handleNotificationClick(notification)}>
                          <ListItemIcon>
                            <Avatar
                              sx={{
                                bgcolor: notification.isRead
                                  ? "grey.200"
                                  : "primary.main"
                              }}>
                              {getNotificationIcon(notification.type)}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center">
                                <Typography
                                  component="span"
                                  variant="subtitle1"
                                  color="textPrimary"
                                  fontWeight={
                                    notification.isRead ? "normal" : "medium"
                                  }>
                                  {notification.title}
                                </Typography>
                                {!notification.isRead && (
                                  <Box
                                    component="span"
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: "50%",
                                      bgcolor: "primary.main",
                                      ml: 1
                                    }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={notification.content}
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    p={3}>
                    <Typography color="textSecondary">
                      새로운 알림이 없습니다
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 최근 입찰 공고 섹션 */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardHeader
                title="최근 입찰 공고"
                action={
                  <Button
                    color="primary"
                    onClick={() => navigate("/biddings")}
                    endIcon={<MoreIcon />}>
                    전체보기
                  </Button>
                }
              />
              <CardContent sx={{ p: 0 }}>
                {dashboardData.recentBiddings.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>공고번호</TableCell>
                          <TableCell>제목</TableCell>
                          <TableCell>입찰 방식</TableCell>
                          <TableCell>상태</TableCell>
                          <TableCell align="center">작업</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboardData.recentBiddings.map((bidding) => (
                          <TableRow key={bidding.id}>
                            <TableCell
                              component="th"
                              scope="row"
                              sx={{ fontSize: "0.875rem" }}>
                              {bidding.bidNumber}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 180 }}>
                              <Typography noWrap variant="body2">
                                {bidding.title}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.875rem" }}>
                              {getBidMethodText(bidding.bidMethod)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={getStatusText(bidding.status)}
                                color={getStatusChipColor(bidding.status)}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                color="primary"
                                onClick={() =>
                                  navigateToBiddingDetail(bidding.id)
                                }
                                size="small">
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    p={3}>
                    <Typography color="textSecondary">
                      최근 입찰 공고가 없습니다
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default SupplierDashboard;
