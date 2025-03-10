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
  DialogActions
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const SupplierList = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
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
        managerName: "이담당",
        managerPosition: "과장",
        managerPhone: "02-1234-5678",
        managerMobile: "010-9876-5432",
        managerEmail: "manager@servermaster.com",
        zipCode: "12345",
        address: "서울특별시 강남구",
        detailAddress: "테헤란로 123",
        businessCert: "첨부됨",
        comments: "서버 전문 업체",
        status: "승인완료",
        rejectReason: ""
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
        managerName: "최담당",
        managerPosition: "팀장",
        managerPhone: "031-5678-1234",
        managerMobile: "010-2345-6789",
        managerEmail: "manager@swsolution.com",
        zipCode: "54321",
        address: "경기도 성남시 분당구",
        detailAddress: "판교로 45",
        businessCert: "첨부됨",
        comments: "소프트웨어 개발 솔루션 제공",
        status: "반려",
        rejectReason: "서류 미비로 인해 반려되었습니다."
      },
      {
        id: 3,
        supplierName: "스마트테크",
        businessNo: "345-67-89012",
        businessType: "도소매업",
        businessCategory: "전자기기",
        sourcingCategory: "전자제품",
        sourcingSubCategory: "스마트폰",
        sourcingMinorCategory: "전자기기",
        ceoName: "이대표",
        managerName: "강담당",
        managerPosition: "부장",
        managerPhone: "051-8765-4321",
        managerMobile: "010-6789-0123",
        managerEmail: "manager@smarttech.com",
        zipCode: "67890",
        address: "부산광역시 해운대구",
        detailAddress: "센텀로 89",
        businessCert: "미첨부",
        comments: "스마트 디바이스 유통",
        status: "승인대기",
        rejectReason: ""
      }
    ];
    setSuppliers(dummyData);
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [searchName, suppliers]);

  const filterSuppliers = () => {
    let filtered = suppliers.filter((s) =>
      s.supplierName.toLowerCase().includes(searchName.toLowerCase())
    );
    setFilteredSuppliers(filtered);
  };

  const handleRejectClick = (supplier) => {
    setSelectedSupplier(supplier);
    setOpenModal(true);
  };

  return (
    <Box sx={{ width: "95%", margin: "20px auto", textAlign: "center" }}>
      <Typography variant="h4" sx={{ mb: 3 }}>협력업체 목록</Typography>

      {/* 상단 버튼 영역 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        {/* 협력업체 등록 버튼 (우측) */}
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/supplier/registrations")}
          sx={{ borderRadius: 2 }}
        >
          협력업체 등록
        </Button>
      </Box>

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
                        navigate(`/supplier/review/${s.id}`, { state: { from: "/supplier", data: s } }) // ✅ "/supplier"로 변경
                      }
                    >
                      {s.supplierName}
                    </Button>
                  </TableCell>
                  <TableCell align="center">{s.businessType}</TableCell>
                  <TableCell align="center">{s.businessCategory}</TableCell>
                  <TableCell align="center">{s.businessNo}</TableCell>
                  <TableCell align="center">
                    {s.status === "반려" ? (
                      <Button color="error" onClick={() => handleRejectClick(s)}>
                        반려
                      </Button>
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
    </Box>
  );
};

export default SupplierList;