import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container, Paper, Typography, Grid, TextField, Select, MenuItem, Button, Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";

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

  const filteredInspections = inspections
    .filter((insp) =>
      (statusFilter ? insp.result === statusFilter : true) &&
      (searchTerm ? insp.contract.id.toString().includes(searchTerm) : true)
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
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="검색어 입력"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={3}>
            <Select fullWidth value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="대기중">대기중</MenuItem>
              <MenuItem value="합격">합격</MenuItem>
              <MenuItem value="불합격">불합격</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={3}>
            <Select fullWidth value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <MenuItem value="desc">검수일(최신순)</MenuItem>
              <MenuItem value="asc">검수일(오래된순)</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={2}>
            <Button fullWidth variant="contained" color="primary">검색</Button>
          </Grid>
        </Grid>
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
                <TableCell>{insp.result}</TableCell>
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
