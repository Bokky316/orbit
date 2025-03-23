import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  IconButton,
  Tooltip,
  Stack,
  Stepper,
  Step,
  StepLabel
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  LocalShipping as LocalShippingIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useSelector } from "react-redux";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

function SupplierOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // 상태 관리
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusHistories, setStatusHistories] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 다이얼로그 상태
  const [deliveryDateDialog, setDeliveryDateDialog] = useState({
    open: false,
    newDate: null
  });

  const [shippingDialog, setShippingDialog] = useState({
    open: false,
    action: "", // 'start' or 'complete'
    comment: ""
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

  // 발주 상세 정보 가져오기
  useEffect(() => {
    const fetchOrderDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWithAuth(`${API_URL}supplier/orders/${id}`);

        if (!response.ok) {
          throw new Error(
            `발주 상세 정보를 불러오는데 실패했습니다. (${response.status})`
          );
        }

        const data = await response.json();
        setOrder(data);

        // 상태 이력 가져오기
        try {
          const historyResponse = await fetchWithAuth(
            `${API_URL}supplier/orders/${id}/status-histories`
          );

          if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            setStatusHistories(historyData);
          }
        } catch (historyError) {
          console.error("상태 이력 로드 중 오류:", historyError);
          // 상태 이력은 필수가 아니므로 전체 로딩 실패로 처리하지 않음
        }
      } catch (err) {
        console.error("발주 상세 정보 로드 중 오류:", err);
        setError(
          "발주 상세 정보를 불러오는 중 오류가 발생했습니다: " + err.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id, refreshTrigger]);

  // 새로고침 핸들러
  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // 납품 예정일 업데이트 다이얼로그 열기
  const handleOpenDeliveryDateDialog = () => {
    setDeliveryDateDialog({
      open: true,
      newDate: order?.expectedDeliveryDate
        ? new Date(order.expectedDeliveryDate)
        : new Date()
    });
  };

  // 납품 예정일 업데이트 다이얼로그 닫기
  const handleCloseDeliveryDateDialog = () => {
    setDeliveryDateDialog({
      ...deliveryDateDialog,
      open: false
    });
  };

  // 납품 예정일 업데이트 제출
  const handleSubmitDeliveryDate = async () => {
    if (!deliveryDateDialog.newDate) {
      alert("유효한 날짜를 선택해주세요.");
      return;
    }

    try {
      const formattedDate = deliveryDateDialog.newDate
        .toISOString()
        .split("T")[0];

      const response = await fetchWithAuth(
        `${API_URL}supplier/orders/${id}/update-delivery-date?newDeliveryDate=${formattedDate}`,
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
      setOrder(updatedOrder);

      handleCloseDeliveryDateDialog();
      alert("납품 예정일이 업데이트되었습니다.");
    } catch (err) {
      console.error("납품 예정일 업데이트 중 오류:", err);
      alert(`납품 예정일 업데이트 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  // 배송 상태 업데이트 다이얼로그 열기
  const handleOpenShippingDialog = (action) => {
    setShippingDialog({
      open: true,
      action,
      comment:
        action === "start" ? "배송이 시작되었습니다." : "배송이 완료되었습니다."
    });
  };

  // 배송 상태 업데이트 다이얼로그 닫기
  const handleCloseShippingDialog = () => {
    setShippingDialog({
      ...shippingDialog,
      open: false
    });
  };

  // 배송 상태 업데이트 제출
  const handleSubmitShippingStatus = async () => {
    try {
      const status =
        shippingDialog.action === "start" ? "SHIPPING" : "COMPLETED";

      const response = await fetchWithAuth(
        `${API_URL}supplier/orders/${id}/update-status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status,
            comment: shippingDialog.comment
          })
        }
      );

      if (!response.ok) {
        throw new Error(
          `배송 상태 업데이트에 실패했습니다. (${response.status})`
        );
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);

      handleCloseShippingDialog();
      alert(
        `배송 ${
          shippingDialog.action === "start" ? "시작" : "완료"
        } 처리되었습니다.`
      );
    } catch (err) {
      console.error("배송 상태 업데이트 중 오류:", err);
      alert(`배송 상태 업데이트 중 오류가 발생했습니다: ${err.message}`);
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

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  // 날짜와 시간 포맷팅
  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
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

  // 발주 상태 단계
  const getOrderStatusStep = () => {
    switch (order?.status) {
      case "DRAFT":
        return 0;
      case "PENDING_APPROVAL":
        return 1;
      case "APPROVED":
        return 2;
      case "IN_PROGRESS":
      case "SHIPPING":
        return 3;
      case "COMPLETED":
        return 4;
      case "CANCELLED":
        return -1;
      default:
        return 0;
    }
  };

  // 로딩 상태
  if (loading) {
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
          발주 상세 정보를 불러오는 중...
        </Typography>
      </Box>
    );
  }

  // 오류 상태
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/supplier/orders")}>
          발주 목록으로
        </Button>
      </Box>
    );
  }

  // 발주 정보가 없는 경우
  if (!order) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          발주 정보를 찾을 수 없습니다.
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/supplier/orders")}>
          발주 목록으로
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* 헤더 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4
        }}>
        <Typography variant="h4">발주 상세</Typography>
        <Box>
          <Tooltip title="새로고침">
            <IconButton onClick={handleRefresh} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/supplier/orders")}>
            발주 목록으로
          </Button>
        </Box>
      </Box>

      {/* 진행 단계 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={getOrderStatusStep()} alternativeLabel>
          <Step>
            <StepLabel>초안</StepLabel>
          </Step>
          <Step>
            <StepLabel>승인대기</StepLabel>
          </Step>
          <Step>
            <StepLabel>승인완료</StepLabel>
          </Step>
          <Step>
            <StepLabel>배송중</StepLabel>
          </Step>
          <Step>
            <StepLabel>완료</StepLabel>
          </Step>
        </Stepper>
      </Paper>

      {/* 기본 정보 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography variant="h5" sx={{ flexGrow: 1 }}>
                {order.title}
              </Typography>
              <Chip
                label={orderStatusMap[order.status] || order.status}
                color={getStatusColor(order.status)}
              />
            </Box>
            <Divider />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              발주 번호
            </Typography>
            <Typography variant="body1">{order.orderNumber}</Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              계약 번호
            </Typography>
            <Typography variant="body1">
              {order.contractNumber || "-"}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              생성일
            </Typography>
            <Typography variant="body1">
              {formatDate(order.createdAt)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              승인일
            </Typography>
            <Typography variant="body1">
              {formatDate(order.approvedAt) || "-"}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              수량
            </Typography>
            <Typography variant="body1">{order.quantity}</Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              단가
            </Typography>
            <Typography variant="body1">
              {order.unitPrice?.toLocaleString()}원
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              납품 예정일
            </Typography>
            <Typography variant="body1">
              {formatDate(order.expectedDeliveryDate)}
              {order.expectedDeliveryDate && (
                <Chip
                  label={calculateDday(order.expectedDeliveryDate)}
                  size="small"
                  color={
                    new Date(order.expectedDeliveryDate) < new Date()
                      ? "error"
                      : "primary"
                  }
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              공급가액
            </Typography>
            <Typography variant="body1">
              {order.supplyPrice?.toLocaleString()}원
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              부가세
            </Typography>
            <Typography variant="body1">
              {order.vat?.toLocaleString()}원
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              총액
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              {order.totalAmount?.toLocaleString()}원
            </Typography>
          </Grid>

          {order.description && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary">
                비고
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                {order.description}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* 배송 관련 작업 버튼 */}
      {(order.status === "APPROVED" || order.status === "SHIPPING") && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: "#f8f9fa" }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            배송 관리
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            {order.status === "APPROVED" && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<LocalShippingIcon />}
                onClick={() => handleOpenShippingDialog("start")}>
                배송 시작
              </Button>
            )}

            {order.status === "SHIPPING" && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleOpenShippingDialog("complete")}>
                배송 완료
              </Button>
            )}

            <Button
              variant="outlined"
              startIcon={<ScheduleIcon />}
              onClick={handleOpenDeliveryDateDialog}>
              납품일 변경
            </Button>
          </Stack>
        </Paper>
      )}

      {/* 계약 조건 */}
      {order.terms && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            계약 조건
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
            {order.terms}
          </Typography>
        </Paper>
      )}

      {/* 상태 이력 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          상태 변경 이력
        </Typography>

        {statusHistories.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>변경일시</TableCell>
                  <TableCell>이전 상태</TableCell>
                  <TableCell>변경 상태</TableCell>
                  <TableCell>변경 사유</TableCell>
                  <TableCell>변경자</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statusHistories.map((history, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatDateTime(history.changedAt)}</TableCell>
                    <TableCell>
                      {history.fromStatus ? (
                        <Chip
                          label={
                            orderStatusMap[history.fromStatus.childCode] ||
                            history.fromStatus.name
                          }
                          size="small"
                          color={getStatusColor(history.fromStatus.childCode)}
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {history.toStatus ? (
                        <Chip
                          label={
                            orderStatusMap[history.toStatus.childCode] ||
                            history.toStatus.name
                          }
                          size="small"
                          color={getStatusColor(history.toStatus.childCode)}
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{history.reason || "-"}</TableCell>
                    <TableCell>{history.changedBy?.username || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body1">상태 변경 이력이 없습니다.</Typography>
        )}
      </Paper>

      {/* 납품 예정일 변경 다이얼로그 */}
      <Dialog
        open={deliveryDateDialog.open}
        onClose={handleCloseDeliveryDateDialog}>
        <DialogTitle>납품 예정일 변경</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            변경하실 납품 예정일을 선택해주세요.
          </DialogContentText>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="납품 예정일"
              value={deliveryDateDialog.newDate}
              onChange={(newValue) =>
                setDeliveryDateDialog({
                  ...deliveryDateDialog,
                  newDate: newValue
                })
              }
              renderInput={(params) => <TextField {...params} fullWidth />}
              minDate={new Date()}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeliveryDateDialog}>취소</Button>
          <Button
            onClick={handleSubmitDeliveryDate}
            variant="contained"
            color="primary">
            변경
          </Button>
        </DialogActions>
      </Dialog>

      {/* 배송 상태 변경 다이얼로그 */}
      <Dialog open={shippingDialog.open} onClose={handleCloseShippingDialog}>
        <DialogTitle>
          {shippingDialog.action === "start" ? "배송 시작" : "배송 완료"} 처리
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {shippingDialog.action === "start"
              ? "배송을 시작하시겠습니까? 구매자에게 배송 시작 알림이 전송됩니다."
              : "배송이 완료되었습니까? 구매자에게 배송 완료 알림이 전송됩니다."}
          </DialogContentText>
          <TextField
            fullWidth
            label="코멘트"
            multiline
            rows={3}
            value={shippingDialog.comment}
            onChange={(e) =>
              setShippingDialog({
                ...shippingDialog,
                comment: e.target.value
              })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseShippingDialog}>취소</Button>
          <Button
            onClick={handleSubmitShippingStatus}
            variant="contained"
            color={shippingDialog.action === "start" ? "primary" : "success"}>
            {shippingDialog.action === "start" ? "배송 시작" : "배송 완료"} 처리
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SupplierOrderDetailPage;
