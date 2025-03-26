// frontend/src/pages/buyer/BuyerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";
import { useNotificationsWebSocket } from "@/hooks/useNotificationsWebSocket";
import { useToastNotifications } from "@/hooks/useToastNotifications";
import {
  getStatusText,
  getBidMethodText
} from "../bidding/helpers/commonBiddingHelpers";

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
  Alert,
  AlertTitle,
  IconButton,
  Divider,
  Tab,
  Tabs
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
  ErrorOutline as ErrorIcon,
  Description as DescriptionIcon
} from "@mui/icons-material";

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

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
      pending: 0,
      ongoing: 0,
      closed: 0,
      canceled: 0
    },
    purchaseRequestSummary: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    },
    recentBiddings: [],
    recentPurchaseRequests: [],
    performanceMetrics: {
      totalContractAmount: 0,
      avgProcessingTime: 0,
      completionRate: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 대시보드 데이터 페치 - API 재시도 로직 포함
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // handleApiWithRetry 사용하여 토큰 갱신 시 자동 재시도
      await handleApiWithRetry(async () => {
        // 병렬로 데이터 요청
        const [
          biddingSummaryResponse,
          prSummaryResponse,
          recentBiddingsResponse,
          recentPRsResponse,
          performanceResponse
        ] = await Promise.all([
          fetchWithAuth(`${API_URL}buyer/bidding-summary`),
          fetchWithAuth(`${API_URL}buyer/purchase-request-summary`),
          fetchWithAuth(`${API_URL}buyer/recent-biddings`),
          fetchWithAuth(`${API_URL}buyer/recent-purchase-requests`),
          fetchWithAuth(`${API_URL}buyer/performance-metrics`)
        ]);

        // 응답이 성공적인지 확인하고 데이터 추출
        // 실제 API가 없을 경우를 대비한 더미 데이터 처리
        let biddingSummary = {};
        let prSummary = {};
        let recentBiddings = [];
        let recentPRs = [];
        let performanceMetrics = {};

        try {
          biddingSummary = await biddingSummaryResponse.json();
        } catch (e) {
          console.log(
            "입찰 요약 데이터를 가져오는데 실패했습니다. 더미 데이터를 사용합니다."
          );
          biddingSummary = {
            total: 12,
            pending: 3,
            ongoing: 5,
            closed: 3,
            canceled: 1
          };
        }

        try {
          prSummary = await prSummaryResponse.json();
        } catch (e) {
          console.log(
            "구매요청 요약 데이터를 가져오는데 실패했습니다. 더미 데이터를 사용합니다."
          );
          prSummary = {
            total: 25,
            pending: 8,
            approved: 15,
            rejected: 2
          };
        }

        try {
          recentBiddings = await recentBiddingsResponse.json();
        } catch (e) {
          console.log(
            "최근 입찰 데이터를 가져오는데 실패했습니다. 더미 데이터를 사용합니다."
          );
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

        try {
          recentPRs = await recentPRsResponse.json();
        } catch (e) {
          console.log(
            "최근 구매요청 데이터를 가져오는데 실패했습니다. 더미 데이터를 사용합니다."
          );
          recentPRs = [
            {
              id: 2001,
              requestNumber: "PR-230101-001",
              title: "마케팅 부서 노트북 구매",
              status: "APPROVED",
              requestDate: new Date(2023, 4, 28),
              department: "마케팅",
              totalAmount: 5500000
            },
            {
              id: 2002,
              requestNumber: "PR-230103-002",
              title: "회의실 프로젝터 구매",
              status: "PENDING",
              requestDate: new Date(2023, 5, 1),
              department: "총무",
              totalAmount: 2800000
            },
            {
              id: 2003,
              requestNumber: "PR-230105-003",
              title: "개발팀 서버 장비 구매",
              status: "APPROVED",
              requestDate: new Date(2023, 5, 3),
              department: "개발",
              totalAmount: 12000000
            }
          ];
        }

        try {
          performanceMetrics = await performanceResponse.json();
        } catch (e) {
          console.log(
            "성과 지표 데이터를 가져오는데 실패했습니다. 더미 데이터를 사용합니다."
          );
          performanceMetrics = {
            totalContractAmount: 230000000,
            avgProcessingTime: 8.5,
            completionRate: 0.85
          };
        }

        setDashboardData({
          biddingSummary,
          purchaseRequestSummary: prSummary,
          recentBiddings,
          recentPurchaseRequests: recentPRs,
          performanceMetrics
        });
      });
    } catch (error) {
      console.error("대시보드 데이터 로딩 실패:", error);
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 상세 페이지 이동 핸들러
  const navigateToBiddingDetail = (biddingId) => {
    navigate(`/biddings/${biddingId}`);
  };

  const navigateToPurchaseRequestDetail = (prId) => {
    navigate(`/purchase-requests/${prId}`);
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
      } else if (notification.type?.includes("PURCHASE_REQUEST")) {
        navigate(`/purchase-requests/${notification.referenceId}`);
      }
    }
  };

  // 알림 아이콘 가져오기
  const getNotificationIcon = (type) => {
    if (type?.includes("BIDDING")) return <GavelIcon />;
    if (type?.includes("CONTRACT")) return <ReceiptIcon />;
    if (type?.includes("ORDER")) return <ShippingIcon />;
    if (type?.includes("PURCHASE_REQUEST")) return <DescriptionIcon />;
    if (type?.includes("EVALUATION")) return <AssessmentIcon />;
    return <NotificationIcon />;
  };

  // 입찰 상태에 따른 Chip 컬러 지정
  const getStatusChipColor = (status) => {
    if (typeof status === "string") {
      switch (status) {
        case "PENDING":
          return "warning";
        case "APPROVED":
          return "success";
        case "REJECTED":
          return "error";
        default:
          return "default";
      }
    } else {
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
    }
  };

  // PR 상태 텍스트 변환
  const getPRStatusText = (status) => {
    switch (status) {
      case "PENDING":
        return "대기중";
      case "APPROVED":
        return "승인됨";
      case "REJECTED":
        return "거부됨";
      default:
        return "기타";
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
          구매자 대시보드
        </Typography>

        <Grid container spacing={3}>
          {/* 입찰 요약 카드 */}
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
                        {dashboardData.biddingSummary.ongoing}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        진행중
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      p={1}>
                      <Typography variant="h4" color="warning.main">
                        {dashboardData.biddingSummary.pending}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        대기중
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
                        {dashboardData.biddingSummary.closed}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        완료
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 구매요청 요약 카드 */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardHeader title="구매요청 요약" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      p={1}>
                      <Typography variant="h4" color="primary">
                        {dashboardData.purchaseRequestSummary.total}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        총 요청
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      p={1}>
                      <Typography variant="h4" color="warning.main">
                        {dashboardData.purchaseRequestSummary.pending}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        대기중
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
                        {dashboardData.purchaseRequestSummary.approved}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        승인됨
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      p={1}>
                      <Typography variant="h4" color="error.main">
                        {dashboardData.purchaseRequestSummary.rejected}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        거부됨
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 성과 지표 카드 */}
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardHeader title="성과 지표" />
              <CardContent>
                <Grid container spacing={3} justifyContent="center">
                  <Grid item xs={12} sm={4}>
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
                            {Math.floor(
                              dashboardData.performanceMetrics
                                .totalContractAmount / 10000
                            )}
                            만원
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        총 계약 금액
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
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
                            (dashboardData.performanceMetrics
                              .avgProcessingTime /
                              15) *
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
                            fontSize="0.9rem">
                            {dashboardData.performanceMetrics.avgProcessingTime.toFixed(
                              1
                            )}
                            일
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        평균 처리 시간
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
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
                            dashboardData.performanceMetrics.completionRate *
                            100
                          }
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
                            fontSize="0.9rem">
                            {(
                              dashboardData.performanceMetrics.completionRate *
                              100
                            ).toFixed(1)}
                            %
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        완료율
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
                {notifications && notifications.length > 0 ? (
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

          {/* 최근 입찰/구매요청 섹션 (탭으로 전환) */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  variant="fullWidth">
                  <Tab label="최근 입찰 공고" />
                  <Tab label="최근 구매 요청" />
                </Tabs>
              </Box>

              {/* 입찰 공고 탭 */}
              <CardContent
                sx={{ p: 0, display: tabValue === 0 ? "block" : "none" }}>
                {dashboardData.recentBiddings.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>공고번호</TableCell>
                          <TableCell>제목</TableCell>
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
                <Box p={1} display="flex" justifyContent="flex-end">
                  <Button
                    color="primary"
                    size="small"
                    onClick={() => navigate("/biddings")}>
                    전체보기
                  </Button>
                </Box>
              </CardContent>

              {/* 구매 요청 탭 */}
              <CardContent
                sx={{ p: 0, display: tabValue === 1 ? "block" : "none" }}>
                {dashboardData.recentPurchaseRequests.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>요청번호</TableCell>
                          <TableCell>제목</TableCell>
                          <TableCell>부서</TableCell>
                          <TableCell>상태</TableCell>
                          <TableCell align="center">작업</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboardData.recentPurchaseRequests.map((pr) => (
                          <TableRow key={pr.id}>
                            <TableCell
                              component="th"
                              scope="row"
                              sx={{ fontSize: "0.875rem" }}>
                              {pr.requestNumber}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 180 }}>
                              <Typography noWrap variant="body2">
                                {pr.title}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.875rem" }}>
                              {pr.department}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={getPRStatusText(pr.status)}
                                color={getStatusChipColor(pr.status)}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                color="primary"
                                onClick={() =>
                                  navigateToPurchaseRequestDetail(pr.id)
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
                      최근 구매 요청이 없습니다
                    </Typography>
                  </Box>
                )}
                <Box p={1} display="flex" justifyContent="flex-end">
                  <Button
                    color="primary"
                    size="small"
                    onClick={() => navigate("/purchase-requests")}>
                    전체보기
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default DashboardPage;
