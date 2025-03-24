import React, { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import moment from "moment";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  CircularProgress,
  Alert
} from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";

import {
  getUnitCodeById,
  formatNumber,
  parsePrice,
  getUnitDisplayNameById
} from "../helpers/commonBiddingHelpers";

function PurchaseRequestSelectionDialog({
  open,
  onClose,
  purchaseRequests,
  onComplete,
  initialPurchaseRequest = null,
  initialSelectedItems = []
}) {
  // 현재 단계 (0: 구매요청 선택, 1: 품목 선택)
  const [activeStep, setActiveStep] = useState(0);

  // 검색어 및 선택 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(
    initialPurchaseRequest
  );
  const [selectedItems, setSelectedItems] = useState(initialSelectedItems);

  // 품목 검색어
  const [itemSearchTerm, setItemSearchTerm] = useState("");

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);

  // 에러 상태
  const [error, setError] = useState(null);

  // 구매 요청 선택 핸들러
  const handleRequestSelect = async (request) => {
    try {
      setIsLoading(true);
      setError(null);

      // 이미 품목 데이터가 있는지 확인
      if (
        request.purchaseRequestItems &&
        request.purchaseRequestItems.length > 0
      ) {
        console.log(
          "이미 품목 데이터가 있습니다:",
          request.purchaseRequestItems
        );
        setSelectedRequest(request);
        setSelectedItems([]);
        setActiveStep(1);
        return;
      }

      // 여기서 실제로는 API 호출을 통해 품목 데이터를 가져와야 함
      //const items = await fetchPurchaseRequestItems(request.id);

      // 임시 시뮬레이션 (실제 구현에서는 API 호출 필요)
      setTimeout(() => {
        // 백엔드 entity 구조에 맞게 필드명 매핑
        const enrichedRequest = {
          ...request,
          purchaseRequestItems: request.items || [] // 이미 로드된 품목이 있으면 사용
        };

        setSelectedRequest(enrichedRequest);
        setSelectedItems([]);
        setActiveStep(1);
        setIsLoading(false);
      }, 500);
    } catch (err) {
      console.error("품목 데이터를 가져오는 중 오류 발생:", err);
      setError("품목 데이터를 가져오는 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  // 품목 선택 핸들러
  const handleItemSelect = (itemId) => {
    console.log("선택된 품목 ID:", itemId);

    // 품목 ID 배열에 저장
    setSelectedItems([itemId]);

    // 선택된 품목을 찾아서 콘솔에 출력 - 디버깅 용도
    const selectedItem = requestItems.find((item) => item.id === itemId);
    console.log("선택된 품목 데이터:", selectedItem);
  };

  // 완료 핸들러
  // handleComplete 함수 수정
  const handleComplete = () => {
    if (selectedRequest && selectedItems.length === 1) {
      const items = requestItems;
      const selectedItem = items.find((item) => item.id === selectedItems[0]);

      if (selectedItem) {
        console.log("완료 시 선택된 요청:", selectedRequest);
        console.log("완료 시 선택된 품목:", selectedItem);

        // 백엔드 entity 구조에 맞게 데이터 매핑
        // PurchaseRequest 엔티티에 맞춤
        const requestData = {
          ...selectedRequest,
          id: selectedRequest.id,
          // 백엔드 entity 필드명과 프론트엔드 필드명 모두 포함
          request_number:
            selectedRequest.requestNumber ||
            selectedRequest.request_number ||
            selectedRequest.id,
          requestNumber:
            selectedRequest.requestNumber ||
            selectedRequest.request_number ||
            selectedRequest.id,
          requestName:
            selectedRequest.requestName ||
            selectedRequest.request_name ||
            selectedRequest.title ||
            "",
          // 중요: ID가 반드시 숫자 타입이어야 함
          purchase_request_id: parseInt(selectedRequest.id, 10),
          purchaseRequestId: parseInt(selectedRequest.id, 10),
          business_department:
            selectedRequest.businessDepartment ||
            selectedRequest.business_department ||
            "",
          business_manager:
            selectedRequest.businessManager ||
            selectedRequest.business_manager ||
            ""
        };

        // PurchaseRequestItem 엔티티에 맞춤
        const itemData = {
          ...selectedItem,
          id: parseInt(selectedItem.id, 10), // 숫자 타입 보장
          // 백엔드 entity 필드명
          purchase_request_item_id: parseInt(selectedItem.id, 10),
          // 프론트엔드 필드명
          purchaseRequestItemId: parseInt(selectedItem.id, 10),
          // 품목 정보
          item_name: selectedItem.itemName || selectedItem.item_name || "",
          itemName: selectedItem.itemName || selectedItem.item_name || "",
          specification: selectedItem.specification || "",
          quantity: parseFloat(selectedItem.quantity) || 0,
          // 단가 및 금액 정보
          unit_price: parsePrice(
            selectedItem.unitPrice || selectedItem.unit_price || 0
          ),
          unitPrice: parsePrice(
            selectedItem.unitPrice || selectedItem.unit_price || 0
          ),
          total_price: parsePrice(
            selectedItem.totalPrice || selectedItem.total_price || 0
          ),
          totalPrice: parsePrice(
            selectedItem.totalPrice || selectedItem.total_price || 0
          ),
          // 단위 코드
          unit_child_code:
            selectedItem.unitChildCode || selectedItem.unit_child_code || "49",
          unitChildCode:
            selectedItem.unitChildCode || selectedItem.unit_child_code || "49",
          // 배송 정보
          delivery_location:
            selectedItem.deliveryLocation ||
            selectedItem.delivery_location ||
            "",
          deliveryLocation:
            selectedItem.deliveryLocation ||
            selectedItem.delivery_location ||
            "",
          delivery_request_date:
            selectedItem.deliveryRequestDate ||
            selectedItem.delivery_request_date ||
            null,
          deliveryRequestDate:
            selectedItem.deliveryRequestDate ||
            selectedItem.delivery_request_date ||
            null
        };

        console.log(
          "완료 시 전달할 데이터:",
          requestData,
          parseInt(selectedItems[0], 10),
          itemData
        );
        // 중요: selectedItems[0]도 숫자 타입 보장
        onComplete(requestData, parseInt(selectedItems[0], 10), itemData);
      }
    }
    onClose();
  };

  // 이전 단계로 이동
  const handleBack = () => {
    setActiveStep(0);
  };

  // 검색어를 기반으로 구매 요청 필터링
  const filteredPurchaseRequests = useMemo(() => {
    if (!Array.isArray(purchaseRequests)) {
      console.error("purchaseRequests가 배열이 아닙니다:", purchaseRequests);
      return [];
    }

    return purchaseRequests.filter(
      (request) =>
        (request.requestName || request.request_name || request.title || "")
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (
          request.requestNumber ||
          request.request_number ||
          request.id?.toString() ||
          ""
        ).includes(searchTerm) ||
        (request.id?.toString() || "").includes(searchTerm)
    );
  }, [purchaseRequests, searchTerm]);

  // 선택된 구매 요청의 품목 목록
  const requestItems = useMemo(() => {
    if (!selectedRequest) return [];
    //console.log("선택된 요청 데이터:", selectedRequest);

    // 품목 데이터 소스 확인 (DB 테이블 구조에 맞게 조정)
    let items = [];

    // 다양한 형태의 데이터 구조 처리
    if (Array.isArray(selectedRequest.items)) {
      items = selectedRequest.items;
    } else if (Array.isArray(selectedRequest.purchaseRequestItems)) {
      items = selectedRequest.purchaseRequestItems;
    } else if (
      selectedRequest.purchaseRequestItemId ||
      selectedRequest.purchase_request_item_id
    ) {
      // 단일 품목이 직접 포함된 경우
      items = [
        {
          id:
            selectedRequest.purchaseRequestItemId ||
            selectedRequest.purchase_request_item_id,
          item_name:
            selectedRequest.itemName || selectedRequest.item_name || "",
          itemName: selectedRequest.itemName || selectedRequest.item_name || "",
          specification: selectedRequest.specification || "",
          quantity: selectedRequest.quantity || 0,
          unit_price:
            selectedRequest.unitPrice || selectedRequest.unit_price || 0,
          unitPrice:
            selectedRequest.unitPrice || selectedRequest.unit_price || 0,
          total_price:
            selectedRequest.totalPrice || selectedRequest.total_price || 0,
          totalPrice:
            selectedRequest.totalPrice || selectedRequest.total_price || 0,
          unit_child_code:
            selectedRequest.unitChildCode ||
            selectedRequest.unit_child_code ||
            "49",
          unitChildCode:
            selectedRequest.unitChildCode ||
            selectedRequest.unit_child_code ||
            "49",
          delivery_location:
            selectedRequest.deliveryLocation ||
            selectedRequest.delivery_location ||
            "",
          deliveryLocation:
            selectedRequest.deliveryLocation ||
            selectedRequest.delivery_location ||
            "",
          delivery_request_date:
            selectedRequest.deliveryRequestDate ||
            selectedRequest.delivery_request_date ||
            null,
          deliveryRequestDate:
            selectedRequest.deliveryRequestDate ||
            selectedRequest.delivery_request_date ||
            null
        }
      ];
    }

    //.log("요청에서 추출한 품목 데이터:", items);

    // 품목이 없는 경우 빈 배열 반환
    if (!items || items.length === 0) {
      console.warn("선택된 구매 요청에 품목이 없습니다.");
      return [];
    }

    return items.map((item) => {
      // 백엔드 entity 구조에 맞게 필드명 처리
      const itemId =
        item.id || item.purchase_request_item_id || item.purchaseRequestItemId;
      const itemName = item.item_name || item.itemName || "";
      const unitChildCode = item.unit_child_code || item.unitChildCode || "49";

      // 가격 정보 처리
      const unitPrice = parsePrice(item.unit_price || item.unitPrice || 0);
      const totalPrice = parsePrice(item.total_price || item.totalPrice || 0);
      const quantity = parseFloat(item.quantity) || 0;

      // 배송 정보
      const deliveryLocation =
        item.delivery_location || item.deliveryLocation || "";
      const deliveryRequestDate =
        item.delivery_request_date || item.deliveryRequestDate || null;

      // 표준화된 품목 데이터 반환
      return {
        id: itemId,
        purchase_request_item_id: itemId,
        purchaseRequestItemId: itemId,
        item_name: itemName,
        itemName: itemName,
        specification: item.specification || "",
        quantity: quantity,
        unit_price: unitPrice,
        unitPrice: unitPrice,
        total_price: totalPrice || unitPrice * quantity,
        totalPrice: totalPrice || unitPrice * quantity,
        unit_child_code: unitChildCode,
        unitChildCode: unitChildCode,
        unitDisplayName: getUnitDisplayNameById(unitChildCode),
        delivery_location: deliveryLocation,
        deliveryLocation: deliveryLocation,
        delivery_request_date: deliveryRequestDate,
        deliveryRequestDate: deliveryRequestDate,
        raw: item // 원본 데이터 보존
      };
    });
  }, [selectedRequest]);

  // 검색어를 기반으로 품목 필터링
  const filteredItems = useMemo(() => {
    if (!requestItems || requestItems.length === 0) return [];

    return requestItems.filter((item) => {
      const itemName = (item.itemName || item.item_name || "").toLowerCase();
      const specification = (item.specification || "").toLowerCase();
      const searchLower = itemSearchTerm.toLowerCase();

      return (
        itemName.includes(searchLower) || specification.includes(searchLower)
      );
    });
  }, [requestItems, itemSearchTerm]);

  // 컴포넌트 초기화
  useEffect(() => {
    if (open) {
      setSearchTerm("");
      setItemSearchTerm("");
      setError(null);

      // 초기 선택 구매 요청이 있는 경우, 해당 단계로 바로 이동
      if (initialPurchaseRequest) {
        setSelectedRequest(initialPurchaseRequest);
        setActiveStep(1);
      } else {
        setActiveStep(0);
      }
    }
  }, [open, initialPurchaseRequest]);

  // 구매 요청 선택 단계 렌더링
  const renderRequestSelection = () => (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "background.paper",
          pb: 2,
          pt: 2
        }}>
        <TextField
          fullWidth
          label="구매 요청명 또는 번호 검색"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
          }}
          sx={{ mt: 1 }}
        />
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: "auto", pt: 1 }}>
        {filteredPurchaseRequests.length > 0 ? (
          <List disablePadding>
            {filteredPurchaseRequests.map((request) => (
              <ListItem
                key={
                  request.requestNumber || request.request_number || request.id
                }
                disableGutters
                sx={{
                  mb: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  overflow: "hidden"
                }}>
                <ListItemButton
                  onClick={() => handleRequestSelect(request)}
                  selected={
                    selectedRequest?.requestNumber === request.requestNumber ||
                    selectedRequest?.request_number ===
                      request.request_number ||
                    selectedRequest?.id === request.id
                  }
                  sx={{
                    p: 2,
                    "&.Mui-selected": {
                      backgroundColor: "primary.light"
                    }
                  }}>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          noWrap>
                          {request.requestNumber ||
                            request.request_number ||
                            request.id}{" "}
                          :{" "}
                          {request.requestName ||
                            request.request_name ||
                            request.title ||
                            "제목 없음"}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ ml: 2, minWidth: 80, textAlign: "right" }}>
                          {request.requestDate
                            ? moment(request.requestDate).format("YYYY-MM-DD")
                            : "미정"}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mt: 1,
                          alignItems: "center"
                        }}>
                        <Typography variant="body2" noWrap>
                          부서:{" "}
                          {request.businessDepartment ||
                            request.business_department ||
                            "미정"}{" "}
                          | 담당자:{" "}
                          {request.businessManager ||
                            request.business_manager ||
                            "미정"}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              {searchTerm
                ? "검색 결과가 없습니다."
                : "구매 요청 목록이 비어있습니다."}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  // 품목 선택 단계 렌더링
  const renderItemSelection = () => (
    <>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="subtitle1" sx={{ flex: 1 }}>
          구매 요청:{" "}
          <strong>
            {selectedRequest?.requestNumber ||
              selectedRequest?.request_number ||
              selectedRequest?.id}{" "}
            -{" "}
            {selectedRequest?.requestName ||
              selectedRequest?.request_name ||
              selectedRequest?.title ||
              "제목 없음"}
          </strong>
        </Typography>
        <Button size="small" onClick={handleBack}>
          구매 요청 변경
        </Button>
      </Box>

      <TextField
        fullWidth
        label="품목명 또는 규격 검색"
        variant="outlined"
        value={itemSearchTerm}
        onChange={(e) => setItemSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
        }}
        sx={{ mt: 2, mb: 2 }}
      />

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress size={40} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : filteredItems.length > 0 ? (
        <TableContainer sx={{ maxHeight: 400, overflow: "auto" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ width: "60px" }}></TableCell>
                <TableCell>품목명</TableCell>
                <TableCell>규격</TableCell>
                <TableCell align="right">수량</TableCell>
                <TableCell align="right">단가</TableCell>
                <TableCell align="right">금액</TableCell>
                <TableCell>납품장소</TableCell>
                <TableCell>납품요청일</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  hover
                  onClick={() => handleItemSelect(item.id)}
                  selected={selectedItems[0] === item.id}
                  sx={{ cursor: "pointer" }}>
                  <TableCell
                    align="center"
                    sx={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "primary.main"
                    }}>
                    {selectedItems[0] === item.id ? "✓" : ""}
                  </TableCell>
                  <TableCell>
                    {item.itemName || item.item_name || "품목명 없음"}
                  </TableCell>
                  <TableCell>{item.specification || "-"}</TableCell>
                  <TableCell align="right">
                    {`${item.quantity} ${item.unitDisplayName}`}
                  </TableCell>
                  <TableCell align="right">
                    {item.unitPrice.toLocaleString()}원
                  </TableCell>
                  <TableCell align="right">
                    {item.totalPrice.toLocaleString()}원
                  </TableCell>
                  <TableCell>
                    {item.deliveryLocation || item.delivery_location || "-"}
                  </TableCell>
                  <TableCell>
                    {item.deliveryRequestDate || item.delivery_request_date
                      ? moment(
                          item.deliveryRequestDate || item.delivery_request_date
                        ).format("YYYY-MM-DD")
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box
          sx={{
            p: 3,
            textAlign: "center",
            border: "1px dashed #ccc",
            borderRadius: 1
          }}>
          <Typography color="text.secondary">품목 정보가 없습니다.</Typography>
          <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
            선택한 구매 요청에 대한 품목이 등록되지 않았거나 검색 결과가
            없습니다.
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
        <Typography variant="body2">
          선택된 품목: <strong>{selectedItems.length}개</strong>
        </Typography>
        {selectedItems.length > 0 && (
          <Button
            size="small"
            color="secondary"
            onClick={() => setSelectedItems([])}>
            선택 초기화
          </Button>
        )}
      </Box>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: "90vh",
          height: "90vh",
          display: "flex",
          flexDirection: "column"
        }
      }}>
      <DialogTitle
        sx={{
          bgcolor: "primary.main",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 1.5, // 패딩 조정
          px: 2
        }}>
        <Typography variant="h6" sx={{ lineHeight: 1 }}>
          {activeStep === 0 ? "구매 요청 선택" : "품목 선택"}
        </Typography>
        <IconButton
          color="inherit"
          onClick={onClose}
          size="small"
          sx={{ p: 0.5 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
        {activeStep === 0 ? renderRequestSelection() : renderItemSelection()}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {activeStep === 1 && (
          <Button onClick={handleBack} color="secondary" sx={{ mr: "auto" }}>
            이전
          </Button>
        )}
        <Button onClick={onClose} color="secondary">
          취소
        </Button>
        {activeStep === 1 && (
          <Button
            onClick={handleComplete}
            variant="contained"
            color="primary"
            disabled={selectedItems.length === 0 || isLoading}>
            선택 완료 ({selectedItems.length}개)
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

PurchaseRequestSelectionDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  purchaseRequests: PropTypes.array,
  onComplete: PropTypes.func.isRequired,
  initialPurchaseRequest: PropTypes.object,
  initialSelectedItems: PropTypes.arrayOf(PropTypes.number)
};

export default PurchaseRequestSelectionDialog;
