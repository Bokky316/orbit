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
  Tabs,
  Tab,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux"; // Redux에서 role 가져오기

const SupplierReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useSelector((state) => state.auth); // 사용자의 역할 가져오기
  const [tabIndex, setTabIndex] = useState(0);
  const [supplier, setSupplier] = useState(null);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchSupplierDetails();
  }, []);

  const fetchSupplierDetails = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/supplier-registrations/${id}`);
      setSupplier(res.data);
      setFormData(res.data);
    } catch (error) {
      console.error("❌ 데이터 로딩 실패:", error.response?.data || error.message);
    }
  };

  const handleApprove = async () => {
    try {
      await axios.put(`http://localhost:8080/api/supplier-registrations/${id}/status`, {
        status: "APPROVED",
      });
      alert("승인되었습니다.");
      navigate("/supplier-registrations");
    } catch (error) {
      console.error("❌ 승인 실패:", error.response?.data || error.message);
    }
  };

  const handleReject = async () => {
    try {
      await axios.put(`http://localhost:8080/api/supplier-registrations/${id}/status`, {
        status: "REJECTED",
        rejectionReason: rejectReason,
      });
      alert("반려되었습니다.");
      setOpenRejectDialog(false);
      navigate("/supplier-registrations");
    } catch (error) {
      console.error("❌ 반려 실패:", error.response?.data || error.message);
    }
  };

  const handleSaveChanges = async () => {
    try {
      await axios.put(`http://localhost:8080/api/supplier-registrations/${id}`, formData);
      alert("수정이 완료되었습니다.");
      setIsEditing(false);
      fetchSupplierDetails();
    } catch (error) {
      console.error("❌ 수정 실패:", error.response?.data || error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  if (!supplier) return <Typography>로딩 중...</Typography>;

  return (
    <Box sx={{ width: "90%", margin: "auto", mt: 5 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>협력업체 등록대기 - 검토</Typography>

      {/* 탭 메뉴 */}
      <Tabs value={tabIndex} onChange={(e, newIndex) => setTabIndex(newIndex)} sx={{ mb: 3 }}>
        <Tab label="기본정보" />
        <Tab label="담당자정보" />
      </Tabs>

      {/* 기본 정보 (수정 가능하도록) */}
      {tabIndex === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>회사명</TableCell>
                <TableCell>
                  {isEditing ? (
                    <TextField name="companyName" value={formData.companyName} onChange={handleInputChange} fullWidth />
                  ) : (
                    supplier.companyName
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>사업자등록번호</TableCell>
                <TableCell>{supplier.businessNo}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>대표자명</TableCell>
                <TableCell>
                  {isEditing ? (
                    <TextField name="ceoName" value={formData.ceoName} onChange={handleInputChange} fullWidth />
                  ) : (
                    supplier.ceoName
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 담당자 정보 */}
      {tabIndex === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>담당자명</TableCell>
                <TableCell>직책</TableCell>
                <TableCell>전화번호</TableCell>
                <TableCell>이메일</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{supplier.managerName}</TableCell>
                <TableCell>{supplier.managerPosition}</TableCell>
                <TableCell>{supplier.managerPhone}</TableCell>
                <TableCell>{supplier.managerEmail}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 협력업체가 수정 가능하도록 버튼 제공 */}
      {role === "ROLE_SUPPLIER" && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          {isEditing ? (
            <>
              <Button variant="contained" color="primary" sx={{ mr: 2 }} onClick={handleSaveChanges}>
                저장
              </Button>
              <Button variant="outlined" color="secondary" onClick={() => setIsEditing(false)}>
                취소
              </Button>
            </>
          ) : (
            <Button variant="contained" color="warning" onClick={() => setIsEditing(true)}>
              수정
            </Button>
          )}
        </Box>
      )}

      {/* 관리자만 승인/반려 가능 */}
      {role === "ROLE_ADMIN" && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button variant="contained" color="success" sx={{ mr: 2 }} onClick={handleApprove}>
            승인
          </Button>
          <Button variant="contained" color="error" onClick={() => setOpenRejectDialog(true)}>
            반려
          </Button>
        </Box>
      )}

      {/* 반려 사유 입력 다이얼로그 */}
      <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)}>
        <DialogTitle>반려 사유 입력</DialogTitle>
        <DialogContent>
          <TextField
            label="반려 사유"
            fullWidth
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectDialog(false)} color="secondary">취소</Button>
          <Button onClick={handleReject} color="error">반려</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupplierReviewPage;
