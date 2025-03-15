import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField
} from "@mui/material";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
// 헬퍼 함수 import
import { getStatusText } from "./helpers/commonBiddingHelpers";

// 발주 진행 상태 단계
const orderSteps = [
  "낙찰 선정",
  "발주 확정",
  "계약 생성",
  "납품 예정",
  "검수 완료",
  "결제 완료"
];

function BiddingOrderPage() {
  const { id: biddingId, evaluationId } = useParams();
  const navigate = useNavigate();

  // 상태 관리
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidding, setBidding] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [participation, setParticipation] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 발주 확정 단계부터 시작
  const [notes, setNotes] = useState("");

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 입찰 공고 정보 가져오기
        const biddingResponse = await fetchWithAuth(
          `${API_URL}biddings/${biddingId}`
        );
        if (!biddingResponse.ok) {
          throw new Error(
            `입찰 공고 정보를 가져오는데 실패했습니다. (${biddingResponse.status})`
          );
        }
        const biddingData = await biddingResponse.json();
        setBidding(biddingData);

        // 평가 정보 가져오기
        const evaluationResponse = await fetchWithAuth(
          `${API_URL}biddings/evaluations/${evaluationId}`
        );
        if (!evaluationResponse.ok) {
          throw new Error(
            `평가 정보를 가져오는데 실패했습니다. (${evaluationResponse.status})`
          );
        }
        const evaluationData = await evaluationResponse.json();
        setEvaluation(evaluationData);

        // 참여 정보 가져오기
        const participationResponse = await fetchWithAuth(
          `${API_URL}biddings/participations/${evaluationData.biddingParticipationId}`
        );
        if (participationResponse.ok) {
          const participationData = await participationResponse.json();
          setParticipation(participationData);

          // 공급자 정보 가져오기 (가정: API 엔드포인트가 있다고 가정)
          if (participationData.supplierId) {
            try {
              const supplierResponse = await fetchWithAuth(
                `${API_URL}members/${participationData.supplierId}`
              );
              if (supplierResponse.ok) {
                const supplierData = await supplierResponse.json();
                setSupplier(supplierData);
              }
            } catch (err) {
              console.error("공급자 정보 로드 실패:", err);
            }
          }
        }
      } catch (error) {
        console.error("데이터 로드 중 오류:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [biddingId, evaluationId]);

  // 계약 생성 핸들러
  const handleCreateContract = async () => {
    try {
      setIsLoading(true);

      //  계약 생성 API 호출
      // const response = await fetchWithAuth(`${API_URL}contracts/create-from-bidding`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     biddingId,
      //     evaluationId,
      //     notes
      //   })
      // });

      // if (!response.ok) {
      //   throw new Error(`계약 생성에 실패했습니다. (${response.status})`);
      // }

      // const contractData = await response.json();
      // console.log("생성된 계약:", contractData);

      // 성공시 다음 단계로 이동 (시뮬레이션)
      setCurrentStep(2);
      alert("계약이 성공적으로 생성되었습니다.");

      // 계약 페이지로 이동
      // navigate(`/contracts/${contractData.id}`);
    } catch (error) {
      console.error("계약 생성 중 오류:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 돌아가기 핸들러
  const handleBack = () => {
    navigate(`/biddings/${biddingId}/vendor-selection`);
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
          돌아가기
        </Button>
      </Box>
    );
  }

  // 데이터가 없는 경우
  if (!bidding || !evaluation) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          필요한 정보를 찾을 수 없습니다.
        </Alert>
        <Button variant="contained" onClick={handleBack}>
          돌아가기
        </Button>
      </Box>
    );
  }

  // 숫자 포맷팅 함수
  const formatNumber = (value) => {
    if (value === null || value === undefined) return "0";
    if (typeof value === "string") {
      if (value.includes(",")) return value;
      const num = parseFloat(value);
      return isNaN(num) ? "0" : num.toLocaleString();
    }
    return value.toLocaleString();
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4
        }}>
        <Typography variant="h4">발주 관리</Typography>
        <Button variant="outlined" onClick={handleBack}>
          돌아가기
        </Button>
      </Box>

      {/* 발주 진행 상태 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {orderSteps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* 기본 정보 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3, height: "100%" }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              입찰 정보
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  입찰 번호
                </Typography>
                <Typography variant="body1">{bidding.bidNumber}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  구매 요청명
                </Typography>
                <Typography variant="body1">{bidding.title}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  상태
                </Typography>
                <Chip
                  label={getStatusText(bidding.status)}
                  color={
                    bidding.status?.childCode === "PENDING"
                      ? "default"
                      : bidding.status?.childCode === "ONGOING"
                      ? "primary"
                      : bidding.status?.childCode === "CLOSED"
                      ? "success"
                      : bidding.status?.childCode === "CANCELED"
                      ? "error"
                      : "default"
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  입찰 마감일
                </Typography>
                <Typography variant="body1">
                  {bidding.endDate
                    ? new Date(bidding.endDate).toLocaleDateString()
                    : "-"}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  품목 수량
                </Typography>
                <Typography variant="body1">{bidding.quantity}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  총 금액
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  {formatNumber(bidding.totalAmount)}원
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3, height: "100%" }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              낙찰자 정보
            </Typography>
            {participation ? (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    공급자명
                  </Typography>
                  <Typography variant="body1">
                    {supplier?.companyName || participation.supplierName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    공급자 연락처
                  </Typography>
                  <Typography variant="body1">
                    {supplier?.contactNumber || "정보 없음"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    이메일
                  </Typography>
                  <Typography variant="body1">
                    {supplier?.email || "정보 없음"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    제안 금액
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    {formatNumber(participation.totalAmount)}원
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    평가 점수
                  </Typography>
                  <Chip
                    label={`${evaluation.totalScore}점`}
                    color={
                      evaluation.totalScore >= 80
                        ? "success"
                        : evaluation.totalScore >= 60
                        ? "primary"
                        : evaluation.totalScore >= 40
                        ? "warning"
                        : "error"
                    }
                  />
                </Grid>
              </Grid>
            ) : (
              <Typography variant="body1">
                공급자 정보를 찾을 수 없습니다.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* 계약 생성 섹션 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          계약 생성
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="계약 특이사항"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="계약에 관련된 특이사항이나 참고 내용을 입력하세요."
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateContract}
                disabled={currentStep > 1}>
                계약 생성하기
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default BiddingOrderPage;
