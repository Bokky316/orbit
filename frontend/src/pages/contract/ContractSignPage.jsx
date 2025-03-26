import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Grid,
  TextField,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from "@mui/material";
import moment from "moment";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { green, grey } from "@mui/material/colors";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { useSelector } from "react-redux";

// 임의 데이터 관련 함수 가져오기
import { getContractDetail } from "./mockData";

const ContractSignPage = () => {
  const { id } = useParams(); // contractId
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const { user } = useSelector(
    (state) => state.auth || { user: { role: "BUYER" } }
  );
  const [contract, setContract] = useState(null);
  const [signing, setSigning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signatureNote, setSignatureNote] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  const isBuyer = user?.role === "BUYER";
  const isSupplier = user?.role === "SUPPLIER";

  // 계약 상세 정보 로드
  useEffect(() => {
    const fetchContract = async () => {
      setLoading(true);
      try {
        // 실제 API 호출 대신 임의 데이터 사용
        setTimeout(() => {
          const contractData = getContractDetail(id);
          if (!contractData) {
            setError("계약 정보를 찾을 수 없습니다.");
          } else {
            setContract(contractData);
          }
          setLoading(false);
        }, 800);
      } catch (err) {
        console.error("계약 정보 로드 실패:", err);
        setError(`계약 정보를 불러오는 중 오류가 발생했습니다: ${err.message}`);
        setLoading(false);
      }
    };

    fetchContract();
  }, [id]);

  // 이미 서명한 사용자인지 확인
  const hasUserSigned = () => {
    if (!contract) return false;
    return (
      (isBuyer && contract.buyerSignature) ||
      (isSupplier && contract.supplierSignature)
    );
  };

  // 서명 캔버스 초기화
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // 캔버스 초기화
    ctx.fillStyle = "#f8f8f8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 서명 영역 테두리
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // 서명 안내선
    ctx.strokeStyle = "#e0e0e0";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 서명 기본 스타일
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000";
  }, [canvasRef]);

  // 서명 그리기 시작
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    setIsDrawing(true);

    // 터치 이벤트와 마우스 이벤트 처리
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);

    setLastPosition({ x, y });
  };

  // 서명 그리기
  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    // 터치 이벤트와 마우스 이벤트 처리
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    setLastPosition({ x, y });
  };

  // 서명 그리기 종료
  const endDrawing = () => {
    setIsDrawing(false);
  };

  // 서명 초기화
  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // 캔버스 초기화
    ctx.fillStyle = "#f8f8f8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 서명 영역 테두리
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // 서명 안내선
    ctx.strokeStyle = "#e0e0e0";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // 서명 확인 다이얼로그 열기
  const handleOpenConfirmDialog = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // 캔버스에 그려진 픽셀 데이터 확인
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let hasSignature = false;

    // 투명도가 0이 아닌 픽셀이 있는지 확인 (서명이 있는지)
    for (let i = 3; i < imageData.length; i += 4) {
      if (imageData[i] > 0 && imageData[i - 3] < 240) {
        // 알파값이 0보다 크고 RGB 중 하나가 어두운 색상
        hasSignature = true;
        break;
      }
    }

    if (!hasSignature) {
      alert("서명을 입력해주세요.");
      return;
    }

    setConfirmDialogOpen(true);
  };

  // 서명 제출
  const handleSubmitSignature = async () => {
    setSigning(true);
    try {
      // 캔버스 이미지를 데이터 URL로 변환
      const signatureDataUrl = canvasRef.current.toDataURL("image/png");

      // 실제 API 호출 대신 모의 처리
      setTimeout(() => {
        alert("서명이 성공적으로 제출되었습니다.");
        navigate(`/contracts/${id}`);
      }, 1500);
    } catch (err) {
      console.error("서명 제출 실패:", err);
      alert(`서명 제출 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setSigning(false);
      setConfirmDialogOpen(false);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return moment(dateString).format("YYYY-MM-DD");
  };

  // 금액 포맷팅
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "-";
    return amount.toLocaleString() + "원";
  };

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

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate("/contracts")}>
          계약 목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  if (!contract) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          계약 정보를 찾을 수 없습니다.
        </Alert>
        <Button variant="contained" onClick={() => navigate("/contracts")}>
          계약 목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  // 이미 서명한 경우
  if (hasUserSigned()) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          계약서 서명
        </Typography>
        <Alert
          severity="info"
          icon={<CheckCircleOutlineIcon fontSize="inherit" />}
          sx={{ mb: 3 }}>
          이미 서명한 계약입니다.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate(`/contracts/${id}`)}>
          계약 상세 페이지로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        계약서 서명
      </Typography>

      <Grid container spacing={3}>
        {/* 계약 정보 요약 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                계약 정보
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    계약 제목
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {contract.title}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    계약번호
                  </Typography>
                  <Typography variant="body1">
                    {contract.transactionNumber}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    계약 금액
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(contract.totalAmount)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    계약 시작일
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(contract.startDate)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    계약 종료일
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(contract.endDate)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    구매자
                  </Typography>
                  <Typography variant="body1">{contract.buyerName}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    공급자
                  </Typography>
                  <Typography variant="body1">
                    {contract.supplierName}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    구매자 서명 상태
                  </Typography>
                  <Chip
                    label={contract.buyerSignature ? "서명 완료" : "미서명"}
                    color={contract.buyerSignature ? "success" : "default"}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    공급자 서명 상태
                  </Typography>
                  <Chip
                    label={contract.supplierSignature ? "서명 완료" : "미서명"}
                    color={contract.supplierSignature ? "success" : "default"}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 서명 영역 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {isBuyer ? "구매자" : "공급자"} 서명
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom>
                  아래 영역에 서명해주세요
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mb: 3,
                  border: "1px solid #ddd",
                  borderRadius: 1,
                  p: 1
                }}>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={200}
                  style={{
                    background: "#f8f8f8",
                    touchAction: "none"
                  }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={endDrawing}
                  onMouseLeave={endDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={endDrawing}
                />
              </Box>

              <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                <Button
                  variant="outlined"
                  onClick={clearSignature}
                  sx={{ mr: 2 }}>
                  서명 초기화
                </Button>
              </Box>

              <TextField
                fullWidth
                label="서명 메모 (선택사항)"
                value={signatureNote}
                onChange={(e) => setSignatureNote(e.target.value)}
                multiline
                rows={3}
                placeholder="서명과 관련된 메모나 코멘트를 남길 수 있습니다."
                sx={{ mb: 3 }}
              />

              <Alert severity="info" sx={{ mb: 3 }}>
                서명 후에는 취소할 수 없으며, 법적 효력이 발생합니다. 계약
                내용을 충분히 검토한 후 서명해주세요.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => navigate(`/contracts/${id}`)}
          disabled={signing}>
          취소
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenConfirmDialog}
          disabled={signing}>
          {signing ? "서명 처리 중..." : "서명 제출"}
        </Button>
      </Box>

      {/* 서명 확인 다이얼로그 */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        aria-labelledby="sign-confirm-dialog-title">
        <DialogTitle id="sign-confirm-dialog-title">서명 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            서명을 제출하면 취소할 수 없으며 계약에 법적 효력이 발생합니다.
            계약에 서명하시겠습니까?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            disabled={signing}>
            취소
          </Button>
          <Button
            onClick={handleSubmitSignature}
            color="primary"
            disabled={signing}>
            {signing ? "처리 중..." : "서명 확인"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContractSignPage;
