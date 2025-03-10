import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
  Box,
  Divider,
  CircularProgress,
  Alert
} from "@mui/material";

const EVALUATION_ITEMS = [
  {
    id: "price",
    name: "가격",
    weight: 20,
    options: [
      { value: 5, label: "A", score: 100, points: 20 },
      { value: 4, label: "B", score: 80, points: 16 },
      { value: 3, label: "C", score: 60, points: 12 }
    ]
  },
  {
    id: "quality",
    name: "품질",
    weight: 30,
    options: [
      { value: 5, label: "1", score: 100, points: 30 },
      { value: 4, label: "2", score: 80, points: 24 },
      { value: 3, label: "3", score: 60, points: 18 },
      { value: 2, label: "4", score: 40, points: 12 },
      { value: 1, label: "5", score: 20, points: 6 }
    ]
  },
  {
    id: "delivery",
    name: "기술력",
    type: "group",
    weight: 30,
    subItems: [
      {
        id: "delivery1",
        name: "기술역량1",
        weight: 20,
        options: [
          { value: 5, label: "1", score: 100, points: 20 },
          { value: 4, label: "2", score: 80, points: 16 },
          { value: 3, label: "3", score: 60, points: 12 },
          { value: 2, label: "4", score: 40, points: 8 },
          { value: 1, label: "5", score: 20, points: 4 }
        ]
      },
      {
        id: "delivery2",
        name: "기술역량2",
        weight: 10,
        options: [
          { value: 5, label: "상", score: 100, points: 10 },
          { value: 3, label: "중", score: 60, points: 6 },
          { value: 1, label: "하", score: 20, points: 2 }
        ]
      }
    ]
  },
  {
    id: "reliability",
    name: "지원력",
    weight: 20,
    options: [
      { value: 5, label: "상", score: 100, points: 20 },
      { value: 3, label: "중", score: 80, points: 16 },
      { value: 1, label: "하", score: 60, points: 12 }
    ]
  }
];

const BiddingEvaluationDialog = ({
  open,
  onClose,
  participationId,
  supplierName,
  bidNumber,
  onEvaluationComplete
}) => {
  const [evaluation, setEvaluation] = useState({
    priceScore: null,
    qualityScore: null,
    deliveryScore: null,
    reliabilityScore: null,
    comments: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [existingEvaluation, setExistingEvaluation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 항목별 점수
  const [scores, setScores] = useState({
    price: null,
    quality: null,
    delivery1: null,
    delivery2: null,
    reliability: null
  });

  // 총점 계산
  const calculateTotalScore = () => {
    let totalPoints = 0;
    let selectedCount = 0;

    // 가격 점수
    if (scores.price !== null) {
      const priceItem = EVALUATION_ITEMS.find((item) => item.id === "price");
      const option = priceItem.options.find(
        (opt) => opt.value === scores.price
      );
      totalPoints += option ? option.points : 0;
      selectedCount++;
    }

    // 품질 점수
    if (scores.quality !== null) {
      const qualityItem = EVALUATION_ITEMS.find(
        (item) => item.id === "quality"
      );
      const option = qualityItem.options.find(
        (opt) => opt.value === scores.quality
      );
      totalPoints += option ? option.points : 0;
      selectedCount++;
    }

    // 기술력 점수 (기술역량1)
    if (scores.delivery1 !== null) {
      const deliveryGroup = EVALUATION_ITEMS.find(
        (item) => item.id === "delivery"
      );
      const deliveryItem = deliveryGroup.subItems.find(
        (item) => item.id === "delivery1"
      );
      const option = deliveryItem.options.find(
        (opt) => opt.value === scores.delivery1
      );
      totalPoints += option ? option.points : 0;
      selectedCount++;
    }

    // 기술력 점수 (기술역량2)
    if (scores.delivery2 !== null) {
      const deliveryGroup = EVALUATION_ITEMS.find(
        (item) => item.id === "delivery"
      );
      const deliveryItem = deliveryGroup.subItems.find(
        (item) => item.id === "delivery2"
      );
      const option = deliveryItem.options.find(
        (opt) => opt.value === scores.delivery2
      );
      totalPoints += option ? option.points : 0;
      selectedCount++;
    }

    // 지원력 점수
    if (scores.reliability !== null) {
      const reliabilityItem = EVALUATION_ITEMS.find(
        (item) => item.id === "reliability"
      );
      const option = reliabilityItem.options.find(
        (opt) => opt.value === scores.reliability
      );
      totalPoints += option ? option.points : 0;
      selectedCount++;
    }

    // 총점은 항목별 점수의 합
    return {
      totalPoints,
      isComplete: selectedCount === 5 // 모든 항목 선택 여부
    };
  };

  // 점수 변환 (5점 만점 기준)
  const convertToFivePointScale = (value, maxPoints) => {
    return Math.round((value / maxPoints) * 5);
  };

  // 기존 평가 데이터 로드
  useEffect(() => {
    if (!open || !participationId) return;

    const fetchExistingEvaluation = async () => {
      try {
        setIsLoading(true);
        // 실제 API 호출 (개발 중에는 주석 처리)
        // const response = await fetch(`/api/biddings/participations/${participationId}/evaluations`);
        // if (!response.ok) throw new Error("평가 정보를 불러오는데 실패했습니다.");
        // const data = await response.json();

        // 목업 데이터 사용 (개발 중에만)
        setTimeout(() => {
          // 이미 평가가 있는 경우의 예시 데이터
          const mockData = [];
          /* 
          mockData.push({
            id: 101,
            biddingParticipationId: participationId,
            evaluatorId: 1,
            priceScore: 4,
            qualityScore: 3,
            deliveryScore: 4,
            reliabilityScore: 5,
            totalScore: 4,
            comments: "전반적으로 우수한 제안입니다.",
            createdAt: "2025-02-15T10:30:45"
          });
          */

          if (mockData.length > 0) {
            setExistingEvaluation(mockData[0]);
            // 기존 평가 데이터로 폼 초기화
            setEvaluation({
              priceScore: mockData[0].priceScore,
              qualityScore: mockData[0].qualityScore,
              deliveryScore: mockData[0].deliveryScore,
              reliabilityScore: mockData[0].reliabilityScore,
              comments: mockData[0].comments
            });

            // 점수 매핑 (실제 구현 시에는 적절한 매핑 로직 필요)
            setScores({
              price: mockData[0].priceScore,
              quality: mockData[0].qualityScore,
              delivery1: Math.ceil(mockData[0].deliveryScore / 2),
              delivery2: Math.floor(mockData[0].deliveryScore / 2),
              reliability: mockData[0].reliabilityScore
            });
          }

          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("평가 정보 조회 중 오류:", error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    fetchExistingEvaluation();
  }, [open, participationId]);

  // 점수 변경 핸들러
  const handleScoreChange = (itemId, value) => {
    setScores((prev) => ({
      ...prev,
      [itemId]: parseInt(value, 10)
    }));
  };

  // 코멘트 변경 핸들러
  const handleCommentsChange = (event) => {
    setEvaluation((prev) => ({
      ...prev,
      comments: event.target.value
    }));
  };

  // 평가 제출
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // 점수 계산
      const { totalPoints, isComplete } = calculateTotalScore();

      if (!isComplete) {
        setError("모든 평가 항목을 선택해주세요.");
        setIsSubmitting(false);
        return;
      }

      // 백엔드로 전송할 데이터 준비
      const evaluationData = {
        biddingParticipationId: participationId,
        evaluatorId: 1, // 현재 로그인한 사용자 ID (실제 구현 시 변경 필요)
        priceScore: convertToFivePointScale(scores.price, 5),
        qualityScore: convertToFivePointScale(scores.quality, 5),
        deliveryScore: Math.round(
          (convertToFivePointScale(scores.delivery1, 5) +
            convertToFivePointScale(scores.delivery2, 5)) /
            2
        ),
        reliabilityScore: convertToFivePointScale(scores.reliability, 5),
        comments: evaluation.comments
      };

      // API 호출 (실제 구현 시)
      // const response = await fetch(`/api/biddings/participations/${participationId}/evaluate`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     "Authorization": `Bearer ${localStorage.getItem("authToken")}`
      //   },
      //   body: JSON.stringify(evaluationData)
      // });

      // if (!response.ok) {
      //   throw new Error("평가 제출에 실패했습니다.");
      // }

      // const result = await response.json();

      // 목업 응답 (개발 중에만)
      setTimeout(() => {
        console.log("평가 제출 데이터:", evaluationData);

        // 성공 시 콜백 호출
        if (onEvaluationComplete) {
          onEvaluationComplete({
            ...evaluationData,
            id: Date.now(),
            totalScore: Math.round(
              (evaluationData.priceScore +
                evaluationData.qualityScore +
                evaluationData.deliveryScore +
                evaluationData.reliabilityScore) /
                4
            ),
            createdAt: new Date().toISOString()
          });
        }

        // 다이얼로그 닫기
        onClose();
        setIsSubmitting(false);
      }, 1000);
    } catch (error) {
      console.error("평가 제출 중 오류:", error);
      setError(error.message);
      setIsSubmitting(false);
    }
  };

  // 로딩 중 표시
  if (isLoading) {
    return (
      <Dialog open={open} maxWidth="md" fullWidth>
        <DialogTitle>공급자 평가</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "300px"
            }}>
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2 }}>
              평가 정보를 불러오는 중...
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>공급자 평가</DialogTitle>
      <DialogContent>
        {/* 기본 정보 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1">입찰 번호: {bidNumber}</Typography>
          <Typography variant="subtitle1">공급자명: {supplierName}</Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        {/* 오류 메시지 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 이미 평가가 완료된 경우 메시지 */}
        {existingEvaluation && (
          <Alert severity="info" sx={{ mb: 2 }}>
            이미 평가가 완료되었습니다. 기존 평가를 수정합니다.
          </Alert>
        )}

        {/* 평가 테이블 */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>평가기준</TableCell>
                <TableCell align="center">배점</TableCell>
                <TableCell align="center">등급</TableCell>
                <TableCell align="center">가중치(%)</TableCell>
                <TableCell align="center">점수</TableCell>
                <TableCell align="center">비고</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* 가격 */}
              <TableRow>
                <TableCell>가격</TableCell>
                <TableCell align="center">20</TableCell>
                <TableCell align="center">
                  <FormControl component="fieldset">
                    <RadioGroup
                      row
                      value={scores.price}
                      onChange={(e) =>
                        handleScoreChange("price", e.target.value)
                      }>
                      {EVALUATION_ITEMS[0].options.map((option) => (
                        <FormControlLabel
                          key={option.label}
                          value={option.value}
                          control={<Radio size="small" />}
                          label={option.label}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </TableCell>
                <TableCell align="center">
                  {EVALUATION_ITEMS[0].options.find(
                    (o) => o.value === scores.price
                  )?.score || ""}
                </TableCell>
                <TableCell align="center">
                  {EVALUATION_ITEMS[0].options.find(
                    (o) => o.value === scores.price
                  )?.points || ""}
                </TableCell>
                <TableCell align="center">점수1</TableCell>
              </TableRow>

              {/* 품질 */}
              <TableRow>
                <TableCell>품질</TableCell>
                <TableCell align="center">30</TableCell>
                <TableCell align="center">
                  <FormControl component="fieldset">
                    <RadioGroup
                      row
                      value={scores.quality}
                      onChange={(e) =>
                        handleScoreChange("quality", e.target.value)
                      }>
                      {EVALUATION_ITEMS[1].options.map((option) => (
                        <FormControlLabel
                          key={option.label}
                          value={option.value}
                          control={<Radio size="small" />}
                          label={option.label}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </TableCell>
                <TableCell align="center">
                  {EVALUATION_ITEMS[1].options.find(
                    (o) => o.value === scores.quality
                  )?.score || ""}
                </TableCell>
                <TableCell align="center">
                  {EVALUATION_ITEMS[1].options.find(
                    (o) => o.value === scores.quality
                  )?.points || ""}
                </TableCell>
                <TableCell align="center">점수2</TableCell>
              </TableRow>

              {/* 기술력 - 헤더 */}
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell rowSpan={3}>기술력</TableCell>
                <TableCell align="center" rowSpan={3}>
                  30
                </TableCell>
                <TableCell colSpan={4} align="center">
                  세부 평가 항목
                </TableCell>
              </TableRow>

              {/* 기술력 - 기술역량1 */}
              <TableRow>
                <TableCell align="center">
                  <FormControl component="fieldset">
                    <RadioGroup
                      row
                      value={scores.delivery1}
                      onChange={(e) =>
                        handleScoreChange("delivery1", e.target.value)
                      }>
                      {EVALUATION_ITEMS[2].subItems[0].options.map((option) => (
                        <FormControlLabel
                          key={option.label}
                          value={option.value}
                          control={<Radio size="small" />}
                          label={option.label}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </TableCell>
                <TableCell align="center">
                  {EVALUATION_ITEMS[2].subItems[0].options.find(
                    (o) => o.value === scores.delivery1
                  )?.score || ""}
                </TableCell>
                <TableCell align="center">
                  {EVALUATION_ITEMS[2].subItems[0].options.find(
                    (o) => o.value === scores.delivery1
                  )?.points || ""}
                </TableCell>
                <TableCell align="center">기술역량1</TableCell>
              </TableRow>

              {/* 기술력 - 기술역량2 */}
              <TableRow>
                <TableCell align="center">
                  <FormControl component="fieldset">
                    <RadioGroup
                      row
                      value={scores.delivery2}
                      onChange={(e) =>
                        handleScoreChange("delivery2", e.target.value)
                      }>
                      {EVALUATION_ITEMS[2].subItems[1].options.map((option) => (
                        <FormControlLabel
                          key={option.label}
                          value={option.value}
                          control={<Radio size="small" />}
                          label={option.label}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </TableCell>
                <TableCell align="center">
                  {EVALUATION_ITEMS[2].subItems[1].options.find(
                    (o) => o.value === scores.delivery2
                  )?.score || ""}
                </TableCell>
                <TableCell align="center">
                  {EVALUATION_ITEMS[2].subItems[1].options.find(
                    (o) => o.value === scores.delivery2
                  )?.points || ""}
                </TableCell>
                <TableCell align="center">기술역량2</TableCell>
              </TableRow>

              {/* 지원력 */}
              <TableRow>
                <TableCell>지원력</TableCell>
                <TableCell align="center">20</TableCell>
                <TableCell align="center">
                  <FormControl component="fieldset">
                    <RadioGroup
                      row
                      value={scores.reliability}
                      onChange={(e) =>
                        handleScoreChange("reliability", e.target.value)
                      }>
                      {EVALUATION_ITEMS[3].options.map((option) => (
                        <FormControlLabel
                          key={option.label}
                          value={option.value}
                          control={<Radio size="small" />}
                          label={option.label}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </TableCell>
                <TableCell align="center">
                  {EVALUATION_ITEMS[3].options.find(
                    (o) => o.value === scores.reliability
                  )?.score || ""}
                </TableCell>
                <TableCell align="center">
                  {EVALUATION_ITEMS[3].options.find(
                    (o) => o.value === scores.reliability
                  )?.points || ""}
                </TableCell>
                <TableCell align="center">점수3</TableCell>
              </TableRow>

              {/* 총점 */}
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell colSpan={4} align="right">
                  <Typography variant="subtitle1">총점</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="subtitle1">
                    {calculateTotalScore().totalPoints}
                  </Typography>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* 평가 의견 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            평가 의견
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={evaluation.comments}
            onChange={handleCommentsChange}
            placeholder="평가에 대한 의견을 입력하세요"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          취소
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={isSubmitting}>
          {isSubmitting ? (
            <CircularProgress size={24} />
          ) : existingEvaluation ? (
            "재평가"
          ) : (
            "평가 완료"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

BiddingEvaluationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  participationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  supplierName: PropTypes.string,
  bidNumber: PropTypes.string,
  onEvaluationComplete: PropTypes.func
};

export default BiddingEvaluationDialog;
