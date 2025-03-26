// 계약 상세 페이지 (완성된 상태)
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Divider,
  TextField,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import { useSelector } from "react-redux";
import DownloadIcon from "@mui/icons-material/Download";
import AssignmentIcon from "@mui/icons-material/Assignment";
import HistoryIcon from "@mui/icons-material/History";
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
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

const ContractDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signatureNote, setSignatureNote] = useState("");

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  const isBuyer = user?.role === "BUYER";
  const isSupplier = user?.role === "SUPPLIER";

  const fetchContract = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_URL}bidding-contracts/${id}`);
      const data = await res.json();
      setContract(data);

      const canSign =
        data.status === "서명중" &&
        ((isBuyer && !data.buyerSignature) ||
          (isSupplier && !data.supplierSignature));

      setShowSignature(canSign);
    } catch (err) {
      console.error("계약 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
  }, [id]);

  useEffect(() => {
    if (!canvasRef.current || !showSignature) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f8f8f8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#ddd";
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }, [showSignature]);

  const getStep = () => {
    if (!contract) return 0;
    if (contract.status === "완료") return 4;
    if (contract.signatureStatus === "완료") return 3;
    if (contract.signatureStatus === "내부서명") return 2;
    if (contract.status === "서명중") return 1;
    return 0;
  };

  const handleProceed = async () => {
    setProcessing(true);
    try {
      await fetchWithAuth(`${API_URL}bidding-contracts/${id}/start`, {
        method: "PUT"
      });
      await fetchContract();
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    const res = await fetchWithAuth(
      `${API_URL}bidding-contracts/${id}/download`,
      {
        headers: { Accept: "application/pdf" }
      }
    );
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `계약서_${contract.transactionNumber || id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleStartDrawing = (e) => {
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    canvasRef.current.getContext("2d").moveTo(x, y);
    setLastPosition({ x, y });
  };

  const handleDraw = (e) => {
    if (!isDrawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
    setLastPosition({ x, y });
  };

  const handleEndDrawing = () => setIsDrawing(false);

  const handleSubmitSignature = async () => {
    setProcessing(true);
    const dataUrl = canvasRef.current.toDataURL("image/png").split(",")[1];
    const endpoint = isBuyer
      ? `${API_URL}bidding-contracts/${id}/sign-buyer`
      : `${API_URL}bidding-contracts/${id}/sign-supplier`;

    await fetchWithAuth(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ signature: dataUrl })
    });

    setConfirmOpen(false);
    setShowSignature(false);
    await fetchContract();
    setProcessing(false);
  };

  if (loading || !contract) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>계약 정보를 불러오는 중...</Typography>
      </Box>
    );
  }

  const formatDate = (date) => (date ? moment(date).format("YYYY-MM-DD") : "-");
  const formatDateTime = (date) =>
    date ? moment(date).format("YYYY-MM-DD HH:mm") : "-";

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4">{contract.title}</Typography>
        <Box>
          <Button onClick={() => navigate("/contracts")} sx={{ mr: 1 }}>
            목록
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            disabled={contract.status === "초안"}
            sx={{ mr: 1 }}>
            계약서 다운로드
          </Button>
          {contract.status === "초안" && isBuyer && (
            <Button variant="contained" onClick={handleProceed}>
              계약 진행하기
            </Button>
          )}
        </Box>
      </Box>

      <Stepper activeStep={getStep()} alternativeLabel sx={{ mb: 3 }}>
        {["초안", "서명중", "내부서명", "모든 서명 완료", "완료"].map(
          (label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          )
        )}
      </Stepper>

      {showSignature && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6">서명</Typography>
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            onMouseDown={handleStartDrawing}
            onMouseMove={handleDraw}
            onMouseUp={handleEndDrawing}
            onMouseLeave={handleEndDrawing}
            style={{ border: "1px solid #ccc", marginBottom: 8 }}
          />
          <TextField
            label="서명 메모"
            fullWidth
            value={signatureNote}
            onChange={(e) => setSignatureNote(e.target.value)}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" onClick={() => setConfirmOpen(true)}>
            서명 제출
          </Button>
        </Paper>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">기본 정보</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography>계약 상태: {contract.status}</Typography>
              <Typography>서명 상태: {contract.signatureStatus}</Typography>
              <Typography>
                기간: {formatDate(contract.startDate)} ~{" "}
                {formatDate(contract.endDate)}
              </Typography>
              <Typography>
                금액: {contract.totalAmount.toLocaleString()}원
              </Typography>
              <Typography>비고: {contract.note || "-"}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">계약 당사자</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography>구매자: {contract.buyerName}</Typography>
              <Typography>공급자: {contract.supplierName}</Typography>
              <Typography>
                구매자 서명일: {formatDate(contract.buyerSignedAt)}
              </Typography>
              <Typography>
                공급자 서명일: {formatDate(contract.supplierSignedAt)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">계약 조항</Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                {contract.contractItems?.map((item) => (
                  <ListItem key={item.id}>
                    <ListItemIcon>
                      <AssignmentIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.name}
                      secondary={item.content}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">계약 변경 이력</Typography>
              <Divider sx={{ mb: 2 }} />
              <Timeline position="alternate">
                {contract.statusHistories?.map((h) => (
                  <TimelineItem key={h.id}>
                    <TimelineOppositeContent color="text.secondary">
                      {formatDateTime(h.changeDate)}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot>
                        <HistoryIcon />
                      </TimelineDot>
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography>
                        {h.previousStatus} → {h.newStatus}
                      </Typography>
                      <Typography variant="caption">
                        사유: {h.reason}
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>서명 확인</DialogTitle>
        <DialogContent>
          <Typography>
            서명 제출 시 계약에 법적 효력이 발생합니다. 제출하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>취소</Button>
          <Button onClick={handleSubmitSignature} variant="contained">
            제출
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContractDetailPage;
