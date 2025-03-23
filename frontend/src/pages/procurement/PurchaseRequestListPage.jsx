import React, { useEffect } from "react";
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
  Link
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import moment from "moment";
import { styled } from "@mui/material/styles";
import useWebSocket from "@hooks/useWebSocket";

// Redux 액션 및 선택자 임포트
import {
  fetchPurchaseRequests,
  setSearchTerm,
  setRequestDate,
  setStatus
} from "@/redux/purchaseRequestSlice"; // Correct import path
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  maxHeight: 440,
  "& .MuiTableHead-root": {
    position: "sticky",
    top: 0,
    backgroundColor: theme.palette.background.paper,
    zIndex: 1
  }
}));

function PurchaseRequestListPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  useWebSocket(user);

  // Redux 상태에서 데이터 가져오기
  const { purchaseRequests, filters } = useSelector(
    (state) => state.purchaseRequest
  );

  useEffect(() => {
    // 컴포넌트 마운트 시 구매 요청 목록 가져오기
    dispatch(fetchPurchaseRequests());
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
  const filteredRequests = purchaseRequests.filter((request) => {
    const searchTermLower = filters.searchTerm.toLowerCase();
    const searchMatch = [
      request.requestName?.toLowerCase(),
      String(request.id),
      request.customer?.toLowerCase(),
      request.businessManager?.toLowerCase()
    ].some((field) => field?.includes(searchTermLower));

    const dateMatch =
      !filters.requestDate ||
      (request.requestDate &&
        moment(request.requestDate).isSame(filters.requestDate, "day"));

    const statusMatch =
      !filters.status || extractStatusCode(request) === filters.status;

    return searchMatch && dateMatch && statusMatch;
  });

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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        구매 요청 목록
      </Typography>

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
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined">
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
        </Grid>
      </Paper>

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
            ))}
          </TableBody>
        </Table>
      </StyledTableContainer>

      {/* 신규 생성 버튼 */}
      <Button
        variant="contained"
        onClick={() => navigate("/purchase-requests/new")}
        sx={{ mt: 2 }}>
        신규 생성
      </Button>
    </Box>
  );
}

export default PurchaseRequestListPage;