import React, { useState, useEffect, useRef } from "react";
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
  Tooltip
} from "@mui/material";
import {
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon
} from "@mui/icons-material";
import SignatureCanvas from "react-signature-canvas";
import { useSelector } from "react-redux";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

function SupplierContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const sigCanvas = useRef({});

  // 상태 관리
  const [contract, setContract] = useState(null);
  const [bidding, setBidding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [statusHistories, setStatusHistories] = useState([]);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState({
    show: false,
    message: "",
    severity: "success"
  });

  // 페이지 로드 시 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 계약 정보 가져오기
        const contractResponse = await fetchWithAuth(
          `${API_URL}supplier/contracts/${id}`
        );

        if (!contractResponse.ok) {
          throw new Error(
            `계약 정보를 가져오는데 실패했습니다. (${contractResponse.status})`
          );
        }

        const contractData = await contractResponse.json();
        setContract(contractData);

        // 관련 입찰 정보 가져오기 (필요 시)
        if (contractData.biddingId) {
          try {
            const biddingResponse = await fetchWithAuth(
              `${API_URL}biddings/${contractData.biddingId}`
            );
            if (biddingResponse.ok) {
              const biddingData = await biddingResponse.json();
              setBidding(biddingData);
            }
          } catch (biddingError) {
            console.error("입찰 정보 로드 중 오류:", biddingError);
            // 입찰 정보 로드 실패는 치명적 오류가 아님 - 계속 진행
          }
        }
      } catch (err) {
        console.error("계약 정보 로드 중 오류:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // 상태 이력 가져오기
  const fetchStatusHistories = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}supplier/contracts/${id}/status-histories`
      );

      if (!response.ok) {
        throw new Error(
          `상태 이력을 가져오는데 실패했습니다. (${response.status})`
        );
      }

      const historiesData = await response.json();
      setStatusHistories(historiesData);
      setHistoryDialogOpen(true);
    } catch (err) {
      console.error("상태 이력 로드 중 오류:", err);
      setStatusMessage({
        show: true,
        message: `상태 이력을 불러올 수 없습니다: ${err.message}`,
        severity: "error"
      });
    }
  };

  // 계약서 다운로드
  const handleDownloadContract = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}supplier/contracts/${id}/download`,
        {
          method: "GET",
          headers: {
            Accept: "application/pdf"
          }
        }
      );

      if (!response.ok) {
        throw new Error(`계약서 다운로드에 실패했습니다. (${response.status})`);
      }

      // Blob으로 응답 데이터 가져오기
      const blob = await response.blob();

      // 다운로드 링크 생성
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `계약서_${contract.transactionNumber}.pdf`;
      document.body.appendChild(a);
      a.click();

      // 링크 정리
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 0);

      setStatusMessage({
        show: true,
        message: "계약서가 다운로드 되었습니다.",
        severity: "success"
      });
    } catch (err) {
      console.error("계약서 다운로드 중 오류:", err);
      setStatusMessage({
        show: true,
        message: `계약서 다운로드 실패: ${err.message}`,
        severity: "error"
      });
    }
  };

  // 서명 다이얼로그 열기
  const handleOpenSignatureDialog = () => {
    setSignatureDialogOpen(true);
  };

  // 서명 다이얼로그 닫기
  const handleCloseSignatureDialog = () => {
    setSignatureDialogOpen(false);
  };

  // 서명 캔버스 지우기
  const clearSignature = () => {
    sigCanvas.current.clear();
  };

  // 서명 제출
  const handleSubmitSignature = async () => {
    if (sigCanvas.current.isEmpty()) {
      setStatusMessage({
        show: true,
        message: "서명을 먼저 작성해주세요.",
        severity: "warning"
      });
      return;
    }

    // 서명 이미지를 base64 문자열로 변환
    const signatureData = sigCanvas.current.toDataURL("image/png");

    try {
      const response = await fetchWithAuth(
        `${API_URL}supplier/contracts/${id}/sign`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: `signature=${encodeURIComponent(signatureData)}`
        }
      );

      if (!response.ok) {
        throw new Error(`서명 제출에 실패했습니다. (${response.status})`);
      }

      const updatedContract = await response.json();
      setContract(updatedContract);
      handleCloseSignatureDialog();

      setStatusMessage({
        show: true,
        message: "계약에 성공적으로 서명했습니다.",
        severity: "success"
      });

      // 양측 서명 완료 시 서명 및 계약 상태 업데이트
      if (updatedContract.buyerSignature && updatedContract.supplierSignature) {
        setStatusMessage({
          show: true,
          message: "양측 모두 서명이 완료되어 계약이 체결되었습니다.",
          severity: "success"
        });
      }
    } catch (err) {
      console.error("서명 제출 중 오류:", err);
      setStatusMessage({
        show: true,
        message: `서명 제출 실패: ${err.message}`,
        severity: "error"
      });
    }
  };

  // 페이지 새로고침
  const handleRefresh = () => {
    window.location.reload();
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  // 상태에 따른 색상
  const getStatusColor = (status) => {
    switch (status) {
      case "DRAFT":
        return "default";
      case "IN_PROGRESS":
        return "warning";
      case "CLOSED":
        return "success";
      case "COMPLETED":
        return "info";
      case "CANCELED":
        return "error";
      default:
        return "default";
    }
  };

  // 서명 상태에 따른 텍스트
  const getSignatureStatusText = (contract) => {
    if (contract.supplierSignature && contract.buyerSignature) {
      return "양측 서명 완료";
    } else if (contract.buyerSignature) {
      return "구매자 서명 완료";
    } else if (contract.supplierSignature) {
      return "공급자 서명 완료";
    } else {
      return "미서명";
    }
  };

  // 서명 현재 단계
  const getSignatureStep = (contract) => {
    if (contract.supplierSignature && contract.buyerSignature) {
      return 2; // 양측 서명 완료
    } else if (contract.buyerSignature || contract.supplierSignature) {
      return 1; // 한쪽 서명 완료
    } else {
      return 0; // 서명 없음
    }
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
        <Button
          variant="contained"
          onClick={() => navigate("/supplier/contracts")}>
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
        <Button
          variant="contained"
          onClick={() => navigate("/supplier/contracts")}>
          계약 목록으로
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* 상태 메시지 */}
      {statusMessage.show && (
        <Alert
          severity={statusMessage.severity}
          sx={{ mb: 3 }}
          onClose={() => setStatusMessage({ ...statusMessage, show: false })}>
          {statusMessage.message}
        </Alert>
      )}

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
          <Tooltip title="상태 이력">
            <IconButton onClick={fetchStatusHistories} sx={{ mr: 1 }}>
              <HistoryIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            onClick={() => navigate("/supplier/contracts")}>
            계약 목록으로
          </Button>
        </Box>
      </Box>

      {/* 기본 정보 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h5">
              계약 정보
              <Chip
                label={contract.statusText || "상태 정보 없음"}
                color={getStatusColor(contract.statusText)}
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
              label={getSignatureStatusText(contract)}
              color={
                contract.buyerSignature && contract.supplierSignature
                  ? "success"
                  : "warning"
              }
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              구매자
            </Typography>
            <Typography variant="body1">
              {contract.buyerName || "정보 없음"}
            </Typography>
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
              {contract.totalAmount ? contract.totalAmount.toLocaleString() : 0}
              원
            </Typography>
          </Grid>
        </Grid>

        {/* 계약 서명 상태 진행도 */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            서명 진행 상태
          </Typography>
          <Stepper activeStep={getSignatureStep(contract)} alternativeLabel>
            <Step>
              <StepLabel>계약 작성</StepLabel>
            </Step>
            <Step>
              <StepLabel>일부 서명 완료</StepLabel>
            </Step>
            <Step>
              <StepLabel>양측 서명 완료</StepLabel>
            </Step>
          </Stepper>
        </Box>

        {/* 계약 문서 다운로드 섹션 */}
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
      </Paper>

      {/* 계약 세부 정보 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          계약 세부 정보
        </Typography>
        <TableContainer>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell component="th" width="30%">
                  계약 설명
                </TableCell>
                <TableCell>{contract.description || "정보 없음"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th">계약 품목</TableCell>
                <TableCell>{contract.itemName || "정보 없음"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th">수량</TableCell>
                <TableCell>{contract.quantity || 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th">단가</TableCell>
                <TableCell>
                  {contract.unitPrice ? contract.unitPrice.toLocaleString() : 0}
                  원
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th">총 금액</TableCell>
                <TableCell>
                  {contract.totalAmount
                    ? contract.totalAmount.toLocaleString()
                    : 0}
                  원
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th">납품 예정일</TableCell>
                <TableCell>{formatDate(contract.deliveryDate)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 서명 상태 및 액션 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          서명 정보
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  구매자 서명
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  상태: {contract.buyerSignature ? "서명 완료" : "미서명"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  서명일:{" "}
                  {contract.buyerSignedAt
                    ? formatDate(contract.buyerSignedAt)
                    : "-"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  공급자 서명
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  상태: {contract.supplierSignature ? "서명 완료" : "미서명"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  서명일:{" "}
                  {contract.supplierSignedAt
                    ? formatDate(contract.supplierSignedAt)
                    : "-"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 서명 버튼 (상태가 IN_PROGRESS이고 공급자가 아직 서명하지 않은 경우에만 표시) */}
        {contract.statusText === "IN_PROGRESS" &&
          !contract.supplierSignature && (
            <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CheckCircleIcon />}
                onClick={handleOpenSignatureDialog}
                size="large">
                공급자 서명하기
              </Button>
            </Box>
          )}
      </Paper>

      {/* 입찰 정보 (있는 경우) */}
      {bidding && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            연관 입찰 정보
          </Typography>
          <TableContainer>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell component="th" width="30%">
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
                  <TableCell component="th">입찰 상태</TableCell>
                  <TableCell>{bidding.statusText}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/supplier/biddings/${bidding.id}`)}>
              입찰 상세 보기
            </Button>
          </Box>
        </Paper>
      )}

      {/* 서명 다이얼로그 */}
      <Dialog
        open={signatureDialogOpen}
        onClose={handleCloseSignatureDialog}
        maxWidth="md"
        fullWidth>
        <DialogTitle>계약 서명</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            아래 영역에 서명을 작성해주세요. 서명은 법적 효력이 있는
            전자서명으로 처리됩니다.
          </DialogContentText>

          <Box sx={{ border: "1px solid #ccc", borderRadius: 1, mb: 2 }}>
            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              canvasProps={{
                width: 500,
                height: 200,
                className: "signature-canvas"
              }}
            />
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={clearSignature} color="secondary">
              지우기
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSignatureDialog}>취소</Button>
          <Button
            onClick={handleSubmitSignature}
            variant="contained"
            color="primary">
            서명 제출
          </Button>
        </DialogActions>
      </Dialog>

      {/* 상태 이력 다이얼로그 */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth>
        <DialogTitle>계약 상태 이력</DialogTitle>
        <DialogContent>
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
                      <TableCell>
                        {new Date(history.changedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {history.fromStatus?.codeValue || "-"}
                      </TableCell>
                      <TableCell>
                        {history.toStatus?.codeValue || "-"}
                      </TableCell>
                      <TableCell>{history.reason || "-"}</TableCell>
                      <TableCell>
                        {history.changedBy?.username || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1">상태 변경 이력이 없습니다.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SupplierContractDetailPage;
