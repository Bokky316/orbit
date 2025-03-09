import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const SupplierRegistrationPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessNo: "",
    companyName: "",
    ceoName: "",
    businessType: "",
    businessCategory: "",
    sourcingCategory: "",
    sourcingSubCategory: "",
    sourcingMinorCategory: "",
    managerName: "",
    managerPosition: "",
    managerPhone: "",
    managerMobile: "",
    managerEmail: "",
    zipCode: "",
    address: "",
    detailAddress: "",
    businessCert: null,
    comments: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "businessNo") {
      let numericValue = value.replace(/[^0-9]/g, "");
      if (numericValue.length <= 3) {
        numericValue = numericValue;
      } else if (numericValue.length <= 5) {
        numericValue = `${numericValue.slice(0, 3)}-${numericValue.slice(3)}`;
      } else if (numericValue.length <= 10) {
        numericValue = `${numericValue.slice(0, 3)}-${numericValue.slice(3, 5)}-${numericValue.slice(5)}`;
      } else {
        numericValue = `${numericValue.slice(0, 3)}-${numericValue.slice(3, 5)}-${numericValue.slice(5, 10)}`;
      }
      setFormData({ ...formData, [name]: numericValue });
    } else if (name === "zipCode") {
      setFormData({ ...formData, [name]: value.replace(/[^0-9]/g, "").slice(0, 5) });
    } else if (name === "managerPhone" || name === "managerMobile") {
      setFormData({ ...formData, [name]: value.replace(/[^0-9]/g, "").slice(0, 11) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, businessCert: e.target.files[0] });
  };

  const handleZipCodeSearch = () => {
    alert("우편번호 검색 기능은 추후 추가 예정입니다.");
  };

  const handleSubmit = async () => {
    console.log("제출된 데이터:", formData);
    alert("협력업체 등록 완료!");
    navigate("/supplier-registrations"); // 수정된 경로로 이동
  };

  return (
    <Box sx={{ width: "60%", margin: "auto", mt: 5, p: 3, border: "1px solid #ccc", borderRadius: 2 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>협력업체 등록</Typography>

      {/* 기본 정보 */}
      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>기본 정보</Typography>
      <Grid container spacing={2}>
        <Grid item xs={9}>
          <TextField
            label="사업자등록번호"
            name="businessNo"
            fullWidth
            value={formData.businessNo}
            onChange={handleInputChange}
            helperText="사업자등록번호는 000-00-00000 형식으로 입력됩니다."
          />
        </Grid>
        <Grid item xs={6}>
          <TextField label="회사명" name="companyName" fullWidth onChange={handleInputChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="대표자명" name="ceoName" fullWidth onChange={handleInputChange} />
        </Grid>
      </Grid>

      {/* 소싱 카테고리 */}
      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>소싱 카테고리</Typography>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <FormControl fullWidth>
            <InputLabel>소싱 대분류</InputLabel>
            <Select name="sourcingCategory" value={formData.sourcingCategory} onChange={handleInputChange}>
              <MenuItem value="하드웨어">하드웨어</MenuItem>
              <MenuItem value="소프트웨어">소프트웨어</MenuItem>
              <MenuItem value="서비스">서비스</MenuItem>
              <MenuItem value="전자제품">전자제품</MenuItem>
              <MenuItem value="기타">기타</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={4}>
          <FormControl fullWidth>
            <InputLabel>소싱 중분류</InputLabel>
            <Select name="sourcingSubCategory" value={formData.sourcingSubCategory} onChange={handleInputChange}>
              <MenuItem value="컴퓨터 장비">컴퓨터 장비</MenuItem>
              <MenuItem value="네트워크 장비">네트워크 장비</MenuItem>
              <MenuItem value="보안 솔루션">보안 솔루션</MenuItem>
              <MenuItem value="클라우드 서비스">클라우드 서비스</MenuItem>
              <MenuItem value="서버">서버</MenuItem>
              <MenuItem value="네트워크">네트워크</MenuItem>
              <MenuItem value="스토리지">스토리지</MenuItem>
              <MenuItem value="보안 솔루션">보안 솔루션</MenuItem>
              <MenuItem value="소프트웨어 개발">소프트웨어 개발</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={4}>
          <FormControl fullWidth>
            <InputLabel>소싱 소분류</InputLabel>
            <Select name="sourcingMinorCategory" value={formData.sourcingMinorCategory} onChange={handleInputChange}>
              <MenuItem value="기타서버">기타서버</MenuItem>
              <MenuItem value="개발툴">개발툴</MenuItem>
              <MenuItem value="전자기기">전자기기</MenuItem>
              <MenuItem value="통신 공사">통신 공사</MenuItem>
              <MenuItem value="PKG SI 개발">PKG SI 개발</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* 담당자 정보 */}
      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>담당자 정보</Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField label="전화번호" name="managerPhone" fullWidth value={formData.managerPhone} onChange={handleInputChange} helperText="전화번호는 11자리 숫자로 입력하세요." />
        </Grid>
        <Grid item xs={6}>
          <TextField label="휴대전화번호" name="managerMobile" fullWidth value={formData.managerMobile} onChange={handleInputChange} helperText="휴대전화번호는 11자리 숫자로 입력하세요." />
        </Grid>
      </Grid>

      {/* 본사 주소 */}
      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>본사 주소</Typography>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Button variant="outlined" onClick={handleZipCodeSearch}>우편번호 검색</Button>
        </Grid>
        <Grid item xs={8}>
          <TextField label="우편번호" name="zipCode" fullWidth value={formData.zipCode} onChange={handleInputChange} helperText="우편번호는 5자리 숫자로 입력하세요." />
        </Grid>
        <Grid item xs={12}>
          <TextField label="주소" name="address" fullWidth onChange={handleInputChange} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="상세주소" name="detailAddress" fullWidth onChange={handleInputChange} />
        </Grid>
      </Grid>

      {/* 첨부서류 */}
      <Box sx={{ border: "1px solid #ccc", borderRadius: 1, p: 2, mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>첨부서류</Typography>
        <Typography>사업자등록증</Typography>
        <input type="file" name="businessCert" onChange={handleFileChange} />
      </Box>

      {/* 의견 */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>의견</Typography>
        <TextField name="comments" fullWidth multiline rows={3} onChange={handleInputChange} />
      </Box>

      {/* 등록 버튼 */}
      <Box sx={{ mt: 3, textAlign: "right" }}>
        <Button variant="contained" color="primary" sx={{ mr: 2 }} onClick={handleSubmit}>등록</Button>
        <Button variant="outlined" color="secondary" onClick={() => window.history.back()}>취소</Button>
      </Box>
    </Box>
  );
};

export default SupplierRegistrationPage;
