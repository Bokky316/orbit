import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Container, Paper, Typography, Grid, Box, Divider, Chip, Table, TableHead, TableBody, TableRow, TableCell, Button, TextField
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";

const InspectionDetailPage = ({ userRole }) => {  // ✅ userRole 매개변수 추가
  const { id } = useParams();
  const [inspection, setInspection] = useState(null);

  useEffect(() => {
    setInspection({
      id,
      contractId: "CNT-2025-003",
      supplierName: "ABC 공급업체",
      productName: "비타민C",
      quantity: 100,
      expectedDelivery: "2025-03-05",
      actualDelivery: "2025-03-04",
      unitPrice: 5000,
      totalAmount: 500000,
      trackingInfo: "TRACK123456789",
      productSpec: "500mg, 100정",
      inspectionDate: "2025-03-08",
      inspectorName: "홍길동",
      status: "대기중",

      // ✅ 테이블 구조에 맞게 개별 필드 사용
      quantity_status: "부족",
      quality_status: "양호",
      packaging_status: "불량",
      spec_match_status: "일치",

      // ✅ 결과 필드 추가
      result: "불합격",

      returnReason: "포장 손상됨",
      attachments: ["파일_123.pdf"]
    });
  }, [id]);

  // ✅ "재검수 요청" 버튼 클릭 시 상태 변경
  const handleReinspectionRequest = () => {
    setInspection({ ...inspection, result: "재검수 요청" });
    console.log(`검수 ID ${id}에 대한 재검수 요청`);
  };

  if (!inspection) return <p>로딩 중...</p>;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>검수 결과 상세</Typography>

        {/* 검수 상태 및 기본 정보 */}
        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Chip
            label={inspection.result}
            color={inspection.result === "합격" ? "success" :
                   inspection.result === "불합격" ? "error" :
                   inspection.result === "재검수 요청" ? "info" :
                   "warning"}
            sx={{ fontSize: 16, px: 2, py: 1 }}
          />
          <Typography variant="subtitle1"><strong>검수자:</strong> {inspection.inspectorName}</Typography>
          <Typography variant="subtitle1"><strong>검수일자:</strong> {inspection.inspectionDate}</Typography>
        </Box>

        {/* 검수 정보 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">🔬 검수 정보</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6}><Typography><strong>계약 번호:</strong> {inspection.contractId}</Typography></Grid>
            <Grid item xs={6}><Typography><strong>공급업체:</strong> {inspection.supplierName}</Typography></Grid>
            <Grid item xs={6}><Typography><strong>품목명:</strong> {inspection.productName}</Typography></Grid>
            <Grid item xs={6}><Typography><strong>수량:</strong> {inspection.quantity}개</Typography></Grid>
            <Grid item xs={6}><Typography><strong>예상 납기:</strong> {inspection.expectedDelivery}</Typography></Grid>
            <Grid item xs={6}><Typography><strong>실제 납기:</strong> {inspection.actualDelivery}</Typography></Grid>
          </Grid>
        </Box>

        {/* 검수 평가 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">📋 검수 항목 평가</Typography>
          <Divider sx={{ mb: 2 }} />
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>항목</strong></TableCell>
                <TableCell><strong>평가 결과</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>수량 상태</TableCell>
                <TableCell>{inspection.quantity_status}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>품질 상태</TableCell>
                <TableCell>{inspection.quality_status}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>포장 상태</TableCell>
                <TableCell>{inspection.packaging_status}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>규격 일치 여부</TableCell>
                <TableCell>{inspection.spec_match_status}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        {/* 검수 의견 (읽기 전용) */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">📝 검수 의견</Typography>
          <Divider sx={{ mb: 2 }} />
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="검수 의견을 입력하세요..."
            sx={{ mt: 2 }}
            disabled // ✅ 읽기 전용 처리
          />
        </Box>

        {/* 첨부 파일 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">📎 첨부 파일</Typography>
          <Divider sx={{ mb: 2 }} />
          {inspection.attachments.map((file, index) => (
            <Button key={index} variant="outlined" startIcon={<AttachFileIcon />} href="#" target="_blank">
              {file}
            </Button>
          ))}
        </Box>

        {/* ✅ 공급자만 "재검수 요청" 가능 */}
        {/* {userRole === "SUPPLIER" && inspection.result === "불합격" && ( */}
          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Button variant="contained" color="info" onClick={handleReinspectionRequest}>
              재검수 요청
            </Button>
          </Box>
      {/*   )} */}
      </Paper>
    </Container>
  );
};

export default InspectionDetailPage;
