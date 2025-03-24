import React, { useState, useEffect } from "react";
import { API_URL } from "@/utils/constants";
import { useNavigate } from "react-router-dom";
import useWebSocket from "@/hooks/useWebSocket";
import { useSelector } from "react-redux";
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
  CardContent,
  Alert,
  Snackbar
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
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
// 헬퍼 함수 import
import {
  getStatusText,
  getBidMethodText
} from "./helpers/commonBiddingHelpers";

// 빈 데이터용 목업 데이터
const MOCK_DATA = [
  {
    id: 1,
    bidNumber: "BID-230501-001",
    title: "서버 장비 구매",
    startDate: "2023-05-01",
    endDate: "2023-05-30",
    status: { childCode: "CLOSED" },
    totalAmount: 5000000,
    purchaseRequestId: "PR-23001",
    itemName: "서버 하드웨어"
  },
  {
    id: 2,
    bidNumber: "BID-230510-002",
    title: "사무용 소프트웨어 라이센스",
    startDate: "2023-05-10",
    endDate: "2023-06-10",
    status: { childCode: "ONGOING" },
    totalAmount: 3000000,
    purchaseRequestId: "PR-23005",
    itemName: "소프트웨어 라이센스"
  }
];

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
  const [useMockData, setUseMockData] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useSelector((state) => state.auth);
  const { sendStatusChange, isConnected } = useWebSocket(user);

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

      // 서버에 오류가 있을 때를 대비해 목업 데이터 사용 옵션
      if (useMockData) {
        // 목업 데이터 사용
        console.log("목업 데이터 사용 중");
        setTimeout(() => {
          const filteredMockData = MOCK_DATA.filter((item) => {
            let matches = true;

            // 상태 필터링
            if (statusFilter && item.status.childCode !== statusFilter) {
              matches = false;
            }

            // 검색어 필터링
            if (
              searchTerm &&
              !item.title.toLowerCase().includes(searchTerm.toLowerCase())
            ) {
              matches = false;
            }

            return matches;
          });

          setBiddings(filteredMockData);
          setFilteredBiddings(filteredMockData);
          setTotalRows(filteredMockData.length);
          setTotalPages(
            Math.ceil(filteredMockData.length / paginationModel.pageSize)
          );
          setLoading(false);
        }, 500); // 실제 API 호출을 시뮬레이션하기 위한 지연
        return;
      }

      // API 호출
      const response = await fetchWithAuth(
        `${API_URL}biddings?${queryParams.toString()}`
      );

      if (!response.ok) {
        const errorText = await response.text();

        // 500 에러가 발생하고 Hibernate 에러인 경우 목업 데이터로 전환
        if (
          response.status === 500 &&
          errorText.includes("ByteBuddyInterceptor")
        ) {
          console.warn("서버 직렬화 오류 감지, 목업 데이터로 전환합니다.");
          setUseMockData(true);
          setSnackbarMessage(
            "서버 오류로 인해 데모 데이터를 표시합니다. 새로고침 후 다시 시도해 주세요."
          );
          setSnackbarOpen(true);

          // 목업 데이터 설정
          setBiddings(MOCK_DATA);
          setFilteredBiddings(MOCK_DATA);
          setTotalRows(MOCK_DATA.length);
          setTotalPages(Math.ceil(MOCK_DATA.length / paginationModel.pageSize));
          setLoading(false);
          return;
        }

        throw new Error(
          `서버 오류가 발생했습니다. (${response.status}): ${errorText}`
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

      // 3번까지 재시도한 후 목업 데이터로 전환
      if (retryCount >= 2) {
        console.warn("API 호출 3회 실패, 목업 데이터를 사용합니다.");
        setUseMockData(true);
        setSnackbarMessage("서버 연결에 실패하여 데모 데이터를 표시합니다.");
        setSnackbarOpen(true);

        setBiddings(MOCK_DATA);
        setFilteredBiddings(MOCK_DATA);
        setTotalRows(MOCK_DATA.length);
        setTotalPages(Math.ceil(MOCK_DATA.length / paginationModel.pageSize));
      } else {
        // 재시도 횟수 증가
        setRetryCount((prev) => prev + 1);
        setBiddings([]);
        setFilteredBiddings([]);
        setTotalRows(0);
        setTotalPages(0);
      }
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

    // 웹소켓으로 상태 변경 알림 (선택사항)
    if (isConnected) {
      sendStatusChange("NEW_BIDDING_ID", "DRAFT", "PENDING");
    }
  }

  const WebSocketStatusIndicator = () => (
    <Box
      sx={{
        position: "fixed",
        bottom: 10,
        right: 10,
        p: 1,
        bgcolor: isConnected ? "success.light" : "error.light",
        color: "white",
        borderRadius: 2
      }}>
      {isConnected ? "실시간 연결됨" : "연결 끊김"}
    </Box>
  );

  // 상태에 따른 색상 반환
  const getStatusColor = (statusCode) => {
    switch (statusCode) {
      case "PENDING":
        return "default";
      case "ONGOING":
        return "primary";
      case "CLOSED":
        return "success";
      case "CANCELED":
        return "error";
      default:
        return "default";
    }
  };

  // 실제 API 재연결 시도
  const handleRetryConnection = () => {
    setUseMockData(false);
    setRetryCount(0);
    setSnackbarOpen(false);
    fetchBiddings();
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

  return (
    <Box sx={{ p: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4
        }}>
        <Typography variant="h4">입찰 공고 리스트</Typography>
        {/* 실시간 연결 상태 표시기 추가 - 테스트용*/}
        <WebSocketStatusIndicator />
        {useMockData && (
          <Button
            variant="outlined"
            color="warning"
            startIcon={<ErrorOutlineIcon />}
            onClick={handleRetryConnection}>
            서버 재연결 시도
          </Button>
        )}
      </Box>

      {/* 필터 영역 */}
      <Card elevation={2} sx={{ marginBottom: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3} className="search_box">
              <TextField
                fullWidth
                variant="outlined"
                className="search-input"
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
                        <ClearIcon />
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
                      error: false
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
                      error: false
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

      {/* 데모 데이터 알림 */}
      {useMockData && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRetryConnection}>
              재시도
            </Button>
          }>
          서버 연결 문제로 현재 데모 데이터를 표시하고 있습니다. 실제 데이터는
          백엔드 서버가 정상화된 후 표시됩니다.
        </Alert>
      )}

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
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
                  <TableCell>입찰방식</TableCell>
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
                            color: "primary.main",
                            fontWeight: "medium",
                            "&:hover": {
                              textDecoration: "underline"
                            }
                          }}>
                          {item.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {item.startDate
                          ? moment(item.startDate).format("YY-MM-DD")
                          : "-"}{" "}
                        ~{" "}
                        {item.endDate
                          ? moment(item.endDate).format("YY-MM-DD")
                          : "-"}
                      </TableCell>
                      <TableCell>{item.itemName || "-"}</TableCell>
                      <TableCell align="right">
                        {Number(item.totalAmount || 0).toLocaleString()}원
                      </TableCell>
                      <TableCell>{getBidMethodText(item.bidMethod)}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(item.status)}
                          color={getStatusColor(item.status?.childCode)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {item.endDate
                          ? moment(item.endDate).format("YY-MM-DD")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
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
              color="primary"
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

      {/* 알림 스낵바 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        action={
          <Button
            color="secondary"
            size="small"
            onClick={handleRetryConnection}>
            재시도
          </Button>
        }
      />
    </Box>
  );
}

export default BiddingListPage;
