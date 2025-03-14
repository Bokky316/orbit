import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Link,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import BiddingEvaluationDialog from "./BiddingEvaluationDialog";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { saveAs } from "file-saver";

import { NotificationPanel, NotificationToast } from "./NotificationComponents";
import {
  useNotifications,
  useWebSocketNotifications
} from "./notificationHooks";
import {
  canParticipateInBidding,
  canSelectWinner,
  canCreateOrder,
  canCreateContractDraft,
  canEvaluateParticipation,
  getBiddingProcessSummary
} from "./biddingHelpers";

function BiddingDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  // 상태 관리
  const [bidding, setBidding] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [evaluationDialogState, setEvaluationDialogState] = useState({
    open: false,
    participationId: null,
    supplierName: ""
  });
  const [statusChangeDialog, setStatusChangeDialog] = useState({
    open: false,
    newStatus: "",
    reason: ""
  });
  const [statusHistories, setStatusHistories] = useState([]);

  // 알림 훅
  const { notifications, unreadCount, fetchNotifications } = useNotifications();
  const { notifications: webSocketNotifications } = useWebSocketNotifications();

  // 데이터 가져오기 함수
  const fetchBiddingDetail = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`입찰 공고 상세 정보 요청 - ID: ${id}`);
      const response = await fetchWithAuth(`${API_URL}biddings/${id}`);

      // 응답 상태 확인
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! Status: ${response.status}, Body: ${errorText}`
        );
      }

      try {
        // 응답을 텍스트로 가져와서 안전하게 처리
        const responseText = await response.text();

        // 빈 응답 체크
        if (!responseText.trim()) {
          throw new Error("서버에서 빈 응답이 반환되었습니다.");
        }

        // JSON 파싱 시도
        const data = JSON.parse(responseText);
        console.log("입찰 공고 상세 정보:", data);
        setBidding(data);

        // 입찰 공고와 관련된 알림 가져오기
        fetchNotifications({
          referenceId: data.id,
          entityType: "BIDDING"
        });

        // 참여 목록 가져오기
        fetchParticipations(id);

        // 상태 이력 가져오기
        fetchStatusHistories(id);
      } catch (parseError) {
        console.error("JSON 파싱 오류:", parseError);

        // 파싱 오류 위치 주변 문자열 검사
        if (parseError.message.includes("position")) {
          const positionMatch = parseError.message.match(/position\s+(\d+)/i);
          if (positionMatch && positionMatch[1]) {
            const errorPosition = parseInt(positionMatch[1], 10);
            const responseText = await response.text();
            const start = Math.max(0, errorPosition - 30);
            const end = Math.min(responseText.length, errorPosition + 30);

            console.error("JSON 파싱 오류 위치 주변:", {
              before: responseText.substring(start, errorPosition),
              errorChar: responseText.charAt(errorPosition),
              after: responseText.substring(errorPosition + 1, end)
            });
          }
        }

        throw new Error(
          `서버 응답을 처리할 수 없습니다: ${parseError.message}`
        );
      }
    } catch (error) {
      console.error("입찰 공고 상세 정보 가져오기 실패:", error);
      setError(
        `입찰 공고 상세 정보를 불러오는 중 오류가 발생했습니다: ${error.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 알림 처리
  const handleNotificationAction = async (notification) => {
    switch (notification.type) {
      case "BIDDING_INVITE":
        // 초대 수락 로직
        await acceptBiddingInvitation(notification.referenceId);
        break;
      case "BIDDING_WINNER_SELECTED":
        // 낙찰자 확인 로직
        await viewBiddingWinnerDetails(notification.referenceId);
        break;
      case "CONTRACT_DRAFT_READY":
        // 계약 초안 보기 로직
        await viewContractDraft(notification.referenceId);
        break;
      default:
        // 기본 알림 처리
        console.log("알림 처리:", notification);
    }
  };

  // 참여 목록 가져오기
  const fetchParticipations = async (biddingId) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}biddings/${biddingId}/participations`
      );

      if (!response.ok) {
        throw new Error("참여 목록을 가져오는데 실패했습니다.");
      }

      const data = await response.json();
      setParticipations(data);
    } catch (error) {
      console.error("참여 목록 가져오기 실패:", error);
      // 주요 데이터가 아니므로 전체 페이지 오류로 처리하지 않음
    }
  };

  // 상태 이력 가져오기
  const fetchStatusHistories = async (biddingId) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}biddings/${biddingId}/status-histories`
      );

      if (!response.ok) {
        throw new Error("상태 이력을 가져오는데 실패했습니다.");
      }

      // 응답을 텍스트로 가져오기
      let responseText = await response.text();

      try {
        // 일반적인 JSON 파싱 시도
        const data = JSON.parse(responseText);
        setStatusHistories(data);
      } catch (parseError) {
        console.error("상태 이력 JSON 파싱 오류:", parseError);

        // 파싱 오류 위치 정보 추출
        const positionMatch = parseError.message.match(/position\s+(\d+)/i);
        if (positionMatch && positionMatch[1]) {
          const errorPosition = parseInt(positionMatch[1], 10);
          console.error("JSON 오류 위치:", errorPosition);

          // 출력하여 확인 (개발용)
          const contextStart = Math.max(0, errorPosition - 30);
          const contextEnd = Math.min(responseText.length, errorPosition + 30);
          console.error("오류 문맥:", {
            before: responseText.substring(contextStart, errorPosition),
            errorChar: responseText.charAt(errorPosition),
            after: responseText.substring(errorPosition + 1, contextEnd)
          });

          try {
            // 데이터 정제 시도 - 응답 끝의 예상치 못한 문자 제거
            // 정확한 위치에서 자르기
            const cleanedText = responseText.substring(0, errorPosition);

            // JSON 형식으로 끝나는지 확인 후 파싱 재시도
            if (
              cleanedText.trim().endsWith("]") ||
              cleanedText.trim().endsWith("}")
            ) {
              const cleanedData = JSON.parse(cleanedText);
              console.log("정제된 데이터로 파싱 성공:", cleanedData);
              setStatusHistories(cleanedData);
            } else {
              // 적절한 JSON 끝 위치 찾기
              const lastBracketPos = Math.max(
                cleanedText.lastIndexOf("]"),
                cleanedText.lastIndexOf("}")
              );

              if (lastBracketPos > 0) {
                const truncatedText = cleanedText.substring(
                  0,
                  lastBracketPos + 1
                );
                const truncatedData = JSON.parse(truncatedText);
                console.log("잘린 데이터로 파싱 성공:", truncatedData);
                setStatusHistories(truncatedData);
              } else {
                // 정제 실패 시 빈 배열 사용
                setStatusHistories([]);
              }
            }
          } catch (secondError) {
            console.error("정제 후에도 파싱 실패:", secondError);
            setStatusHistories([]);
          }
        } else {
          // 위치 정보가 없는 경우 빈 배열 사용
          setStatusHistories([]);
        }
      }
    } catch (error) {
      console.error("상태 이력 가져오기 실패:", error);
      setStatusHistories([]);
    }
  };

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    if (id) {
      fetchBiddingDetail();
    }
  }, [id]);

  // 입찰 공고 삭제
  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "정말로 이 입찰 공고를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다."
    );

    if (confirmDelete) {
      try {
        setIsLoading(true);

        const response = await fetchWithAuth(`${API_URL}biddings/${id}`, {
          method: "DELETE"
        });

        if (!response.ok) {
          throw new Error(
            `입찰 공고 삭제에 실패했습니다. (${response.status})`
          );
        }

        alert("입찰 공고가 성공적으로 삭제되었습니다.");
        navigate("/biddings");
      } catch (error) {
        console.error("입찰 공고 삭제 중 오류:", error);
        alert(`오류가 발생했습니다: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 상태 변경 다이얼로그 열기
  const handleOpenStatusChange = () => {
    setStatusChangeDialog({
      open: true,
      newStatus: bidding.status?.childCode || "PENDING",
      reason: ""
    });
  };

  // 상태 변경 다이얼로그 닫기
  const handleCloseStatusChange = () => {
    setStatusChangeDialog({
      ...statusChangeDialog,
      open: false
    });
  };

  // 상태 변경 제출
  const handleStatusChangeSubmit = async () => {
    try {
      setIsLoading(true);

      const response = await fetchWithAuth(`${API_URL}biddings/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: statusChangeDialog.newStatus,
          reason: statusChangeDialog.reason
        })
      });

      if (!response.ok) {
        throw new Error(`상태 변경에 실패했습니다. (${response.status})`);
      }

      const updatedBidding = await response.json();
      setBidding(updatedBidding);

      // 상태 이력 다시 가져오기
      fetchStatusHistories(id);

      alert("상태가 성공적으로 변경되었습니다.");
      handleCloseStatusChange();
    } catch (error) {
      console.error("상태 변경 중 오류:", error);
      alert(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 공급자 평가 제출 핸들러
  const handleEvaluationSubmit = async (evaluationData) => {
    try {
      const response = await fetchWithAuth(`${API_URL}biddings/evaluations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
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

  // 평가 완료 후 자동 낙찰자 선정 로직 추가
  const handleEvaluationComplete = async (evaluation) => {
    try {
      // 1. 평가 데이터를 서버에 저장
      const savedEvaluation = await handleEvaluationSubmit(evaluation);

      // 2. 평가 완료 후 참여 목록 업데이트
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

      // 3. 모든 평가가 완료되었는지 확인하고, 최고 점수 낙찰자 자동 선정
      const allEvaluated = participations.every((p) =>
        p.id === evaluation.biddingParticipationId ? true : p.isEvaluated
      );

      if (allEvaluated) {
        // 평가 목록 다시 가져오기
        const evaluationsResponse = await fetchWithAuth(
          `${API_URL}biddings/evaluations/by-bidding/${id}`
        );
        if (evaluationsResponse.ok) {
          const evaluationsData = await evaluationsResponse.json();

          // 최고 점수 찾기
          if (evaluationsData.length > 0) {
            const highestScoreEval = evaluationsData.reduce((prev, current) =>
              prev.totalScore > current.totalScore ? prev : current
            );

            // 최고 점수 낙찰자 선정 API 호출
            await fetchWithAuth(
              `${API_URL}biddings/orders/evaluation/${highestScoreEval.id}/select-bidder`,
              { method: "PUT" }
            );

            // 낙찰자 상태 업데이트를 위해 데이터 다시 가져오기
            fetchBiddingDetail();
          }
        }
      }

      return savedEvaluation;
    } catch (error) {
      console.error("평가 처리 중 오류:", error);
      throw error;
    }
  };

  // 발주 생성 핸들러
  const handleOrder = async (evaluationId) => {
    try {
      setIsLoading(true);

      // 해당 평가 정보 가져오기
      const evaluationResponse = await fetchWithAuth(
        `${API_URL}biddings/evaluations/${evaluationId}`
      );
      if (!evaluationResponse.ok) {
        throw new Error(
          `평가 정보를 가져오는데 실패했습니다. (${evaluationResponse.status})`
        );
      }
      const evaluationData = await evaluationResponse.json();

      // 참여 정보 찾기
      const participation = participations.find(
        (p) => p.id === evaluationData.biddingParticipationId
      );
      if (!participation) {
        throw new Error(`참여 정보를 찾을 수 없습니다.`);
      }

      // 발주 생성 데이터 준비
      const orderData = prepareOrderData(
        bidding,
        evaluationData,
        participation
      );

      // 발주 생성 API 호출
      const response = await fetchWithAuth(`${API_URL}biddings/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error(`발주 생성에 실패했습니다. (${response.status})`);
      }

      const orderResult = await response.json();

      // 성공 알림
      alert("발주가 성공적으로 생성되었습니다.");

      // 데이터 다시 불러오기 (발주 상태 업데이트를 위해)
      fetchBiddingDetail();
    } catch (error) {
      console.error("발주 생성 중 오류:", error);
      alert(`발주 생성 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 파일 다운로드 핸들러 추가
  const handleFileDownload = async (filename) => {
    try {
      // 파일 다운로드 API 요청
      const response = await fetchWithAuth(
        `${API_URL}biddings/download-file?filename=${encodeURIComponent(
          filename
        )}`,
        { method: "GET" }
      );

      if (!response.ok) {
        throw new Error("파일을 다운로드할 수 없습니다.");
      }

      // Blob으로 변환 및 다운로드
      const blob = await response.blob();

      // file-saver 사용
      saveAs(blob, filename);
    } catch (error) {
      console.error("파일 다운로드 중 오류:", error);
      alert("파일을 다운로드할 수 없습니다.");
    }
  };

  // 수정 버튼 핸들러 추가
  const handleEdit = () => {
    navigate(`/biddings/${id}/edit`);
  };

  // 목록으로 돌아가기 핸들러 추가
  const handleBack = () => {
    navigate("/biddings");
  };

  // 숫자 값 안전하게 표시
  const formatNumber = (value) => {
    if (value === null || value === undefined) return "0";
    if (typeof value === "string") {
      if (value.includes(",")) return value;
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
        <Button variant="contained" onClick={handleBack}>
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
        <Button variant="contained" onClick={handleBack}>
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
          <Button
            variant="outlined"
            onClick={handleOpenStatusChange}
            sx={{ mr: 1 }}>
            상태 변경
          </Button>
          <Button variant="outlined" onClick={handleBack} sx={{ mr: 1 }}>
            목록으로
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleEdit}
            sx={{ mr: 1 }}>
            수정
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
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
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              입찰 방식
            </Typography>
            <Typography variant="body1">{bidding.bidMethod}</Typography>
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
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          첨부 파일
        </Typography>
        {bidding.filePath ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body1">{bidding.filePath}</Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleFileDownload(bidding.filePath)}
              startIcon={<DownloadIcon />}>
              다운로드
            </Button>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            첨부된 파일이 없습니다.
          </Typography>
        )}
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
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 4
                  }}>
                  <Typography variant="h4">입찰 공고 상세</Typography>
                  <Box>
                    <Button
                      variant="outlined"
                      onClick={handleOpenStatusChange}
                      sx={{ mr: 1 }}>
                      상태 변경
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleVendorSelection}
                      sx={{ mr: 1 }}>
                      공급자 선정
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleBack}
                      sx={{ mr: 1 }}>
                      목록으로
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleEdit}
                      sx={{ mr: 1 }}>
                      수정
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleDelete}>
                      삭제
                    </Button>
                  </Box>
                </Box>
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
                      {/* 입찰 방식에 따른 평가 버튼 조건 */}
                      {((bidding.bidMethod === "정가제안" &&
                        participation.isConfirmed) ||
                        bidding.bidMethod === "가격제안") && (
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
                      )}

                      {/* 입찰 프로세스 액션 버튼들 */}
                      <section className="bidding-actions">
                        {canParticipateInBidding(
                          bidding,
                          userRole,
                          userSupplierInfo
                        ) && (
                          <button onClick={handleParticipate}>입찰 참여</button>
                        )}

                        {canSelectWinner(bidding, userRole) && (
                          <button onClick={handleSelectWinner}>
                            낙찰자 선정
                          </button>
                        )}

                        {canCreateOrder(bidding, userRole) && (
                          <button onClick={handleCreateOrder}>발주 생성</button>
                        )}

                        {canCreateContractDraft(bidding, userRole) && (
                          <button onClick={handleCreateContractDraft}>
                            계약 초안 생성
                          </button>
                        )}

                        {bidding.participations?.map(
                          (participation) =>
                            canEvaluateParticipation(bidding, userRole) && (
                              <button
                                key={participation.id}
                                onClick={() =>
                                  handleEvaluateParticipation(participation.id)
                                }>
                                {participation.companyName} 평가
                              </button>
                            )
                        )}
                      </section>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body1">
            아직 입찰 참여 공급자가 없습니다.
          </Typography>
        )}
      </Paper>

      {/* 상태 변경 이력 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          상태 변경 이력
        </Typography>
        {statusHistories.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>이전 상태</TableCell>
                  <TableCell>현재 상태</TableCell>
                  <TableCell>변경 사유</TableCell>
                  <TableCell>변경자</TableCell>
                  <TableCell>변경일시</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statusHistories.map((history) => (
                  <TableRow key={history.id}>
                    <TableCell>{getStatusText(history.fromStatus)}</TableCell>
                    <TableCell>{getStatusText(history.toStatus)}</TableCell>
                    <TableCell>{history.reason || "-"}</TableCell>
                    <TableCell>{history.changedBy?.username || "-"}</TableCell>
                    <TableCell>
                      {history.changedAt
                        ? new Date(history.changedAt).toLocaleString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body1">상태 변경 이력이 없습니다.</Typography>
        )}
      </Paper>

      {/* 상태 변경 다이얼로그 */}
      <Dialog open={statusChangeDialog.open} onClose={handleCloseStatusChange}>
        <DialogTitle>입찰 공고 상태 변경</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel id="new-status-label">새 상태</InputLabel>
            <Select
              labelId="new-status-label"
              value={statusChangeDialog.newStatus}
              label="새 상태"
              onChange={(e) =>
                setStatusChangeDialog({
                  ...statusChangeDialog,
                  newStatus: e.target.value
                })
              }>
              <MenuItem value="PENDING">대기중</MenuItem>
              <MenuItem value="ONGOING">진행중</MenuItem>
              <MenuItem value="CLOSED">마감</MenuItem>
              <MenuItem value="CANCELED">취소</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="normal"
            label="변경 사유"
            fullWidth
            multiline
            rows={4}
            value={statusChangeDialog.reason}
            onChange={(e) =>
              setStatusChangeDialog({
                ...statusChangeDialog,
                reason: e.target.value
              })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusChange}>취소</Button>
          <Button
            onClick={handleStatusChangeSubmit}
            variant="contained"
            color="primary">
            변경
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

export default BiddingDetailPage;
