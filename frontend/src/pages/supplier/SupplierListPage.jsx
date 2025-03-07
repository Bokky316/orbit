import React, { useState, useEffect } from "react";
import axios from "axios";
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
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { useNavigate } from "react-router-dom";  // ✅ 페이지 이동을 위한 훅 추가

const SupplierList = () => {
  const navigate = useNavigate();  // ✅ 페이지 이동을 위한 함수
  const [suppliers, setSuppliers] = useState([]);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [minorCategory, setMinorCategory] = useState("");
  const [searchName, setSearchName] = useState("");
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);

  useEffect(() => {
    fetchSuppliers();
  }, [status]);

  useEffect(() => {
    filterSuppliers();
  }, [searchName, category, subCategory, minorCategory, suppliers]);

  const fetchSuppliers = async () => {
    try {
      let url = "http://localhost:8080/api/supplier-registrations";
      if (status) {
        url += `?status=${status}`;
      }

      const res = await axios.get(url, { withCredentials: true });
      setSuppliers(res.data);
    } catch (error) {
      console.error("❌ 서버 요청 실패:", error.response?.data || error.message);
      alert(`서버 오류: ${error.response?.data || "알 수 없는 오류 발생"}`);
    }
  };

  const filterSuppliers = () => {
    let filtered = suppliers.filter((s) =>
      s.supplierName.toLowerCase().includes(searchName.toLowerCase())
    );

    if (category) filtered = filtered.filter((s) => s.sourcingCategory === category);
    if (subCategory) filtered = filtered.filter((s) => s.sourcingSubCategory === subCategory);
    if (minorCategory) filtered = filtered.filter((s) => s.businessCategory === minorCategory);

    setFilteredSuppliers(filtered);
  };

  return (
    <Box sx={{ width: "95%", margin: "20px auto", textAlign: "center" }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        협력업체 목록
      </Typography>

      {/* ✅ 등록 버튼 추가 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/supplier-registrations/new")}
        >
          협력업체 등록
        </Button>
      </Box>

      {/* 필터 섹션 */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2, gap: 2 }}>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          sx={{ minWidth: 150 }}
          displayEmpty
        >
          <MenuItem value="">소싱대분류</MenuItem>
          <MenuItem value="하드웨어">하드웨어</MenuItem>
          <MenuItem value="소프트웨어">소프트웨어</MenuItem>
          <MenuItem value="전자제품">전자제품</MenuItem>
          <MenuItem value="공사">공사</MenuItem>
          <MenuItem value="용역">용역</MenuItem>
        </Select>

        <Select
          value={subCategory}
          onChange={(e) => setSubCategory(e.target.value)}
          sx={{ minWidth: 150 }}
          displayEmpty
        >
          <MenuItem value="">소싱중분류</MenuItem>
          <MenuItem value="서버">서버</MenuItem>
          <MenuItem value="소프트웨어">소프트웨어</MenuItem>
          <MenuItem value="스마트폰">스마트폰</MenuItem>
          <MenuItem value="공사">공사</MenuItem>
          <MenuItem value="개발용역">개발용역</MenuItem>
        </Select>

        <Select
          value={minorCategory}
          onChange={(e) => setMinorCategory(e.target.value)}
          sx={{ minWidth: 150 }}
          displayEmpty
        >
          <MenuItem value="">소싱소분류</MenuItem>
          <MenuItem value="기타서버">기타서버</MenuItem>
          <MenuItem value="개발툴">개발툴</MenuItem>
          <MenuItem value="전자기기">전자기기</MenuItem>
          <MenuItem value="통신 공사">통신 공사</MenuItem>
          <MenuItem value="PKG SI 개발">PKG SI 개발</MenuItem>
        </Select>

        <TextField
          label="업체명"
          variant="outlined"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          sx={{ minWidth: 200 }}
        />
      </Box>

      {/* 테이블 */}
      <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell align="center">소싱대분류</TableCell>
              <TableCell align="center">소싱중분류</TableCell>
              <TableCell align="center">소싱소분류</TableCell>
              <TableCell align="center">업체명</TableCell>
              <TableCell align="center">업태</TableCell>
              <TableCell align="center">업종</TableCell>
              <TableCell align="center">사업자등록번호</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell align="center">{s.sourcingCategory}</TableCell>
                  <TableCell align="center">{s.sourcingSubCategory}</TableCell>
                  <TableCell align="center">{s.businessCategory}</TableCell>
                  <TableCell align="center">
                    {/* ✅ 업체명 클릭 시 상세 페이지로 이동 */}
                    <Button
                      variant="text"
                      color="primary"
                      onClick={() => navigate(`/supplier-review/${s.id}`)}
                    >
                      {s.supplierName}
                    </Button>
                  </TableCell>
                  <TableCell align="center">{s.businessType}</TableCell>
                  <TableCell align="center">{s.businessCategory}</TableCell>
                  <TableCell align="center">{s.businessNo}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  검색된 업체가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SupplierList;