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
    </Container>
  );
};

export default InspectionsListPage;