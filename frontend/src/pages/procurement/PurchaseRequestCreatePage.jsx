import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createPurchaseRequest } from '@/redux/purchaseRequestSlice';
import {
    Box, Typography, Paper, TextField, Button, Grid, Alert, IconButton,
    List, ListItem, ListItemAvatar, ListItemText, Avatar, ListItemIcon, InputAdornment,
} from '@mui/material';
import { API_URL } from '@/utils/constants';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { Delete as DeleteIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from 'moment';

/**
 * 구매 요청 생성 페이지 컴포넌트 (첨부 파일 지원, 디자인 업데이트, JSON 파싱 오류 해결)
 * @returns {JSX.Element}
 */
function PurchaseRequestCreatePage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // State 변수 선언
    const [requestName, setRequestName] = useState('');
    const [requestDate, setRequestDate] = useState(moment());
    const [customer, setCustomer] = useState('');
    const [businessDepartment, setBusinessDepartment] = useState('');
    const [businessManager, setBusinessManager] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [businessBudget, setBusinessBudget] = useState('');
    const [specialNotes, setSpecialNotes] = useState('');
    const [managerPhoneNumber, setManagerPhoneNumber] = useState('');
    const [projectStartDate, setProjectStartDate] = useState(null);
    const [projectEndDate, setProjectEndDate] = useState(null);
    const [projectContent, setProjectContent] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [items, setItems] = useState([{
        itemName: '', specification: '', unit: '', quantity: '', unitPrice: '', totalPrice: '',
        deliveryRequestDate: null, deliveryLocation: ''
    }]);

    // 에러 State 변수 선언
    const [requestNameError, setRequestNameError] = useState('');
    const [businessDepartmentError, setBusinessDepartmentError] = useState('');
    const [businessManagerError, setBusinessManagerError] = useState('');
    const [requestError, setRequestError] = useState('');

    const currentUser = useSelector(state => state.auth.user);

    useEffect(() => {}, []);

    // 숫자 입력 필드 포맷팅 (숫자 외 문자 제거)
    const formatNumberInput = (value) => {
        return value.replace(/[^0-9]/g, ''); // 숫자만 허용
    };

    // 폼 제출 핸들러
    const handleSubmit = async (event) => {
        event.preventDefault();

        // 유효성 검사
        let isValid = true;
        if (!requestName) {
            setRequestNameError('요청명은 필수 입력 값입니다.');
            isValid = false;
        } else {
            setRequestNameError('');
        }

        if (!businessDepartment) {
            setBusinessDepartmentError('사업 부서는 필수 입력 값입니다.');
            isValid = false;
        } else {
            setBusinessDepartmentError('');
        }

        if (!businessManager) {
            setBusinessManagerError('사업 담당자는 필수 입력 값입니다.');
            isValid = false;
        } else {
            setBusinessManagerError('');
        }

        if (!isValid) {
            return;
        }

        // 구매 요청 데이터 객체 생성
        const purchaseRequestData = {
            requestName, requestDate: requestDate.format('YYYY-MM-DD'), customer, businessDepartment,
            businessManager, businessType, businessBudget: Number(businessBudget) || 0, // 숫자 변환 및 NaN 처리
            specialNotes, managerPhoneNumber: managerPhoneNumber || '', // 숫자만 남기기 (핸들러에서 처리)
            projectStartDate: projectStartDate ? projectStartDate.format('YYYY-MM-DD') : null,
            projectEndDate: projectEndDate ? projectEndDate.format('YYYY-MM-DD') : null, projectContent,
            purchaseRequestItemDTOs: items.map(item => ({
                ...item, quantity: Number(item.quantity) || 0, // 숫자 변환 및 NaN 처리
                unitPrice: Number(item.unitPrice) || 0, // 숫자 변환 및 NaN 처리
                totalPrice: Number(item.totalPrice) || 0, // 숫자 변환 및 NaN 처리
                deliveryRequestDate: item.deliveryRequestDate ? item.deliveryRequestDate.format('YYYY-MM-DD') : null
            }))
        };

        // FormData 객체 생성 및 데이터 추가
        const formData = new FormData();
        formData.append('purchaseRequestDTO', new Blob([JSON.stringify(purchaseRequestData)], {
            type: "application/json"
        }));

        // 첨부 파일 추가
        attachments.forEach(file => {
            formData.append('files', file);
        });

        try {
            // API 요청
            const response = await fetchWithAuth(`${API_URL}purchase-requests`, {
                method: 'POST', body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 구매 요청 성공 후 페이지 이동
            navigate('/purchase-requests');
        } catch (error) {
            console.error("Failed to create purchase request:", error);
            setRequestError("구매 요청 등록에 실패했습니다. 다시 시도해주세요.");
        }
    };

    // 입력 필드 변경 핸들러
    const handleChange = (event) => {
        const { name, value } = event.target;
        switch (name) {
            case 'requestName': setRequestName(value); break;
            case 'customer': setCustomer(value); break;
            case 'businessDepartment': setBusinessDepartment(value); break;
            case 'businessManager': setBusinessManager(value); break;
            case 'businessType': setBusinessType(value); break;
            case 'businessBudget': // formatNumberInput 적용
                const formattedBudget = formatNumberInput(value);
                setBusinessBudget(formattedBudget);
                break;
            case 'specialNotes': setSpecialNotes(value); break;
            case 'managerPhoneNumber':
                // 숫자만 입력 가능하도록 제한
                const formattedPhoneNumber = formatNumberInput(value);
                setManagerPhoneNumber(formattedPhoneNumber);
                break;
            case 'projectContent': setProjectContent(value); break;
            default: break;
        }
    };

    // 첨부 파일 변경 핸들러
    const handleAttachmentChange = (event) => {
        setAttachments(Array.from(event.target.files));
    };

    // 첨부 파일 제거 핸들러
    const handleRemoveAttachment = (index) => {
        const newAttachments = [...attachments];
        newAttachments.splice(index, 1);
        setAttachments(newAttachments);
    };

    // 품목 변경 핸들러
    const handleItemChange = (e, index) => {
        const { name, value } = e.target;
        const list = [...items];
        list[index][name] = value;
        setItems(list);
    };

    // 품목 제거 핸들러
    const handleRemoveItem = index => {
        setItems(items.filter((s, i) => i !== index));
    };

    // 품목 추가 핸들러
    const handleAddItem = () => {
        setItems([...items, {
            itemName: '', specification: '', unit: '', quantity: '', unitPrice: '', totalPrice: '',
            deliveryRequestDate: null, deliveryLocation: ''
        }]);
    };

    // 날짜 변경 핸들러
    const handleDateChange = (date) => {
        setRequestDate(date);
    };

    // 사업 시작일 변경 핸들러
    const handleStartDateChange = (date) => {
        setProjectStartDate(date);
    };

    // 사업 종료일 변경 핸들러
    const handleEndDateChange = (date) => {
        setProjectEndDate(date);
    };

    // 납품 요청일 변경 핸들러
    const handleDeliveryRequestDateChange = (date, index) => {
        const newItems = [...items];
        newItems[index].deliveryRequestDate = date;
        setItems(newItems);
    };

    // 숫자 품목 변경 핸들러 (수정됨)
    const handleNumericItemChange = (e, index) => {
        const { name, value } = e.target;
        const formattedValue = formatNumberInput(value);

        const newItems = [...items];
        newItems[index][name] = formattedValue;

         // 수량과 단가가 모두 입력되었을 때만 totalPrice 계산
         if (newItems[index].quantity && newItems[index].unitPrice) {
            const quantity = Number(newItems[index].quantity) || 0;
            const unitPrice = Number(newItems[index].unitPrice) || 0;
            newItems[index].totalPrice = (quantity * unitPrice).toString();
        } else {
            newItems[index].totalPrice = '0'; // 하나라도 비어있으면 0으로 설정
        }

        setItems(newItems);
    };

    // 사업 예산 변경 핸들러
    const handleBusinessBudgetChange = (e) => {
        const rawValue = e.target.value;
        const formatted = formatNumberInput(rawValue);
        setBusinessBudget(formatted);
    };

    // 렌더링
    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <Box sx={{ padding: 3 }}>
                <Typography variant="h5" gutterBottom>구매 요청 생성</Typography>
                <Paper sx={{ padding: 2 }}>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField fullWidth label="요청명" name="requestName" value={requestName}
                                           onChange={handleChange} error={!!requestNameError}
                                           helperText={requestNameError} required/>
                            </Grid>
                            <Grid item xs={6}>
                                <DatePicker label="요청일" value={requestDate} onChange={handleDateChange}
                                            renderInput={(params) => (
                                                <TextField {...params} fullWidth InputProps={{ readOnly: true }}/>
                                            )}/>
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth label="고객사" name="customer" value={customer}
                                           onChange={handleChange}/>
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth label="사업부서" name="businessDepartment"
                                           value={businessDepartment} onChange={handleChange} required
                                           error={!!businessDepartmentError} helperText={businessDepartmentError}/>
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth label="사업담당자" name="businessManager" value={businessManager}
                                           onChange={handleChange} required error={!!businessManagerError}
                                           helperText={businessManagerError}/>
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth label="사업구분" name="businessType" value={businessType}
                                           onChange={handleChange}/>
                            </Grid>
                             <Grid item xs={6}>
                                <TextField fullWidth label="사업예산" name="businessBudget" value={businessBudget}
                                           onChange={handleBusinessBudgetChange} InputProps={{
                                    startAdornment: <InputAdornment position="start">₩</InputAdornment>,
                                }}/>
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth label="담당자 핸드폰" name="managerPhoneNumber"
                                           value={managerPhoneNumber} onChange={handleChange} InputProps={{
                                    maxLength: 11, // 최대 11자 제한
                                }}/>
                            </Grid>
                            <Grid item xs={6}>
                                <DatePicker label="사업 시작일" value={projectStartDate} onChange={handleStartDateChange}
                                            renderInput={(params) => <TextField {...params} fullWidth/>}/>
                            </Grid>
                            <Grid item xs={6}>
                                <DatePicker label="사업 종료일" value={projectEndDate} onChange={handleEndDateChange}
                                            renderInput={(params) => <TextField {...params} fullWidth/>}/>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="사업내용" name="projectContent" multiline rows={4}
                                           value={projectContent} onChange={handleChange}/>
                            </Grid>

                            {/* 첨부 파일 선택 */}
                            <Grid item xs={12}>
                                <Button variant="outlined" component="label">
                                    첨부 파일 선택
                                    <input type="file" multiple onChange={handleAttachmentChange} style={{ display: 'none' }}/>
                                </Button>

                                {/* 첨부 파일 목록 표시 */}
                                <List>
                                    {attachments.map((file, index) => (
                                        <ListItem key={index}>
                                            <ListItemAvatar>
                                                <Avatar><AttachFileIcon/></Avatar>
                                            </ListItemAvatar>
                                            <ListItemText primary={file.name}
                                                          secondary={`${(file.size / 1024).toFixed(2)} KB`}/>
                                            <ListItemIcon>
                                                <IconButton edge="end" aria-label="delete"
                                                            onClick={() => handleRemoveAttachment(index)}>
                                                    <DeleteIcon/>
                                                </IconButton>
                                            </ListItemIcon>
                                        </ListItem>
                                    ))}
                                </List>
                            </Grid>

                            {/* 물품 정보 입력 필드 추가 */}
                            <Grid item xs={12}>
                                <Typography variant="h6">물품 정보</Typography>
                                {items.map((item, index) => (
                                    <Grid container spacing={2} key={index} alignItems="center">
                                        <Grid item xs={2}>
                                            <TextField fullWidth label="품목" name="itemName" value={item.itemName}
                                                       onChange={e => handleItemChange(e, index)}/>
                                        </Grid>
                                        <Grid item xs={2}>
                                            <TextField fullWidth label="사양" name="specification"
                                                       value={item.specification} onChange={e => handleItemChange(e, index)}/>
                                        </Grid>
                                        <Grid item xs={1}>
                                            <TextField fullWidth label="단위" name="unit" value={item.unit}
                                                       onChange={e => handleItemChange(e, index)}/>
                                        </Grid>
                                         <Grid item xs={1}>
                                            <TextField fullWidth label="수량" name="quantity" value={item.quantity}
                                                       onChange={(e) => handleNumericItemChange(e, index)}/>
                                        </Grid>
                                        <Grid item xs={2}>
                                            <TextField fullWidth label="단가" name="unitPrice" value={item.unitPrice}
                                                       onChange={(e) => handleNumericItemChange(e, index)}
                                                       InputProps={{
                                                           inputProps: {
                                                               style: { textAlign: 'right' }
                                                           }
                                                       }}/>
                                        </Grid>
                                        <Grid item xs={2}>
                                            <TextField fullWidth label="금액" name="totalPrice" value={item.totalPrice}
                                                       InputProps={{ readOnly: true, // 읽기 전용으로 설정
                                                       }}/>
                                        </Grid>
                                        <Grid item xs={2}>
                                            <DatePicker label="납품요청일" value={item.deliveryRequestDate}
                                                        onChange={(date) => handleDeliveryRequestDateChange(date, index)}
                                                        renderInput={(params) => <TextField {...params} fullWidth/>}/>
                                        </Grid>
                                        <Grid item xs={2}>
                                            <TextField fullWidth label="납품장소" name="deliveryLocation"
                                                       value={item.deliveryLocation} onChange={e => handleItemChange(e, index)}/>
                                        </Grid>
                                        <Grid item xs={1}>
                                            <IconButton aria-label="delete" onClick={() => handleRemoveItem(index)}>
                                                <DeleteIcon/>
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                ))}
                                <Button variant="contained" color="primary" onClick={handleAddItem}>
                                    물품 추가
                                </Button>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="특기사항" name="specialNotes" multiline rows={4}
                                           value={specialNotes} onChange={handleChange}/>
                            </Grid>
                            <Grid item xs={12}>
                                <Button variant="contained" color="primary" type="submit">저장</Button>
                            </Grid>
                        </Grid>
                    </form>
                    {/* 요청 실패 시 에러 메시지 표시 */}
                    {requestError && (<Alert severity="error">{requestError}</Alert>)}
                </Paper>
            </Box>
        </LocalizationProvider>
    );
}

export default PurchaseRequestCreatePage;
