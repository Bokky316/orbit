import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
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
  Box,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  Pagination
} from "@mui/material";

// 아이콘 임포트
import SearchIcon from "@mui/icons-material/Search";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import HistoryIcon from "@mui/icons-material/History";
import RefreshIcon from "@mui/icons-material/Refresh";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

// 결과 상태별 스타일 데이터
const resultStatusMap = {
  검수대기: {
    color: "default",
    icon: <HistoryIcon fontSize="small" />,
    text: "검수대기"
  },
  합격: {
    color: "success",
    icon: <CheckCircleIcon fontSize="small" />,
    text: "합격"
  },
  불합격: {
    color: "error",
    icon: <ErrorIcon fontSize="small" />,
    text: "불합격"
  },
  반품요청: {
    color: "warning",
    icon: <WarningIcon fontSize="small" />,
    text: "반품요청"
  },
  재검수요청: {
    color: "info",
    icon: <RefreshIcon fontSize="small" />,
    text: "재검수요청"
  }
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

  // 페이지 로드 시 날짜 필터 초기화
  useEffect(() => {
    setStartDate("");  // 빈 문자열로 설정
    setEndDate("");    // 빈 문자열로 설정
  }, []);

  // 필터 리셋 함수
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setSortOrder("desc");
    setStartDate("");
    setEndDate("");
  };

  // 검수 목록 로드
  useEffect(() => {
    const fetchInspections = async () => {
      try {
        setLoading(true);
        setError(null);

        // 임시 테스트 데이터 (API 호출에 문제가 있을 경우 주석 해제)
        /*
        const testData = [
          {
            id: "TEMP-1",
            contractId: "TRX-2025-001",
            supplierName: "공급업체 201",
            productName: "계약 품목 1",
            quantity: 1000,
            result: "검수대기",
            inspection_date: "-",
            inspectorName: "-"
          },
          {
            id: "TEMP-3",
            contractId: "TRX-2025-003",
            supplierName: "공급업체 203",
            productName: "계약 품목 3",
            quantity: 600,
            result: "검수대기",
            inspection_date: "-",
            inspectorName: "-"
          }
        ];

        setInspections(testData);
        setLoading(false);
        return; // 테스트 데이터 사용 시 여기서 함수 종료
        */

        const token = localStorage.getItem("accessToken");
        console.log("토큰:", token); // 토큰 확인용 로그

        // API 호출 시도
        console.log("API 호출 시작");

        const response = await fetch("/api/inspections", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        console.log("API 응답 상태:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("API 응답 데이터:", data); // 응답 데이터 확인용 로그

        // 백엔드 응답을 프론트엔드 형식으로 변환하고 누락된 데이터는 임시로 채움
        const formattedInspections = data.map(item => {
          // 검수 ID 형식 생성: INS-{id 숫자 5자리}
          const formattedId = `INS-${String(item.id).padStart(5, '0')}`;

          // 계약 번호 형식 생성: CNT-{contractId 숫자 5자리}
          const formattedContractId = `CNT-${String(item.contractId).padStart(5, '0')}`;

          // 공급업체 정보가 없을 경우 임시 데이터 생성
          const dummySupplierName = item.supplierName || `공급업체-${item.contractId}`;

          // 품목 정보가 없을 경우 임시 데이터 생성
          const dummyProductName = item.productName || `품목-${item.contractId}`;

          // 수량 정보가 없을 경우 임시 데이터 생성 (100~1000 사이 임의 값)
          const dummyQuantity = item.quantity || Math.floor(Math.random() * 900 + 100);

          return {
            id: formattedId,
            contractId: item.transactionNumber || formattedContractId,
            supplierName: dummySupplierName,
            productName: dummyProductName,
            quantity: dummyQuantity,
            result: item.result || "검수대기",
            // 날짜 처리: 검수 대기 상태면 "-", 그 외에는 검수일자 또는 현재 날짜
            inspection_date: item.result === "검수대기" ? "-" :
                            (item.inspectionDate ?
                              new Date(item.inspectionDate).toISOString().split('T')[0] :
                              "-"),
            inspectorName: item.inspectorName || "-"
          };
        });

        console.log("변환된 데이터:", formattedInspections); // 변환된 데이터 확인용 로그
        console.log("변환된 데이터 길이:", formattedInspections.length);

        if (formattedInspections.length === 0) {
          console.log("주의: 변환된 데이터가 비어 있습니다!");
        }

        setInspections(formattedInspections);
        setLoading(false);
      } catch (err) {
        console.error("검수 목록 불러오기 실패:", err);
        setError("검수 목록을 불러오는데 실패했습니다: " + err.message);
        setInspections([]);
        setLoading(false);
      }
    };

    fetchInspections();
  }, []);

  // 검색 및 필터링 로직 수정
  const filteredInspections = inspections
    .filter((insp) => {
      // 상태 필터링
      const statusCheck = statusFilter ? insp.result === statusFilter : true;

      // 검색어 필터링
      const searchCheck = searchTerm
        ? Object.values(insp)
            .filter((value) => value !== null && value !== undefined)
            .map((value) => value.toString().toLowerCase())
            .some((text) => text.includes(searchTerm.toLowerCase()))
        : true;

      // 날짜 필터링 - inspectionDate가 null인 경우 항상 포함되도록 수정
      const dateCheck = insp.inspection_date === "-" || insp.inspection_date === null
        ? true // 날짜가 없는 항목은 항상 포함
        : (
            (!startDate || new Date(insp.inspection_date) >= new Date(startDate)) &&
            (!endDate || new Date(insp.inspection_date) <= new Date(endDate))
          );

      return searchCheck && statusCheck && dateCheck;
    })
    .sort((a, b) => {
      // 날짜가 없는 항목은 최신 또는 가장 오래된 항목으로 처리
      if (a.inspection_date === "-" && b.inspection_date === "-") return 0;
      if (a.inspection_date === "-") return sortOrder === "desc" ? -1 : 1;
      if (b.inspection_date === "-") return sortOrder === "desc" ? 1 : -1;

      return sortOrder === "desc"
        ? new Date(b.inspection_date) - new Date(a.inspection_date)
        : new Date(a.inspection_date) - new Date(b.inspection_date);
    });

  // 현재 페이지에 표시할 항목들
  const paginatedInspections = filteredInspections.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  console.log("필터링된 데이터:", filteredInspections.length); // 필터 결과 확인
  console.log("페이지 데이터:", paginatedInspections.length); // 현재 페이지 데이터 확인

  // 페이지 변경 시 처리
  useEffect(() => {
    // 필터링된 결과가 현재 페이지보다 적으면 첫 페이지로 이동
    if (filteredInspections.length <= page * rowsPerPage && page > 0) {
      setPage(0);
    }
  }, [filteredInspections.length, page, rowsPerPage]);

      // 테이블 행 클릭 처리
  const handleRowClick = (id) => {
    // 검수 상세 페이지로 이동
    // ID에서 숫자 부분만 추출하여 전달 (INS-00001 -> 1)
    const numericId = id.split('-')[1] ? parseInt(id.split('-')[1], 10) : id;
    navigate(`/inspections/${numericId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        검수 관리
      </Typography>
      {/* 검색 및 필터 카드 */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              width: "100%",
              flexWrap: "wrap"
            }}>
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
              sx={{ flex: "1 1 150px", minWidth: "120px" }}
            />

            {/* 상태 필터 */}
            <FormControl size="small" sx={{ width: "130px", flex: "0 0 auto" }}>
              <InputLabel>검수 상태</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="검수 상태">
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="검수대기">검수대기</MenuItem>
                <MenuItem value="합격">합격</MenuItem>
                <MenuItem value="불합격">불합격</MenuItem>
                <MenuItem value="재검수요청">재검수요청</MenuItem>
                <MenuItem value="반품요청">반품요청</MenuItem>
              </Select>
            </FormControl>

            {/* 정렬 필터 */}
            <FormControl size="small" sx={{ width: "130px", flex: "0 0 auto" }}>
              <InputLabel>정렬</InputLabel>
              <Select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                label="정렬">
                <MenuItem value="desc">최신순</MenuItem>
                <MenuItem value="asc">오래된순</MenuItem>
              </Select>
            </FormControl>

            {/* 기간 검색 */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flex: "0 0 auto"
              }}>
              <CalendarTodayIcon
                sx={{ color: "text.secondary" }}
                fontSize="small"
              />
              <TextField
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="small"
                sx={{ width: "140px" }}
                InputLabelProps={{ shrink: true }}
              />
              <Typography sx={{ mx: 0.5 }}>~</Typography>
              <TextField
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size="small"
                sx={{ width: "140px" }}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            {/* 초기화 버튼 */}
            <Tooltip title="필터 초기화">
              <IconButton
                onClick={resetFilters}
                size="small"
                sx={{ ml: "auto" }}>
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
      {/* 검수 목록 테이블 */}
      <Card variant="outlined">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider"
          }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
            검수 목록 ({filteredInspections.length}건)
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        )}

        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }} >
                <TableCell>검수 ID</TableCell>
                <TableCell>계약 번호</TableCell>
                <TableCell>공급업체명</TableCell>
                <TableCell>품목명</TableCell>
                <TableCell align="center">수량</TableCell>
                <TableCell align="center">결과</TableCell>
                <TableCell>검수일자</TableCell>
                <TableCell>검수자</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredInspections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Alert severity="info" sx={{ justifyContent: 'center' }}>
                      검색 조건에 맞는 검수 내역이 없습니다.
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInspections.map((insp) => {
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
                    </TableRow>
                  );
                })
              )}
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
              {filteredInspections.length > 0 ?
                `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, filteredInspections.length)} / ${filteredInspections.length}` :
                "0-0 / 0"}
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
      </Card>
    </Container>
  );
};

export default InspectionsListPage;
