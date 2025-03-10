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
  TablePagination,
  Chip,
  Link,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

function BiddingEvaluationListPage() {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // 데이터 로딩
  const fetchEvaluations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 실제 API 호출
      const token = localStorage.getItem("authToken") || "temp-token";
      const response = await fetch(`/api/evaluations`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("평가 목록을 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      setEvaluations(data);
      setFilteredEvaluations(data);
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
      const mockEvaluations = [
        {
          id: 1,
          biddingParticipationId: 101,
          supplierName: "글로벌 IT 솔루션",
          bidNumber: "BID-2025-0042",
          biddingTitle: "개발자 PC 구매",
          totalScore: 4,
          evaluatedAt: "2025-03-07T14:32:11"
        },
        {
          id: 2,
          biddingParticipationId: 102,
          supplierName: "네트워크 시스템즈",
          bidNumber: "BID-2025-0042",
          biddingTitle: "개발자 PC 구매",
          totalScore: 5,
          evaluatedAt: "2025-03-08T09:15:23"
        },
        {
          id: 3,
          biddingParticipationId: 103,
          supplierName: "디지털 인프라 솔루션",
          bidNumber: "BID-2025-0039",
          biddingTitle: "서버 장비 구매",
          totalScore: 3,
          evaluatedAt: "2025-03-05T11:45:33"
        }
      ];

      setEvaluations(mockEvaluations);
      setFilteredEvaluations(mockEvaluations);
      setIsLoading(false);
    }, 1000);
  };

  // 초기 데이터 로딩
  useEffect(() => {
    // 실제 API 호출 (개발 완료 후 주석 해제)
    // fetchEvaluations();

    // 테스트 목적의 목업 데이터 (개발 시에만 사용)
    loadMockData();
  }, []);

  // 검색 처리
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredEvaluations(evaluations);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = evaluations.filter(
        (evaluation) =>
          evaluation.supplierName.toLowerCase().includes(lowercaseQuery) ||
          evaluation.bidNumber.toLowerCase().includes(lowercaseQuery) ||
          evaluation.biddingTitle.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredEvaluations(filtered);
    }
    setPage(0);
  }, [searchQuery, evaluations]);

  // 페이지 변경 핸들러
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경 핸들러
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 점수에 따른 색상 반환
  const getScoreColor = (score) => {
    if (score >= 4) return "success";
    if (score >= 3) return "warning";
    return "error";
  };

  // 평가 상세 페이지로 이동
  const handleEvaluationClick = (evaluationId) => {
    navigate(`/evaluations/${evaluationId}`);
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
          onClick={fetchEvaluations}
          startIcon={<RefreshIcon />}
          sx={{ mt: 2 }}>
          다시 시도
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
        <Typography variant="h4">협력사 평가 목록</Typography>
      </Box>

      {/* 검색 및 필터링 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <TextField
            variant="outlined"
            placeholder="공급자, 입찰번호 검색..."
            size="small"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ maxWidth: 500 }}
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchEvaluations}
            sx={{ ml: 2 }}>
            새로고침
          </Button>
        </Box>
      </Paper>

      {/* 평가 목록 */}
      <Paper sx={{ width: "100%", mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>공급자</TableCell>
                <TableCell>입찰 번호</TableCell>
                <TableCell>입찰 제목</TableCell>
                <TableCell align="center">평가 점수</TableCell>
                <TableCell align="right">평가일</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEvaluations.length > 0 ? (
                filteredEvaluations
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((evaluation) => (
                    <TableRow
                      key={evaluation.id}
                      hover
                      onClick={() => handleEvaluationClick(evaluation.id)}
                      sx={{ cursor: "pointer" }}>
                      <TableCell>
                        <Link
                          component="button"
                          underline="hover"
                          color="primary">
                          {evaluation.supplierName}
                        </Link>
                      </TableCell>
                      <TableCell>{evaluation.bidNumber}</TableCell>
                      <TableCell>{evaluation.biddingTitle}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${evaluation.totalScore}점`}
                          color={getScoreColor(evaluation.totalScore)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {new Date(evaluation.evaluatedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    평가 데이터가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredEvaluations.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행 수:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} / ${count}`
          }
        />
      </Paper>
    </Box>
  );
}

export default BiddingEvaluationListPage;
