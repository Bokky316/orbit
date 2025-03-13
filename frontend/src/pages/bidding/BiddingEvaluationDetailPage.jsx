import React, { useState, useEffect } from "react";
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
  CircularProgress,
  Alert,
  Button,
  Chip,
  Divider,
  Grid,
  LinearProgress
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import BiddingEvaluationDialog from "./BiddingEvaluationDialog";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

function BiddingEvaluationDetailPage() {
  const { biddingId } = useParams();
  const navigate = useNavigate();

  // 상태 관리
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidding, setBidding] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [evaluationDialogState, setEvaluationDialogState] = useState({
    open: false,
    participationId: null,
    supplierName: ""
  });

  // 임의의 샘플 데이터
  const sampleBidding = {
    id: parseInt(biddingId),
    purchaseRequestId: "PR-2025-0001",
    bidNumber: "BID-2025-0042",
    title: "서버 장비 구매",
    description: "데이터 센터 확장을 위한 서버 장비 구매",
    bidMethod: "가격제안",
    startDate: "2025-02-10",
    endDate: "2025-03-10",
    totalAmount: 50000000,
    status: "진행중"
  };

  // 임의의 공급자 평가 샘플 데이터
  const sampleEvaluations = [
    {
      id: 1,
      biddingParticipationId: 101,
      supplierName: "글로벌 IT 솔루션",
      priceScore: 25,
      qualityScore: 20,
      deliveryScore: 18,
      reliabilityScore: 12,
      totalScore: 85,
      comments: "전반적으로 만족스러운 제안. 품질이 특히 우수함"
    },
    {
      id: 2,
      biddingParticipationId: 102,
      supplierName: "테크노 시스템즈",
      priceScore: 28,
      qualityScore: 18,
      deliveryScore: 15,
      reliabilityScore: 10,
      totalScore: 81,
      comments: "가격 경쟁력이 뛰어나지만 품질과 납기에 약간의 우려가 있음"
    },
    {
      id: 3,
      biddingParticipationId: 103,
      supplierName: "디지털 이노베이션",
      priceScore: 22,
      qualityScore: 23,
      deliveryScore: 19,
      reliabilityScore: 14,
      totalScore: 88,
      comments:
        "서비스 품질과 납기 준수 능력이 탁월함. 가격은 다소 높지만 그만한 가치가 있음"
    },
    {
      id: 4,
      biddingParticipationId: 104,
      supplierName: "스마트 솔루션",
      priceScore: 0,
      qualityScore: 0,
      deliveryScore: 0,
      reliabilityScore: 0,
      totalScore: 0,
      comments: ""
    },
    {
      id: 5,
      biddingParticipationId: 105,
      supplierName: "클라우드 엔터프라이즈",
      priceScore: 0,
      qualityScore: 0,
      deliveryScore: 0,
      reliabilityScore: 0,
      totalScore: 0,
      comments: ""
    }
  ];

  // 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 임의의 샘플 데이터 설정
        setBidding(sampleBidding);
        setEvaluations(sampleEvaluations);

        // const [biddingResponse, evaluationsResponse] = await Promise.all([
        //   fetchWithAuth(`${API_URL}biddings/${biddingId}`),
        //   fetchWithAuth(`${API_URL}biddings/evaluations/by-bidding/${biddingId}`)
        // ]);

        // if (!biddingResponse.ok || !evaluationsResponse.ok) {
        //   throw new Error("데이터를 불러오는 데 실패했습니다.");
        // }

        // const biddingData = await biddingResponse.json();
        // const evaluationsData = await evaluationsResponse.json();

        // setBidding(biddingData);
        // setEvaluations(evaluationsData);
      } catch (error) {
        console.error("데이터 로드 중 오류:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [biddingId]);

  // 공급자 평가 제출 핸들러
  const handleEvaluationSubmit = async (evaluationData) => {
    try {
      const response = await fetchWithAuth(`${API_URL}biddings/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evaluationData)
      });

      if (!response.ok) {
        throw new Error("평가 제출에 실패했습니다.");
      }

      return await response.json();
    } catch (error) {
      console.error("평가 제출 중 오류:", error);
      throw error;
    }
  };

  // 평가 완료 핸들러
  const handleEvaluationComplete = async (evaluation) => {
    try {
      const savedEvaluation = await handleEvaluationSubmit(evaluation);

      // 평가 목록 다시 가져오기
      const evaluationsResponse = await fetchWithAuth(
        `${API_URL}biddings/evaluations/by-bidding/${biddingId}`
      );

      if (evaluationsResponse.ok) {
        const evaluationsData = await evaluationsResponse.json();
        setEvaluations(evaluationsData);
      }

      return savedEvaluation;
    } catch (error) {
      console.error("평가 처리 중 오류:", error);
      throw error;
    }
  };

  // 평가된 공급자 목록
  const evaluatedSuppliers = evaluations.filter(
    (evaluation) => evaluation.totalScore > 0
  );

  // 평가 통계 계산
  const calculateAverage = (field) => {
    if (evaluatedSuppliers.length === 0) return 0;
    const sum = evaluatedSuppliers.reduce(
      (acc, curr) => acc + (curr[field] || 0),
      0
    );
    return (sum / evaluatedSuppliers.length).toFixed(1);
  };

  const avgPriceScore = calculateAverage("priceScore");
  const avgQualityScore = calculateAverage("qualityScore");
  const avgDeliveryScore = calculateAverage("deliveryScore");
  const avgReliabilityScore = calculateAverage("reliabilityScore");
  const avgTotalScore = calculateAverage("totalScore");

  // 돌아가기 핸들러
  const handleBack = () => {
    navigate("/biddings/evaluations");
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
      </Box>
    );
  }

  // 오류 발생
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={handleBack}>
          목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  // 데이터가 없는 경우
  if (!bidding) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          입찰 공고 정보를 찾을 수 없습니다.
        </Alert>
        <Button variant="contained" onClick={handleBack}>
          목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  const ScoreBar = ({ value, maxScore = 100 }) => (
    <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
      <Box sx={{ width: "100%", mr: 1 }}>
        <LinearProgress
          variant="determinate"
          value={(value / maxScore) * 100}
          color="primary"
        />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">
          {value}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ p: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4
        }}>
        <Typography variant="h4">공급자 평가 상세</Typography>
        <Button variant="outlined" onClick={handleBack}>
          목록으로 돌아가기
        </Button>
      </Box>

      {/* 입찰 공고 정보 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          입찰 공고 정보
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              구매 요청 번호
            </Typography>
            <Typography variant="body1">
              {bidding.purchaseRequestId || "-"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              공고 번호
            </Typography>
            <Typography variant="body1">{bidding.bidNumber}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              입찰 방식
            </Typography>
            <Typography variant="body1">{bidding.bidMethod}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              평가 현황
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip
                label={`${evaluatedSuppliers.length}/${evaluations.length}`}
                color={
                  evaluatedSuppliers.length === 0
                    ? "default"
                    : evaluatedSuppliers.length === evaluations.length
                    ? "success"
                    : "warning"
                }
                size="small"
              />
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              공고명
            </Typography>
            <Typography variant="body1">{bidding.title}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              공고 기간
            </Typography>
            <Typography variant="body1">
              {bidding.startDate} ~ {bidding.endDate}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 평가 목록 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          공급자 평가 목록
        </Typography>

        <TableContainer>
          <Table sx={{ border: "1px solid #e0e0e0" }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    width: "20%",
                    fontWeight: "bold",
                    borderRight: "1px solid #e0e0e0",
                    backgroundColor: "#f5f5f5"
                  }}>
                  공급자
                </TableCell>
                <TableCell
                  sx={{
                    width: "60%",
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5"
                  }}>
                  평가 항목
                </TableCell>
                <TableCell
                  sx={{
                    width: "20%",
                    fontWeight: "bold",
                    borderLeft: "1px solid #e0e0e0",
                    backgroundColor: "#f5f5f5"
                  }}>
                  평가 결과
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {evaluations.map((evaluation) => (
                <TableRow key={evaluation.id}>
                  {/* 첫 번째 열: 공급자 정보 */}
                  <TableCell
                    sx={{
                      borderRight: "1px solid #e0e0e0",
                      verticalAlign: "top"
                    }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1">
                        {evaluation.supplierName}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* 두 번째 열: 평가 항목들 */}
                  <TableCell>
                    {evaluation.totalScore > 0 ? (
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2">가격</Typography>
                          <ScoreBar
                            value={evaluation.priceScore}
                            maxScore={30}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">품질</Typography>
                          <ScoreBar
                            value={evaluation.qualityScore}
                            maxScore={40}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">납품</Typography>
                          <ScoreBar
                            value={evaluation.deliveryScore}
                            maxScore={20}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">신뢰도</Typography>
                          <ScoreBar
                            value={evaluation.reliabilityScore}
                            maxScore={10}
                          />
                        </Grid>
                      </Grid>
                    ) : (
                      <Typography color="text.secondary">
                        평가 정보 없음
                      </Typography>
                    )}
                  </TableCell>
                  {/* 세 번째 열: 총점 */}
                  <TableCell
                    sx={{
                      borderLeft: "1px solid #e0e0e0"
                    }}>
                    {evaluation.totalScore > 0 ? (
                      <Typography>{evaluation.totalScore}</Typography>
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          setEvaluationDialogState({
                            open: true,
                            participationId: evaluation.biddingParticipationId,
                            supplierName: evaluation.supplierName
                          })
                        }>
                        평가하기
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 평가 통계 정보 */}
      {evaluatedSuppliers.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            평가 통계
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell>평가 항목</TableCell>
                      <TableCell align="center">평균 점수</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>가격</TableCell>
                      <TableCell align="center">{avgPriceScore}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>품질</TableCell>
                      <TableCell align="center">{avgQualityScore}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>납품</TableCell>
                      <TableCell align="center">{avgDeliveryScore}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>신뢰도</TableCell>
                      <TableCell align="center">
                        {avgReliabilityScore}
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ backgroundColor: "#f9f9f9" }}>
                      <TableCell>
                        <strong>총점 평균</strong>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={`${avgTotalScore}점`} color="primary" />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} md={6}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell>통계 항목</TableCell>
                      <TableCell align="center">값</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>전체 참여 공급자 수</TableCell>
                      <TableCell align="center">{evaluations.length}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>평가 완료된 공급자 수</TableCell>
                      <TableCell align="center">
                        {evaluatedSuppliers.length}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>미평가 공급자 수</TableCell>
                      <TableCell align="center">
                        {evaluations.length - evaluatedSuppliers.length}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>최고 평가 점수</TableCell>
                      <TableCell align="center">
                        {evaluatedSuppliers.length > 0
                          ? Math.max(
                              ...evaluatedSuppliers.map((e) => e.totalScore)
                            )
                          : "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>최저 평가 점수</TableCell>
                      <TableCell align="center">
                        {evaluatedSuppliers.length > 0
                          ? Math.min(
                              ...evaluatedSuppliers.map((e) => e.totalScore)
                            )
                          : "-"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* 공급자 평가 다이얼로그 */}
      <BiddingEvaluationDialog
        open={evaluationDialogState.open}
        onClose={() =>
          setEvaluationDialogState({ ...evaluationDialogState, open: false })
        }
        participationId={evaluationDialogState.participationId}
        supplierName={evaluationDialogState.supplierName}
        bidNumber={bidding.bidNumber}
        bidId={bidding.id}
        onEvaluationComplete={handleEvaluationComplete}
      />
    </Box>
  );
}
export default BiddingEvaluationDetailPage;
