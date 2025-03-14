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
  Select,
  MenuItem,
  Box,
  Typography,
  Grid,
  CircularProgress,
  Chip
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
// 헬퍼 함수 import
import { getStatusText } from "./helpers/commonBiddingHelpers";

function BiddingListPage() {
  // 상태 관리
  const [biddings, setBiddings] = useState([]);
  const [filteredBiddings, setFilteredBiddings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalRows, setTotalRows] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: ""
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
        queryParams.append("startDate", dateRange.start);
      }
      if (dateRange.end) {
        queryParams.append("endDate", dateRange.end);
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

      setBiddings(biddingList);
      setFilteredBiddings(biddingList);
      setTotalRows(totalElements);
    } catch (error) {
      console.error("입찰 공고 목록 가져오기 실패:", error.message);
      setError(
        "입찰 공고 목록을 불러오는 중 오류가 발생했습니다. " + error.message
      );

      setBiddings([]);
      setFilteredBiddings([]);
      setTotalRows(0);
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

  // 상태 변경 핸들러
  function handleStatusChange(event) {
    setStatusFilter(event.target.value);
  }

  // 날짜 변경 핸들러
  function handleDateChange(field, event) {
    const { value } = event.target;
    setDateRange((prev) => ({
      ...prev,
      [field]: value
    }));
  }

  // 상세보기 핸들러
  function handleViewDetail(id) {
    try {
      console.log(`입찰 공고 상세 페이지로 이동 - ID: ${id}`);

      // 상세 페이지에서 응답 처리를 담당하므로
      // 여기서는 단순히 페이지 이동만 수행
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
    maxHeight: 440,
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
      <Paper elevation={2} sx={{ padding: 2, marginBottom: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="검색어 입력"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel id="status-select-label">상태 선택</InputLabel>
              <Select
                labelId="status-select-label"
                value={statusFilter}
                label="상태 선택"
                onChange={handleStatusChange}>
                <MenuItem value="">전체</MenuItem>
                {/* 상태 코드 시스템 사용 */}
                <MenuItem value="PENDING">대기중</MenuItem>
                <MenuItem value="ONGOING">진행중</MenuItem>
                <MenuItem value="CLOSED">마감</MenuItem>
                <MenuItem value="CANCELED">취소</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="시작일"
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateChange("start", e)}
              InputLabelProps={{
                shrink: true
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="종료일"
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateChange("end", e)}
              InputLabelProps={{
                shrink: true
              }}
            />
          </Grid>

          <Grid
            item
            xs={12}
            md={3}
            sx={{ display: "flex", alignItems: "center" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              sx={{ height: "56px", marginRight: 1 }}>
              검색
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleCreateBidding}
              sx={{ height: "56px" }}>
              신규
            </Button>
          </Grid>
        </Grid>
      </Paper>

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
        <Paper>
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
        </Paper>
      )}

      {/* 페이징 정보 */}
      <Box
        sx={{
          mt: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
        <Typography>
          총 {totalRows}개 항목 중{" "}
          {totalRows > 0
            ? (paginationModel.page - 1) * paginationModel.pageSize + 1
            : 0}{" "}
          -
          {Math.min(paginationModel.page * paginationModel.pageSize, totalRows)}
        </Typography>

        <Box>
          <Button
            disabled={paginationModel.page === 1}
            onClick={() =>
              setPaginationModel((prev) => ({ ...prev, page: prev.page - 1 }))
            }>
            이전
          </Button>
          <Button
            disabled={
              paginationModel.page * paginationModel.pageSize >= totalRows
            }
            onClick={() =>
              setPaginationModel((prev) => ({ ...prev, page: prev.page + 1 }))
            }>
            다음
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default BiddingListPage;
