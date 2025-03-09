import { useState,useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Container, Paper, Typography, Grid, TextField, Select, MenuItem, Button,
  Table, TableHead, TableBody, TableRow, TableCell, FormControl, InputLabel, Box
} from "@mui/material";

const InspectionsListPage = () => {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ 검수 목록 불러오기 (API 호출)
 useEffect(() => {
   const token = localStorage.getItem("accessToken"); // ✅ 저장된 JWT 토큰 가져오기

   fetch("/api/inspections", {
     method: "GET",
     headers: {
       "Authorization": `Bearer ${token}`, // ✅ JWT 토큰 포함
       "Content-Type": "application/json"
     }
   })
     .then((response) => {
       console.log("🔍 API 응답 상태 코드:", response.status);
       if (!response.ok) {
         throw new Error(`HTTP error! Status: ${response.status}`);
       }
       return response.json();
     })
     .then((data) => {
       console.log("✅ 검수 데이터:", data);
       setInspections(Array.isArray(data) ? data : []);
     })
     .catch((error) => {
       console.error("❌ 검수 목록 불러오기 실패:", error);
       setInspections([]);
     });
 }, []);



  // 🔍 검색 및 필터링 상태
  const [searchTerm, setSearchTerm] = useState(""); // 검색어
  const [statusFilter, setStatusFilter] = useState(""); // 검수 상태 필터
  const [startDate, setStartDate] = useState("2025-03-01"); // 검수일 기준 기간 검색 (시작일)
  const [endDate, setEndDate] = useState("2025-03-07"); // 검수일 기준 기간 검색 (종료일)
  const [sortOrder, setSortOrder] = useState("desc"); // 정렬

  // 🔍 검색 및 필터링 로직 (모든 키워드 검색 가능하도록 개선)
  const filteredInspections = inspections
    .filter((insp) =>
      (searchTerm
        ? Object.values(insp)
            .filter(value => value !== null && value !== undefined) // null 또는 undefined 방지
            .map(value => value.toString().toLowerCase()) // 문자열 변환 후 소문자로 통일
            .some(text => text.includes(searchTerm.toLowerCase())) // 포함 여부 확인
        : true) &&
      (statusFilter ? insp.result === statusFilter : true) &&
      (startDate ? new Date(insp.inspection_date) >= new Date(startDate) : true) &&
      (endDate ? new Date(insp.inspection_date) <= new Date(endDate) : true)
    )
    .sort((a, b) => {
      return sortOrder === "desc"
        ? new Date(b.inspection_date) - new Date(a.inspection_date)
        : new Date(a.inspection_date) - new Date(b.inspection_date);
    });

  return (
    <Container>
      <Paper elevation={3} sx={{ padding: 3, marginTop: 3 }}>
        <Typography variant="h5" gutterBottom>검수 목록</Typography>

        {/* 🔍 검색 & 필터 UI */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={8}>
            <TextField
              fullWidth
              label="검색어 입력 (검수 ID, 계약 번호, 공급업체명, 품목명, 검수자 등)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={4}>
            <FormControl fullWidth>
              <InputLabel>상태</InputLabel>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="상태">
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="합격">합격</MenuItem>
                <MenuItem value="불합격">불합격</MenuItem>
              </Select>
            </FormControl>
          </Grid>

        </Grid>

        {/* ⏳ 검수일 기준 기간 검색 */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} sm={8}>
            <Typography variant="subtitle2" gutterBottom>검수일 기간 검색</Typography>
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

        {/* 📜 검수 목록 테이블 */}
        <Table sx={{ marginTop: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>검수 ID</TableCell>
              <TableCell>계약 번호</TableCell>
              <TableCell>공급업체명</TableCell>
              <TableCell>품목명</TableCell>
              <TableCell>수량</TableCell>
              <TableCell>결과</TableCell>
              <TableCell>검수일자</TableCell>
              <TableCell>검수자</TableCell>
              <TableCell>검수</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInspections.map((insp) => (
              <TableRow key={insp.id}>
                <TableCell>
                  <Link to={`/inspections/${insp.id}`}>{insp.id}</Link>
                </TableCell>
                <TableCell>{insp.contractId}</TableCell>
                <TableCell>{insp.supplierName}</TableCell>
                <TableCell>{insp.productName}</TableCell>
                <TableCell>{insp.quantity}</TableCell>
                <TableCell>{insp.result || "-"}</TableCell>
                <TableCell>{insp.inspection_date || "-"}</TableCell>
                <TableCell>{insp.inspectorName || "-"}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color={insp.result ? "secondary" : "primary"}
                    onClick={() => navigate(`/inspections/${insp.id}/edit`)}
                  >
                    {insp.result ? "검수 수정" : "검수"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default InspectionsListPage;
