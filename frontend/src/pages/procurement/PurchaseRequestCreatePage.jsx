import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createPurchaseRequest } from '@/redux/purchaseRequestSlice';
import {
    Box, Typography, Paper, TextField, Button, Grid, Alert,
    IconButton, List, ListItem, ListItemAvatar, ListItemText,
    Avatar, InputAdornment, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Delete as DeleteIcon, AttachFile as AttachFileIcon, Add as AddIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from 'moment';

const initItem = {
    itemName: '',
    specification: '',
    unit: '',
    quantity: '',
    unitPrice: '',
    totalPrice: 0,
    deliveryRequestDate: null,
    deliveryLocation: ''
};

/**
 * 구매 요청 생성 페이지 컴포넌트
 */
function PurchaseRequestCreatePage() {
    const dispatch = useDispatch();

    // 공통 필드 상태
    const [businessType, setBusinessType] = useState('');
    const [requestName, setRequestName] = useState('');
    const [requestDate, setRequestDate] = useState(moment());
    const [customer, setCustomer] = useState('');
    const [businessDepartment, setBusinessDepartment] = useState('');
    const [businessManager, setBusinessManager] = useState('');
    const [businessBudget, setBusinessBudget] = useState('');
    const [specialNotes, setSpecialNotes] = useState('');
    const [managerPhoneNumber, setManagerPhoneNumber] = useState('');

    // SI 필드 상태
    const [projectStartDate, setProjectStartDate] = useState(null);
    const [projectEndDate, setProjectEndDate] = useState(null);
    const [projectContent, setProjectContent] = useState('');

    // 유지보수 필드 상태
    const [contractStartDate, setContractStartDate] = useState(null);
    const [contractEndDate, setContractEndDate] = useState(null);
    const [contractAmount, setContractAmount] = useState('');
    const [contractDetails, setContractDetails] = useState('');

    // 물품 필드 상태
    const [items, setItems] = useState([initItem]);

    // 첨부 파일 상태
    const [attachments, setAttachments] = useState([]);

    // 품목 필드 변경 핸들러
    const handleItemChange = (index, fieldName, value) => {
      const newItems = [...items];
      newItems[index][fieldName] = value;

      // 수량/단가 변경 시 총액 자동 계산
      if (fieldName === 'quantity' || fieldName === 'unitPrice') {
        const quantity = Number(newItems[index].quantity) || 0;
        const unitPrice = Number(newItems[index].unitPrice) || 0;
        newItems[index].totalPrice = quantity * unitPrice;
      }

      setItems(newItems);
    };

    // 숫자 입력 핸들러
    const handleNumericItemChange = (index, fieldName) => (e) => {
      const value = e.target.value.replace(/[^0-9]/g, '');
      handleItemChange(index, fieldName, value);
    };

    // 품목 삭제 핸들러
    const handleRemoveItem = (index) => {
      if (items.length > 1) {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
      }
    };


    /**
     * 폼 제출 핸들러
     */
    // handleSubmit 함수 수정
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 공통 데이터
        let requestData = {
            businessType, // 사업 구분
            requestName,
            requestDate: requestDate.format('YYYY-MM-DD'), // 날짜 포맷 일치화
            customer,
            businessDepartment,
            businessManager,
            businessBudget: parseFloat(businessBudget.replace(/,/g, '')) || 0, // 숫자 포맷 정리
            specialNotes,
            managerPhoneNumber: managerPhoneNumber.replace(/[^0-9]/g, '') // 숫자만 추출
        };

        // 사업 구분별 데이터 추가
        if (businessType === 'SI') {
            requestData = {
                ...requestData,
                projectStartDate: projectStartDate?.format('YYYY-MM-DD'),
                projectEndDate: projectEndDate?.format('YYYY-MM-DD'),
                projectContent
            };
        } else if (businessType === 'MAINTENANCE') {
            requestData = {
                ...requestData,
                contractStartDate: contractStartDate?.format('YYYY-MM-DD'),
                contractEndDate: contractEndDate?.format('YYYY-MM-DD'),
                contractAmount: parseFloat(contractAmount.replace(/,/g, '')) || 0,
                contractDetails
            };
        } else if (businessType === 'GOODS') {
            requestData.items = items.map(item => ({
                ...item,
                quantity: parseInt(item.quantity) || 0,
                unitPrice: parseFloat(item.unitPrice.replace(/,/g, '')) || 0,
                totalPrice: parseFloat(item.totalPrice.replace(/,/g, '')) || 0,
                deliveryRequestDate: item.deliveryRequestDate ? item.deliveryRequestDate.format('YYYY-MM-DD') : null
            }));
        }

        // FormData 생성 및 전송
        const formPayload = new FormData();
        formPayload.append(
            'purchaseRequestDTO',
            new Blob([JSON.stringify(requestData)], { type: 'application/json' })
        );

        attachments.forEach((file, index) => {
            formPayload.append(`files[${index}]`, file);
        });

        try {
            await dispatch(createPurchaseRequest(formPayload)).unwrap();
            alert('구매 요청이 성공적으로 생성되었습니다.');
        } catch (error) {
            alert(`오류 발생: ${error.message}`);
        }
    };


    /**
     * 동적 필드 렌더링 함수
     */
    const renderDynamicFields = () => {
        switch (businessType) {
            case 'SI':
                return (
                    <>
                        <Grid item xs={6}>
                            <DatePicker
                                label="프로젝트 시작일"
                                value={projectStartDate}
                                onChange={setProjectStartDate}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <DatePicker
                                label="프로젝트 종료일"
                                value={projectEndDate}
                                onChange={setProjectEndDate}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="프로젝트 내용"
                                multiline
                                rows={4}
                                value={projectContent}
                                onChange={(e) => setProjectContent(e.target.value)}
                            />
                        </Grid>
                    </>
                );
            case 'MAINTENANCE':
                return (
                    <>
                        <Grid item xs={6}>
                            <DatePicker
                                label="계약 시작일"
                                value={contractStartDate}
                                onChange={setContractStartDate}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <DatePicker
                                label="계약 종료일"
                                value={contractEndDate}
                                onChange={setContractEndDate}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="계약 금액"
                                value={contractAmount}
                                onChange={(e) => setContractAmount(e.target.value.replace(/[^0-9]/g, ''))}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₩</InputAdornment>,
                                    inputProps: { maxLength: 15 }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="계약 상세 내용"
                                multiline
                                rows={4}
                                value={contractDetails}
                                onChange={(e) => setContractDetails(e.target.value)}
                            />
                        </Grid>
                    </>
                );
            case 'GOODS':
                return (
                    <>
                        {items.map((item, index) => (
                            <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 2 }}>
                                {/* 품목명 */}
                                <Grid item xs={3}>
                                    <TextField
                                        fullWidth
                                        label="품목명 *"
                                        value={item.itemName}
                                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                                        required
                                    />
                                </Grid>

                                {/* 사양 */}
                                <Grid item xs={2}>
                                    <TextField
                                        fullWidth
                                        label="사양"
                                        value={item.specification}
                                        onChange={(e) => handleItemChange(index, 'specification', e.target.value)}
                                    />
                                </Grid>

                                {/* 단위 */}
                                <Grid item xs={1}>
                                    <TextField
                                        fullWidth
                                        label="단위"
                                        value={item.unit}
                                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                    />
                                </Grid>

                                {/* 수량 */}
                                <Grid item xs={1}>
                                    <TextField
                                        fullWidth
                                        label="수량 *"
                                        value={item.quantity}
                                        onChange={(e) => handleNumericItemChange(index, 'quantity')(e)}
                                        required
                                    />
                                </Grid>

                                {/* 단가 */}
                                <Grid item xs={2}>
                                    <TextField
                                        fullWidth
                                        label="단가 *"
                                        value={item.unitPrice}
                                        onChange={(e) => handleNumericItemChange(index, 'unitPrice')(e)}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">₩</InputAdornment>,
                                            inputProps: { maxLength: 15 }
                                        }}
                                        required
                                    />
                                </Grid>

                                {/* 총액 (자동 계산) */}
                                <Grid item xs={2}>
                                    <TextField
                                        fullWidth
                                        label="총액"
                                        value={item.totalPrice.toLocaleString()}
                                        InputProps={{
                                            readOnly: true,
                                            startAdornment: <InputAdornment position="start">₩</InputAdornment>
                                        }}
                                    />
                                </Grid>

                                {/* 납품 요청일 */}
                                <Grid item xs={2}>
                                    <DatePicker
                                        label="납품 요청일"
                                        value={item.deliveryRequestDate}
                                        onChange={(date) => handleItemChange(index, 'deliveryRequestDate', date)}
                                        renderInput={(params) => <TextField {...params} fullWidth />}
                                    />
                                </Grid>

                                {/* 납품 장소 */}
                                <Grid item xs={2}>
                                    <TextField
                                        fullWidth
                                        label="납품 장소"
                                        value={item.deliveryLocation}
                                        onChange={(e) => handleItemChange(index, 'deliveryLocation', e.target.value)}
                                    />
                                </Grid>

                                {/* 삭제 버튼 */}
                                <Grid item xs={1}>
                                    <IconButton
                                        aria-label="delete"
                                        onClick={() => handleRemoveItem(index)}
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        ))}

                        {/* 품목 추가 버튼 */}
                        <Button
                            variant="outlined"
                            onClick={() => setItems([...items, initItem])}
                            startIcon={<AddIcon />}
                        >
                            품목 추가
                        </Button>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    구매 요청 생성
                </Typography>
                <Paper sx={{ p: 2 }}>
                    <Grid container spacing={3}>
                        {/* 공통 필드 */}
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="요청명 *"
                                name="requestName"
                                value={requestName}
                                onChange={(e) => setRequestName(e.target.value)}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <DatePicker
                                label="요청일 *"
                                value={requestDate}
                                onChange={(date) => setRequestDate(date)}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="고객사"
                                name="customer"
                                value={customer}
                                onChange={(e) => setCustomer(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="사업 부서 *"
                                name="businessDepartment"
                                value={businessDepartment}
                                onChange={(e) => setBusinessDepartment(e.target.value)}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="사업 담당자 *"
                                name="businessManager"
                                value={businessManager}
                                onChange={(e) => setBusinessManager(e.target.value)}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel id="business-type-label">사업 구분 *</InputLabel>
                                <Select
                                    labelId="business-type-label"
                                    value={businessType}
                                    onChange={(e) => setBusinessType(e.target.value)}
                                    required
                                >
                                    <MenuItem value="SI">SI</MenuItem>
                                    <MenuItem value="MAINTENANCE">유지보수</MenuItem>
                                    <MenuItem value="GOODS">물품</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="사업 예산"
                                name="businessBudget"
                                value={businessBudget}
                                onChange={(e) => setBusinessBudget(e.target.value.replace(/[^0-9]/g, ''))}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₩</InputAdornment>,
                                    inputProps: { maxLength: 15 }
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="담당자 핸드폰"
                                name="managerPhoneNumber"
                                value={managerPhoneNumber}
                                onChange={(e) => setManagerPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="특이 사항"
                                name="specialNotes"
                                multiline
                                rows={4}
                                value={specialNotes}
                                onChange={(e) => setSpecialNotes(e.target.value)}
                            />
                        </Grid>

                        {/* 동적 필드 렌더링 */}
                        {renderDynamicFields()}

                        {/* 파일 첨부 */}
                        <Grid item xs={12}>
                            <input
                                type="file"
                                multiple
                                onChange={(e) => setAttachments(Array.from(e.target.files))}
                                id="file-upload"
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="file-upload">
                                <Button variant="outlined" component="span" startIcon={<AttachFileIcon />}>
                                    파일 첨부
                                </Button>
                            </label>
                            {attachments.length > 0 && (
                              <>
                                  {attachments.map((file, index) => (
                                      <List key={index} sx={{ mt: 2 }}>
                                          <ListItem>
                                              <ListItemAvatar>
                                                  <Avatar><AttachFileIcon /></Avatar>
                                              </ListItemAvatar>
                                              <ListItemText
                                                  primary={file.name}
                                                  secondary={`${(file.size / 1024).toFixed(2)} KB`}
                                              />
                                              {/* 삭제 버튼 */}
                                              <IconButton edge="end" aria-label="delete" onClick={() => {
                                                  const newFiles = [...attachments];
                                                  newFiles.splice(index, 1);
                                                  setAttachments(newFiles);
                                              }}>
                                                  <DeleteIcon />
                                              </IconButton>
                                          </ListItem>
                                      </List>
                                  ))}
                              </>
                            )}
                        </Grid>

                        {/* 제출 버튼 */}
                        <Grid item xs={12} sx={{ textAlign: 'right' }}>
                            <Button
                              type="submit"
                              variant="contained"
                              color="primary"
                              size="large"
                              sx={{ mt: 2 }}
                            >
                              제출하기
                            </Button>
                        </Grid>

                    </Grid>
                </Paper>
            </Box>
        </LocalizationProvider>
    );
}

export default PurchaseRequestCreatePage;
