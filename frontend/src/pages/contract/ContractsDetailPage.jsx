import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Stack,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  Description as DescriptionIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as ShippingIcon,
  Refresh as RefreshIcon,
  Done as DoneIcon
} from "@mui/icons-material";

// 더미데이터 컨텍스트 사용
import { useBiddingData } from "../bidding/BiddingDataContext";

function ContractsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getContractById,
    getBiddingById,
    getSupplierById,
    contracts,
    setContracts,
    orders,
    setOrders
  } = useBiddingData();

  // 상태 관리
  const [contract, setContract] = useState(null);
  const [bidding, setBidding] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // 새로고침 트리거용 키

  // 계약 서명 상태
  const [signDialog, setSignDialog] = useState({ open: false, type: "" });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: "",
    title: "",
    message: ""
  });
  const [commentDialog, setCommentDialog] = useState({
    open: false,
    comment: ""
  });

  // 발주 관련 상태
  const [createOrderDialog, setCreateOrderDialog] = useState(false);
  const [orderData, setOrderData] = useState({
    quantity: 0,
    expectedDeliveryDate: new Date(
      new Date().setDate(new Date().getDate() + 30)
    ),
    notes: "",
    deliveryAddress: ""
  });
  const [orderValidation, setOrderValidation] = useState({});

  // 페이지 로드 시 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 더미 데이터에서 계약 정보 가져오기
        const contractData = getContractById(id);

        if (!contractData) {
          throw new Error("계약 정보를 찾을 수 없습니다.");
        }

        setContract(contractData);

        // 연관된 입찰 정보 가져오기
        if (contractData.biddingId) {
          const biddingData = getBiddingById(contractData.biddingId);
          if (biddingData) {
            setBidding(biddingData);

            // 입찰 정보에서 기본 발주 데이터 설정
            if (biddingData.participations) {
              const selectedBidder = biddingData.participations.find(
                (p) => p.isSelectedBidder
              );
              if (selectedBidder) {
                setOrderData((prev) => ({
                  ...prev,
                  quantity: selectedBidder.quantity || 1
                }));
              }
            }
          }
        }

        // 공급자 정보 가져오기
        if (contractData.supplierId) {
          const supplierData = getSupplierById(contractData.supplierId);
          if (supplierData) {
            setSupplier(supplierData);

            // 공급자 주소를 기본 배송지로 설정
            if (supplierData.address) {
              setOrderData((prev) => ({
                ...prev,
                deliveryAddress: supplierData.address
              }));
            }
          }
        }
      } catch (err) {
        console.error("계약 상세 정보 로드 중 오류:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, getContractById, getBiddingById, getSupplierById, refreshKey]);

  // 계약서 다운로드 핸들러
  const handleDownloadContract = () => {
    alert(
      "계약서 다운로드를 시뮬레이션합니다. (실제 파일은 다운로드되지 않습니다)"
    );
  };

  // 계약 서명 핸들러
  const handleSign = (type) => {
    setSignDialog({ open: true, type });
  };

  // 서명 다이얼로그 닫기
  const handleCloseSignDialog = () => {
    setSignDialog({ open: false, type: "" });
  };

  // 서명 제출 핸들러
  const handleSubmitSign = () => {
    // 서명 처리 (더미 데이터 갱신)
    const updatedContract = { ...contract };

    if (signDialog.type === "internal") {
      updatedContract.signatureStatus = "내부서명";
      updatedContract.status = "서명중";
    } else if (signDialog.type === "supplier") {
      updatedContract.signatureStatus = "완료";
      updatedContract.status = "활성";
    }

    // 계약 목록 업데이트
    const updatedContracts = contracts.map((c) =>
      c.id === contract.id ? updatedContract : c
    );
    setContracts(updatedContracts);
    setContract(updatedContract);

    handleCloseSignDialog();
    alert(
      `${
        signDialog.type === "internal" ? "내부" : "공급자"
      } 서명이 완료되었습니다.`
    );
  };

  // 계약 삭제 확인 다이얼로그 열기
  const handleConfirmDelete = () => {
    setConfirmDialog({
      open: true,
      action: "delete",
      title: "계약 삭제",
      message: "이 계약을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다."
    });
  };

  // 계약 완료 확인 다이얼로그 열기
  const handleConfirmComplete = () => {
    setCommentDialog({
      open: true,
      comment: ""
    });
  };

  // 댓글 다이얼로그 닫기
  const handleCloseCommentDialog = () => {
    setCommentDialog({ open: false, comment: "" });
  };

  // 댓글 제출 핸들러
  const handleSubmitComment = () => {
    // 계약 완료 처리 (더미 데이터 갱신)
    const updatedContract = { ...contract, status: "완료" };

    // 계약 목록 업데이트
    const updatedContracts = contracts.map((c) =>
      c.id === contract.id ? updatedContract : c
    );
    setContracts(updatedContracts);
    setContract(updatedContract);

    handleCloseCommentDialog();
    alert("계약이 완료 처리되었습니다.");
  };

  // 확인 다이얼로그 닫기
  const handleCloseConfirmDialog = () => {
    setConfirmDialog({ open: false, action: "", title: "", message: "" });
  };

  // 확인 다이얼로그 액션 핸들러
  const handleConfirmAction = () => {
    if (confirmDialog.action === "delete") {
      // 계약 삭제 처리 (더미 데이터이므로 실제 삭제는 발생하지 않음)
      alert(
        "계약이 삭제되었습니다. (더미 데이터이므로 실제로 삭제되지 않습니다)"
      );
      navigate("/contracts");
    }
    handleCloseConfirmDialog();
  };

  // 계약 승인 상태 업데이트
  const handleUpdateStatus = (newStatus) => {
    const updatedContract = { ...contract, status: newStatus };

    // 계약 목록 업데이트
    const updatedContracts = contracts.map((c) =>
      c.id === contract.id ? updatedContract : c
    );
    setContracts(updatedContracts);
    setContract(updatedContract);

    alert(`계약 상태가 '${newStatus}'로 변경되었습니다.`);
  };

  // 페이지 새로고침 핸들러
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // 발주 생성 다이얼로그 열기
  const handleOpenOrderDialog = () => {
    setCreateOrderDialog(true);
  };

  // 발주 생성 다이얼로그 닫기
  const handleCloseOrderDialog = () => {
    setCreateOrderDialog(false);
    setOrderValidation({});
  };

  // 발주 데이터 변경 핸들러
  const handleOrderDataChange = (field, value) => {
    setOrderData((prev) => ({
      ...prev,
      [field]: value
    }));

    // 필드 변경 시 해당 필드의 유효성 검사 상태 초기화
    if (orderValidation[field]) {
      setOrderValidation((prev) => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // 발주 데이터 유효성 검사
  const validateOrderData = () => {
    const errors = {};

    if (!orderData.quantity || orderData.quantity <= 0) {
      errors.quantity = "수량은 1 이상이어야 합니다.";
    }

    if (!orderData.expectedDeliveryDate) {
      errors.expectedDeliveryDate = "예상 납품일을 선택해주세요.";
    } else if (new Date(orderData.expectedDeliveryDate) <= new Date()) {
      errors.expectedDeliveryDate = "예상 납품일은 오늘 이후 날짜여야 합니다.";
    }

    if (!orderData.deliveryAddress || orderData.deliveryAddress.trim() === "") {
      errors.deliveryAddress = "배송 주소를 입력해주세요.";
    }

    setOrderValidation(errors);
    return Object.keys(errors).length === 0;
  };

  // 발주 생성 제출 핸들러
  const handleSubmitOrder = () => {
    // 유효성 검사
    if (!validateOrderData()) {
      return;
    }

    // 입찰 관련 정보 확인
    if (!bidding || !supplier) {
      alert("입찰 또는 공급사 정보가 없습니다.");
      return;
    }

    // 단가 계산 (계약 금액 / 수량)
    const unitPrice = Math.round(contract.totalAmount / orderData.quantity);
    const totalAmount = unitPrice * orderData.quantity;
    const supplyPrice = Math.round(totalAmount / 1.1);
    const vat = totalAmount - supplyPrice;

    // 발주 생성
    const newOrder = {
      id: `ORDER-${Date.now()}`,
      orderNumber: `ORD-${contract.transactionNumber.split("-")[1]}`, // 계약번호 기반 발주번호 생성
      contractId: contract.id,
      biddingId: bidding.id,
      supplierId: supplier.id,
      supplierName: supplier.name,
      title: `${bidding.title.replace("입찰", "")} 발주`,
      description: orderData.notes || `${bidding.title}에 대한 발주`,
      status: "DRAFT",
      unitPrice: unitPrice,
      quantity: orderData.quantity,
      supplyPrice: supplyPrice,
      vat: vat,
      totalAmount: totalAmount,
      expectedDeliveryDate: orderData.expectedDeliveryDate.toISOString(),
      deliveryAddress: orderData.deliveryAddress,
      terms: bidding.conditions,
      contractNumber: contract.transactionNumber,
      createdAt: new Date().toISOString(),
      isSelectedBidder: true
    };

    // 발주 추가
    setOrders([...orders, newOrder]);

    handleCloseOrderDialog();
    alert("발주가 생성되었습니다. 발주 관리 페이지에서 확인할 수 있습니다.");

    // 발주 페이지로 이동
    navigate(`/orders/${newOrder.id}`);
  };

  // 로딩 중일 때
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "70vh"
        }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          계약 정보를 불러오는 중...
        </Typography>
      </Box>
    );
  }

  // 오류 발생 시
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate("/contracts")}>
          계약 목록으로
        </Button>
      </Box>
    );
  }

  // 계약 정보가 없을 때
  if (!contract) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          계약 정보를 찾을 수 없습니다.
        </Alert>
        <Button variant="contained" onClick={() => navigate("/contracts")}>
          계약 목록으로
        </Button>
      </Box>
    );
  }

  // 서명 단계 상태
  const getSignatureStep = () => {
    switch (contract.signatureStatus) {
      case "미서명":
        return 0;
      case "내부서명":
        return 1;
      case "완료":
        return 2;
      default:
        return 0;
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  // 상태에 따른 색상
  const getStatusColor = (status) => {
    switch (status) {
      case "초안":
        return "default";
      case "서명중":
        return "warning";
      case "활성":
        return "success";
      case "완료":
        return "info";
      case "취소":
        return "error";
      default:
        return "default";
    }
  };

  // 발주 생성 가능 여부 확인
  const canCreateOrder = () => {
    return contract.status === "활성" || contract.status === "완료";
  };

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
        <Typography variant="h4">계약 상세</Typography>
        <Box>
          <Tooltip title="새로고침">
            <IconButton onClick={handleRefresh} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            onClick={() => navigate("/contracts")}
            sx={{ mr: 1 }}>
            계약 목록으로
          </Button>
          {contract.status === "초안" && (
            <>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate(`/contracts/${id}/edit`)}
                sx={{ mr: 1 }}
                startIcon={<EditIcon />}>
                수정
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleConfirmDelete}
                startIcon={<DeleteIcon />}>
                삭제
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* 기본 정보 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h5">
              계약 정보
              <Chip
                label={contract.status}
                color={getStatusColor(contract.status)}
                size="small"
                sx={{ ml: 2 }}
              />
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              계약 번호
            </Typography>
            <Typography variant="body1">
              {contract.transactionNumber}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              입찰 번호
            </Typography>
            <Typography variant="body1">
              {contract.biddingNumber || "-"}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              계약 생성일
            </Typography>
            <Typography variant="body1">
              {formatDate(contract.createdAt)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              서명 상태
            </Typography>
            <Chip
              label={contract.signatureStatus}
              color={
                contract.signatureStatus === "완료"
                  ? "success"
                  : contract.signatureStatus === "내부서명"
                  ? "warning"
                  : "default"
              }
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              공급자
            </Typography>
            <Typography variant="body1">{contract.supplierName}</Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              계약 기간
            </Typography>
            <Typography variant="body1">
              {formatDate(contract.startDate)} ~ {formatDate(contract.endDate)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              계약 금액
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              {contract.totalAmount.toLocaleString()}원
            </Typography>
          </Grid>
        </Grid>

        {/* 계약 서명 상태 진행도 */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            서명 진행 상태
          </Typography>
          <Stepper activeStep={getSignatureStep()} alternativeLabel>
            <Step>
              <StepLabel>작성 완료</StepLabel>
            </Step>
            <Step>
              <StepLabel>내부 서명</StepLabel>
            </Step>
            <Step>
              <StepLabel>공급자 서명</StepLabel>
            </Step>
          </Stepper>
        </Box>

        {/* 계약 문서 다운로드 섹션 */}
        {contract.finalContractFilePath && (
          <Box sx={{ mt: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <DescriptionIcon color="primary" />
              <Typography variant="body1">계약서 파일</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadContract}>
                다운로드
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>

      {/* 연관 정보 */}
      {bidding && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            연관 입찰 정보
          </Typography>
          <TableContainer>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell component="th" width="20%">
                    입찰 제목
                  </TableCell>
                  <TableCell>{bidding.title}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th">입찰 번호</TableCell>
                  <TableCell>{bidding.bidNumber}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th">입찰 기간</TableCell>
                  <TableCell>
                    {formatDate(bidding.startDate)} ~{" "}
                    {formatDate(bidding.endDate)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th">낙찰 금액</TableCell>
                  <TableCell>
                    {contract.totalAmount.toLocaleString()}원
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/biddings/${bidding.id}`)}>
              입찰 상세 보기
            </Button>
          </Box>
        </Paper>
      )}

      {/* 공급자 정보 */}
      {supplier && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            공급자 정보
          </Typography>
          <TableContainer>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell component="th" width="20%">
                    공급자명
                  </TableCell>
                  <TableCell>{supplier.name}</TableCell>
                  <TableCell component="th" width="20%">
                    사업자번호
                  </TableCell>
                  <TableCell>{supplier.businessNumber}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th">담당자</TableCell>
                  <TableCell>{supplier.contactPerson}</TableCell>
                  <TableCell component="th">연락처</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th">이메일</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell component="th">주소</TableCell>
                  <TableCell>{supplier.address}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* 액션 버튼 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          계약 관리
        </Typography>
        <Grid container spacing={2}>
          {/* 서명 버튼 */}
          {contract.status === "초안" &&
            contract.signatureStatus === "미서명" && (
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleSign("internal")}
                  startIcon={<CheckCircleIcon />}>
                  내부 서명
                </Button>
              </Grid>
            )}

          {contract.status === "서명중" &&
            contract.signatureStatus === "내부서명" && (
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleSign("supplier")}
                  startIcon={<SendIcon />}>
                  공급자 서명 요청
                </Button>
              </Grid>
            )}

          {/* 발주 생성 버튼 */}
          {canCreateOrder() && (
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenOrderDialog}
                startIcon={<ShippingIcon />}>
                발주 생성
              </Button>
            </Grid>
          )}

          {/* 계약 완료 버튼 */}
          {contract.status === "활성" && (
            <Grid item>
              <Button
                variant="contained"
                color="success"
                onClick={handleConfirmComplete}
                startIcon={<DoneIcon />}>
                계약 완료 처리
              </Button>
            </Grid>
          )}

          {/* 계약 취소 버튼 */}
          {(contract.status === "초안" ||
            contract.status === "서명중" ||
            contract.status === "활성") && (
            <Grid item>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleUpdateStatus("취소")}>
                계약 취소
              </Button>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* 서명 다이얼로그 */}
      <Dialog open={signDialog.open} onClose={handleCloseSignDialog}>
        <DialogTitle>
          {signDialog.type === "internal" ? "내부 서명" : "공급자 서명 요청"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {signDialog.type === "internal"
              ? "이 계약에 내부 서명을 추가하시겠습니까?"
              : "공급자에게 서명 요청을 보내시겠습니까?"}
          </DialogContentText>
          {signDialog.type === "supplier" && (
            <TextField
              autoFocus
              margin="dense"
              label="요청 메시지 (선택사항)"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSignDialog}>취소</Button>
          <Button
            onClick={handleSubmitSign}
            variant="contained"
            color="primary">
            {signDialog.type === "internal" ? "서명 확인" : "요청 전송"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 발주 생성 다이얼로그 */}
      <Dialog
        open={createOrderDialog}
        onClose={handleCloseOrderDialog}
        maxWidth="md"
        fullWidth>
        <DialogTitle>발주 생성</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            {supplier?.name || contract.supplierName}에게 보낼 발주 정보를
            입력해주세요.
          </DialogContentText>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="수량"
                type="number"
                value={orderData.quantity}
                onChange={(e) =>
                  handleOrderDataChange(
                    "quantity",
                    parseInt(e.target.value) || 0
                  )
                }
                error={!!orderValidation.quantity}
                helperText={orderValidation.quantity}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="예상 납품일"
                  value={orderData.expectedDeliveryDate}
                  onChange={(newDate) =>
                    handleOrderDataChange("expectedDeliveryDate", newDate)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!orderValidation.expectedDeliveryDate}
                      helperText={orderValidation.expectedDeliveryDate}
                    />
                  )}
                  minDate={new Date()}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="배송 주소"
                value={orderData.deliveryAddress}
                onChange={(e) =>
                  handleOrderDataChange("deliveryAddress", e.target.value)
                }
                error={!!orderValidation.deliveryAddress}
                helperText={orderValidation.deliveryAddress}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="추가 요청사항"
                multiline
                rows={4}
                value={orderData.notes}
                onChange={(e) => handleOrderDataChange("notes", e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mt: 2 }}>
                발주 요약
              </Typography>
              <Divider sx={{ my: 1 }} />

              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ mt: 2 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" width="40%">
                        계약 번호
                      </TableCell>
                      <TableCell>{contract.transactionNumber}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">공급자</TableCell>
                      <TableCell>
                        {supplier?.name || contract.supplierName}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">품목</TableCell>
                      <TableCell>
                        {bidding?.title.replace("입찰", "") || "계약 품목"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">수량</TableCell>
                      <TableCell>{orderData.quantity}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">예상 금액</TableCell>
                      <TableCell>
                        {contract.totalAmount.toLocaleString()}원
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">예상 납품일</TableCell>
                      <TableCell>
                        {orderData.expectedDeliveryDate
                          ? orderData.expectedDeliveryDate.toLocaleDateString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOrderDialog}>취소</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitOrder}>
            발주 생성
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ContractsDetailPage;

{
  /* 확인 다이얼로그 */
}
<Dialog open={confirmDialog.open} onClose={handleCloseConfirmDialog}>
  <DialogTitle>{confirmDialog.title}</DialogTitle>
  <DialogContent>
    <DialogContentText>{confirmDialog.message}</DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleCloseConfirmDialog}>취소</Button>
    <Button onClick={handleConfirmAction} color="primary" autoFocus>
      확인
    </Button>
  </DialogActions>
</Dialog>;

{
  /* 완료 코멘트 다이얼로그 */
}
<Dialog open={commentDialog.open} onClose={handleCloseCommentDialog}>
  <DialogTitle>계약 완료 처리</DialogTitle>
  <DialogContent>
    <DialogContentText sx={{ mb: 2 }}>
      이 계약을 완료 처리하시겠습니까? 완료 사유나 코멘트를 남길 수 있습니다.
    </DialogContentText>
    <TextField
      autoFocus
      margin="dense"
      label="완료 사유/코멘트"
      fullWidth
      multiline
      rows={3}
      variant="outlined"
      value={commentDialog.comment}
      onChange={(e) =>
        setCommentDialog({ ...commentDialog, comment: e.target.value })
      }
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={handleCloseCommentDialog}>취소</Button>
    <Button onClick={handleSubmitComment} variant="contained" color="success">
      완료 처리
    </Button>
  </DialogActions>
</Dialog>;
