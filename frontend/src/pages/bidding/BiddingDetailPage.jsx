import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Link,
  Alert
} from "@mui/material";
import BiddingEvaluationDialog from "./BiddingEvaluationDialog";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

function BiddingDetailPage({ onEdit, onBack }) {
  const { id } = useParams();
  // 상태 관리
  const [bidding, setBidding] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [evaluationDialogState, setEvaluationDialogState] = useState({
    open: false,
    participationId: null,
    supplierName: ""
  });

  // 상태 변환 함수
  const getStatusText = (status) => {
    const statusMap = {
      PENDING: "대기중",
      ONGOING: "진행중",
      OPEN: "오픈",
      CLOSED: "마감",
      CANCELED: "취소"
    };
    return statusMap[status] || status;
  };

  // 입찰 방식 변환 함수
  const getBidMethodText = (method) => {
    const methodMap = {
      FIXED_PRICE: "정가제안",
      PRICE_SUGGESTION: "가격제안"
    };
    return methodMap[method] || method;
  };

  // 데이터 로딩
  useEffect(() => {
    async function fetchBiddingData() {
      try {
        setIsLoading(true);
        setError(null);

        // 1. 입찰 공고 상세 정보 가져오기
        const biddingResponse = await fetchWithAuth(`${API_URL}biddings/${id}`);

        if (!biddingResponse.ok) {
          throw new Error(
            `입찰 공고 정보를 불러오는데 실패했습니다. (${biddingResponse.status})`
          );
        }

        const biddingData = await biddingResponse.json();
        //console.log("API 응답 데이터:", biddingData);

        // API 응답 데이터 형식에 맞게 필드 매핑
        const mappedBidding = {
          id: biddingData.id,
          bidNumber: biddingData.bidNumber || `BID-${biddingData.id}`,
          title: biddingData.title,
          description: biddingData.description,
          bidMethod: biddingData.bidMethod,
          status: biddingData.status,
          startDate: biddingData.startDate,
          endDate: biddingData.endDate,
          conditions: biddingData.conditions || biddingData.biddingConditions,
          internalNote: biddingData.internalNote,
          quantity: biddingData.quantity || 0,
          unitPrice: biddingData.unitPrice || 0,
          supplyPrice: biddingData.supplyPrice || 0,
          vat: biddingData.vat || 0,
          totalAmount: biddingData.totalAmount || 0,
          createdBy: biddingData.createdBy,
          createdAt: biddingData.createdAt,
          updatedAt: biddingData.updatedAt
        };

        setBidding(mappedBidding);

        // 2. 입찰 참여 목록 가져오기
        const participationsResponse = await fetchWithAuth(
          `${API_URL}biddings/${id}/participations`
        );

        if (!participationsResponse.ok) {
          console.warn(
            `입찰 참여 정보를 불러오는데 실패했습니다. (${participationsResponse.status})`
          );
          setParticipations([]);
        } else {
          const participationsData = await participationsResponse.json();
          setParticipations(participationsData);
        }
      } catch (error) {
        console.error("데이터 로딩 중 오류:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    // 실제 API 호출
    if (id) {
      fetchBiddingData();
    } else {
      setError("유효하지 않은 입찰 ID입니다.");
      setIsLoading(false);
    }
  }, [id]);

  // 입찰 공고 삭제
  async function handleDelete() {
    try {
      setIsLoading(true);

      const response = await fetchWithAuth(`${API_URL}biddings/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error(`입찰 공고 삭제에 실패했습니다. (${response.status})`);
      }

      alert("입찰 공고가 성공적으로 삭제되었습니다.");

      // 목록 페이지로 이동
      if (onBack) {
        onBack();
      }
    } catch (error) {
      console.error("입찰 공고 삭제 중 오류:", error);
      alert(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  }

  // 공급자 평가 제출 핸들러
  const handleEvaluationSubmit = async (evaluationData) => {
    try {
      const response = await fetchWithAuth(`${API_URL}bidding-evaluations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(evaluationData)
      });

      if (!response.ok) {
        throw new Error("평가 제출에 실패했습니다.");
      }

      const savedEvaluation = await response.json();
      return savedEvaluation;
    } catch (error) {
      console.error("평가 제출 중 오류:", error);
      throw error;
    }
  };

  // 숫자 값 안전하게 표시
  const formatNumber = (value) => {
    if (value === null || value === undefined) return "0";
    if (typeof value === "string") {
      // 문자열에 콤마가 포함되어 있으면 그대로 반환
      if (value.includes(",")) return value;
      // 숫자로 변환 시도
      const num = parseFloat(value);
      return isNaN(num) ? "0" : num.toLocaleString();
    }
    return value.toLocaleString();
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
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={onBack}>
          돌아가기
        </Button>
      </Box>
    );
  }

  // 데이터가 없는 경우
  if (!bidding) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          입찰 공고를 찾을 수 없습니다
        </Alert>
        <Button variant="contained" onClick={onBack}>
          돌아가기
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
        <Typography variant="h4">입찰 공고 상세</Typography>
        <Box>
          <Button variant="outlined" onClick={onBack} sx={{ mr: 1 }}>
            목록으로
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => onEdit && onEdit(id)}
            sx={{ mr: 1 }}>
            수정
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => setIsDeleteDialogOpen(true)}>
            삭제
          </Button>
        </Box>
      </Box>

      {/* 기본 정보 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          기본 정보
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              입찰 번호
            </Typography>
            <Typography variant="body1">{bidding.bidNumber}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              상태
            </Typography>
            <Chip
              label={getStatusText(bidding.status)}
              color={
                bidding.status === "ONGOING" || bidding.status === "OPEN"
                  ? "success"
                  : bidding.status === "PENDING"
                  ? "warning"
                  : bidding.status === "CLOSED"
                  ? "primary"
                  : "default"
              }
            />
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
              등록일
            </Typography>
            <Typography variant="body1">
              {bidding.createdAt
                ? new Date(bidding.createdAt).toLocaleDateString()
                : "-"}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              구매 요청명
            </Typography>
            <Typography variant="body1">{bidding.title || "-"}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              공급자
            </Typography>
            <Typography variant="body1">
              {bidding.description || "-"}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              품목 수량
            </Typography>
            <Typography variant="body1">
              {formatNumber(bidding.quantity)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              단가
            </Typography>
            <Typography variant="body1">
              {formatNumber(bidding.unitPrice)}원
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              공급가액
            </Typography>
            <Typography variant="body1">
              {formatNumber(bidding.supplyPrice)}원
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              부가세
            </Typography>
            <Typography variant="body1">
              {formatNumber(bidding.vat)}원
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              총액
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              {formatNumber(bidding.totalAmount)}원
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              마감일
            </Typography>
            <Typography variant="body1">
              {bidding.endDate ? (
                <>
                  {new Date(bidding.endDate).toLocaleDateString()} (
                  {new Date() > new Date(bidding.endDate)
                    ? "마감됨"
                    : `D-${Math.ceil(
                        (new Date(bidding.endDate) - new Date()) /
                          (1000 * 60 * 60 * 24)
                      )}`}
                  )
                </>
              ) : (
                "-"
              )}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 입찰 조건 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          입찰 조건
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
          {bidding.conditions || "입찰 조건이 없습니다."}
        </Typography>
      </Paper>

      {/* 내부 메모 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          내부 메모
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
          {bidding.internalNote || "내부 메모가 없습니다."}
        </Typography>
      </Paper>

      {/* 입찰 참여 목록 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          입찰 참여 현황
        </Typography>

        {participations && participations.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>공급자</TableCell>
                  <TableCell align="right">단가</TableCell>
                  <TableCell align="right">총액</TableCell>
                  <TableCell>비고</TableCell>
                  <TableCell align="right">제출일</TableCell>
                  <TableCell>평가</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {participations.map((participation) => (
                  <TableRow key={participation.id}>
                    <TableCell>{participation.supplierName}</TableCell>
                    <TableCell align="right">
                      {formatNumber(participation.unitPrice)}원
                    </TableCell>
                    <TableCell align="right">
                      {formatNumber(participation.totalAmount)}원
                    </TableCell>
                    <TableCell>{participation.note || "-"}</TableCell>
                    <TableCell align="right">
                      {participation.submittedAt
                        ? new Date(
                            participation.submittedAt
                          ).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Link
                        component="button"
                        underline="hover"
                        onClick={() =>
                          setEvaluationDialogState({
                            open: true,
                            participationId: participation.id,
                            supplierName: participation.supplierName
                          })
                        }>
                        {participation.isEvaluated ? "재평가" : "평가하기"}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body1">아직 입찰 참여가 없습니다.</Typography>
        )}
      </Paper>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>입찰 공고 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            정말로 이 입찰 공고를 삭제하시겠습니까? 이 작업은 되돌릴 수
            없습니다.
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

      {/* 공급자 평가 다이얼로그 */}
      <BiddingEvaluationDialog
        open={evaluationDialogState.open}
        onClose={() =>
          setEvaluationDialogState({ ...evaluationDialogState, open: false })
        }
        participationId={evaluationDialogState.participationId}
        supplierName={evaluationDialogState.supplierName}
        bidNumber={bidding?.bidNumber}
        onEvaluationComplete={async (evaluation) => {
          try {
            // 평가 데이터를 서버에 저장
            const savedEvaluation = await handleEvaluationSubmit(evaluation);

            // 평가 완료 후 참여 목록 업데이트
            setParticipations((prev) =>
              prev.map((p) =>
                p.id === evaluation.biddingParticipationId
                  ? {
                      ...p,
                      isEvaluated: true,
                      evaluationScore: savedEvaluation.totalScore
                    }
                  : p
              )
            );

            return savedEvaluation;
          } catch (error) {
            console.error("평가 처리 중 오류:", error);
            throw error;
          }
        }}
      />
    </Box>
  );
}

BiddingDetailPage.propTypes = {
  onEdit: PropTypes.func,
  onBack: PropTypes.func
};

export default BiddingDetailPage;
