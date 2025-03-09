import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Button,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

const SupplierReviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ 이전 페이지 정보 저장
  const formData = location.state?.data || {};
  const prevPage = location.state?.from || "/supplier-registrations"; // 기본값 설정

  console.log("넘어온 업체 데이터:", formData);
  console.log("이전 페이지:", prevPage);

  const [tabIndex, setTabIndex] = React.useState(0);

  const handleGoToList = () => {
    navigate(prevPage); // ✅ 이전 페이지로 이동
  };

  return (
    <Box sx={{ width: "90%", margin: "auto", mt: 5 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        협력업체 등록 정보
      </Typography>

      {/* 탭 메뉴 */}
      <Tabs value={tabIndex} onChange={(e, newIndex) => setTabIndex(newIndex)} sx={{ mb: 3 }}>
        <Tab label="기본 정보" />
        <Tab label="담당자 정보" />
      </Tabs>

      {/* 기본 정보 */}
      {tabIndex === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>사업자등록번호</TableCell>
                <TableCell>{formData.businessNo}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>회사명</TableCell>
                <TableCell>{formData.supplierName || "데이터 없음"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>대표자명</TableCell>
                <TableCell>{formData.ceoName}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>업태</TableCell>
                <TableCell>{formData.businessType}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>업종</TableCell>
                <TableCell>{formData.businessCategory}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>소싱대분류</TableCell>
                <TableCell>{formData.sourcingCategory}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>소싱중분류</TableCell>
                <TableCell>{formData.sourcingSubCategory}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>소싱소분류</TableCell>
                <TableCell>{formData.sourcingMinorCategory}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>우편번호</TableCell>
                <TableCell>{formData.zipCode}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>주소</TableCell>
                <TableCell>{formData.address}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>상세주소</TableCell>
                <TableCell>{formData.detailAddress}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>사업자등록증</TableCell>
                <TableCell>{formData.businessCert ? "첨부됨" : "미첨부"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>의견</TableCell>
                <TableCell>{formData.comments}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 담당자 정보 */}
      {tabIndex === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>담당자명</TableCell>
                <TableCell>{formData.managerName}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>직책</TableCell>
                <TableCell>{formData.managerPosition}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>전화번호</TableCell>
                <TableCell>{formData.managerPhone}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>휴대전화번호</TableCell>
                <TableCell>{formData.managerMobile}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>이메일</TableCell>
                <TableCell>{formData.managerEmail}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 목록으로 버튼 */}
      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Button variant="contained" color="primary" onClick={handleGoToList}>
          목록으로
        </Button>
      </Box>
    </Box>
  );
};

export default SupplierReviewPage;
