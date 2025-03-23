import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Tooltip
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import RefreshIcon from "@mui/icons-material/Refresh";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useSelector } from "react-redux";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

function SupplierOrdersListPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // 상태 관리
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 액션 메뉴 상태
  const [actionMenu, setActionMenu] = useState({
    anchorEl: null,
    orderId: null
  });

  // 상태 텍스트 맵핑
  const orderStatusMap = {
    DRAFT: "초안",
    PENDING_APPROVAL: "승인대기",
    APPROVED: "승인완료",
    IN_PROGRESS: "진행중",
    SHIPPING: "배송중",
    COMPLETED: "완료",
    CANCELLED: "취소"
  };

  // 발주 목록 가져오기
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWithAuth(`${API_URL}supplier/orders`);

        if (!response.ok) {
          throw new Error(
            `발주 목록을 불러오는데 실패했습니다. (${response.status})`
          );
        }

        const data = await response.json();
        setOrders(data);
        setFilteredOrders(data);
      } catch (err) {
        console.error("발주 데이터 로드 중 오류:", err);
        setError("발주 목록을 불러오는 중 오류가 발생했습니다: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [refreshTrigger]);

  // 필터링 적용
  useEffect(() => {
    // 탭에 따른 필터링 (상태별)
    let statusFiltered = [...orders];

    switch (tabValue) {
      case 0: // 전체
        break;
      case 1: // 승인완료
        statusFiltered = orders.filter((order) => order.status === "APPROVED");
        break;
      case 2: // 진행중
        statusFiltered = orders.filter(
          (order) =>
            order.status === "IN_PROGRESS" || order.status === "SHIPPING"
        );
        break;
      case 3: // 완료
        statusFiltered = orders.filter((order) => order.status === "COMPLETED");
        break;
      case 4: // 취소/거부
        statusFiltered = orders.filter((order) => order.status === "CANCELLED");
        break;
      default:
        break;
    }

    // 검색어 필터링
    let searchFiltered = statusFiltered;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      searchFiltered = statusFiltered.filter(
        (order) =>
          (order.orderNumber &&
            order.orderNumber.toLowerCase().includes(term)) ||
          (order.title && order.title.toLowerCase().includes(term)) ||
          (order.contractNumber &&
            order.contractNumber.toLowerCase().includes(term))
      );
    }

    // 날짜 필터링
    let dateFiltered = searchFiltered;
    if (dateRange.start) {
      dateFiltered = dateFiltered.filter(
        (order) =>
          order.expectedDeliveryDate &&
          new Date(order.expectedDeliveryDate) >= dateRange.start
      );
    }
    if (dateRange.end) {
      dateFiltered = dateFiltered.filter(
        (order) =>
          order.expectedDeliveryDate &&
          new Date(order.expectedDeliveryDate) <= dateRange.end
      );
    }

    setFilteredOrders(dateFiltered);
  }, [orders, tabValue, searchTerm, dateRange]);

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // 날짜 변경 핸들러
  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // 발주 상세 페이지로 이동
  const handleViewOrder = (orderId) => {
    navigate(`/supplier/orders/${orderId}`);
  };

  // 액션 메뉴 열기
  const handleOpenActionMenu = (event, orderId) => {
    setActionMenu({
      anchorEl: event.currentTarget,
      orderId
    });
  };

  // 액션 메뉴 닫기
  const handleCloseActionMenu = () => {
    setActionMenu({
      anchorEl: null,
      orderId: null
    });
  };

  // 새로고침 핸들러
  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // 납품 예정일 업데이트
  const handleUpdateDeliveryDate = async (orderId, newDate) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}supplier/orders/${orderId}/update-delivery-date?newDeliveryDate=${
          newDate.toISOString().split("T")[0]
        }`,
        {
          method: "PUT"
        }
      );

      if (!response.ok) {
        throw new Error(
          `납품 예정일 업데이트에 실패했습니다. (${response.status})`
        );
      }

      const updatedOrder = await response.json();

      // 주문 목록 업데이트
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === orderId ? updatedOrder : order))
      );

      alert("납품 예정일이 업데이트되었습니다.");
    } catch (err) {
      console.error("납품 예정일 업데이트 중 오류:", err);
      alert(`납품 예정일 업데이트 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  // 배송 시작 처리
  const handleStartShipping = async (orderId) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}supplier/orders/${orderId}/update-status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status: "SHIPPING",
            comment: "배송이 시작되었습니다."
          })
        }
      );

      if (!response.ok) {
        throw new Error(`배송 시작 처리에 실패했습니다. (${response.status})`);
      }

      const updatedOrder = await response.json();

      // 주문 목록 업데이트
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === orderId ? updatedOrder : order))
      );

      handleCloseActionMenu();
      alert("배송 시작 처리되었습니다.");
    } catch (err) {
      console.error("배송 시작 처리 중 오류:", err);
      alert(`배송 시작 처리 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  // 배송 완료 처리
  const handleCompleteShipping = async (orderId) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}supplier/orders/${orderId}/update-status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status: "COMPLETED",
            comment: "배송이 완료되었습니다."
          })
        }
      );

      if (!response.ok) {
        throw new Error(`배송 완료 처리에 실패했습니다. (${response.status})`);
      }

      const updatedOrder = await response.json();

      // 주문 목록 업데이트
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === orderId ? updatedOrder : order))
      );

      handleCloseActionMenu();
      alert("배송 완료 처리되었습니다.");
    } catch (err) {
      console.error("배송 완료 처리 중 오류:", err);
      alert(`배송 완료 처리 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  // 상태에 따른 색상
  const getStatusColor = (status) => {
    switch (status) {
      case "DRAFT":
        return "default";
      case "PENDING_APPROVAL":
        return "warning";
      case "APPROVED":
        return "primary";
      case "IN_PROGRESS":
        return "info";
      case "SHIPPING":
        return "secondary";
      case "COMPLETED":
        return "success";
      case "CANCELLED":
        return "error";
      default:
        return "default";
    }
  };

  // 배지 수 계산
  const getStatusCount = (status) => {
    if (status === "ALL") return orders.length;
    if (status === "APPROVED")
      return orders.filter((o) => o.status === "APPROVED").length;
    if (status === "IN_PROGRESS")
      return orders.filter(
        (o) => o.status === "IN_PROGRESS" || o.status === "SHIPPING"
      ).length;
    if (status === "COMPLETED")
      return orders.filter((o) => o.status === "COMPLETED").length;
    if (status === "CANCELLED")
      return orders.filter((o) => o.status === "CANCELLED").length;
    return 0;
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  // 오늘 기준으로 D-day 계산
  const calculateDday = (dateString) => {
    if (!dateString) return "";

    const targetDate = new Date(dateString);
    const today = new Date();

    // 날짜만 비교하기 위해 시간 정보 제거
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `D+${Math.abs(diffDays)}`;
    } else if (diffDays > 0) {
      return `D-${diffDays}`;
    } else {
      return "D-Day";
    }
  };

  // 로딩 상태
  if (loading && orders.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh"
        }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          발주 목록을 불러오는 중...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3
        }}>
        <Typography variant="h4">발주 관리</Typography>
        <Tooltip title="새로고침">
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 필터링 섹션 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="발주번호, 제목 등으로 검색"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="납품 예정일 시작"
                value={dateRange.start}
                onChange={(newValue) => handleDateChange("start", newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="납품 예정일 종료"
                value={dateRange.end}
                onChange={(newValue) => handleDateChange("end", newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Paper>

      {/* 탭 영역 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth">
          <Tab
            label={
              <Badge badgeContent={getStatusCount("ALL")} color="primary">
                전체
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={getStatusCount("APPROVED")} color="primary">
                승인완료
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                badgeContent={getStatusCount("IN_PROGRESS")}
                color="primary">
                진행중
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={getStatusCount("COMPLETED")} color="success">
                완료
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={getStatusCount("CANCELLED")} color="error">
                취소
              </Badge>
            }
          />
        </Tabs>
      </Paper>

      {/* 카드 뷰 */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={3}>
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <Grid item xs={12} sm={6} md={4} key={order.id}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 2
                      }}>
                      <Typography variant="h6" component="div">
                        {order.orderNumber}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => handleOpenActionMenu(e, order.id)}>
                        <MoreVertIcon />
                      </IconButton>
                    </Box>

                    <Typography variant="body2" color="text.secondary" noWrap>
                      {order.title}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mt: 2
                      }}>
                      <Chip
                        label={orderStatusMap[order.status] || order.status}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                      <Typography variant="body2">
                        {order.expectedDeliveryDate &&
                          calculateDday(order.expectedDeliveryDate)}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          수량
                        </Typography>
                        <Typography variant="body2">
                          {order.quantity}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          총액
                        </Typography>
                        <Typography variant="body2">
                          {order.totalAmount?.toLocaleString()}원
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          납품 예정일
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(order.expectedDeliveryDate)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewOrder(order.id)}>
                      상세보기
                    </Button>

                    {order.status === "APPROVED" && (
                      <Button
                        size="small"
                        color="primary"
                        startIcon={<LocalShippingIcon />}
                        onClick={() => handleStartShipping(order.id)}>
                        배송 시작
                      </Button>
                    )}

                    {order.status === "SHIPPING" && (
                      <Button
                        size="small"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleCompleteShipping(order.id)}>
                        배송 완료
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body1">
                  {searchTerm || dateRange.start || dateRange.end
                    ? "검색 조건에 맞는 발주가 없습니다."
                    : "등록된 발주가 없습니다."}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* 테이블 뷰 */}
      <Paper sx={{ mt: 4 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>발주번호</TableCell>
                <TableCell>제목</TableCell>
                <TableCell>수량</TableCell>
                <TableCell>금액</TableCell>
                <TableCell>납품 예정일</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>{order.title}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell align="right">
                      {order.totalAmount?.toLocaleString()}원
                    </TableCell>
                    <TableCell>
                      {formatDate(order.expectedDeliveryDate)}
                      {order.expectedDeliveryDate && (
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          {calculateDday(order.expectedDeliveryDate)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={orderStatusMap[order.status] || order.status}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleViewOrder(order.id)}>
                        상세보기
                      </Button>

                      {order.status === "APPROVED" && (
                        <Button
                          size="small"
                          color="primary"
                          sx={{ ml: 1 }}
                          onClick={() => handleStartShipping(order.id)}>
                          배송 시작
                        </Button>
                      )}

                      {order.status === "SHIPPING" && (
                        <Button
                          size="small"
                          color="success"
                          sx={{ ml: 1 }}
                          onClick={() => handleCompleteShipping(order.id)}>
                          배송 완료
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {searchTerm || dateRange.start || dateRange.end
                      ? "검색 조건에 맞는 발주가 없습니다."
                      : "등록된 발주가 없습니다."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 액션 메뉴 */}
      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={handleCloseActionMenu}>
        <MenuItem
          onClick={() => {
            handleViewOrder(actionMenu.orderId);
            handleCloseActionMenu();
          }}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>상세보기</ListItemText>
        </MenuItem>

        {orders.find((o) => o.id === actionMenu.orderId)?.status ===
          "APPROVED" && (
          <MenuItem onClick={() => handleStartShipping(actionMenu.orderId)}>
            <ListItemIcon>
              <LocalShippingIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>배송 시작</ListItemText>
          </MenuItem>
        )}

        {orders.find((o) => o.id === actionMenu.orderId)?.status ===
          "SHIPPING" && (
          <MenuItem onClick={() => handleCompleteShipping(actionMenu.orderId)}>
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>배송 완료</ListItemText>
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            const order = orders.find((o) => o.id === actionMenu.orderId);
            if (order) {
              const now = new Date();
              const newDate = new Date(now.setDate(now.getDate() + 7));
              handleUpdateDeliveryDate(actionMenu.orderId, newDate);
            }
            handleCloseActionMenu();
          }}>
          <ListItemIcon>
            <ScheduleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>납품일 연장 (+7일)</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default SupplierOrdersListPage;
