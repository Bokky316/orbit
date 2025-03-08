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
  Button, // Button 추가
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom"; // useNavigate 추가

const SupplierReviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate(); // useNavigate 훅 추가
  const formData = location.state || {
    businessNo: "123-45-67890",
    businessFile: null,
    companyName: "더미 회사",
    ceoName: "더미 대표",
    businessType: "제조업",
    businessCategory: "IT",
    sourcingCategory: "하드웨어",
    sourcingSubCategory: "컴퓨터 장비",
    sourcingMinorCategory: "기타서버",
    managerName: "더미 담당자",
    managerPosition: "과장",
    managerPhone: "010-1234-5678",
    managerMobile: "010-9876-5432",
    managerEmail: "dummy@example.com",
    zipCode: "12345",
    address: "더미 주소",
    detailAddress: "더미 상세 주소",
    businessCert: null,
    comments: "더미 코멘트",
  };
  const [tabIndex, setTabIndex] = React.useState(0);

  const handleGoToList = () => {
    navigate("/supplier-registrations"); // 목록 페이지로 이동
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
                <TableCell>{formData.companyName}</TableCell>
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
