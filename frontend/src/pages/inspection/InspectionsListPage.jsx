<<<<<<< HEAD
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Typography, Grid, TextField, Select, MenuItem, Button,
  Table, TableHead, TableBody, TableRow, TableCell, FormControl, InputLabel,
  Box, Chip, IconButton, Tooltip, Alert, CircularProgress,
  Card, CardContent, Divider, InputAdornment, Pagination
} from "@mui/material";

// 아이콘 임포트
import SearchIcon from "@mui/icons-material/Search";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import HistoryIcon from "@mui/icons-material/History";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

// 결과 상태별 스타일 데이터
const resultStatusMap = {
  "검수대기": { color: "default", icon: <HistoryIcon fontSize="small" />, text: "검수대기" },
  "합격": { color: "success", icon: <CheckCircleIcon fontSize="small" />, text: "합격" },
  "불합격": { color: "error", icon: <ErrorIcon fontSize="small" />, text: "불합격" },
  "반품요청": { color: "warning", icon: <WarningIcon fontSize="small" />, text: "반품요청" },
  "재검수요청": { color: "info", icon: <RefreshIcon fontSize="small" />, text: "재검수요청" }
};

const InspectionsListPage = () => {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 검색 및 필터링 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  // 페이지네이션 상태
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // 페이지 로드 시 오늘 날짜로부터 30일 전으로 시작일 설정
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // 필터 리셋 함수
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setSortOrder("desc");

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  };

  // 검수 목록 로드
  useEffect(() => {
    const fetchInspections = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("accessToken");

        // 실제 API 호출 코드
        // const response = await fetch("/api/inspections", {
        //   method: "GET",
        //   headers: {
        //     "Authorization": `Bearer ${token}`,
        //     "Content-Type": "application/json"
        //   }
        // });

        // if (!response.ok) {
        //   throw new Error(`HTTP error! Status: ${response.status}`);
        // }

        // const data = await response.json();

        // 테스트 데이터 (API 연동 시 제거)
        setTimeout(() => {
          const mockData = [
            {
              id: "INS-2025-001",
              contractId: "CNT-2025-001",
              supplierName: "ABC 공급업체",
              productName: "비타민C 정제",
              quantity: 100,
              result: "합격",
              inspection_date: "2025-03-07",
              inspectorName: "홍길동"
            },
            {
              id: "INS-2025-002",
              contractId: "CNT-2025-002",
              supplierName: "XYZ 상사",
              productName: "종합 비타민",
              quantity: 50,
              result: "불합격",
              inspection_date: "2025-03-06",
              inspectorName: "김철수"
            },
            {
              id: "INS-2025-003",
              contractId: "CNT-2025-003",
              supplierName: "헬스케어 제약",
              productName: "오메가3",
              quantity: 200,
              result: "재검수요청",
              inspection_date: "2025-03-05",
              inspectorName: "박영희"
            },
            {
              id: "INS-2025-004",
              contractId: "CNT-2025-004",
              supplierName: "웰니스 솔루션",
              productName: "루테인",
              quantity: 150,
              result: "검수대기",
              inspection_date: "2025-03-04",
              inspectorName: "-"
            },
            {
              id: "INS-2025-005",
              contractId: "CNT-2025-005",
              supplierName: "내추럴 트리",
              productName: "프로바이오틱스",
              quantity: 80,
              result: "반품요청",
              inspection_date: "2025-03-03",
              inspectorName: "이지원"
            }
          ];

          setInspections(mockData);
          setLoading(false);
        }, 800); // 로딩 시뮬레이션

      } catch (err) {
        console.error("검수 목록 불러오기 실패:", err);
        setError("검수 목록을 불러오는데 실패했습니다.");
        setInspections([]);
        setLoading(false);
      }
    };

    fetchInspections();
  }, []);

  // 검색 및 필터링 로직
  const filteredInspections = inspections
    .filter((insp) => {
      // 상태 필터링
      const statusCheck = statusFilter ? insp.result === statusFilter : true;

      // 검색어 필터링
      const searchCheck = searchTerm
        ? Object.values(insp)
            .filter(value => value !== null && value !== undefined)
            .map(value => value.toString().toLowerCase())
            .some(text => text.includes(searchTerm.toLowerCase()))
        : true;

      // 날짜 필터링
      const dateCheck =
        (!startDate || new Date(insp.inspection_date) >= new Date(startDate)) &&
        (!endDate || new Date(insp.inspection_date) <= new Date(endDate));

      return searchCheck && statusCheck && dateCheck;
    })
    .sort((a, b) => {
      return sortOrder === "desc"
        ? new Date(b.inspection_date) - new Date(a.inspection_date)
        : new Date(a.inspection_date) - new Date(b.inspection_date);
    });

  // 현재 페이지에 표시할 항목들
  const paginatedInspections = filteredInspections.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // 페이지 변경 시 처리
  useEffect(() => {
    // 필터링된 결과가 현재 페이지보다 적으면 첫 페이지로 이동
    if (filteredInspections.length <= page * rowsPerPage && page > 0) {
      setPage(0);
    }
  }, [filteredInspections.length, page, rowsPerPage]);

  // 테이블 행 클릭 처리
  const handleRowClick = (id) => {
    navigate(`/inspections/${id}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>검수 관리</Typography>

      {/* 검색 및 필터 카드 */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', flexWrap: 'wrap' }}>
            {/* 검색창 */}
            <TextField
              placeholder="검색어 입력"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              size="small"
              sx={{ flex: '1 1 150px', minWidth: '120px' }}
            />

            {/* 상태 필터 */}
            <FormControl size="small" sx={{ width: '130px', flex: '0 0 auto' }}>
              <InputLabel>검수 상태</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="검수 상태"
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="검수대기">검수대기</MenuItem>
                <MenuItem value="합격">합격</MenuItem>
                <MenuItem value="불합격">불합격</MenuItem>
                <MenuItem value="재검수요청">재검수요청</MenuItem>
                <MenuItem value="반품요청">반품요청</MenuItem>
              </Select>
            </FormControl>

            {/* 정렬 필터 */}
            <FormControl size="small" sx={{ width: '130px', flex: '0 0 auto' }}>
              <InputLabel>정렬</InputLabel>
              <Select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                label="정렬"
              >
                <MenuItem value="desc">최신순</MenuItem>
                <MenuItem value="asc">오래된순</MenuItem>
              </Select>
            </FormControl>

            {/* 기간 검색 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
              <CalendarTodayIcon sx={{ color: 'text.secondary' }} fontSize="small" />
              <TextField
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="small"
                sx={{ width: '140px' }}
                InputLabelProps={{ shrink: true }}
              />
              <Typography sx={{ mx: 0.5 }}>~</Typography>
              <TextField
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size="small"
                sx={{ width: '140px' }}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            {/* 초기화 버튼 */}
            <Tooltip title="필터 초기화">
              <IconButton onClick={resetFilters} size="small" sx={{ ml: 'auto' }}>
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {/* 검수 목록 테이블 */}
      <Card variant="outlined">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            검수 목록 ({filteredInspections.length}건)
          </Typography>
        </Box>

        {error ? (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredInspections.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>검색 조건에 맞는 검수 내역이 없습니다.</Alert>
        ) : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.default' }}>
                    <TableCell>검수 ID</TableCell>
                    <TableCell>계약 번호</TableCell>
                    <TableCell>공급업체명</TableCell>
                    <TableCell>품목명</TableCell>
                    <TableCell align="center">수량</TableCell>
                    <TableCell align="center">결과</TableCell>
                    <TableCell>검수일자</TableCell>
                    <TableCell>검수자</TableCell>
                    <TableCell align="center">작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedInspections.map((insp) => {
                    const statusInfo = resultStatusMap[insp.result] || resultStatusMap["검수대기"];

                    return (
                      <TableRow
                        key={insp.id}
                        hover
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                        onClick={() => handleRowClick(insp.id)}
                      >
                        <TableCell sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                          {insp.id}
                        </TableCell>
                        <TableCell>{insp.contractId}</TableCell>
                        <TableCell>{insp.supplierName}</TableCell>
                        <TableCell>{insp.productName}</TableCell>
                        <TableCell align="center">{insp.quantity.toLocaleString()}</TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={statusInfo.text}
                            color={statusInfo.color}
                            icon={statusInfo.icon}
                          />
                        </TableCell>
                        <TableCell>{insp.inspection_date || "-"}</TableCell>
                        <TableCell>{insp.inspectorName || "-"}</TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          {(insp.result === "검수대기" || insp.result === "재검수요청") && (
                            <Tooltip title="검수하기">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/inspections/${insp.id}/edit`);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>

            {/* 페이지네이션 컨트롤 */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 2,
              py: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  페이지당 행:
                </Typography>
                <Select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(e.target.value)}
                  size="small"
                  sx={{ minWidth: 80 }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                  {`${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, filteredInspections.length)} / ${filteredInspections.length}`}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => setPage(0)}
                    disabled={page === 0}
                  >
                    <Box component="span" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>«</Box>
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0}
                  >
                    <Box component="span" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>‹</Box>
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(filteredInspections.length / rowsPerPage) - 1}
                  >
                    <Box component="span" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>›</Box>
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setPage(Math.ceil(filteredInspections.length / rowsPerPage) - 1)}
                    disabled={page >= Math.ceil(filteredInspections.length / rowsPerPage) - 1}
                  >
                    <Box component="span" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>»</Box>
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Card>
=======
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  FormControl,
  InputLabel,
  Box
} from "@mui/material";

const InspectionsListPage = () => {
  const [inspections, setInspections] = useState([
    {
      id: 1,
      contract: { id: "CNT001", productName: "비타민C", quantity: 100, expectedDeliveryDate: "03-05", actualDeliveryDate: "03-04" },
      inspectionDate: "2025-03-05",
      result: "합격"
    },
    {
      id: 2,
      contract: { id: "CNT002", productName: "오메가3", quantity: 50, expectedDeliveryDate: "03-06", actualDeliveryDate: "03-06" },
      inspectionDate: "2025-03-06",
      result: "불합격"
    }
  ]);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  // 기간 검색을 위한 상태 추가
  const [startDate, setStartDate] = useState("2025-03-01");
  const [endDate, setEndDate] = useState("2025-03-07");

  const filteredInspections = inspections
    .filter((insp) =>
      (statusFilter ? insp.result === statusFilter : true) &&
       (searchTerm ?
            (insp.contract.id.toString().includes(searchTerm) ||
             insp.contract.productName.toLowerCase().includes(searchTerm.toLowerCase()))
            : true) &&
      // 기간 필터 추가
      (startDate ? new Date(insp.inspectionDate) >= new Date(startDate) : true) &&
      (endDate ? new Date(insp.inspectionDate) <= new Date(endDate) : true)
    )
    .sort((a, b) => {
      return sortOrder === "desc"
        ? new Date(b.inspectionDate) - new Date(a.inspectionDate)
        : new Date(a.inspectionDate) - new Date(b.inspectionDate);
    });

  return (
    <Container>
      <Paper elevation={3} sx={{ padding: 3, marginTop: 3 }}>
        <Typography variant="h5" gutterBottom>검수 목록</Typography>

        {/* 기존 검색 및 필터 영역 */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="검색어 입력"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={4}>
            <FormControl fullWidth>
              <InputLabel>상태</InputLabel>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="상태">
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="대기중">대기중</MenuItem>
                <MenuItem value="합격">합격</MenuItem>
                <MenuItem value="불합격">불합격</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4}>
            <FormControl fullWidth>
              <InputLabel>정렬</InputLabel>
              <Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} label="정렬">
                <MenuItem value="desc">검수일(최신순)</MenuItem>
                <MenuItem value="asc">검수일(오래된순)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* 기간 검색 영역 추가 */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} sm={8}>
            <Typography variant="subtitle2" gutterBottom>검수일 기간</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flexGrow: 1 }}
              />
              <Typography sx={{ mx: 1 }}>~</Typography>
              <TextField
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flexGrow: 1 }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* 테이블 */}
        <Table sx={{ marginTop: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>계약번호</TableCell>
              <TableCell>제품명</TableCell>
              <TableCell>수량</TableCell>
              <TableCell>예정 납기</TableCell>
              <TableCell>실제 납품</TableCell>
              <TableCell>검수일</TableCell>
              <TableCell>결과</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInspections.map((insp) => (
              <TableRow key={insp.id}>
                <TableCell><Link to={`/inspections/${insp.id}`}>{insp.contract.id}</Link></TableCell>
                <TableCell>{insp.contract.productName || "-"}</TableCell>
                <TableCell>{insp.contract.quantity || "-"}</TableCell>
                <TableCell>{insp.contract.expectedDeliveryDate || "-"}</TableCell>
                <TableCell>{insp.contract.actualDeliveryDate || "-"}</TableCell>
                <TableCell>{insp.inspectionDate}</TableCell>
                <TableCell>
                  <Box
                    component="span"
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      backgroundColor: insp.result === "합격" ? 'success.100' : 'error.100',
                      color: insp.result === "합격" ? 'success.800' : 'error.800'
                    }}
                  >
                    {insp.result}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Grid container spacing={2} sx={{ marginTop: 2 }}>
          <Grid item>
            <Button variant="contained" color="primary">검수 등록</Button>
          </Grid>
          <Grid item>
            <Button variant="contained" color="secondary">검수 내역 내보내기 (Excel/PDF)</Button>
          </Grid>
        </Grid>
      </Paper>
>>>>>>> 9920c594 (feat: Inspection 엔티티 추가 및 프론트엔드 페이지 수정)
    </Container>
  );
};

export default InspectionsListPage;