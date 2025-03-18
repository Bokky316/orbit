import React, { useState, useEffect } from "react";
import { API_URL } from "@/utils/constants";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  FormControl,
  InputLabel,
  InputAdornment,
  Select,
  MenuItem,
  Box,
  Typography,
  Grid,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent
} from "@mui/material";
import Pagination from "@mui/material/Pagination";
import { styled } from "@mui/material/styles";
import moment from "moment";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import SearchIcon from "@mui/icons-material/Search";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ClearIcon from "@mui/icons-material/Clear";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
// 헬퍼 함수 import
import { getStatusText } from "./helpers/commonBiddingHelpers";

function BiddingListPage() {
  // 상태 관리
  const [biddings, setBiddings] = useState([]);
  const [filteredBiddings, setFilteredBiddings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null
  });
  const [paginationModel, setPaginationModel] = useState({
    page: 1,
    pageSize: 10
  });

  const navigate = useNavigate();

  // 입찰 공고 목록 가져오기
  const fetchBiddings = async () => {
    setLoading(true);
    setError(null);

    try {
      // 쿼리 파라미터 구성
      const queryParams = new URLSearchParams({
        page: paginationModel.page - 1,
        size: paginationModel.pageSize
      });

      // 상태 필터 추가
      if (statusFilter) {
        queryParams.append("statusCode", statusFilter);
      }

      // 날짜 필터 추가
      if (dateRange.start) {
        queryParams.append(
          "startDate",
          moment(dateRange.start).format("YYYY-MM-DD")
        );
      }
      if (dateRange.end) {
        queryParams.append(
          "endDate",
          moment(dateRange.end).format("YYYY-MM-DD")
        );
      }

      // 검색어 추가
      if (searchTerm) {
        queryParams.append("keyword", searchTerm);
      }

      // API 호출
      const response = await fetchWithAuth(
        `${API_URL}biddings?${queryParams.toString()}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! Status: ${response.status}, Body: ${errorText}`
        );
      }

      const data = await response.json();
      console.log("API 응답 데이터:", data);

      // 데이터 구조 처리
      const biddingList = Array.isArray(data) ? data : data.content || [];
      const totalElements = Array.isArray(data)
        ? biddingList.length
        : data.totalElements || biddingList.length;
      const totalPages = Array.isArray(data)
        ? Math.ceil(biddingList.length / paginationModel.pageSize)
        : data.totalPages ||
          Math.ceil(totalElements / paginationModel.pageSize);

      setBiddings(biddingList);
      setFilteredBiddings(biddingList);
      setTotalRows(totalElements);
      setTotalPages(totalPages);
    } catch (error) {
      console.error("입찰 공고 목록 가져오기 실패:", error.message);
      setError(
        "입찰 공고 목록을 불러오는 중 오류가 발생했습니다. " + error.message
      );

      setBiddings([]);
      setFilteredBiddings([]);
      setTotalRows(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // 페이지 로드 시 데이터 가져오기
  useEffect(() => {
    fetchBiddings();
  }, [paginationModel.page, paginationModel.pageSize]);

  // 필터 적용 시 데이터 다시 가져오기
  const handleSearch = () => {
    setPaginationModel((prev) => ({ ...prev, page: 1 }));
    fetchBiddings();
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDateRange({
      start: null,
      end: null
    });
    setPaginationModel({
      page: 1,
      pageSize: 10
    });
    // 초기화 후 데이터 다시 가져오기
    setTimeout(fetchBiddings, 0);
  };

  // 상태 변경 핸들러
  function handleStatusChange(event) {
    setStatusFilter(event.target.value);
  }

  // 날짜 변경 핸들러
  function handleDateChange(field, date) {
    setDateRange((prev) => ({
      ...prev,
      [field]: date
    }));
  }

  // 페이지 변경 핸들러
  const handlePageChange = (event, value) => {
    setPaginationModel((prev) => ({
      ...prev,
      page: value
    }));
  };

  // 상세보기 핸들러
  function handleViewDetail(id) {
    try {
      console.log(`입찰 공고 상세 페이지로 이동 - ID: ${id}`);
      navigate(`/biddings/${id}`);
    } catch (error) {
      console.error("상세 페이지 이동 중 오류:", error);
    }
  }

  // 새 입찰 등록 페이지로 이동
  function handleCreateBidding() {
    navigate("/biddings/new");
  }

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

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        입찰 공고 리스트
      </Typography>

      {/* 필터 영역 */}
      <Card elevation={2} sx={{ marginBottom: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="검색어를 입력하세요"
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
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel id="status-select-label">상태</InputLabel>
                <Select
                  labelId="status-select-label"
                  value={statusFilter}
                  label="상태"
                  onChange={handleStatusChange}>
                  <MenuItem value="">전체</MenuItem>
                  <MenuItem value="PENDING">대기중</MenuItem>
                  <MenuItem value="ONGOING">진행중</MenuItem>
                  <MenuItem value="CLOSED">마감</MenuItem>
                  <MenuItem value="CANCELED">취소</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                  label="시작일"
                  value={dateRange.start}
                  onChange={(newDate) => handleDateChange("start", newDate)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: false,
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarMonthIcon color="action" />
                          </InputAdornment>
                        )
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={2}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                  label="종료일"
                  value={dateRange.end}
                  onChange={(newDate) => handleDateChange("end", newDate)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: false,
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarMonthIcon color="action" />
                          </InputAdornment>
                        )
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid
              item
              xs={12}
              md={3}
              sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Tooltip title="필터 초기화">
                <span
                  onClick={handleResetFilters}
                  sx={{ border: "1px solid #e0e0e0", borderRadius: 2 }}>
                  <RestartAltIcon />
                </span>
              </Tooltip>

              <Button
                variant="outlinedThick"
                color="primary"
                onClick={handleSearch}>
                검색
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 에러 메시지 */}
      {error && (
        <Typography color="error" sx={{ my: 2 }}>
          {error}
        </Typography>
      )}

      {/* 로딩 상태 */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        /* 테이블 영역 */
        <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
          <StyledTableContainer>
            <Table stickyHeader aria-label="입찰 공고 목록 테이블">
              <TableHead>
                <TableRow>
                  <TableCell>구매요청번호</TableCell>
                  <TableCell>공고번호</TableCell>
                  <TableCell>공고명</TableCell>
                  <TableCell>공고기간</TableCell>
                  <TableCell>품목</TableCell>
                  <TableCell>금액</TableCell>
                  <TableCell>공고상태</TableCell>
                  <TableCell>마감</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBiddings.length > 0 ? (
                  filteredBiddings.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.purchaseRequestId || "-"}</TableCell>
                      <TableCell>{item.bidNumber}</TableCell>
                      <TableCell>
                        <Typography
                          component="a"
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleViewDetail(item.id);
                          }}
                          sx={{
                            textDecoration: "none",
                            color: "blue",
                            "&:hover": {
                              textDecoration: "underline"
                            }
                          }}>
                          {item.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {item.startDate
                          ? new Date(item.startDate).toLocaleDateString()
                          : "-"}{" "}
                        ~
                        {item.endDate
                          ? new Date(item.endDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>{item.itemName || "-"}</TableCell>
                      <TableCell align="right">
                        {Number(item.totalAmount).toLocaleString()}원
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(item.status)}
                          color={
                            item.status?.childCode === "PENDING"
                              ? "default"
                              : item.status?.childCode === "ONGOING"
                              ? "primary"
                              : item.status?.childCode === "CLOSED"
                              ? "success"
                              : item.status?.childCode === "CANCELED"
                              ? "error"
                              : "default"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {item.endDate
                          ? new Date(item.endDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </StyledTableContainer>

          {/* 하단 버튼 및 페이지네이션 */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2
            }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleCreateBidding}>
              신규등록
            </Button>

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
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
          </Box>
        </Paper>
      )}
    </Box>
  );
}

export default BiddingListPage;
