import React, { useState, useEffect } from "react";
import { API_URL } from "../../constant";
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
  Divider,
  Card,
  CardContent
} from "@mui/material";
import { styled } from "@mui/material/styles";

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

function BiddingPriceTestPage() {
  // 상태 관리
  const [biddings, setBiddings] = useState([]);
  const [filteredBiddings, setFilteredBiddings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalRows, setTotalRows] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: ""
  });
  const [paginationModel, setPaginationModel] = useState({
    page: 1,
    pageSize: 10 // 페이지당 항목 수
  });

  // 테스트 데이터
  const testBiddings = [
    {
      id: 1,
      bidNumber: "BID-2023-0001",
      title: "컴퓨터 구매",
      startDate: "2023-07-01",
      endDate: "2023-07-15",
      itemName: "고성능 워크스테이션",
      unitPrice: 1000000,
      quantity: 10,
      supplyPrice: 10000000,
      vat: 1000000,
      totalAmount: 11000000,
      status: "진행중"
    },
    {
      id: 2,
      bidNumber: "BID-2023-0002",
      title: "서버 장비 구매",
      startDate: "2023-08-01",
      endDate: "2023-08-20",
      itemName: "서버 라우터",
      unitPrice: 5000000,
      quantity: 2,
      supplyPrice: 10000000,
      vat: 1000000,
      totalAmount: 11000000,
      status: "대기중"
    },
    {
      id: 3,
      bidNumber: "BID-2023-0003",
      title: "소프트웨어 라이센스",
      startDate: "2023-09-01",
      endDate: "2023-09-30",
      itemName: "오피스 라이센스",
      unitPrice: 200000,
      quantity: 50,
      supplyPrice: 10000000,
      vat: 1000000,
      totalAmount: 11000000,
      status: "대기중"
    },
    {
      id: 4,
      bidNumber: "BID-2023-0004",
      title: "사무용 가구",
      startDate: "2023-10-01",
      endDate: "2023-10-15",
      itemName: "모니터 스탠드",
      unitPrice: 300000,
      quantity: 20,
      supplyPrice: 6000000,
      vat: 600000,
      totalAmount: 6600000,
      status: "진행중"
    },
    {
      id: 5,
      bidNumber: "BID-2023-0005",
      title: "네트워크 장비",
      startDate: "2023-11-01",
      endDate: "2023-11-30",
      itemName: "네트워크 스위치",
      unitPrice: 450000,
      quantity: 15,
      supplyPrice: 6750000,
      vat: 675000,
      totalAmount: 7425000,
      status: "진행중"
    }
  ];

  const navigate = useNavigate();

  // 임시 데이터 로드
  useEffect(() => {
    // API 대신 테스트 데이터 사용
    setBiddings(testBiddings);
    setFilteredBiddings(testBiddings);
    setTotalRows(testBiddings.length);
  }, []);

  // 필터 적용
  const handleSearch = () => {
    let filtered = [...biddings];

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.bidNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (status) {
      filtered = filtered.filter((item) => item.status === status);
    }

    // 날짜 필터
    if (dateRange.start) {
      filtered = filtered.filter(
        (item) => new Date(item.startDate) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(
        (item) => new Date(item.endDate) <= new Date(dateRange.end)
      );
    }

    setFilteredBiddings(filtered);
    setTotalRows(filtered.length);
    setPaginationModel((prev) => ({ ...prev, page: 1 }));
  };

  // 상태 변경 핸들러
  function handleStatusChange(event) {
    setStatus(event.target.value);
  }

  // 날짜 변경 핸들러
  function handleDateChange(field, event) {
    const { value } = event.target;
    setDateRange((prev) => ({
      ...prev,
      [field]: value
    }));
  }

  // 금액 형식화 함수
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("ko-KR").format(value);
  };

  // 선택된 아이템의 상세 정보
  const [selectedItem, setSelectedItem] = useState(null);

  // 행 클릭 핸들러
  const handleRowClick = (item) => {
    setSelectedItem(item);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        입찰 공고 가격 계산 테스트
      </Typography>

      {/* 필터 영역 */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
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
              value={status}
              label="상태 선택"
              onChange={handleStatusChange}>
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="대기중">대기중</MenuItem>
              <MenuItem value="진행중">진행중</MenuItem>
              <MenuItem value="마감">마감</MenuItem>
              <MenuItem value="취소">취소</MenuItem>
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
            sx={{ height: "56px" }}>
            검색
          </Button>
        </Grid>
      </Grid>

      {/* 에러 메시지 */}
      {error && (
        <Typography color="error" sx={{ my: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={3}>
        {/* 테이블 영역 */}
        <Grid item xs={12} md={selectedItem ? 8 : 12}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper>
              <StyledTableContainer>
                <Table stickyHeader aria-label="입찰 공고 가격 테스트 테이블">
                  <TableHead>
                    <TableRow>
                      <TableCell>공고번호</TableCell>
                      <TableCell>공고명</TableCell>
                      <TableCell>품목</TableCell>
                      <TableCell>단가</TableCell>
                      <TableCell>수량</TableCell>
                      <TableCell>공급가액</TableCell>
                      <TableCell>부가세</TableCell>
                      <TableCell>총금액</TableCell>
                      <TableCell>상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredBiddings.length > 0 ? (
                      filteredBiddings.map((item) => (
                        <TableRow
                          key={item.id}
                          hover
                          onClick={() => handleRowClick(item)}
                          sx={{
                            cursor: "pointer",
                            backgroundColor:
                              selectedItem?.id === item.id
                                ? "#f5f5f5"
                                : "inherit"
                          }}>
                          <TableCell>{item.bidNumber}</TableCell>
                          <TableCell>{item.title}</TableCell>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.unitPrice)}원
                          </TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.supplyPrice)}원
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.vat)}원
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.totalAmount)}원
                          </TableCell>
                          <TableCell>{item.status}</TableCell>
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
              {(paginationModel.page - 1) * paginationModel.pageSize + 1} -
              {Math.min(
                paginationModel.page * paginationModel.pageSize,
                totalRows
              )}
            </Typography>

            <Box>
              <Button
                disabled={paginationModel.page === 1}
                onClick={() =>
                  setPaginationModel((prev) => ({
                    ...prev,
                    page: prev.page - 1
                  }))
                }>
                이전
              </Button>
              <Button
                disabled={
                  paginationModel.page * paginationModel.pageSize >= totalRows
                }
                onClick={() =>
                  setPaginationModel((prev) => ({
                    ...prev,
                    page: prev.page + 1
                  }))
                }>
                다음
              </Button>
            </Box>
          </Box>
        </Grid>

        {/* 선택된 항목 상세 정보 */}
        {selectedItem && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  가격 계산 상세 정보
                </Typography>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  gutterBottom>
                  {selectedItem.title} ({selectedItem.bidNumber})
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      품목:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1">
                      {selectedItem.itemName}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      단가:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1">
                      {formatCurrency(selectedItem.unitPrice)}원
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      수량:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1">
                      {selectedItem.quantity}개
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      계산식 (단가 × 수량):
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1">
                      {formatCurrency(selectedItem.unitPrice)} ×{" "}
                      {selectedItem.quantity} ={" "}
                      {formatCurrency(selectedItem.supplyPrice)}원
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      공급가액:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(selectedItem.supplyPrice)}원
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      계산식 (공급가액 × 10%):
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1">
                      {formatCurrency(selectedItem.supplyPrice)} × 10% ={" "}
                      {formatCurrency(selectedItem.vat)}원
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      부가세:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(selectedItem.vat)}원
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      계산식 (공급가액 + 부가세):
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1">
                      {formatCurrency(selectedItem.supplyPrice)} +{" "}
                      {formatCurrency(selectedItem.vat)} ={" "}
                      {formatCurrency(selectedItem.totalAmount)}원
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      총금액:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="primary.main">
                      {formatCurrency(selectedItem.totalAmount)}원
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setSelectedItem(null)}
                    fullWidth>
                    닫기
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default BiddingPriceTestPage;
