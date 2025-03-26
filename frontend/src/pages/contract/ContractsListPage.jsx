import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Button,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Pagination
} from "@mui/material";
import { styled } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ClearIcon from "@mui/icons-material/Clear";
import moment from "moment";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

function ContractsListPage() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [signatureFilter, setSignatureFilter] = useState("");
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null
  });
  const [paginationModel, setPaginationModel] = useState({
    page: 1,
    pageSize: 10
  });
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 계약 목록 가져오기
  const fetchContracts = async () => {
    setLoading(true);
    setError(null);
    try {
      // 기본 API 경로
      let apiUrl = `${API_URL}bidding-contracts`;

      // 상태 필터가 있는 경우 API 경로 변경
      if (statusFilter) {
        apiUrl = `${API_URL}bidding-contracts/status/${statusFilter}`;
      }

      console.log("API 요청 URL:", apiUrl);

      const response = await fetchWithAuth(apiUrl);

      if (!response.ok) {
        throw new Error("계약 목록을 불러오는 데 실패했습니다.");
      }

      const data = await response.json();
      console.log("계약 목록 데이터:", data);

      // 전체 계약 데이터 저장
      setContracts(data);

      // 필터링 로직 적용
      let filtered = [...data];

      // 서명 상태 필터 적용
      if (signatureFilter) {
        filtered = filtered.filter(
          (contract) => contract.signatureStatus === signatureFilter
        );
      }

      // 검색어 필터 적용
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (contract) =>
            (contract.transactionNumber &&
              contract.transactionNumber.toLowerCase().includes(term)) ||
            (contract.supplierName &&
              contract.supplierName.toLowerCase().includes(term)) ||
            (contract.biddingNumber &&
              contract.biddingNumber.toLowerCase().includes(term)) ||
            (contract.title && contract.title.toLowerCase().includes(term))
        );
      }

      // 정렬: 최신 계약이 상위에 표시
      filtered.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      setFilteredContracts(filtered);
      setTotalRows(filtered.length);
      setTotalPages(Math.ceil(filtered.length / paginationModel.pageSize));
      setLoading(false);
    } catch (err) {
      console.error("계약 목록 가져오기 실패:", err);
      setError(`계약 목록을 불러오는 중 오류가 발생했습니다: ${err.message}`);
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchContracts();
  }, []);

  // 필터 적용 시 데이터 다시 가져오기
  const handleSearch = () => {
    setPaginationModel((prev) => ({ ...prev, page: 1 }));
    fetchContracts();
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setSignatureFilter("");
    setDateRange({
      start: null,
      end: null
    });
    setPaginationModel({
      page: 1,
      pageSize: 10
    });
    setTimeout(fetchContracts, 0);
  };

  // 상태 변경 핸들러
  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
  };

  // 서명 상태 변경 핸들러
  const handleSignatureStatusChange = (event) => {
    setSignatureFilter(event.target.value);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (event, value) => {
    setPaginationModel((prev) => ({
      ...prev,
      page: value
    }));
  };

  // 계약 상세 페이지로 이동
  const handleViewContract = (contractId) => {
    navigate(`/contracts/${contractId}`);
  };

  // 계약서 다운로드
  const handleDownloadContract = async (contractId, transactionNumber) => {
    try {
      setLoading(true);

      const response = await fetchWithAuth(
        `${API_URL}bidding-contracts/${contractId}/download`,
        {
          method: "GET",
          headers: {
            Accept: "application/pdf"
          }
        }
      );

      if (!response.ok) {
        throw new Error("계약서 다운로드에 실패했습니다.");
      }

      // 응답 blob 형태로 변환
      const blob = await response.blob();

      // 다운로드 링크 생성
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `계약서_${transactionNumber || contractId}.pdf`;
      document.body.appendChild(a);
      a.click();

      // 링크 정리
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setLoading(false);
      }, 100);
    } catch (err) {
      console.error("계약서 다운로드 오류:", err);
      alert(`계약서 다운로드 중 오류가 발생했습니다: ${err.message}`);
      setLoading(false);
    }
  };

  // 계약 상태에 따른 색상
  const getStatusColor = (status) => {
    switch (status) {
      case "DRAFT":
        return "default";
      case "IN_PROGRESS":
        return "warning";
      case "ACTIVE":
        return "success";
      case "CLOSED":
        return "info";
      case "CANCELED":
        return "error";
      default:
        return "default";
    }
  };

  // 서명 상태에 따른 색상
  const getSignatureStatusColor = (status) => {
    switch (status) {
      case "NONE":
        return "default";
      case "PARTIAL":
        return "warning";
      case "COMPLETED":
        return "success";
      default:
        return "default";
    }
  };

  // 상태 표시 텍스트 변환
  const getStatusDisplayText = (status) => {
    switch (status) {
      case "DRAFT":
        return "초안";
      case "IN_PROGRESS":
        return "서명중";
      case "ACTIVE":
        return "활성";
      case "CLOSED":
        return "완료";
      case "CANCELED":
        return "취소";
      default:
        return status || "알 수 없음";
    }
  };

  // 서명 상태 표시 텍스트 변환
  const getSignatureStatusDisplayText = (status) => {
    switch (status) {
      case "NONE":
        return "미서명";
      case "PARTIAL":
        return "내부서명";
      case "COMPLETED":
        return "완료";
      default:
        return status || "알 수 없음";
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return moment(dateString).format("YYYY-MM-DD");
  };

  // 금액 포맷팅
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "-";
    return amount.toLocaleString() + "원";
  };

  // 스티키 헤더를 위한 스타일링된 TableContainer
  const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    maxHeight: 600,
    "& .MuiTableHead-root": {
      position: "sticky",
      top: 0,
      backgroundColor: theme.palette.background.paper,
      zIndex: 1
    }
  }));

  // 현재 페이지에 표시할 데이터 계산
  const startIndex = (paginationModel.page - 1) * paginationModel.pageSize;
  const endIndex = startIndex + paginationModel.pageSize;
  const paginatedContracts = filteredContracts.slice(startIndex, endIndex);

  if (loading && contracts.length === 0) {
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
          계약 목록을 불러오는 중...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3
        }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            계약 관리
          </Typography>
          <Typography variant="body1" color="text.secondary">
            계약 목록을 확인하고 관리하세요.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate("/biddings")}>
            입찰 목록으로
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 필터 영역 */}
      <Card elevation={2} sx={{ marginBottom: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4} className="search_box">
              <TextField
                fullWidth
                variant="outlined"
                className="search-input"
                placeholder="계약번호, 공급업체, 제목 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchTerm("")}
                        aria-label="검색어 지우기">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel id="status-select-label">계약 상태</InputLabel>
                <Select
                  labelId="status-select-label"
                  value={statusFilter}
                  label="계약 상태"
                  onChange={handleStatusChange}>
                  <MenuItem value="">전체</MenuItem>
                  <MenuItem value="DRAFT">초안</MenuItem>
                  <MenuItem value="IN_PROGRESS">서명중</MenuItem>
                  <MenuItem value="ACTIVE">활성</MenuItem>
                  <MenuItem value="CLOSED">완료</MenuItem>
                  <MenuItem value="CANCELED">취소</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel id="signature-select-label">서명 상태</InputLabel>
                <Select
                  labelId="signature-select-label"
                  value={signatureFilter}
                  label="서명 상태"
                  onChange={handleSignatureStatusChange}>
                  <MenuItem value="">전체</MenuItem>
                  <MenuItem value="NONE">미서명</MenuItem>
                  <MenuItem value="PARTIAL">내부서명</MenuItem>
                  <MenuItem value="COMPLETED">완료</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid
              item
              xs={12}
              md={4}
              sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Tooltip title="필터 초기화">
                <Button
                  className="restart_btn"
                  variant="outlined"
                  onClick={handleResetFilters}
                  startIcon={<RestartAltIcon />}>
                  초기화
                </Button>
              </Tooltip>

              <Button
                variant="contained"
                color="primary"
                onClick={handleSearch}>
                검색
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 테이블 영역 */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <StyledTableContainer>
          <Table stickyHeader aria-label="계약 목록 테이블">
            <TableHead>
              <TableRow>
                <TableCell>계약번호</TableCell>
                <TableCell>입찰번호</TableCell>
                <TableCell>계약명</TableCell>
                <TableCell>공급업체</TableCell>
                <TableCell>계약금액</TableCell>
                <TableCell>계약기간</TableCell>
                <TableCell>계약상태</TableCell>
                <TableCell>서명상태</TableCell>
                <TableCell>액션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedContracts.length > 0 ? (
                paginatedContracts.map((contract) => (
                  <TableRow key={contract.id} hover>
                    <TableCell>{contract.transactionNumber || "-"}</TableCell>
                    <TableCell>{contract.biddingNumber || "-"}</TableCell>
                    <TableCell>
                      <Typography
                        component="a"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewContract(contract.id);
                        }}
                        sx={{
                          textDecoration: "none",
                          color: "primary.main",
                          fontWeight: "medium",
                          "&:hover": {
                            textDecoration: "underline"
                          }
                        }}>
                        {contract.title}
                      </Typography>
                    </TableCell>
                    <TableCell>{contract.supplierName || "-"}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(contract.totalAmount)}
                    </TableCell>
                    <TableCell>
                      {formatDate(contract.startDate)} ~{" "}
                      {formatDate(contract.endDate)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusDisplayText(contract.status)}
                        color={getStatusColor(contract.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getSignatureStatusDisplayText(
                          contract.signatureStatus
                        )}
                        color={getSignatureStatusColor(
                          contract.signatureStatus
                        )}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="계약 상세 보기">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewContract(contract.id)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      {(contract.status === "ACTIVE" ||
                        contract.status === "CLOSED" ||
                        contract.signatureStatus === "COMPLETED") && (
                        <Tooltip title="계약서 다운로드">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() =>
                              handleDownloadContract(
                                contract.id,
                                contract.transactionNumber
                              )
                            }>
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    {searchTerm || statusFilter || signatureFilter
                      ? "검색 결과가 없습니다."
                      : "등록된 계약이 없습니다."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </StyledTableContainer>

        {/* 하단 페이지네이션 */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2
          }}>
          <Typography variant="body2" color="text.secondary">
            총 {totalRows}개 항목
          </Typography>

          <Pagination
            count={totalPages}
            page={paginationModel.page}
            onChange={handlePageChange}
            color="primary"
            size="medium"
            showFirstButton
            showLastButton
          />
        </Box>
      </Paper>
    </Box>
  );
}

export default ContractsListPage;
