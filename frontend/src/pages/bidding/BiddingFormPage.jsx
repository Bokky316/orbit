import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress
} from "@mui/material";

function BiddingFormPage(props) {
  const { mode = "create", biddingId, onSave, onCancel } = props;

  // 초기 상태 설정
  const initialFormData = {
    projectCode: "",
    projectName: "",
    supplier: "",
    itemQuantity: 0,
    unitPrice: 0,
    supplyPrice: 0,
    vat: 0,
    billingUnit: "",
    biddingConditions: "",
    deadline: "",
    internalNote: "",
    status: "대기중"
  };

  // 상태 관리
  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [fileList, setFileList] = useState([]);

  // 수정 모드일 경우 데이터 가져오기
  useEffect(() => {
    function fetchBiddingData() {
      if (mode === "edit" && biddingId) {
        try {
          setIsLoading(true);
          // API 호출로 데이터 가져오기 (임시로 setTimeout 사용)
          setTimeout(() => {
            // 임시 데이터로 셋업 (실제로는 API 응답으로 대체)
            const mockData = {
              id: biddingId,
              projectCode: "PRJ-2023-001",
              projectName: "시스템 구축 프로젝트",
              supplier: "테크놀로지 주식회사",
              itemQuantity: 10,
              unitPrice: 100000,
              supplyPrice: 1000000,
              vat: 100000,
              billingUnit: "개",
              biddingConditions: "납품 후 검수 필요",
              deadline: "2023-12-31",
              internalNote: "내부 검토 필요",
              status: "진행중"
            };
            setFormData(mockData);
            setIsLoading(false);
          }, 1000);
        } catch (error) {
          console.error("데이터 로딩 중 오류 발생:", error);
          setIsLoading(false);
        }
      }
    }

    fetchBiddingData();
  }, [mode, biddingId]);

  // 금액 계산 로직
  function calculatePrices(quantity, price) {
    const supplyPrice = price * quantity;
    const vat = supplyPrice * 0.1;

    setFormData((prev) => ({
      ...prev,
      supplyPrice,
      vat
    }));
  }

  // 입력 핸들러
  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  // 셀렉트 변경 핸들러
  function handleSelectChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  // 수량 및 단가 변경 핸들러
  function handleNumberChange(name, value) {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // 수량이나 단가가 변경되면 금액 재계산
    if (name === "itemQuantity") {
      calculatePrices(value, formData.unitPrice);
    } else if (name === "unitPrice") {
      calculatePrices(formData.itemQuantity, value);
    }
  }

  // 날짜 변경 핸들러
  function handleDateChange(event) {
    const { value } = event.target;
    setFormData((prev) => ({
      ...prev,
      deadline: value
    }));
  }

  // 파일 변경 핸들러
  function handleFileChange(event) {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files);
      setFileList((prev) => [...prev, ...newFiles]);

      // formData에도 파일 정보 추가
      setFormData((prev) => ({
        ...prev,
        files: [...(prev.files || []), ...newFiles]
      }));
    }
  }

  // 저장 핸들러
  function handleSave() {
    if (onSave) {
      onSave(formData);
    } else {
      console.log("저장된 데이터:", formData);
      // 여기서 API 호출을 통해 서버에 데이터 저장
    }
  }

  // 취소 핸들러
  function handleCancel() {
    if (onCancel) {
      onCancel();
    } else {
      console.log("작업 취소");
      // 취소 로직 (예: 이전 페이지로 돌아가기)
    }
  }

  // 프로젝트 선택 핸들러
  function handleProjectSelect(projectCode, projectName) {
    setFormData((prev) => ({
      ...prev,
      projectCode,
      projectName
    }));
    setIsProjectModalOpen(false);
  }

  // 공급자 선택 핸들러
  function handleSupplierSelect(supplier) {
    setFormData((prev) => ({
      ...prev,
      supplier
    }));
    setIsSupplierModalOpen(false);
  }

  // 로딩 중일 때
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh"
        }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        {mode === "create" ? "입찰 공고 등록" : "입찰 공고 수정"}
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* 프로젝트 선택 */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="프로젝트 코드"
              name="projectCode"
              value={formData.projectCode}
              onClick={() => setIsProjectModalOpen(true)}
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="프로젝트명"
              name="projectName"
              value={formData.projectName}
              InputProps={{ readOnly: true }}
            />
          </Grid>

          {/* 공급자 선택 */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="거래처(공급자)"
              name="supplier"
              value={formData.supplier}
              onClick={() => setIsSupplierModalOpen(true)}
              InputProps={{ readOnly: true }}
            />
          </Grid>

          {/* 품목 및 수량 */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="품목 수량"
              name="itemQuantity"
              type="number"
              value={formData.itemQuantity}
              onChange={(e) =>
                handleNumberChange("itemQuantity", Number(e.target.value))
              }
            />
          </Grid>

          {/* 가격 관련 입력 */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="단가"
              name="unitPrice"
              type="number"
              value={formData.unitPrice}
              onChange={(e) =>
                handleNumberChange("unitPrice", Number(e.target.value))
              }
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="공급가액"
              name="supplyPrice"
              value={formData.supplyPrice}
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="부가세"
              name="vat"
              value={formData.vat}
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="billing-unit-label">과금 단위</InputLabel>
              <Select
                labelId="billing-unit-label"
                name="billingUnit"
                value={formData.billingUnit}
                label="과금 단위"
                onChange={handleSelectChange}>
                <MenuItem value="개">개</MenuItem>
                <MenuItem value="세트">세트</MenuItem>
                <MenuItem value="개월">개월</MenuItem>
                <MenuItem value="시간">시간</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="status-label">상태</InputLabel>
              <Select
                labelId="status-label"
                name="status"
                value={formData.status}
                label="상태"
                onChange={handleSelectChange}>
                <MenuItem value="대기중">대기중</MenuItem>
                <MenuItem value="진행중">진행중</MenuItem>
                <MenuItem value="마감">마감</MenuItem>
                <MenuItem value="취소">취소</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* 입찰 조건 및 마감 시간 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="입찰 조건"
              name="biddingConditions"
              multiline
              rows={4}
              value={formData.biddingConditions}
              onChange={handleInputChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="마감 일자"
              name="deadline"
              type="date"
              value={formData.deadline}
              onChange={handleDateChange}
              InputLabelProps={{
                shrink: true
              }}
            />
          </Grid>

          {/* 비고 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="비고 (내부용)"
              name="internalNote"
              multiline
              rows={4}
              value={formData.internalNote}
              onChange={handleInputChange}
            />
          </Grid>

          {/* 파일 업로드 */}
          <Grid item xs={12}>
            <Button variant="contained" component="label">
              파일 등록
              <input type="file" multiple hidden onChange={handleFileChange} />
            </Button>
            {fileList.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">선택된 파일:</Typography>
                <List>
                  {fileList.map((file, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={file.name} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* 프로젝트 선택 모달 */}
      <Dialog
        open={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}>
        <DialogTitle>프로젝트 선택</DialogTitle>
        <DialogContent>
          {/* 프로젝트 검색 및 선택 로직 */}
          <TextField
            fullWidth
            label="프로젝트명 검색"
            variant="outlined"
            sx={{ mt: 2, mb: 2 }}
          />
          <List>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() =>
                  handleProjectSelect("PRJ-2023-001", "시스템 구축 프로젝트")
                }>
                <ListItemText primary="PRJ-2023-001: 시스템 구축 프로젝트" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() =>
                  handleProjectSelect("PRJ-2023-002", "네트워크 인프라 개선")
                }>
                <ListItemText primary="PRJ-2023-002: 네트워크 인프라 개선" />
              </ListItemButton>
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsProjectModalOpen(false)}>취소</Button>
        </DialogActions>
      </Dialog>

      {/* 공급자 선택 모달 */}
      <Dialog
        open={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}>
        <DialogTitle>공급자 선택</DialogTitle>
        <DialogContent>
          {/* 공급자 검색 및 선택 로직 */}
          <TextField
            fullWidth
            label="공급자명 검색"
            variant="outlined"
            sx={{ mt: 2, mb: 2 }}
          />
          <List>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleSupplierSelect("테크놀로지 주식회사")}>
                <ListItemText primary="테크놀로지 주식회사" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleSupplierSelect("글로벌 IT 솔루션")}>
                <ListItemText primary="글로벌 IT 솔루션" />
              </ListItemButton>
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSupplierModalOpen(false)}>취소</Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          {mode === "create" ? "등록" : "수정"}
        </Button>
        <Button variant="outlined" onClick={handleCancel}>
          취소
        </Button>
      </Box>
    </Box>
  );
}

// PropTypes 정의
BiddingFormPage.propTypes = {
  mode: PropTypes.oneOf(["create", "edit"]),
  biddingId: PropTypes.number,
  onSave: PropTypes.func,
  onCancel: PropTypes.func
};

export default BiddingFormPage;
