import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";

const SupplierRegistrationPage = () => {
  const [formData, setFormData] = useState({
    businessNo: "",
    businessFile: null,
    companyName: "",
    ceoName: "",
    businessType: "",
    businessCategory: "",
    sourcingCategory: "",
    sourcingSubCategory: "",
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
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, businessCert: e.target.files[0] });
  };

  const handleZipCodeSearch = () => {
    alert("우편번호 검색 기능은 추후 추가 예정입니다.");
  };

  const handleSubmit = async () => {
    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });

    try {
      const response = await fetch("http://localhost:8080/api/supplier-registrations", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error("등록 실패");
      }

      alert("등록이 완료되었습니다.");
    } catch (error) {
      alert("오류 발생: " + error.message);
    }
  };

  return (
    <Box sx={{ width: "60%", margin: "auto", mt: 5, p: 3, border: "1px solid #ccc", borderRadius: 2 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        협력업체 등록
      </Typography>

      {/* 기본 정보 */}
      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
        기본 정보
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={8}>
          <TextField label="사업자등록번호" name="businessNo" fullWidth required onChange={handleInputChange} />
        </Grid>
        <Grid item xs={4}>
          <input type="file" name="businessFile" onChange={handleFileChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="회사명" name="companyName" fullWidth required onChange={handleInputChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="대표자명" name="ceoName" fullWidth required onChange={handleInputChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="업태" name="businessType" fullWidth required onChange={handleInputChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="업종" name="businessCategory" fullWidth required onChange={handleInputChange} />
        </Grid>
        <Grid item xs={6}>
          <Select name="sourcingCategory" fullWidth value={formData.sourcingCategory} onChange={handleInputChange}>
            <MenuItem value="">소싱대분류 선택</MenuItem>
            <MenuItem value="하드웨어">하드웨어</MenuItem>
            <MenuItem value="소프트웨어">소프트웨어</MenuItem>
          </Select>
        </Grid>
        <Grid item xs={6}>
          <Select name="sourcingSubCategory" fullWidth value={formData.sourcingSubCategory} onChange={handleInputChange}>
            <MenuItem value="">소싱중분류 선택</MenuItem>
            <MenuItem value="서버">서버</MenuItem>
            <MenuItem value="소프트웨어 개발">소프트웨어 개발</MenuItem>
          </Select>
        </Grid>
      </Grid>

      {/* 담당자 정보 */}
      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
        담당자 정보
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField label="담당자명" name="managerName" fullWidth onChange={handleInputChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="직책" name="managerPosition" fullWidth onChange={handleInputChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="전화번호" name="managerPhone" fullWidth onChange={handleInputChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="휴대전화번호" name="managerMobile" fullWidth onChange={handleInputChange} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="이메일" name="managerEmail" fullWidth onChange={handleInputChange} />
        </Grid>
      </Grid>

      {/* 본사 주소 */}
      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
        본사 주소
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Button variant="outlined" color="primary" onClick={handleZipCodeSearch}>
            우편번호 검색
          </Button>
        </Grid>
        <Grid item xs={8}>
          <TextField label="우편번호" name="zipCode" fullWidth required onChange={handleInputChange} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="주소" name="address" fullWidth required onChange={handleInputChange} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="상세주소" name="detailAddress" fullWidth required onChange={handleInputChange} />
        </Grid>
      </Grid>

      {/* 첨부서류 */}
      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
        첨부서류
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography>사업자등록증</Typography>
          <input type="file" name="businessCert" onChange={handleFileChange} />
        </Grid>
      </Grid>

      {/* 의견 */}
      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
        의견
      </Typography>
      <TextField name="comments" fullWidth multiline rows={3} onChange={handleInputChange} />

      {/* 버튼 */}
      <Box sx={{ mt: 3, textAlign: "right" }}>
        <Button variant="contained" color="primary" sx={{ mr: 2 }} onClick={handleSubmit}>
          등록
        </Button>
        <Button variant="outlined" color="secondary" onClick={() => window.history.back()}>
          취소
        </Button>
      </Box>
    </Box>
  );
};

export default SupplierRegistrationPage;