import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Typography,
  Divider,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Chip,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Alert,
  Stack
} from "@mui/material";
import {
  ArrowBack,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  PlayArrow
} from "@mui/icons-material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from "@mui/lab";
import moment from "moment";

const BiddingOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ id: 1 }); // 로그인 사용자 정보 (임시)
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState({
    title: "",
    action: "",
    message: ""
  });

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

  // 발주 상세 조회
  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bidding-orders/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("발주 상세 조회에 실패했습니다.");
      }

      const data = await response.json();
      setOrder(data);
    } catch (error) {
      console.error("발주 상세 조회 중 오류 발생:", error);
      alert("발주 정보를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  // 발주 상태 업데이트 공통 함수
  const updateOrderStatus = async (action, actionName) => {
    try {
      const queryParams = action === "approve" ? `?approverId=${user.id}` : "";

      const response = await fetch(
        `/api/bidding-orders/${id}/${action}${queryParams}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`발주 ${actionName}에 실패했습니다.`);
      }

      const data = await response.json();
      setOrder(data);
      alert(`발주가 ${actionName} 되었습니다.`);
    } catch (error) {
      console.error(`발주 ${actionName} 중 오류 발생:`, error);
      alert(`발주 ${actionName}에 실패했습니다.`);
    }
  };

  // 승인 대기로 변경
  const submitForApproval = async () => {
    try {
      const orderDto = { ...order, status: "PENDING_APPROVAL" };

      const response = await fetch(`/api/bidding-orders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderDto)
      });

      if (!response.ok) {
        throw new Error("발주 승인 요청에 실패했습니다.");
      }

      const data = await response.json();
      setOrder(data);
      alert("발주가 승인 요청되었습니다.");
    } catch (error) {
      console.error("발주 승인 요청 중 오류 발생:", error);
      alert("발주 승인 요청에 실패했습니다.");
    }
  };

  // 다이얼로그 열기
  const openConfirmDialog = (title, action, message) => {
    setDialogAction({ title, action, message });
    setOpenDialog(true);
  };

  // 다이얼로그 닫기
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // 다이얼로그 액션 실행
  const handleConfirm = () => {
    switch (dialogAction.action) {
      case "approve":
        updateOrderStatus("approve", "승인");
        break;
      case "start":
        updateOrderStatus("start", "진행 시작");
        break;
      case "complete":
        updateOrderStatus("complete", "완료");
        break;
      case "cancel":
        updateOrderStatus("cancel", "취소");
        break;
      case "delete":
        deleteOrder();
        break;
      default:
        break;
    }
    setOpenDialog(false);
  };

  // 발주 삭제
  const deleteOrder = async () => {
    try {
      const response = await fetch(`/api/bidding-orders/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("발주 삭제에 실패했습니다.");
      }

      alert("발주가 삭제되었습니다.");
      navigate("/bidding-orders");
    } catch (error) {
      console.error("발주 삭제 중 오류 발생:", error);
      alert("발주 삭제에 실패했습니다.");
    }
  };

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
          발주 정보를 불러오는 중...
        </Typography>
      </Box>
    );
  }

  if (!order) {
    return <Alert severity="warning">발주 정보를 찾을 수 없습니다.</Alert>;
  }

  return (
    <div className="bidding-order-detail">
      <Paper elevation={3} sx={{ mb: 4 }}>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate("/bidding-orders")}>
                목록으로
              </Button>
              <Typography variant="h6">발주 상세 정보</Typography>
            </Stack>
          }
          action={
            <Stack direction="row" spacing={1}>
              {order.status === "DRAFT" && (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={submitForApproval}>
                    승인 요청
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    component={Link}
                    to={`/bidding-orders/${id}/edit`}>
                    수정
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() =>
                      openConfirmDialog(
                        "발주 삭제",
                        "delete",
                        "이 발주를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                      )
                    }>
                    삭제
                  </Button>
                </>
              )}
              {order.status === "PENDING_APPROVAL" && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CheckCircle />}
                  onClick={() =>
                    openConfirmDialog(
                      "발주 승인",
                      "approve",
                      "이 발주를 승인하시겠습니까?"
                    )
                  }>
                  승인
                </Button>
              )}
              {order.status === "APPROVED" && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrow />}
                  onClick={() =>
                    openConfirmDialog(
                      "발주 진행",
                      "start",
                      "이 발주의 진행을 시작하시겠습니까?"
                    )
                  }>
                  진행 시작
                </Button>
              )}
              {order.status === "IN_PROGRESS" && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() =>
                    openConfirmDialog(
                      "발주 완료",
                      "complete",
                      "이 발주를 완료 처리하시겠습니까?"
                    )
                  }>
                  완료 처리
                </Button>
              )}
              {[
                "DRAFT",
                "PENDING_APPROVAL",
                "APPROVED",
                "IN_PROGRESS"
              ].includes(order.status) && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() =>
                    openConfirmDialog(
                      "발주 취소",
                      "cancel",
                      "이 발주를 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                    )
                  }>
                  취소
                </Button>
              )}
            </Stack>
          }
        />
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>
            {order.title}
            <Box component="span" sx={{ ml: 2 }}>
              <Chip
                label={statusLabels[order.status]}
                color={statusColors[order.status]}
                variant={order.status === "DRAFT" ? "outlined" : "filled"}
              />
              {order.isSelectedBidder && (
                <Chip label="낙찰자" color="success" sx={{ ml: 1 }} />
              )}
            </Box>
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell component="th" width="20%">
                    발주 번호
                  </TableCell>
                  <TableCell>{order.orderNumber}</TableCell>
                  <TableCell component="th" width="20%">
                    입찰 ID
                  </TableCell>
                  <TableCell>{order.biddingId}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th">발주 상태</TableCell>
                  <TableCell>{statusLabels[order.status]}</TableCell>
                  <TableCell component="th">생성일</TableCell>
                  <TableCell>
                    {moment(order.createdAt).format("YYYY-MM-DD HH:mm")}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th">공급자</TableCell>
                  <TableCell>{order.supplierName}</TableCell>
                  <TableCell component="th">공급자 ID</TableCell>
                  <TableCell>{order.supplierId}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th">낙찰자 선정일</TableCell>
                  <TableCell>
                    {order.bidderSelectedAt
                      ? moment(order.bidderSelectedAt).format(
                          "YYYY-MM-DD HH:mm"
                        )
                      : "-"}
                  </TableCell>
                  <TableCell component="th">예상 납품일</TableCell>
                  <TableCell>
                    {order.expectedDeliveryDate
                      ? moment(order.expectedDeliveryDate).format("YYYY-MM-DD")
                      : "-"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" sx={{ mb: 2 }}>
            금액 정보
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell component="th" width="20%">
                    수량
                  </TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell component="th" width="20%">
                    단가
                  </TableCell>
                  <TableCell>
                    {order.unitPrice ? order.unitPrice.toLocaleString() : "0"}{" "}
                    원
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th">공급가액</TableCell>
                  <TableCell>
                    {order.supplyPrice
                      ? order.supplyPrice.toLocaleString()
                      : "0"}{" "}
                    원
                  </TableCell>
                  <TableCell component="th">부가세</TableCell>
                  <TableCell>
                    {order.vat ? order.vat.toLocaleString() : "0"} 원
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th">총액</TableCell>
                  <TableCell colSpan={3}>
                    <Typography variant="h6">
                      {order.totalAmount
                        ? order.totalAmount.toLocaleString()
                        : "0"}{" "}
                      원
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  발주 설명
                </Typography>
                <Typography>
                  {order.description || "설명이 없습니다."}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  계약 조건
                </Typography>
                <Typography>
                  {order.terms || "계약 조건이 없습니다."}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              진행 상태
            </Typography>
            <Timeline position="alternate">
              <TimelineItem>
                <TimelineOppositeContent color="text.secondary">
                  {moment(order.createdAt).format("YYYY-MM-DD HH:mm")}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color="primary" />
                  {order.status !== "DRAFT" && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>발주 생성</TimelineContent>
              </TimelineItem>

              {order.status !== "DRAFT" && (
                <TimelineItem>
                  <TimelineOppositeContent color="text.secondary">
                    {/* 승인 요청 시간이 있다면 표시 */}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color="primary" />
                    {["APPROVED", "IN_PROGRESS", "COMPLETED"].includes(
                      order.status
                    ) && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>승인 요청됨</TimelineContent>
                </TimelineItem>
              )}

              {["APPROVED", "IN_PROGRESS", "COMPLETED"].includes(
                order.status
              ) && (
                <TimelineItem>
                  <TimelineOppositeContent color="text.secondary">
                    {order.approvedAt &&
                      moment(order.approvedAt).format("YYYY-MM-DD HH:mm")}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color="success" />
                    {["IN_PROGRESS", "COMPLETED"].includes(order.status) && (
                      <TimelineConnector />
                    )}
                  </TimelineSeparator>
                  <TimelineContent>승인됨</TimelineContent>
                </TimelineItem>
              )}

              {["IN_PROGRESS", "COMPLETED"].includes(order.status) && (
                <TimelineItem>
                  <TimelineOppositeContent color="text.secondary">
                    {/* 진행 시작 시간이 있다면 표시 */}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color="warning" />
                    {order.status === "COMPLETED" && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>진행 시작됨</TimelineContent>
                </TimelineItem>
              )}

              {order.status === "COMPLETED" && (
                <TimelineItem>
                  <TimelineOppositeContent color="text.secondary">
                    {/* 완료 시간이 있다면 표시 */}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color="success" />
                  </TimelineSeparator>
                  <TimelineContent>완료됨</TimelineContent>
                </TimelineItem>
              )}

              {order.status === "CANCELLED" && (
                <TimelineItem>
                  <TimelineOppositeContent color="text.secondary">
                    {/* 취소 시간이 있다면 표시 */}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color="error" />
                  </TimelineSeparator>
                  <TimelineContent>취소됨</TimelineContent>
                </TimelineItem>
              )}
            </Timeline>
          </Paper>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              관련 정보
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                component={Link}
                to={`/biddings/${order.biddingId}`}
                color="primary">
                관련 입찰 보기
              </Button>
              <Button
                component={Link}
                to={`/bidding-participations/${order.biddingParticipationId}`}
                color="primary">
                낙찰자 참여 정보 보기
              </Button>
              <Button
                component={Link}
                to={`/bidding-items/${order.biddingItemId}`}
                color="primary">
                입찰 품목 보기
              </Button>
              <Button
                component={Link}
                to={`/suppliers/${order.supplierId}`}
                color="primary">
                공급자 정보 보기
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Paper>

      {/* 확인 다이얼로그 */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description">
        <DialogTitle id="alert-dialog-title">{dialogAction.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {dialogAction.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button
            onClick={handleConfirm}
            color={
              dialogAction.action === "delete" ||
              dialogAction.action === "cancel"
                ? "error"
                : "primary"
            }
            autoFocus>
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BiddingOrderDetail;
