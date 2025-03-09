import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  Stack,
  Card,
  CardContent,
  CardHeader
} from "@mui/material";
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  EditOutlined as EditIcon,
  VisibilityOutlined as ViewIcon
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import moment from "moment";

const BiddingOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // 상태별 색상 매핑
  const statusColors = {
    DRAFT: "default",
    PENDING_APPROVAL: "primary",
    APPROVED: "success",
    IN_PROGRESS: "warning",
    COMPLETED: "success",
    CANCELLED: "error"
  };

  // 상태별 라벨 매핑
  const statusLabels = {
    DRAFT: "초안",
    PENDING_APPROVAL: "승인 대기",
    APPROVED: "승인됨",
    IN_PROGRESS: "진행 중",
    COMPLETED: "완료",
    CANCELLED: "취소됨"
  };

  // 발주 목록 조회
  const fetchOrders = async () => {
    setLoading(true);
    try {
      let endpoint = "/api/bidding-orders";

      // 상태 필터 적용
      if (statusFilter) {
        endpoint = `/api/bidding-orders/status/${statusFilter}`;
      }

      // 날짜 범위 필터 적용
      if (startDate && endDate) {
        const formattedStartDate = startDate.format("YYYY-MM-DDTHH:mm:ss");
        const formattedEndDate = endDate.format("YYYY-MM-DDTHH:mm:ss");
        endpoint = `/api/bidding-orders/date-range?startDate=${encodeURIComponent(
          formattedStartDate
        )}&endDate=${encodeURIComponent(formattedEndDate)}`;
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("발주 목록 조회에 실패했습니다.");
      }

      const data = await response.json();
      setOrders(data);

      // 날짜 범위가 있으면 총액 조회
      if (startDate && endDate) {
        const formattedStartDate = startDate.format("YYYY-MM-DDTHH:mm:ss");
        const formattedEndDate = endDate.format("YYYY-MM-DDTHH:mm:ss");
        const amountEndpoint = `/api/bidding-orders/total-amount?startDate=${encodeURIComponent(
          formattedStartDate
        )}&endDate=${encodeURIComponent(formattedEndDate)}`;

        const amountResponse = await fetch(amountEndpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });

        if (amountResponse.ok) {
          const amountData = await amountResponse.json();
          setTotalAmount(amountData || 0);
        } else {
          setTotalAmount(0);
        }
      } else {
        setTotalAmount(0);
      }
    } catch (error) {
      console.error("발주 목록 조회 중 오류 발생:", error);
      alert("발주 목록을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchOrders();
  }, []);

  // 필터 초기화
  const resetFilters = () => {
    setStatusFilter("");
    setStartDate(null);
    setEndDate(null);
  };

  // 페이지 변경 핸들러
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경 핸들러
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <div className="bidding-order-list">
        <Card elevation={3}>
          <CardHeader
            title="발주 목록"
            action={
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                component={Link}
                to="/bidding-orders/create">
                새 발주 등록
              </Button>
            }
          />
          <CardContent>
            {/* 필터 영역 */}
            <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel id="status-filter-label">
                      상태별 필터링
                    </InputLabel>
                    <Select
                      labelId="status-filter-label"
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label="상태별 필터링">
                      <MenuItem value="">전체</MenuItem>
                      <MenuItem value="DRAFT">초안</MenuItem>
                      <MenuItem value="PENDING_APPROVAL">승인 대기</MenuItem>
                      <MenuItem value="APPROVED">승인됨</MenuItem>
                      <MenuItem value="IN_PROGRESS">진행 중</MenuItem>
                      <MenuItem value="COMPLETED">완료</MenuItem>
                      <MenuItem value="CANCELLED">취소됨</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Stack direction="row" spacing={2}>
                    <DatePicker
                      label="시작일"
                      value={startDate}
                      onChange={setStartDate}
                      slotProps={{
                        textField: { size: "small", fullWidth: true }
                      }}
                      format="YYYY-MM-DD"
                    />
                    <DatePicker
                      label="종료일"
                      value={endDate}
                      onChange={setEndDate}
                      slotProps={{
                        textField: { size: "small", fullWidth: true }
                      }}
                      format="YYYY-MM-DD"
                    />
                  </Stack>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      startIcon={<FilterListIcon />}
                      onClick={fetchOrders}>
                      필터적용
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={() => {
                        resetFilters();
                        fetchOrders();
                      }}>
                      초기화
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            {/* 총액 표시 */}
            {totalAmount > 0 && (
              <Box sx={{ textAlign: "right", mb: 2 }}>
                <Typography variant="h6" component="span">
                  선택 기간 총 발주액: {totalAmount.toLocaleString()} 원
                </Typography>
              </Box>
            )}

            {/* 발주 목록 테이블 */}
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>발주 번호</TableCell>
                      <TableCell>발주 제목</TableCell>
                      <TableCell>공급자</TableCell>
                      <TableCell>총액</TableCell>
                      <TableCell>납품 예정일</TableCell>
                      <TableCell>상태</TableCell>
                      <TableCell>낙찰자</TableCell>
                      <TableCell>생성일</TableCell>
                      <TableCell>작업</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <Link
                              to={`/bidding-orders/${order.id}`}
                              style={{
                                textDecoration: "none",
                                color: "#1976d2"
                              }}>
                              {order.orderNumber}
                            </Link>
                          </TableCell>
                          <TableCell>{order.title}</TableCell>
                          <TableCell>{order.supplierName}</TableCell>
                          <TableCell>
                            {order.totalAmount
                              ? order.totalAmount.toLocaleString()
                              : 0}{" "}
                            원
                          </TableCell>
                          <TableCell>
                            {order.expectedDeliveryDate
                              ? moment(order.expectedDeliveryDate).format(
                                  "YYYY-MM-DD"
                                )
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={statusLabels[order.status]}
                              color={statusColors[order.status]}
                              variant={
                                order.status === "DRAFT" ? "outlined" : "filled"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {order.isSelectedBidder ? (
                              <Chip
                                label="낙찰자"
                                color="success"
                                size="small"
                              />
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {order.createdAt
                              ? moment(order.createdAt).format(
                                  "YYYY-MM-DD HH:mm"
                                )
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Button
                                component={Link}
                                to={`/bidding-orders/${order.id}`}
                                color="primary"
                                startIcon={<ViewIcon />}
                                size="small">
                                상세
                              </Button>
                              {order.status === "DRAFT" && (
                                <Button
                                  component={Link}
                                  to={`/bidding-orders/${order.id}/edit`}
                                  color="secondary"
                                  startIcon={<EditIcon />}
                                  size="small">
                                  수정
                                </Button>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    {orders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          데이터가 없습니다.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={orders.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="페이지당 행 수:"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} / ${count}`
                  }
                />
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </LocalizationProvider>
  );
};

export default BiddingOrderList;
