import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  Chip,
  Rating,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon
} from "@mui/icons-material";
import BiddingEvaluationDialog from "./BiddingEvaluationDialog";

function BiddingEvaluationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [supplierInfo, setSupplierInfo] = useState(null);
  const [biddingInfo, setBiddingInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // 데이터 로딩
  const fetchEvaluationData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 인증 토큰
      const token = localStorage.getItem("authToken") || "temp-token";

      // 1. 평가 상세 정보 가져오기
      const evaluationResponse = await fetch(`/api/evaluations/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!evaluationResponse.ok) {
        throw new Error("평가 정보를 불러오는데 실패했습니다.");
      }

      const evaluationData = await evaluationResponse.json();
      setEvaluation(evaluationData);

      // 2. 입찰 참여 정보 가져오기
      const participationResponse = await fetch(
        `/api/biddings/participations/${evaluationData.biddingParticipationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (participationResponse.ok) {
        const participationData = await participationResponse.json();
        setSupplierInfo({
          supplierName: participationData.supplierName,
          supplierId: participationData.supplierId
        });

        // 3. 입찰 정보 가져오기
        const biddingResponse = await fetch(
          `/api/biddings/${participationData.biddingId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (biddingResponse.ok) {
          const biddingData = await biddingResponse.json();
          setBiddingInfo({
            bidNumber: biddingData.bidNumber,
            title: biddingData.title,
            status: biddingData.status
          });
        }
      }
    } catch (error) {
      console.error("데이터 로딩 중 오류:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 테스트 목적으로 임시 데이터 사용
  const loadMockData = () => {
    setTimeout(() => {
      const mockEvaluation = {
        id: parseInt(id),
        biddingParticipationId: 101,
        evaluatorId: 1,
        priceScore: 4,
        qualityScore: 5,
        deliveryScore: 4,
        reliabilityScore: 3,
        totalScore: 4,
        comments:
          "전반적으로 만족스러운 입찰이었으며, 특히 제품 품질이 우수했음. 다만 신뢰도 측면에서 과거 이력을 고려할 때 개선의 여지가 있음.",
        createdAt: "2025-03-07T14:32:11",
        updatedAt: "2025-03-07T14:32:11"
      };

      const mockSupplierInfo = {
        supplierName: "글로벌 IT 솔루션",
        supplierId: 2002
      };

      const mockBiddingInfo = {
        bidNumber: "BID-2025-0042",
        title: "개발자 PC 구매",
        status: "ONGOING"
      };

      setEvaluation(mockEvaluation);
      setSupplierInfo(mockSupplierInfo);
      setBiddingInfo(mockBiddingInfo);
      setIsLoading(false);
    }, 1000);
  };

  // 초기 데이터 로딩
  useEffect(() => {
    // 실제 API 호출 (개발 완료 후 주석 해제)
    // fetchEvaluationData();

    // 테스트 목적의 목업 데이터 (개발 시에만 사용)
    loadMockData();
  }, [id]);

  // 평가 삭제 처리
  const handleDelete = async () => {
    try {
      setIsLoading(true);

      // 인증 토큰
      const token = localStorage.getItem("authToken") || "temp-token";

      const response = await fetch(`/api/evaluations/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("평가 삭제에 실패했습니다.");
      }

      // 삭제 성공 알림
      alert("평가가 성공적으로 삭제되었습니다.");

      // 목록 페이지로 이동
      navigate("/evaluations");
    } catch (error) {
      console.error("평가 삭제 중 오류:", error);
      alert("오류가 발생했습니다: " + error.message);
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // 평가 수정 완료 처리
  const handleEditComplete = (updatedEvaluation) => {
    setEvaluation({
      ...evaluation,
      ...updatedEvaluation,
      updatedAt: new Date().toISOString()
    });
    setIsEditDialogOpen(false);
  };

  // 점수에 따른 색상 반환
  const getScoreColor = (score) => {
    if (score >= 4) return "success";
    if (score >= 3) return "warning";
    return "error";
  };

  // 상태 변환 함수
  const getStatusText = (status) => {
    const statusMap = {
      PENDING: "대기중",
      ONGOING: "진행중",
      CLOSED: "마감",
      CANCELED: "취소"
    };
    return statusMap[status] || status;
  };

  // 로딩 중
  if (isLoading) {
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
          데이터를 불러오는 중...
        </Typography>
      </Box>
    );
  }

  // 오류 발생
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" color="error" gutterBottom>
          오류가 발생했습니다
        </Typography>
        <Typography>{error}</Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/evaluations")}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}>
          목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  // 데이터가 없는 경우
  if (!evaluation) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          평가 정보를 찾을 수 없습니다
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/evaluations")}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}>
          목록으로 돌아가기
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
        <Typography variant="h4">협력사 평가 상세</Typography>
        <Box>
          <Button
            variant="outlined"
            onClick={() => navigate("/evaluations")}
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 1 }}>
            목록으로
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsEditDialogOpen(true)}
            startIcon={<EditIcon />}
            sx={{ mr: 1 }}>
            수정
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => setIsDeleteDialogOpen(true)}
            startIcon={<DeleteIcon />}>
            삭제
          </Button>
        </Box>
      </Box>

      {/* 평가 정보 섹션 */}
      <Grid container spacing={3}>
        {/* 기본 정보 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              기본 정보
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  공급자
                </Typography>
                <Typography variant="body1">
                  {supplierInfo?.supplierName || "-"}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  입찰 번호
                </Typography>
                <Typography variant="body1">
                  {biddingInfo?.bidNumber || "-"}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  입찰 상태
                </Typography>
                <Chip
                  label={
                    biddingInfo?.status
                      ? getStatusText(biddingInfo.status)
                      : "-"
                  }
                  color={
                    biddingInfo?.status === "ONGOING"
                      ? "success"
                      : biddingInfo?.status === "PENDING"
                      ? "warning"
                      : biddingInfo?.status === "CLOSED"
                      ? "primary"
                      : "default"
                  }
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  입찰 제목
                </Typography>
                <Typography variant="body1">
                  {biddingInfo?.title || "-"}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  평가일
                </Typography>
                <Typography variant="body1">
                  {evaluation.createdAt
                    ? new Date(evaluation.createdAt).toLocaleDateString()
                    : "-"}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  최종 수정일
                </Typography>
                <Typography variant="body1">
                  {evaluation.updatedAt
                    ? new Date(evaluation.updatedAt).toLocaleDateString()
                    : "-"}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  평가 점수
                </Typography>
                <Chip
                  label={`${evaluation.totalScore}점`}
                  color={getScoreColor(evaluation.totalScore)}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* 평가 세부 점수 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              평가 세부 점수
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>평가 항목</TableCell>
                    <TableCell align="center">점수</TableCell>
                    <TableCell align="center">등급</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>가격</TableCell>
                    <TableCell align="center">
                      {evaluation.priceScore}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          evaluation.priceScore >= 4
                            ? "우수"
                            : evaluation.priceScore >= 3
                            ? "보통"
                            : "미흡"
                        }
                        color={getScoreColor(evaluation.priceScore)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>품질</TableCell>
                    <TableCell align="center">
                      {evaluation.qualityScore}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          evaluation.qualityScore >= 4
                            ? "우수"
                            : evaluation.qualityScore >= 3
                            ? "보통"
                            : "미흡"
                        }
                        color={getScoreColor(evaluation.qualityScore)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>기술력</TableCell>
                    <TableCell align="center">
                      {evaluation.deliveryScore}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          evaluation.deliveryScore >= 4
                            ? "우수"
                            : evaluation.deliveryScore >= 3
                            ? "보통"
                            : "미흡"
                        }
                        color={getScoreColor(evaluation.deliveryScore)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>신뢰도</TableCell>
                    <TableCell align="center">
                      {evaluation.reliabilityScore}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          evaluation.reliabilityScore >= 4
                            ? "우수"
                            : evaluation.reliabilityScore >= 3
                            ? "보통"
                            : "미흡"
                        }
                        color={getScoreColor(evaluation.reliabilityScore)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell>종합 평가</TableCell>
                    <TableCell align="center">
                      {evaluation.totalScore}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          evaluation.totalScore >= 4
                            ? "우수"
                            : evaluation.totalScore >= 3
                            ? "보통"
                            : "미흡"
                        }
                        color={getScoreColor(evaluation.totalScore)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* 평가 의견 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              평가 의견
            </Typography>
            <Card variant="outlined" sx={{ height: "calc(100% - 40px)" }}>
              <CardContent>
                <Typography
                  variant="body1"
                  sx={{ whiteSpace: "pre-line", height: "100%" }}>
                  {evaluation.comments || "평가 의견이 없습니다."}
                </Typography>
              </CardContent>
            </Card>
          </Paper>
        </Grid>

        {/* 추가 정보 또는 다른 섹션을 여기에 추가할 수 있습니다 */}
      </Grid>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>평가 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            정말로 이 평가를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)} color="primary">
            취소
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* 평가 수정 다이얼로그 */}
      <BiddingEvaluationDialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        participationId={evaluation.biddingParticipationId}
        supplierName={supplierInfo?.supplierName || ""}
        bidNumber={biddingInfo?.bidNumber || ""}
        onEvaluationComplete={handleEditComplete}
      />
    </Box>
  );
}

export default BiddingEvaluationDetailPage;
