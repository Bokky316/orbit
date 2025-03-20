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
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Divider
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useSelector } from "react-redux";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

function SupplierContractsList() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // 상태 관리
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // 계약 목록 가져오기
  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWithAuth(`${API_URL}supplier/contracts`);

        if (!response.ok) {
          throw new Error(
            `계약 목록을 불러오는데 실패했습니다. (${response.status})`
          );
        }

        const data = await response.json();
        setContracts(data);
        setFilteredContracts(data);
      } catch (err) {
        console.error("계약 데이터 로드 중 오류:", err);
        setError("계약 목록을 불러오는 중 오류가 발생했습니다: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [refreshTrigger]);

  // 필터링 적용
  useEffect(() => {
    // 탭에 따른 필터링 (상태별)
    let statusFiltered = [...contracts];

    switch (tabValue) {
      case 0: // 전체
        break;
      case 1: // 대기중 (초안 + 서명중)
        statusFiltered = contracts.filter(
          (contract) =>
            contract.statusText === "DRAFT" ||
            contract.statusText === "IN_PROGRESS"
        );
        break;
      case 2: // 활성
        statusFiltered = contracts.filter(
          (contract) => contract.statusText === "CLOSED"
        );
        break;
      case 3: // 완료
        statusFiltered = contracts.filter(
          (contract) => contract.statusText === "COMPLETED"
        );
        break;
      case 4: // 취소
        statusFiltered = contracts.filter(
          (contract) => contract.statusText === "CANCELED"
        );
        break;
      default:
        break;
    }

    // 검색어 필터링
    let searchFiltered = statusFiltered;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      searchFiltered = statusFiltered.filter(
        (contract) =>
          (contract.transactionNumber &&
            contract.transactionNumber.toLowerCase().includes(term)) ||
          (contract.biddingNumber &&
            contract.biddingNumber.toLowerCase().includes(term)) ||
          (contract.itemName && contract.itemName.toLowerCase().includes(term))
      );
    }

    // 날짜 필터링
    let dateFiltered = searchFiltered;
    if (dateRange.start) {
      dateFiltered = dateFiltered.filter(
        (contract) =>
          contract.startDate && new Date(contract.startDate) >= dateRange.start
      );
    }
    if (dateRange.end) {
      dateFiltered = dateFiltered.filter(
        (contract) =>
          contract.endDate && new Date(contract.endDate) <= dateRange.end
      );
    }

    setFilteredContracts(dateFiltered);
  }, [contracts, tabValue, searchTerm, dateRange]);

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // 날짜 변경 핸들러
  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // 필터 초기화
  const handleClearFilters = () => {
    setSearchTerm("");
    setDateRange({ start: null, end: null });
    setTabValue(0);
  };

  // 새로고침 핸들러
  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // 계약 상세 페이지로 이동
  const handleViewContract = (contractId) => {
    navigate(`/supplier/contracts/${contractId}`);
  };

  // 계약서 다운로드
  const handleDownloadContract = async (contractId) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}supplier/contracts/${contractId}/download`,
        {
          method: "GET",
          headers: {
            Accept: "application/pdf"
          }
        }
      );

      if (!response.ok) {
        throw new Error(`계약서 다운로드에 실패했습니다. (${response.status})`);
      }

      // Blob으로 응답 데이터 가져오기
      const blob = await response.blob();

      // 다운로드 링크 생성
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `계약서_${contractId}.pdf`;
      document.body.appendChild(a);
      a.click();

      // 링크 정리
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 0);
    } catch (err) {
      console.error("계약서 다운로드 중 오류:", err);
      alert(`계약서 다운로드 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  // 계약 서명 필요 여부 확인
  const needsSignature = (contract) => {
    return contract.statusText === "IN_PROGRESS" && !contract.supplierSignature;
  };

  // 계약 서명 페이지로 이동
  const handleSignContract = (contractId) => {
    navigate(`/supplier/contracts/${contractId}`);
  };

  // 상태에 따른 색상
  const getStatusColor = (status) => {
    switch (status) {
      case "DRAFT":
        return "default";
      case "IN_PROGRESS":
        return "warning";
      case "CLOSED":
        return "success";
      case "COMPLETED":
        return "info";
      case "CANCELED":
        return "error";
      default:
        return "default";
    }
  };

  // 서명 상태에 따른 색상
  const getSignatureStatusColor = (contract) => {
    if (contract.buyerSignature && contract.supplierSignature) {
      return "success";
    } else if (contract.buyerSignature || contract.supplierSignature) {
      return "warning";
    } else {
      return "default";
    }
  };

  // 서명 상태 텍스트 변환
  const getSignatureStatusText = (contract) => {
    if (contract.buyerSignature && contract.supplierSignature) {
      return "양측 서명 완료";
    } else if (contract.buyerSignature) {
      return "구매자 서명 완료";
    } else if (contract.supplierSignature) {
      return "공급자 서명 완료";
    } else {
      return "미서명";
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  // 로딩 중일 때
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
          계약 정보를 불러오는 중...
        </Typography>
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
          mb: 3
        }}>
        <Typography variant="h4">내 계약 목록</Typography>
        <Box>
          <Tooltip title="새로고침">
            <IconButton onClick={handleRefresh} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={showFilters ? "필터 숨기기" : "필터 표시"}>
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              sx={{ mr: 1 }}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 필터 영역 */}
      {showFilters && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="계약번호 또는 입찰번호 검색"
                variant="outlined"
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setSearchTerm("")}
                        size="small">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="시작일"
                  value={dateRange.start}
                  onChange={(date) => handleDateChange("start", date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="종료일"
                  value={dateRange.end}
                  onChange={(date) => handleDateChange("end", date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                onClick={handleClearFilters}
                startIcon={<ClearIcon />}>
                필터 초기화
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* 탭 영역 */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto">
          <Tab label="전체" />
          <Tab label="진행중" />
          <Tab label="활성" />
          <Tab label="완료" />
          <Tab label="취소" />
        </Tabs>
      </Box>

      {/* 계약 목록 */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>계약 번호</TableCell>
                <TableCell>입찰 번호</TableCell>
                <TableCell>품목</TableCell>
                <TableCell>계약일</TableCell>
                <TableCell align="center">계약 기간</TableCell>
                <TableCell align="center">계약 금액</TableCell>
                <TableCell align="center">상태</TableCell>
                <TableCell align="center">서명 상태</TableCell>
                <TableCell align="center">작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    데이터 로딩 중...
                  </TableCell>
                </TableRow>
              )}

              {!loading && filteredContracts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    조건에 맞는 계약이 없습니다.
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>{contract.transactionNumber}</TableCell>
                    <TableCell>{contract.biddingNumber || "-"}</TableCell>
                    <TableCell>{contract.itemName || "-"}</TableCell>
                    <TableCell>{formatDate(contract.createdAt)}</TableCell>
                    <TableCell align="center">
                      {formatDate(contract.startDate)} ~{" "}
                      {formatDate(contract.endDate)}
                    </TableCell>
                    <TableCell align="right">
                      {contract.totalAmount
                        ? contract.totalAmount.toLocaleString()
                        : 0}
                      원
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={contract.statusText}
                        color={getStatusColor(contract.statusText)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getSignatureStatusText(contract)}
                        color={getSignatureStatusColor(contract)}
                        size="small"
                        icon={
                          contract.buyerSignature &&
                          contract.supplierSignature ? (
                            <CheckCircleIcon />
                          ) : undefined
                        }
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Tooltip title="상세 보기">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewContract(contract.id)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {contract.statusText !== "DRAFT" && (
                          <Tooltip title="계약서 다운로드">
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() =>
                                handleDownloadContract(contract.id)
                              }>
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {needsSignature(contract) && (
                          <Tooltip title="서명하기">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleSignContract(contract.id)}>
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 요약 정보 */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                총 계약
              </Typography>
              <Typography variant="h4" color="primary">
                {contracts.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                서명 필요
              </Typography>
              <Typography variant="h4" color="warning.main">
                {
                  contracts.filter(
                    (c) =>
                      c.statusText === "IN_PROGRESS" && !c.supplierSignature
                  ).length
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                활성 계약
              </Typography>
              <Typography variant="h4" color="success.main">
                {contracts.filter((c) => c.statusText === "CLOSED").length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                완료된 계약
              </Typography>
              <Typography variant="h4" color="info.main">
                {contracts.filter((c) => c.statusText === "COMPLETED").length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default SupplierContractsList;
