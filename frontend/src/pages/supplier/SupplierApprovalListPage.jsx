import React, { useState, useEffect } from "react";
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const SupplierApprovalListPage = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    // ✅ `SupplierListPage` 데이터와 동일한 형식 + 진행 상태 유지
    const dummyData = [
      {
        id: 1,
        supplierName: "서버마스터",
        businessNo: "123-45-67890",
        businessType: "제조업",
        businessCategory: "기타서버",
        sourcingCategory: "하드웨어",
        sourcingSubCategory: "서버",
        sourcingMinorCategory: "기타서버",
        ceoName: "김대표",
        status: "검토대기",
        rejectReason: "",
      },
      {
        id: 2,
        supplierName: "소프트웨어솔루션",
        businessNo: "234-56-78901",
        businessType: "서비스업",
        businessCategory: "개발툴",
        sourcingCategory: "소프트웨어",
        sourcingSubCategory: "소프트웨어",
        sourcingMinorCategory: "개발툴",
        ceoName: "박대표",
        status: "반려",
        rejectReason: "서류 미비로 인해 반려되었습니다.",
      },
    ];
    setSuppliers(dummyData);
    setFilteredSuppliers(dummyData);
  }, []);

  const handleRejectReasonClick = (supplier) => {
    setSelectedSupplier(supplier);
    setOpenModal(true);
  };

  const handleReviewClick = (supplier) => {
    navigate(`/supplier-review/${supplier.id}`, { state: { from: "/supplier-approval", data: supplier } });
  };

  // ✅ 목록으로 버튼 클릭 시 `/supplier-registrations`로 이동
  const handleGoToList = () => {
    navigate("/supplier-registrations");
  };

  return (
    <Box sx={{ width: "95%", margin: "20px auto", textAlign: "center" }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        가입 승인 대기 & 승인 검토
      </Typography>

      <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell align="center">번호</TableCell>
              <TableCell align="center">소싱대분류</TableCell>
              <TableCell align="center">소싱중분류</TableCell>
              <TableCell align="center">소싱소분류</TableCell>
              <TableCell align="center">업체명</TableCell>
              <TableCell align="center">업태</TableCell>
              <TableCell align="center">업종</TableCell>
              <TableCell align="center">사업자등록번호</TableCell>
              <TableCell align="center">진행 상태</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((s, index) => (
                <TableRow key={s.id}>
                  <TableCell align="center">{index + 1}</TableCell>
                  <TableCell align="center">{s.sourcingCategory}</TableCell>
                  <TableCell align="center">{s.sourcingSubCategory}</TableCell>
                  <TableCell align="center">{s.sourcingMinorCategory}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="text"
                      color="primary"
                      onClick={() =>
                        navigate(`/supplier-review/${s.id}`, { state: { from: "/supplier-approval", data: s } })
                      }
                    >
                      {s.supplierName}
                    </Button>
                  </TableCell>
                  <TableCell align="center">{s.businessType}</TableCell>
                  <TableCell align="center">{s.businessCategory}</TableCell>
                  <TableCell align="center">{s.businessNo}</TableCell>
                  <TableCell align="center">
                    {s.status === "검토대기" ? (
                      <Box>
                        {s.status}{" "}
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          onClick={() => handleReviewClick(s)}
                          sx={{ ml: 1 }}
                        >
                          검토하기
                        </Button>
                      </Box>
                    ) : s.status === "반려" ? (
                      <Box>
                        {s.status}{" "}
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={() => handleRejectReasonClick(s)}
                          sx={{ ml: 1 }}
                        >
                          반려사유확인
                        </Button>
                      </Box>
                    ) : (
                      s.status
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center">검색된 업체가 없습니다.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 반려 사유 모달 */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>반려 사유</DialogTitle>
        <DialogContent>
          <Typography>업체명: {selectedSupplier?.supplierName}</Typography>
          <Typography sx={{ mt: 2, color: "red" }}>{selectedSupplier?.rejectReason || "반려 사유 없음"}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* ✅ 목록으로 버튼 추가 */}
      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Button variant="contained" color="primary" onClick={handleGoToList}>
          목록으로
        </Button>
      </Box>
    </Box>
  );
};

export default SupplierApprovalListPage;
