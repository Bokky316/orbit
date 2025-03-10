import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Typography, Grid, TextField, Select, MenuItem, Button,
  Table, TableHead, TableBody, TableRow, TableCell, FormControl, InputLabel,
  Box, Chip, IconButton, Tooltip, Alert, CircularProgress,
  Card, CardContent, Divider, InputAdornment, Tabs, Tab, Badge
} from "@mui/material";

// 아이콘 임포트
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import HistoryIcon from "@mui/icons-material/History";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
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
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  // 검색 및 필터링 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

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

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setSortOrder("desc");
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
      // 탭 필터링
      if (currentTab === 1 && insp.result !== "검수대기") return false;
      if (currentTab === 2 && insp.result !== "합격") return false;
      if (currentTab === 3 && insp.result !== "불합격") return false;
      if (currentTab === 4 && insp.result !== "재검수요청" && insp.result !== "반품요청") return false;

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

      return searchCheck && dateCheck;
    })
    .sort((a, b) => {
      return sortOrder === "desc"
        ? new Date(b.inspection_date) - new Date(a.inspection_date)
        : new Date(a.inspection_date) - new Date(b.inspection_date);
    });

  // 상태별 건수 계산
  const pendingCount = inspections.filter(item => item.result === "검수대기").length;
  const passedCount = inspections.filter(item => item.result === "합격").length;
  const failedCount = inspections.filter(item => item.result === "불합격").length;
  const requestCount = inspections.filter(item =>
    item.result === "재검수요청" || item.result === "반품요청"
  ).length;

  // 테이블 행 클릭 처리
  const handleRowClick = (id) => {
    navigate(`/inspections/${id}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>검수 관리</Typography>

      {/* 상태별 탭 */}
      <Tabs
        value={currentTab}
        onChange={(e, newValue) => setCurrentTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge badgeContent={inspections.length} color="primary" sx={{ mr: 1 }}>
              <FilterListIcon />
            </Badge>
            전체
          </Box>
        } />
        <Tab label={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge badgeContent={pendingCount} color="default" sx={{ mr: 1 }}>
              <HistoryIcon />
            </Badge>
            검수대기
          </Box>
        } />
        <Tab label={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge badgeContent={passedCount} color="success" sx={{ mr: 1 }}>
              <CheckCircleIcon />
            </Badge>
            합격
          </Box>
        } />
        <Tab label={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge badgeContent={failedCount} color="error" sx={{ mr: 1 }}>
              <ErrorIcon />
            </Badge>
            불합격
          </Box>
        } />
        <Tab label={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge badgeContent={requestCount} color="warning" sx={{ mr: 1 }}>
              <RefreshIcon />
            </Badge>
            요청사항
          </Box>
        } />
      </Tabs>

      {/* 검색 및 필터 카드 */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 2 }}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* 검색창 */}
            <TextField
              placeholder="검색어 입력 (검수 ID, 계약 번호, 공급업체명 등)"
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
              sx={{ flexGrow: 1, mr: 2 }}
            />

            {/* 필터 버튼 */}
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setExpandedFilters(!expandedFilters)}
              size="medium"
            >
              필터
            </Button>

            {/* 리셋 버튼 */}
            <Tooltip title="필터 초기화">
              <IconButton onClick={resetFilters} sx={{ ml: 1 }}>
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* 확장된 필터 영역 */}
          {expandedFilters && (
            <>
              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2} alignItems="center">
                {/* 정렬 필터 */}
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>정렬</InputLabel>
                    <Select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      label="정렬"
                    >
                      <MenuItem value="desc">검수일(최신순)</MenuItem>
                      <MenuItem value="asc">검수일(오래된순)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* 기간 검색 */}
                <Grid item xs={12} sm={8}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                    <TextField
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      size="small"
                      sx={{ mr: 1 }}
                      InputLabelProps={{ shrink: true }}
                    />
                    <Typography sx={{ mx: 1 }}>~</Typography>
                    <TextField
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </>
          )}
        </CardContent>
      </Card>

      {/* 검수 목록 테이블 */}
      <Card variant="outlined">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            검수 목록 ({filteredInspections.length}건)
          </Typography>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/inspections/new")}
            size="small"
          >
            검수 등록
          </Button>
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
                {filteredInspections.map((insp) => {
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
                        {insp.result === "검수대기" && (
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
        )}
      </Card>
    </Container>
  );
};

export default InspectionsListPage;