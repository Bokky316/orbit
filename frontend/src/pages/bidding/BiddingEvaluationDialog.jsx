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
  Chip
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
  if (score >= 90) return { grade: 'A', color: 'success' };
  if (score >= 80) return { grade: 'B', color: 'primary' };
  if (score >= 70) return { grade: 'C', color: 'warning' };
  return { grade: 'D', color: 'error' };
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

  // 가중치 계산 함수
  const calculateWeightedScore = () => {
    return EVALUATION_CRITERIA.reduce((total, criterion) => {
      const score = scores[criterion.id] || 0;
      return total + (score * criterion.weight);
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
    try {
      const weightedScore = calculateWeightedScore();
      const detailScores = calculateDetailScores();

      const evaluationData = {
        biddingId: bidId,
        biddingParticipationId: participationId,
        evaluatorId: user?.id,
        ...detailScores,
        weightedTotalScore: weightedScore,
        comments
      };

      const savedEvaluation = await onEvaluationComplete(evaluationData);
      
      // 점수 등급 계산
      const { grade, color } = getScoreGrade(weightedScore * 100);

      setSuccess(
        <Alert severity="success">
          <Grid container alignItems="center" spacing={2}>
            <Grid item>
              <Typography variant="body1">
                평가가 성공적으로 저장되었습니다.
              </Typography>
            </Grid>
            <Grid item>
              <Chip 
                label={`${weightedScore.toFixed(2)} (${grade}등급)`} 
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
      setError("평가 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 점수 변경 핸들러
  const handleScoreChange = (criterionId, newValue) => {
    setScores(prev => ({
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
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        공급자 평가: {supplierName} (입찰 번호: {bidNumber})
      </DialogTitle>

      <DialogContent>
        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        {success}

        {!loading && !success && (
          <Grid container spacing={3}>
            {criteria.map((criterion) => (
              <Grid item xs={12} key={criterion.id}>
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={4}>
                    <Typography>
                      {criterion.name} ({criterion.maxScore}점)
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Slider
                      value={scores[criterion.id] || 0}
                      onChange={(_, newValue) => 
                        handleScoreChange(criterion.id, newValue)
                      }
                      min={0}
                      max={criterion.maxScore}
                      step={1}
                      valueLabelDisplay="auto"
                    />
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
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>취소</Button>
        {!success && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
          >
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