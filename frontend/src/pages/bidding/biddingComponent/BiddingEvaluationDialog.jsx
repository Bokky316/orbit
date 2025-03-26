import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Slider,
  CircularProgress,
  Alert,
  AlertTitle,
  Chip,
  Box
} from "@mui/material";
import { useSelector } from "react-redux";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

// 평가 기준 상수
const EVALUATION_CRITERIA = [
  { id: 1, name: "가격", maxScore: 30, weight: 0.3 },
  { id: 2, name: "품질", maxScore: 40, weight: 0.4 },
  { id: 3, name: "납품", maxScore: 20, weight: 0.2 },
  { id: 4, name: "신뢰도", maxScore: 10, weight: 0.1 }
];

// 점수 등급 판정 함수
const getScoreGrade = (score) => {
  if (score >= 90) return { grade: "A", color: "success" };
  if (score >= 80) return { grade: "B", color: "primary" };
  if (score >= 70) return { grade: "C", color: "warning" };
  return { grade: "D", color: "error" };
};

function BiddingEvaluationDialog({
  open,
  onClose,
  participationId,
  supplierName,
  bidNumber,
  bidId,
  onEvaluationComplete
}) {
  const { user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [criteria] = useState(EVALUATION_CRITERIA);
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState("");
  const [existingEvaluation, setExistingEvaluation] = useState(null);

  // 기존 평가 데이터 가져오기
  useEffect(() => {
    if (open && participationId) {
      fetchExistingEvaluation();
    }
  }, [open, participationId]);

  // 기존 평가 데이터 조회
  const fetchExistingEvaluation = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}evaluations/participation/${participationId}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data) {
          setExistingEvaluation(data);
          // 기존 평가 점수 설정
          const existingScores = {
            1: data.priceScore || 0,
            2: data.qualityScore || 0,
            3: data.deliveryScore || 0,
            4: data.reliabilityScore || 0
          };
          setScores(existingScores);
          setComments(data.comments || "");
        }
      }
    } catch (error) {
      console.error("기존 평가 데이터 로딩 실패:", error);
    }
  };

  // 가중치 계산 함수
  const calculateWeightedScore = () => {
    return EVALUATION_CRITERIA.reduce((total, criterion) => {
      const score = scores[criterion.id] || 0;
      return total + score * criterion.weight;
    }, 0);
  };

  // 세부 점수 계산 함수
  const calculateDetailScores = () => {
    return {
      priceScore: scores[1] || 0,
      qualityScore: scores[2] || 0,
      deliveryScore: scores[3] || 0,
      reliabilityScore: scores[4] || 0
    };
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const weightedScore = calculateWeightedScore();
      const detailScores = calculateDetailScores();

      const evaluationData = {
        biddingId: bidId,
        biddingParticipationId: participationId,
        evaluatorId: user?.id,
        evaluatorName: user?.username,
        priceScore: scores[1] || 0,
        qualityScore: scores[2] || 0,
        deliveryScore: scores[3] || 0,
        reliabilityScore: scores[4] || 0,

        comment: comments
      };

      // 직접 평가 데이터 저장 API 호출
      const response = await fetchWithAuth(`${API_URL}bidding-evaluations`, {
        method: existingEvaluation ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(evaluationData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "평가 저장에 실패했습니다.");
      }

      const savedEvaluation = await response.json();

      // 부모 컴포넌트의 콜백 함수 호출
      if (onEvaluationComplete) {
        await onEvaluationComplete(savedEvaluation);
      }

      // 점수 등급 계산
      const { grade, color } = getScoreGrade(weightedScore * 100);

      setSuccess(
        <Alert severity="success">
          <AlertTitle>평가 완료</AlertTitle>
          <Grid container alignItems="center" spacing={2}>
            <Grid item>
              <Typography variant="body1">
                평가가 성공적으로 저장되었습니다.
              </Typography>
            </Grid>
            <Grid item>
              <Chip
                label={`${(weightedScore * 100).toFixed(1)} (${grade}등급)`}
                color={color}
                size="small"
              />
            </Grid>
          </Grid>
        </Alert>
      );

      // 2초 후 자동 닫기
      setTimeout(handleClose, 2000);
    } catch (error) {
      console.error("평가 저장 중 오류:", error);
      setError(error.message || "평가 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 점수 변경 핸들러
  const handleScoreChange = (criterionId, newValue) => {
    setScores((prev) => ({
      ...prev,
      [criterionId]: newValue
    }));
  };

  const handleClose = () => {
    if (!loading) {
      setScores({});
      setComments("");
      setSuccess(false);
      setError(null);
      setExistingEvaluation(null);
      onClose();
    }
  };

  const isFormComplete = () => {
    return criteria.every((criterion) => (scores[criterion.id] || 0) > 0);
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : handleClose}
      maxWidth="md"
      fullWidth>
      <DialogTitle>
        공급자 평가: {supplierName} (입찰 번호: {bidNumber})
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            <AlertTitle>오류</AlertTitle>
            {error}
          </Alert>
        )}

        {success && <Box sx={{ my: 2 }}>{success}</Box>}

        {!loading && !success && (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                각 항목별 점수를 평가해주세요
              </Typography>
            </Grid>

            {criteria.map((criterion) => (
              <Grid item xs={12} key={criterion.id}>
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography>
                      {criterion.name} ({criterion.maxScore}점)
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Slider
                      value={scores[criterion.id] || 0}
                      onChange={(_, newValue) =>
                        handleScoreChange(criterion.id, newValue)
                      }
                      min={0}
                      max={criterion.maxScore}
                      step={1}
                      marks={[
                        { value: 0, label: "0" },
                        {
                          value: criterion.maxScore / 2,
                          label: (criterion.maxScore / 2).toString()
                        },
                        {
                          value: criterion.maxScore,
                          label: criterion.maxScore.toString()
                        }
                      ]}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Typography variant="body2" align="center">
                      {scores[criterion.id] || 0} / {criterion.maxScore}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            ))}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="기타 의견"
                multiline
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="공급자 평가에 대한 의견을 입력해주세요"
              />
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 2
                }}>
                <Typography variant="subtitle1">
                  총점: {(calculateWeightedScore() * 100).toFixed(1)}
                </Typography>
                {calculateWeightedScore() > 0 && (
                  <Chip
                    label={
                      getScoreGrade(calculateWeightedScore() * 100).grade +
                      " 등급"
                    }
                    color={getScoreGrade(calculateWeightedScore() * 100).color}
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          취소
        </Button>
        {!success && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading || !isFormComplete()}>
            평가 저장
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

BiddingEvaluationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  participationId: PropTypes.number,
  supplierName: PropTypes.string,
  bidNumber: PropTypes.string,
  bidId: PropTypes.number,
  onEvaluationComplete: PropTypes.func.isRequired
};

export default BiddingEvaluationDialog;
