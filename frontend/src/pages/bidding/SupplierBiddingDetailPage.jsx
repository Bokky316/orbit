// SupplierBiddingDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import moment from "moment";

import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from "@mui/material";

import {
  InfoOutlined as InfoIcon,
  Description as DescriptionIcon,
  History as HistoryIcon,
  Assignment as AssignmentIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
  HourglassEmpty as HourglassIcon
} from "@mui/icons-material";

import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";
import { BiddingStatus, BiddingMethod } from "./helpers/biddingTypes";
import {
  formatNumber,
  getBidMethodText,
  getStatusText
} from "./helpers/commonBiddingHelpers";
import { useNotificationsWebSocket } from "@/hooks/useNotificationsWebSocket";
import { useToastNotifications } from "@/hooks/useToastNotifications";

import SectionHeader from "./biddingComponent/SectionHeader";

function SupplierBiddingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // 알림 웹소켓 연결
  const { toast } = useToastNotifications();

  // 알림 수신 시 토스트 띄우는 함수
  const handleNotification = (notification) => {
    toast({
      title: notification.title,
      description: notification.content,
      severity: "info", // MUI Alert 스타일 대응 (success | error | warning | info)
      duration: 5000
    });
  };

  // 알림 웹소켓 연결
  useNotificationsWebSocket(user, handleNotification);

  // 상태 관리
  const [bidding, setBidding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participation, setParticipation] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    conditions: true,
    participation: true,
    evaluation: false
  });

  // 참여 입력 상태
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [comment, setComment] = useState("");
  const [participationSubmitting, setParticipationSubmitting] = useState(false);
  const [participationResult, setParticipationResult] = useState(null);

  // 입찰 상세 정보 가져오기
  const fetchBiddingDetail = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}biddings/${id}`);
      if (!response.ok) {
        throw new Error("입찰 정보를 불러오는 데 실패했습니다.");
      }
      const data = await response.json();
      console.log("입찰 정보:", data);
      console.log("입찰 상태 값:", data.status);
      console.log("상태 타입:", typeof data.status);
      if (typeof data.status === "object") {
        console.log("상태 객체 내용:", JSON.stringify(data.status));
      }
      setBidding(data);

      // 기존 참여 정보가 있으면 폼에 설정
      if (data.participation) {
        setParticipation(data.participation);
        setUnitPrice(data.participation.unitPrice || "");
        setQuantity(data.participation.quantity || "");
        setComment(data.participation.comment || "");
      } else if (data.quantity) {
        // 참여 정보가 없으면 입찰 기본 수량으로 설정
        setQuantity(data.quantity);
      }
    } catch (err) {
      console.error("입찰 상세 조회 오류:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 정가제 여부 확인 함수 추가
  const isFixedPriceBidding = () => {
    if (!bidding) return false;

    // bidding.bidMethod 값 확인을 위한 디버깅 로그
    console.log("현재 입찰 방식:", bidding.bidMethod);

    // BiddingMethod 상수 확인을 위한 디버깅 로그
    console.log("BiddingMethod 상수:", BiddingMethod);

    // 문자열 비교 및 객체 비교 모두 처리
    return (
      bidding.bidMethod === BiddingMethod.FIXED_PRICE ||
      bidding.bidMethod === "FIXED_PRICE" ||
      // 정가제안 관련 추가 값들 확인
      bidding.bidMethod === "FIXED_PRICE_OFFER" ||
      bidding.bidMethod === BiddingMethod.FIXED_PRICE_OFFER ||
      // 단순히 정가제 라는 문자열을 포함하는지 확인 (한글 포함)
      (typeof bidding.bidMethod === "string" &&
        (bidding.bidMethod.includes("정가") ||
          bidding.bidMethod.toLowerCase().includes("fixed")))
    );
  };

  // 참여 제출 핸들러 수정 - API 필수 파라미터 처리
  // API 엔드포인트 경로 수정

  // 변경 전:
  // ${API_URL}supplier/biddings/${id}/participate

  // 변경 후: 아래 형식으로 수정해야 합니다
  // ${API_URL}suppliers/biddings/${id}/participate

  // 코드에서 수정해야 할 부분:

  // 1. handleParticipate 함수에서 API 엔드포인트 경로 수정
  const handleParticipate = async () => {
    try {
      setParticipationSubmitting(true);

      // 디버깅 로그 추가
      console.log("참여 시작: 정가제 여부", isFixedPriceBidding());
      console.log("bidding.unitPrice:", bidding.unitPrice);
      console.log("bidding.quantity:", bidding.quantity);

      let participationData = {};

      if (isFixedPriceBidding()) {
        // 정가제의 경우에도 unitPrice와 quantity를 항상 포함시킴
        const fixedUnitPrice = bidding.unitPrice || 0;
        const fixedQuantity = bidding.quantity || 0;

        participationData = {
          unitPrice: fixedUnitPrice,
          quantity: fixedQuantity,
          comment: comment || ""
        };

        console.log("정가제 참여 데이터:", participationData);
      } else {
        // 일반 입찰의 경우 입력된 값 사용
        const unitPriceNumber = parseFloat(unitPrice);
        const quantityNumber = parseFloat(quantity);

        // 유효성 검사
        if (
          !unitPriceNumber ||
          isNaN(unitPriceNumber) ||
          unitPriceNumber <= 0
        ) {
          throw new Error("유효한 단가를 입력해주세요");
        }
        if (!quantityNumber || isNaN(quantityNumber) || quantityNumber <= 0) {
          throw new Error("유효한 수량을 입력해주세요");
        }

        participationData = {
          unitPrice: unitPriceNumber,
          quantity: quantityNumber,
          comment: comment || ""
        };

        console.log("일반입찰 참여 데이터:", participationData);
      }

      // 수정된 엔드포인트 경로
      const endpoint = `${API_URL}biddings/${id}/participate`;
      console.log("API 요청 엔드포인트:", endpoint);

      const response = await fetchWithAuth(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(participationData)
      });

      console.log("API 응답 상태:", response.status);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "알 수 없는 오류" }));
        console.error("API 오류 응답:", errorData);
        throw new Error(errorData.message || "참여 요청 실패");
      }

      const result = await response.json();
      console.log("참여 성공 결과:", result);
      setParticipationResult(result);
      alert("입찰 참여가 성공적으로 완료되었습니다.");
      fetchBiddingDetail(); // 최신 정보 다시 불러오기
    } catch (e) {
      console.error("참여 실패:", e);
      alert(e.message);
    } finally {
      setParticipationSubmitting(false);
    }
  };

  // 참여 수정 핸들러 함수도 같은 방식으로 수정
  const handleUpdateParticipation = async () => {
    try {
      setParticipationSubmitting(true);

      let participationData = {};

      if (isFixedPriceBidding()) {
        // 정가제의 경우에도 unitPrice와 quantity를 항상 포함시킴
        const fixedUnitPrice = bidding.unitPrice || 0;
        const fixedQuantity = bidding.quantity || 0;

        participationData = {
          unitPrice: fixedUnitPrice,
          quantity: fixedQuantity,
          comment: comment || ""
        };
      } else {
        // 일반 입찰의 경우 입력된 값 사용
        const unitPriceNumber = parseFloat(unitPrice);
        const quantityNumber = parseFloat(quantity);

        // 유효성 검사
        if (
          !unitPriceNumber ||
          isNaN(unitPriceNumber) ||
          unitPriceNumber <= 0
        ) {
          throw new Error("유효한 단가를 입력해주세요");
        }
        if (!quantityNumber || isNaN(quantityNumber) || quantityNumber <= 0) {
          throw new Error("유효한 수량을 입력해주세요");
        }

        participationData = {
          unitPrice: unitPriceNumber,
          quantity: quantityNumber,
          comment: comment || ""
        };
      }

      // 수정된 엔드포인트 경로
      const endpoint = `${API_URL}suppliers/biddings/${id}/participation/${participation.id}`;
      console.log("API 요청 엔드포인트:", endpoint);

      const response = await fetchWithAuth(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(participationData)
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "알 수 없는 오류" }));
        console.error("API 오류 응답:", errorData);
        throw new Error(errorData.message || "수정 요청 실패");
      }

      const result = await response.json();
      setParticipationResult(result);
      alert("입찰 참여 정보가 성공적으로 수정되었습니다.");
      fetchBiddingDetail(); // 최신 정보 다시 불러오기
    } catch (e) {
      console.error("수정 실패:", e);
      alert(e.message);
    } finally {
      setParticipationSubmitting(false);
    }
  };

  // 섹션 확장/축소 토글
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (id) {
      fetchBiddingDetail();
    }
  }, [id]);

  // 입찰 프로세스 단계 및 현재 단계 계산
  const getProcessSteps = () => {
    return [
      { label: "공고", value: BiddingStatus.PENDING },
      { label: "진행 중", value: BiddingStatus.ONGOING },
      { label: "평가", value: "EVALUATION" },
      { label: "낙찰 완료", value: "WINNER_SELECTED" }
    ];
  };

  const getActiveStep = () => {
    if (!bidding) return 0;

    const statusCode =
      typeof bidding.status === "object"
        ? bidding.status.childCode || bidding.status.code
        : bidding.status;

    if (statusCode === BiddingStatus.PENDING) return 0;
    if (statusCode === BiddingStatus.ONGOING) return 1;
    if (statusCode === BiddingStatus.CLOSED) {
      // 낙찰자가 선정되었는지 확인
      if (participation?.isSelectedBidder) return 3;
      // 평가 단계
      return 2;
    }
    return 0;
  };

  // 상태에 따른 참여 가능 여부 확인
  const canParticipate = () => {
    if (!bidding) return false;

    const statusCode =
      typeof bidding.status === "object"
        ? bidding.status.childCode || bidding.status.code
        : bidding.status;
    return statusCode === BiddingStatus.ONGOING;
  };

  // 상태에 따른 참여 수정 가능 여부 확인
  const canUpdateParticipation = () => {
    if (!bidding || !participation) return false;

    const statusCode =
      typeof bidding.status === "object"
        ? bidding.status.childCode || bidding.status.code
        : bidding.status;
    return statusCode === BiddingStatus.ONGOING;
  };

  // 참여 정보가 있는지 확인
  const hasParticipated = () => {
    return !!participation;
  };

  // 낙찰 여부 확인
  const isWinner = () => {
    return participation?.isSelectedBidder === true;
  };

  // 평가 완료 여부 확인
  const isEvaluated = () => {
    return participation?.isEvaluated === true;
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          onClick={() => navigate("/suppliers/biddings")}
          sx={{ mt: 2 }}>
          목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  // 상태 코드 및 노출 텍스트 설정
  const statusCode =
    typeof bidding.status === "object"
      ? bidding.status.childCode || bidding.status.code
      : bidding.status;
  const isOpen = statusCode === BiddingStatus.ONGOING;
  const isClosed = statusCode === BiddingStatus.CLOSED;

  // 상태 노출 텍스트 세부 설정
  let statusDisplayText = getStatusText(statusCode);
  if (isClosed) {
    if (isWinner()) {
      statusDisplayText = "낙찰";
    } else if (isEvaluated()) {
      statusDisplayText = "평가 완료";
    } else if (participation) {
      statusDisplayText = "평가 진행중";
    }
  }

  // 참여 가능 여부 확인
  const isParticipationPossible = canParticipateInBidding(
    bidding,
    currentUser.supplierId
  );

  return (
    <Box sx={{ p: 4 }}>
      {/* 페이지 헤더 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3
        }}>
        <Typography variant="h4">입찰 공고 상세 정보</Typography>
        <Button
          variant="outlined"
          onClick={() => navigate("/suppliers/biddings")}>
          목록으로
        </Button>
      </Box>

      {/* 프로세스 진행 상태 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={getActiveStep()} alternativeLabel>
          {getProcessSteps().map((step) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* 기본 정보 섹션 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <SectionHeader
          title="기본 정보"
          icon={<InfoIcon />}
          expanded={expandedSections.basicInfo}
          onToggle={() => toggleSection("basicInfo")}
        />
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              입찰 번호
            </Typography>
            <Typography variant="body1">{bidding.bidNumber || "-"}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              품목
            </Typography>
            <Typography variant="body1">
              {bidding.purchaseRequestItemName}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              입찰 방식
            </Typography>
            <Typography variant="body1">
              {getBidMethodText(bidding.bidMethod)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              입찰 기간
            </Typography>
            <Typography variant="body1">
              {bidding.biddingPeriod?.startDate &&
              bidding.biddingPeriod?.endDate
                ? `${moment(bidding.biddingPeriod.startDate).format(
                    "YYYY-MM-DD"
                  )} ~ ${moment(bidding.biddingPeriod.endDate).format(
                    "YYYY-MM-DD"
                  )}`
                : "-"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              수량
            </Typography>
            <Typography variant="body1">{bidding.quantity || 0}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              단가
            </Typography>
            <Typography variant="body1">
              {formatNumber(bidding.unitPrice)} 원
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              총액
            </Typography>
            <Typography variant="body1">
              {formatNumber(bidding.totalAmount)} 원
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              세금계산서 발행여부
            </Typography>
            <Typography variant="body1">필요</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 입찰 조건 섹션 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <SectionHeader
          title="입찰 조건"
          icon={<DescriptionIcon />}
          expanded={expandedSections.conditions}
          onToggle={() => toggleSection("conditions")}
        />
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
            {bidding.conditions || "입찰 조건이 등록되지 않았습니다."}
          </Typography>
        </Box>
      </Paper>

      {/* 입찰 참여 섹션 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <SectionHeader
          title={hasParticipated() ? "내 참여 정보" : "입찰 참여하기"}
          icon={<AssignmentIcon />}
          expanded={expandedSections.participation}
          onToggle={() => toggleSection("participation")}
        />

        {canParticipate() && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {!isFixedPriceBidding() ? (
                // 일반 입찰 방식일 때 보여줄 폼
                <>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="단가 (원)"
                      fullWidth
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      type="number"
                      InputProps={{
                        inputProps: { min: 0 }
                      }}
                      disabled={participationSubmitting}
                      helperText="참여할 단가를 입력하세요"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="수량"
                      fullWidth
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      type="number"
                      InputProps={{
                        inputProps: { min: 0 }
                      }}
                      disabled={participationSubmitting}
                      helperText="공급 가능한 수량을 입력하세요"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="비고"
                      fullWidth
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      multiline
                      rows={3}
                      disabled={participationSubmitting}
                      helperText="특이사항이나 추가 정보를 입력하세요"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        예상 총액: {formatNumber(unitPrice * quantity || 0)}원
                      </Typography>
                    </Box>
                  </Grid>
                </>
              ) : (
                // 정가제 입찰일 때 보여줄 정보
                <>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      단가 (원)
                    </Typography>
                    <Typography variant="body1">
                      {formatNumber(bidding.unitPrice)} 원 (고정)
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      수량
                    </Typography>
                    <Typography variant="body1">
                      {bidding.quantity} (고정)
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      총액
                    </Typography>
                    <Typography variant="body1">
                      {formatNumber(bidding.unitPrice * bidding.quantity)} 원
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="비고"
                      fullWidth
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      multiline
                      rows={3}
                      disabled={participationSubmitting}
                      helperText="특이사항이나 추가 정보를 입력하세요 (선택사항)"
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  {hasParticipated() ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleUpdateParticipation}
                      disabled={
                        participationSubmitting || !canUpdateParticipation()
                      }>
                      {participationSubmitting ? "처리중..." : "정보 수정하기"}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleParticipate}
                      disabled={participationSubmitting}>
                      {participationSubmitting
                        ? "처리중..."
                        : isFixedPriceBidding()
                        ? "제안 수락하기"
                        : "참여하기"}
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {!canParticipate() && !hasParticipated() && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info">
              {isClosed
                ? "이 입찰은 마감되었습니다. 참여 기간에 입찰에 참여하지 않았습니다."
                : "현재 이 입찰에 참여할 수 없습니다."}
            </Alert>
          </Box>
        )}
      </Paper>

      {/* 평가 결과 섹션 - 마감 후에만 표시 */}
      {isClosed && hasParticipated() && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <SectionHeader
            title="평가 결과"
            icon={<StarIcon />}
            expanded={expandedSections.evaluation}
            onToggle={() => toggleSection("evaluation")}
          />

          <Box sx={{ mt: 2 }}>
            {isWinner() ? (
              <Alert
                severity="success"
                icon={<CheckIcon fontSize="inherit" />}
                sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  축하합니다! 이 입찰의 낙찰자로 선정되었습니다.
                </Typography>
                <Typography variant="body2">
                  곧 계약 관련 정보를 받게 될 것입니다.
                </Typography>
              </Alert>
            ) : isEvaluated() ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  평가가 완료되었습니다.
                </Typography>
                <Typography variant="body2">
                  낙찰자 선정 결과를 기다려 주세요.
                </Typography>
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  현재 평가가 진행 중입니다.
                </Typography>
                <Typography variant="body2">
                  평가 결과가 나오면 알림을 받게 됩니다.
                </Typography>
              </Alert>
            )}

            {participation.evaluationScore > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  평가 점수
                </Typography>
                <Typography variant="h5" color="primary">
                  {participation.evaluationScore} / 100
                </Typography>
              </Box>
            )}

            {participation.evaluationComment && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  평가 코멘트
                </Typography>
                <Typography variant="body1">
                  {participation.evaluationComment}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
}

export default SupplierBiddingDetailPage;
