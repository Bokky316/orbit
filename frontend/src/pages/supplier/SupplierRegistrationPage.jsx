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
  const navigate = useNavigate(); // useNavigate 훅 사용
  const [formData, setFormData] = useState({
    businessNo: "",
    businessFile: null,
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

  const [errors, setErrors] = useState({
    businessNo: "",
    companyName: "",
    ceoName: "",
    zipCode: "",
    address: "",
    detailAddress: "",
    managerPhone: "",
    managerMobile: "",
    managerEmail: "",
  });

  const validateForm = () => {
    let newErrors = {};
    if (!formData.businessNo) {
      newErrors.businessNo = "사업자등록번호는 필수 입력 항목입니다.";
    }
    if (!formData.companyName) {
      newErrors.companyName = "회사명은 필수 입력 항목입니다.";
    }
    if (!formData.ceoName) {
      newErrors.ceoName = "대표자명은 필수 입력 항목입니다.";
    }
    if (!formData.zipCode) {
      newErrors.zipCode = "우편번호는 필수 입력 항목입니다.";
    }
    if (!formData.address) {
      newErrors.address = "주소는 필수 입력 항목입니다.";
    }
    if (!formData.detailAddress) {
      newErrors.detailAddress = "상세주소는 필수 입력 항목입니다.";
    }
    if (!formData.managerPhone) {
      newErrors.managerPhone = "전화번호는 필수 입력 항목입니다.";
    } else if (formData.managerPhone.length !== 11) {
      newErrors.managerPhone = "전화번호는 11자리 숫자로 입력해야 합니다.";
    }
    if (!formData.managerMobile) {
      newErrors.managerMobile = "휴대전화번호는 필수 입력 항목입니다.";
    } else if (formData.managerMobile.length !== 11) {
      newErrors.managerMobile = "휴대전화번호는 11자리 숫자로 입력해야 합니다.";
    }
    if (!formData.managerEmail) {
      newErrors.managerEmail = "이메일은 필수 입력 항목입니다.";
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.managerEmail)) {
      newErrors.managerEmail = "올바른 이메일 형식이 아닙니다.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setErrors({ ...errors, [name]: "" });  // 에러 메시지 초기화

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
      let numericValue = value.replace(/[^0-9]/g, "");
      if (numericValue.length <= 5) {
        setFormData({ ...formData, [name]: numericValue });
      }
    } else if (name === "managerPhone" || name === "managerMobile") {
      let numericValue = value.replace(/[^0-9]/g, "");
      setFormData({ ...formData, [name]: numericValue });
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
    if (!validateForm()) {
      for (const key in errors) {
        if (errors[key]) {
          const element = document.querySelector(`input[name=${key}]`);
          if (element) {
            element.focus();
            break;
          }
        }
      }
      return;
    }

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
      navigate("/supplier-review", { state: formData }); // Review 페이지로 데이터 전달
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
          <TextField
            label="사업자등록번호"
            name="businessNo"
            fullWidth
            required
            onChange={handleInputChange}
            value={formData.businessNo}
            inputProps={{
              maxLength: 12,
              pattern: "[0-9-]*",
              inputMode: "numeric",
            }}
            helperText={errors.businessNo || "숫자만 입력하면 자동으로 하이픈이 추가됩니다 (예: 123-45-67890)"}
            error={!!errors.businessNo}
          />
        </Grid>
        <Grid item xs={4}>
          <input type="file" name="businessFile" onChange={handleFileChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="회사명"
            name="companyName"
            fullWidth
            required
            onChange={handleInputChange}
            value={formData.companyName}
            helperText={errors.companyName}
            error={!!errors.companyName}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="대표자명"
            name="ceoName"
            fullWidth
            required
            onChange={handleInputChange}
            value={formData.ceoName}
            helperText={errors.ceoName}
            error={!!errors.ceoName}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField label="업태" name="businessType" fullWidth onChange={handleInputChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="업종" name="businessCategory" fullWidth onChange={handleInputChange} />
        </Grid>
        <Grid item xs={4}>
          <FormControl fullWidth>
            <InputLabel id="sourcing-category-label">소싱대분류</InputLabel>
            <Select
              labelId="sourcing-category-label"
              name="sourcingCategory"
              value={formData.sourcingCategory}
              onChange={handleInputChange}
              label="소싱대분류"
            >
              <MenuItem value="하드웨어">하드웨어</MenuItem>
              <MenuItem value="소프트웨어">소프트웨어</MenuItem>
              <MenuItem value="서비스">서비스</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={4}>
          <FormControl fullWidth>
            <InputLabel id="sourcing-sub-category-label">소싱중분류</InputLabel>
            <Select
              labelId="sourcing-sub-category-label"
              name="sourcingSubCategory"
              value={formData.sourcingSubCategory}
              onChange={handleInputChange}
              label="소싱중분류"
            >
              <MenuItem value="컴퓨터 장비">컴퓨터 장비</MenuItem>
              <MenuItem value="네트워크 장비">네트워크 장비</MenuItem>
              <MenuItem value="보안 솔루션">보안 솔루션</MenuItem>
              <MenuItem value="클라우드 서비스">클라우드 서비스</MenuItem>
              <MenuItem value="서버">서버</MenuItem>
              <MenuItem value="소프트웨어 개발">소프트웨어 개발</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={4}>
          <FormControl fullWidth>
            <InputLabel id="sourcing-minor-category-label">소싱소분류</InputLabel>
            <Select
              labelId="sourcing-minor-category-label"
              name="sourcingMinorCategory"
              value={formData.sourcingMinorCategory}
              onChange={handleInputChange}
              label="소싱소분류"
            >
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
          <TextField
            label="전화번호"
            name="managerPhone"
            fullWidth
            required
            onChange={handleInputChange}
            inputProps={{
              maxLength: 11,
              inputMode: "numeric",
              pattern: "[0-9]*"
            }}
            helperText={errors.managerPhone || "전화번호 11자리를 입력해주세요"}
            error={!!errors.managerPhone}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="휴대전화번호"
            name="managerMobile"
            fullWidth
            required
            onChange={handleInputChange}
            inputProps={{
              maxLength: 11,
              inputMode: "numeric",
              pattern: "[0-9]*"
            }}
            helperText={errors.managerMobile || "휴대전화번호 11자리를 입력해주세요"}
            error={!!errors.managerMobile}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="이메일"
            name="managerEmail"
            fullWidth
            required
            onChange={handleInputChange}
            helperText={errors.managerEmail || "유효한 이메일 주소를 입력해주세요 (예: example@example.com)"}
            error={!!errors.managerEmail}
          />
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
          <TextField
            label="우편번호"
            name="zipCode"
            fullWidth
            required
            onChange={handleInputChange}
            inputProps={{
              maxLength: 5,
              inputMode: "numeric",
              pattern: "[0-9]*"
            }}
            helperText={errors.zipCode || "우편번호는 5자리 숫자로 입력해야 합니다."}
            error={!!errors.zipCode}
          />
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
