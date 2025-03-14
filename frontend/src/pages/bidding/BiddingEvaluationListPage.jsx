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
  TextField,
  InputAdornment,
  Chip
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

function BiddingEvaluationListPage() {
  const navigate = useNavigate();

  // 상태 관리
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // 임의의 구매요청 리스트 샘플 데이터
  const samplePurchaseRequests = [
    {
      id: 1001,
      purchaseRequestId: "PR-2025-0001",
      bidNumber: "BID-2025-0042",
      title: "서버 장비 구매",
      description: "데이터 센터 확장을 위한 서버 장비 구매",
      bidMethod: "가격제안",
      startDate: "2025-02-10",
      endDate: "2025-03-10",
      totalAmount: 50000000,
      evaluationCount: 3,
      participationCount: 5
    },
    {
      id: 1002,
      purchaseRequestId: "PR-2025-0008",
      bidNumber: "BID-2025-0098",
      title: "개발자용 노트북 구매",
      description: "신규 입사자 및 노후장비 교체용 노트북 구매",
      bidMethod: "정가제안",
      startDate: "2025-02-15",
      endDate: "2025-03-05",
      totalAmount: 35000000,
      evaluationCount: 2,
      participationCount: 3
    },
    {
      id: 1003,
      purchaseRequestId: "PR-2025-0015",
      bidNumber: "BID-2025-0127",
      title: "사무용 가구 구매",
      description: "신규 사무실 구축을 위한 사무용 가구 구매",
      bidMethod: "가격제안",
      startDate: "2025-03-01",
      endDate: "2025-03-20",
      totalAmount: 15000000,
      evaluationCount: 1,
      participationCount: 4
    },
    {
      id: 1004,
      purchaseRequestId: "PR-2025-0023",
      bidNumber: "BID-2025-0156",
      title: "네트워크 장비 업그레이드",
      description: "네트워크 인프라 개선을 위한 장비 업그레이드",
      bidMethod: "정가제안",
      startDate: "2025-02-28",
      endDate: "2025-03-18",
      totalAmount: 25000000,
      evaluationCount: 4,
      participationCount: 4
    },
    {
      id: 1005,
      purchaseRequestId: "PR-2025-0031",
      bidNumber: "BID-2025-0189",
      title: "클라우드 서비스 도입",
      description: "하이브리드 클라우드 인프라 구축을 위한 서비스 도입",
      bidMethod: "가격제안",
      startDate: "2025-03-05",
      endDate: "2025-03-25",
      totalAmount: 60000000,
      evaluationCount: 0,
      participationCount: 2
    }
  ];

  // 컴포넌트 마운트시 샘플 데이터 로드
  useEffect(() => {
    setEvaluations(samplePurchaseRequests);
  }, []);

  // 필터링된 데이터
  const filteredEvaluations = evaluations.filter((evaluation) => {
    const searchText = searchTerm.toLowerCase();

    return (
      (evaluation.purchaseRequestId &&
        evaluation.purchaseRequestId.toLowerCase().includes(searchText)) ||
      (evaluation.bidNumber &&
        evaluation.bidNumber.toLowerCase().includes(searchText)) ||
      (evaluation.title && evaluation.title.toLowerCase().includes(searchText))
    );
  });

  // 테이블 행 클릭 핸들러
  const handleRowClick = (biddingId) => {
    navigate(`/biddings/evaluations/${biddingId}`);
  };

  // 평가 기간 포맷팅 함수
  const formatBiddingPeriod = (startDate, endDate) => {
    if (!startDate || !endDate) return "-";
    return `${startDate} ~ ${endDate}`;
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
        <Button variant="contained" onClick={() => setError(null)}>
          다시 시도
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        협력사 평가 목록
      </Typography>

      {/* 검색 필드 */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="구매요청번호, 공고번호, 공고명으로 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {/* 평가 목록 테이블 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell>구매요청번호</TableCell>
              <TableCell>공고번호</TableCell>
              <TableCell>공고명</TableCell>
              <TableCell>입찰방식</TableCell>
              <TableCell>공고기간</TableCell>
              <TableCell>평가현황</TableCell>
              <TableCell>상태</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEvaluations.length > 0 ? (
              filteredEvaluations.map((evaluation) => {
                // 평가 상태에 따른 색상 및 텍스트
                const evaluationStatus =
                  evaluation.evaluationCount === 0
                    ? "미평가"
                    : evaluation.evaluationCount ===
                      evaluation.participationCount
                    ? "평가완료"
                    : "평가중";

                const statusColor =
                  evaluationStatus === "미평가"
                    ? "default"
                    : evaluationStatus === "평가완료"
                    ? "success"
                    : "warning";

                return (
                  <TableRow
                    key={evaluation.id}
                    hover
                    onClick={() => handleRowClick(evaluation.id)}
                    sx={{ cursor: "pointer" }}>
                    <TableCell>{evaluation.purchaseRequestId}</TableCell>
                    <TableCell>{evaluation.bidNumber}</TableCell>
                    <TableCell>{evaluation.title}</TableCell>
                    <TableCell>{evaluation.bidMethod}</TableCell>
                    <TableCell>
                      {formatBiddingPeriod(
                        evaluation.startDate,
                        evaluation.endDate
                      )}
                    </TableCell>
                    <TableCell>
                      {evaluation.evaluationCount}/
                      {evaluation.participationCount}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={evaluationStatus}
                        color={statusColor}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  평가 정보가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default BiddingEvaluationListPage;
