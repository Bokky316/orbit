import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link,
  Card,
  CardContent,
  Chip,
  Divider,
  InputAdornment,
  TablePagination,
  styled
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Clear as ClearIcon,
  AttachFile as AttachFileIcon
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import moment from "moment";
import useWebSocket from "@hooks/useWebSocket";

// Redux 액션 및 선택자 임포트
import {
  fetchPurchaseRequests,
  setSearchTerm,
  setRequestDate,
  setStatus
} from "@/redux/purchaseRequestSlice";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

// 스타일 컴포넌트 정의
const StatusChip = styled(Chip)(({ theme, statuscode }) => {
  // statuscode 소문자로 변환하여 비교
  const status = String(statuscode).toLowerCase();

  // 상태별 색상 지정
  let color = theme.palette.grey[500]; // 기본값

  if (status.includes("approved") || status.includes("승인")) {
    color = theme.palette.success.main;
  } else if (status.includes("rejected") || status.includes("반려")) {
    color = theme.palette.error.main;
  } else if (status.includes("requested") || status.includes("요청")) {
    color = theme.palette.info.main;
  } else if (status.includes("received") || status.includes("접수")) {
    color = theme.palette.primary.main;
  } else if (status.includes("vendor_selection") || status.includes("업체")) {
    color = theme.palette.secondary.main;
  } else if (status.includes("contract_pending") || status.includes("계약")) {
    color = theme.palette.warning.light;
  } else if (status.includes("inspection") || status.includes("검수")) {
    color = theme.palette.warning.main;
  } else if (status.includes("invoice") || status.includes("인보이스")) {
    color = theme.palette.info.dark;
  } else if (status.includes("payment") || status.includes("지급")) {
    color = theme.palette.success.dark;
  }

  return {
    backgroundColor: color,
    color: theme.palette.getContrastText(color),
    fontWeight: "bold",
    minWidth: "80px"
  };
});

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  maxHeight: "calc(100vh - 320px)", // 화면 높이에 맞게 조정
  "& .MuiTableHead-root": {
    position: "sticky",
    top: 0,
    backgroundColor: theme.palette.background.paper,
    zIndex: 1
  },
  "& .MuiTableRow-root:hover": {
    backgroundColor: theme.palette.action.hover
  }
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
  fontWeight: 600,
  color: theme.palette.text.primary
}));

function PurchaseRequestListPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  useWebSocket(user);

  // Redux 상태에서 데이터 가져오기
  const { purchaseRequests, filters, loading, error } = useSelector(
    (state) => state.purchaseRequest
  );

  // 페이지네이션 상태
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // 첫 로드 시 데이터 가져오기
  useEffect(() => {
    // 컴포넌트 마운트 시 구매 요청 목록 가져오기
    dispatch(fetchPurchaseRequests());

    // 자동 갱신 설정
    const intervalId = setInterval(() => {
      dispatch(fetchPurchaseRequests());
    }, 300000); // 5분마다 자동 갱신

    return () => clearInterval(intervalId);
  }, [dispatch]);

  // 상태 코드 추출 함수
  const extractStatusCode = (request) => {
    // 1. status_child_code가 있으면 사용 (서버에서 직접 오는 필드)
    if (request.status_child_code) {
      return request.status_child_code;
    }

    // 2. prStatusChild가 있으면 그대로 사용
    if (request.prStatusChild) {
      return request.prStatusChild;
    }

    // 3. status 문자열이 있으면 파싱
    if (request.status) {
      const parts = request.status.split('-');
      // 형식이 무엇이든 마지막 부분을 상태 코드로 처리
      if (parts.length >= 2) {
        return parts[parts.length - 1]; // 마지막 부분 반환
      }
    }

    // 4. 기본값 반환
    return "REQUESTED"; // 기본 상태
  };

  // 상태 라벨 가져오기 함수 추가
  const getStatusLabel = (statusCode) => {
    switch(statusCode) {
      case 'REQUESTED': return '구매 요청';
      case 'RECEIVED': return '요청 접수';
      case 'VENDOR_SELECTION': return '업체 선정';
      case 'CONTRACT_PENDING': return '계약 대기';
      case 'INSPECTION': return '검수 진행';
      case 'INVOICE_ISSUED': return '인보이스 발행';
      case 'PAYMENT_COMPLETED': return '대금지급 완료';
      default: return statusCode || '상태 정보 없음';
    }
  };

  // 필터링된 구매 요청 목록 계산
  const filteredRequests = purchaseRequests
    ? purchaseRequests.filter((request) => {
        const searchTermLower = filters.searchTerm
          ? filters.searchTerm.toLowerCase()
          : "";
        const searchMatch =
          !searchTermLower ||
          [
            request.requestName?.toLowerCase(),
            String(request.id),
            request.customer?.toLowerCase(),
            request.businessManager?.toLowerCase()
          ].some((field) => field && field.includes(searchTermLower));

        const dateMatch =
          !filters.requestDate ||
          (request.requestDate &&
            moment(request.requestDate).isSame(filters.requestDate, "day"));

    const statusMatch =
      !filters.status || extractStatusCode(request) === filters.status;

        return searchMatch && dateMatch && statusMatch;
      })
    : [];

  // 페이지 변경 핸들러
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경 핸들러
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 필터 변경 핸들러
  const handleFilterChange = (type, value) => {
    switch (type) {
      case "searchTerm":
        dispatch(setSearchTerm(value));
        break;
      case "requestDate":
        dispatch(setRequestDate(value));
        break;
      case "status":
        dispatch(setStatus(value));
        break;
      default:
        break;
    }
  };

  const downloadFile = async (attachment, e) => {
    // 이벤트 전파 방지 (행 클릭 이벤트 방지)
    e.stopPropagation();

    try {
      const response = await fetchWithAuth(
        `${API_URL}attachments/${attachment.id}/download`,
        {
          method: "GET",
          responseType: "blob" // Blob 형태로 받기
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = attachment.originalName || attachment.fileName; // 파일 이름 설정
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        console.error("파일 다운로드 실패:", response.status);
      }
    } catch (error) {
      console.error("파일 다운로드 중 오류 발생:", error);
    }
  };

  // 로딩 중 표시
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh"
        }}>
        <Typography variant="h6">
          구매 요청 목록을 불러오는 중입니다...
        </Typography>
      </Box>
    );
  }

  // 에러 발생 시 표시
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          오류가 발생했습니다: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <PageTitle variant="h4">구매 요청 목록</PageTitle>
      </Box>

      {/* 필터 섹션 - 상태 코드 수정 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="검색"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                label="요청일"
                value={filters.requestDate ? moment(filters.requestDate) : null}
                onChange={(date) => handleFilterChange("requestDate", date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: false
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                  label="요청일"
                  value={
                    filters.requestDate ? moment(filters.requestDate) : null
                  }
                  onChange={(date) => handleFilterChange("requestDate", date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: false
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>진행상태</InputLabel>
                <Select
                  value={filters.status || ""}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  label="진행상태">
                  <MenuItem value="">전체</MenuItem>
                  <MenuItem value="REQUESTED">구매 요청</MenuItem>
                  <MenuItem value="RECEIVED">구매요청 접수</MenuItem>
                  <MenuItem value="VENDOR_SELECTION">업체 선정</MenuItem>
                  <MenuItem value="CONTRACT_PENDING">계약 대기</MenuItem>
                  <MenuItem value="INSPECTION">검수 진행</MenuItem>
                  <MenuItem value="INVOICE_ISSUED">인보이스 발행</MenuItem>
                  <MenuItem value="PAYMENT_COMPLETED">대금지급 완료</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                onClick={handleClearFilters}
                startIcon={<ClearIcon />}>
                필터 초기화
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 구매 요청 목록 테이블 */}
      <StyledTableContainer component={Paper}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell>진행상태</TableCell>
              <TableCell>요청제목</TableCell>
              <TableCell>요청번호</TableCell>
              <TableCell>고객사</TableCell>
              <TableCell>요청일</TableCell>
              <TableCell>사업부서</TableCell>
              <TableCell>첨부파일</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.map((request) => (
              <TableRow
                key={request.id}
                hover
                onClick={() => navigate(`/purchase-requests/${request.id}`)}
                sx={{ cursor: "pointer" }}>
                <TableCell>
                  {getStatusLabel(extractStatusCode(request))}
                </TableCell>
                <TableCell>{request.requestName}</TableCell>
                <TableCell>{request.id}</TableCell>
                <TableCell>{request.customer}</TableCell>
                <TableCell>
                  {request.requestDate ? moment(request.requestDate).format("YYYY-MM-DD") : '-'}
                </TableCell>
                <TableCell>{request.businessDepartment}</TableCell>
                <TableCell>
                  {request.attachments && request.attachments.length > 0
                    ? request.attachments.map((attachment) => (
                        <Link
                          key={attachment.id}
                          component="button"
                          variant="body2"
                          onClick={(e) => downloadFile(attachment, e)}>
                          {attachment.originalName || attachment.fileName}
                        </Link>
                      ))
                    : "-"}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.length > 0 ? (
                filteredRequests
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((request) => {
                    const statusCode = extractStatusCode(request);
                    return (
                      <TableRow
                        key={request.id}
                        hover
                        onClick={() =>
                          navigate(`/purchase-requests/${request.id}`)
                        }
                        sx={{ cursor: "pointer" }}>
                        <TableCell>
                          <StatusChip
                            label={getStatusLabel(statusCode)}
                            statuscode={statusCode}
                            size="small"
                          />
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: "bold", color: "primary.main" }}>
                          {request.requestName}
                        </TableCell>
                        <TableCell>
                          {request.requestNumber || request.id}
                        </TableCell>
                        <TableCell>{request.customer || "-"}</TableCell>
                        <TableCell>
                          {request.requestDate
                            ? moment(request.requestDate).format("YYYY-MM-DD")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {request.businessDepartment || "-"}
                        </TableCell>
                        <TableCell>
                          {request.attachments &&
                          request.attachments.length > 0 ? (
                            <Box sx={{ display: "flex", gap: 1 }}>
                              {request.attachments.map((attachment, index) => (
                                <Link
                                  key={attachment.id}
                                  component="button"
                                  onClick={(e) => downloadFile(attachment, e)}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center"
                                  }}>
                                  <AttachFileIcon
                                    fontSize="small"
                                    sx={{ mr: 0.5 }}
                                  />
                                  {index + 1}
                                </Link>
                              ))}
                            </Box>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>
                      검색 조건에 맞는 구매 요청이 없습니다.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </StyledTableContainer>
        <Divider />
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredRequests.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행 수:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} / 총 ${count}개`
          }
        />
      </Card>
    </Box>
  );
}

export default PurchaseRequestListPage;