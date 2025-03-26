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
  Alert,
  ListItemText
} from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";

import {
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
  const [activeStep, setActiveStep] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(
    initialPurchaseRequest
  );
  const [selectedItems, setSelectedItems] = useState(initialSelectedItems);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRequestSelect = async (request) => {
    try {
      setIsLoading(true);
      setError(null);

      if (
        request.purchaseRequestItems &&
        request.purchaseRequestItems.length > 0
      ) {
        setSelectedRequest(request);
        setSelectedItems([]);
        setActiveStep(1);
        return;
      }

      setTimeout(() => {
        const enrichedRequest = {
          ...request,
          purchaseRequestItems: request.items || []
        };

        setSelectedRequest(enrichedRequest);
        setSelectedItems([]);
        setActiveStep(1);
        setIsLoading(false);
      }, 500);
    } catch (err) {
      setError("품목 데이터를 가져오는 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  const handleItemSelect = (itemId) => {
    setSelectedItems([itemId]);
  };

  const handleComplete = () => {
    if (selectedRequest && selectedItems.length === 1) {
      const selectedItem = requestItems.find(
        (item) => item.id === selectedItems[0]
      );
      if (selectedItem) {
        const requestData = {
          ...selectedRequest,
          id: parseInt(selectedRequest.id, 10),
          requestNumber:
            selectedRequest.requestNumber ||
            selectedRequest.request_number ||
            selectedRequest.id,
          requestName:
            selectedRequest.requestName ||
            selectedRequest.request_name ||
            selectedRequest.title ||
            "",
          purchaseRequestId: parseInt(selectedRequest.id, 10)
        };

        const itemData = {
          ...selectedItem,
          id: parseInt(selectedItem.id, 10),
          purchaseRequestItemId: parseInt(selectedItem.id, 10),
          itemName: selectedItem.itemName || selectedItem.item_name || "",
          specification: selectedItem.specification || "",
          quantity: parseFloat(selectedItem.quantity) || 0,
          unitPrice: parsePrice(
            selectedItem.unitPrice || selectedItem.unit_price || 0
          ),
          totalPrice: parsePrice(
            selectedItem.totalPrice || selectedItem.total_price || 0
          ),
          unitChildCode:
            selectedItem.unitChildCode || selectedItem.unit_child_code || "49",
          deliveryLocation:
            selectedItem.deliveryLocation ||
            selectedItem.delivery_location ||
            "",
          deliveryRequestDate:
            selectedItem.deliveryRequestDate ||
            selectedItem.delivery_request_date ||
            null
        };

        onComplete(requestData, itemData.id, itemData);
      }
    }
    onClose();
  };

  const handleBack = () => setActiveStep(0);

  const filteredPurchaseRequests = useMemo(() => {
    return (purchaseRequests || []).filter((request) => {
      const name = (
        request.requestName ||
        request.request_name ||
        request.title ||
        ""
      ).toLowerCase();
      const number =
        request.requestNumber ||
        request.request_number ||
        request.id?.toString() ||
        "";
      return (
        name.includes(searchTerm.toLowerCase()) || number.includes(searchTerm)
      );
    });
  }, [purchaseRequests, searchTerm]);

  const requestItems = useMemo(() => {
    if (!selectedRequest) return [];
    const items =
      selectedRequest.purchaseRequestItems || selectedRequest.items || [];

    return items.map((item) => {
      const id =
        item.id || item.purchaseRequestItemId || item.purchase_request_item_id;
      const name = item.itemName || item.item_name || "";
      const unitCode = item.unitChildCode || item.unit_child_code || "49";

      return {
        ...item,
        id,
        itemName: name,
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parsePrice(item.unitPrice || item.unit_price || 0),
        totalPrice: parsePrice(item.totalPrice || item.total_price || 0),
        unitDisplayName: getUnitDisplayNameById(unitCode),
        deliveryLocation: item.deliveryLocation || item.delivery_location || "",
        deliveryRequestDate:
          item.deliveryRequestDate || item.delivery_request_date || null
      };
    });
  }, [selectedRequest]);

  const filteredItems = useMemo(() => {
    return requestItems.filter((item) => {
      const name = (item.itemName || "").toLowerCase();
      const spec = (item.specification || "").toLowerCase();
      return (
        name.includes(itemSearchTerm.toLowerCase()) ||
        spec.includes(itemSearchTerm.toLowerCase())
      );
    });
  }, [requestItems, itemSearchTerm]);

  useEffect(() => {
    if (open) {
      setSearchTerm("");
      setItemSearchTerm("");
      setError(null);
      if (initialPurchaseRequest) {
        setSelectedRequest(initialPurchaseRequest);
        setActiveStep(1);
      } else {
        setActiveStep(0);
      }
    }
  }, [open, initialPurchaseRequest]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: "primary.main", color: "white" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {activeStep === 0 ? "구매 요청 선택" : "품목 선택"}
          </Typography>
          <IconButton color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        {activeStep === 0 ? (
          <>
            <TextField
              fullWidth
              label="구매 요청명 또는 번호 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
              sx={{ mb: 2 }}
            />
            <List>
              {filteredPurchaseRequests.map((request) => (
                <ListItemButton
                  key={request.id}
                  onClick={() => handleRequestSelect(request)}
                  selected={selectedRequest?.id === request.id}>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="subtitle1">
                          {request.requestNumber ||
                            request.request_number ||
                            request.id}{" "}
                          -{" "}
                          {request.requestName ||
                            request.request_name ||
                            request.title ||
                            "제목 없음"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {request.requestDate
                            ? moment(request.requestDate).format("YYYY-MM-DD")
                            : "미정"}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        부서:{" "}
                        {request.businessDepartment ||
                          request.business_department ||
                          "미정"}{" "}
                        | 담당자:{" "}
                        {request.businessManager ||
                          request.business_manager ||
                          "미정"}
                      </Typography>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          </>
        ) : (
          <>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}>
              <Typography variant="subtitle1">
                {selectedRequest?.requestNumber ||
                  selectedRequest?.request_number ||
                  selectedRequest?.id}{" "}
                -{" "}
                {selectedRequest?.requestName ||
                  selectedRequest?.request_name ||
                  selectedRequest?.title ||
                  "제목 없음"}
              </Typography>
              <Button size="small" onClick={handleBack}>
                구매 요청 변경
              </Button>
            </Box>

            <TextField
              fullWidth
              label="품목명 또는 규격 검색"
              value={itemSearchTerm}
              onChange={(e) => setItemSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
              sx={{ mb: 2 }}
            />

            {isLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell></TableCell>
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
                        selected={selectedItems[0] === item.id}
                        onClick={() => handleItemSelect(item.id)}
                        sx={{ cursor: "pointer" }}>
                        <TableCell align="center">
                          {selectedItems[0] === item.id ? "✓" : ""}
                        </TableCell>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.specification}</TableCell>
                        <TableCell align="right">
                          {item.quantity} {item.unitDisplayName}
                        </TableCell>
                        <TableCell align="right">
                          {item.unitPrice.toLocaleString()}원
                        </TableCell>
                        <TableCell align="right">
                          {item.totalPrice.toLocaleString()}원
                        </TableCell>
                        <TableCell>{item.deliveryLocation}</TableCell>
                        <TableCell>
                          {item.deliveryRequestDate
                            ? moment(item.deliveryRequestDate).format(
                                "YYYY-MM-DD"
                              )
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>취소</Button>
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
