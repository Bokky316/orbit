import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
import { API_URL } from '@/utils/constants';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { fetchProjects } from '@/redux/projectSlice'; // 프로젝트 목록 액션 추가

const initItem = {
    itemId: '', // 아이템 ID 추가
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
    const navigate = useNavigate();

    // 프로젝트 목록 상태
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');

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
    const [availableItems, setAvailableItems] = useState([]); // 사용 가능한 아이템 목록

    // 첨부 파일 상태
    const [attachments, setAttachments] = useState([]);

    useEffect(() => {
        // 컴포넌트 마운트 시 프로젝트 목록 가져오기
        const fetchAllProjects = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}projects`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) {
                    throw new Error(`프로젝트 목록을 가져오는데 실패했습니다: ${response.status}`);
                }
                const projectsData = await response.json();
                setProjects(projectsData);
            } catch (error) {
                alert(`프로젝트 목록을 가져오는 중 오류가 발생했습니다: ${error.message}`);
            }
        };

        fetchAllProjects();

        // 아이템 목록 가져오기
        const fetchItems = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}items`, { // 아이템 목록 API 엔드포인트
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) {
                    throw new Error(`아이템 목록을 가져오는데 실패했습니다: ${response.status}`);
                }
                const itemsData = await response.json();
                setAvailableItems(itemsData);
            } catch (error) {
                alert(`아이템 목록을 가져오는 중 오류가 발생했습니다: ${error.message}`);
            }
        };

        fetchItems();
    }, []);

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

    // 아이템 선택 핸들러
    const handleItemSelect = (index, event) => {
        const selectedItemId = event.target.value;
        const selectedItem = availableItems.find(item => item.id === selectedItemId);

        if (selectedItem) {
            const newItems = [...items];
            newItems[index] = {
                ...newItems[index],
                itemId: selectedItem.id, // 아이템 ID 저장
                itemName: selectedItem.name, // 아이템 이름
                specification: selectedItem.specification, // 사양
                unit: selectedItem.unit // 단위
            };
            setItems(newItems);
        }
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
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 공통 데이터
        let requestData = {
            businessType,
            requestName,
            requestDate: requestDate.format('YYYY-MM-DD'),
            customer,
            businessDepartment,
            businessManager,
            businessBudget: parseFloat(businessBudget.replace(/,/g, '')) || 0,
            specialNotes,
            managerPhoneNumber: '01044737122',
            projectId: selectedProjectId,

            // status 필드 대신 직접 매핑된 컬럼 이름으로 지정
            prStatusParent: 'PURCHASE_REQUEST',
            prStatusChild: 'REQUESTED'
        };

        // 사업 구분별 데이터 추가
        if (businessType === 'SI') {
            requestData.projectStartDate = projectStartDate ? projectStartDate.format('YYYY-MM-DD') : null;
            requestData.projectEndDate = projectEndDate ? projectEndDate.format('YYYY-MM-DD') : null;
            requestData.projectContent = projectContent;
        } else if (businessType === 'MAINTENANCE') {
            requestData.contractStartDate = contractStartDate ? contractStartDate.format('YYYY-MM-DD') : null;
            requestData.contractEndDate = contractEndDate ? contractEndDate.format('YYYY-MM-DD') : null;
            requestData.contractAmount = parseFloat(contractAmount.replace(/,/g, '')) || 0;
            requestData.contractDetails = contractDetails;
        } else if (businessType === 'GOODS') {
            requestData.items = items.map(item => ({
                itemId: item.itemId, // 아이템 ID 전송
                quantity: parseInt(item.quantity) || 0,
                unitPrice: parseFloat(item.unitPrice.replace(/,/g, '')) || 0,
                totalPrice: parseFloat(item.totalPrice) || 0,
                deliveryRequestDate: item.deliveryRequestDate ? item.deliveryRequestDate.format('YYYY-MM-DD') : null,
                deliveryLocation: item.deliveryLocation
            }));
        }

        try {
            console.log('JSON 요청 전송:', JSON.stringify(requestData, null, 2));

            const response = await fetchWithAuth(`${API_URL}purchase-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const createdRequest = await response.json();
                alert('구매 요청이 성공적으로 생성되었습니다.');

                // 파일 첨부가 있는 경우 처리
                if (attachments.length > 0) {
                    const fileFormData = new FormData();

                    attachments.forEach(file => {
                        fileFormData.append('files', file);
                    });

                    try {
                        // 기본 fetch API 사용 (Content-Type 헤더 생략)
                        const fileResponse = await fetch(`${API_URL}purchase-requests/${createdRequest.id}/attachments`, {
                            method: 'POST',
                            credentials: 'include', // 쿠키 포함
                            body: fileFormData
                        });

                        if (fileResponse.ok) {
                            alert('첨부 파일이 성공적으로 업로드되었습니다.');
                        } else {
                            const errorMsg = await fileResponse.text();
                            alert(`첨부 파일 업로드에 실패했습니다: ${errorMsg}`);
                        }
                    } catch (fileError) {
                        alert(`첨부 파일 업로드 중 오류 발생: ${fileError.message}`);
                    }
                }
            } else {
                const errorData = await response.text();
                alert(`오류 발생: ${errorData}`);
            }
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
                                {/* 아이템 선택 */}
                                <Grid item xs={3}>
                                    <FormControl fullWidth>
                                        <InputLabel id={`item-select-label-${index}`}>품목 선택 *</InputLabel>
                                        <Select
                                            labelId={`item-select-label-${index}`}
                                            id={`item-select-${index}`}
                                            value={item.itemId}
                                            label="품목 선택 *"
                                            onChange={(e) => handleItemSelect(index, e)}
                                            required
                                        >
                                            {availableItems.map(availableItem => (
                                                <MenuItem key={availableItem.id} value={availableItem.id}>
                                                    {availableItem.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {/* 사양 (선택된 아이템 정보) */}
                                <Grid item xs={2}>
                                    <TextField
                                        fullWidth
                                        label="사양"
                                        value={item.specification || ''}
                                        InputProps={{
                                            readOnly: true
                                        }}
                                    />
                                </Grid>

                                {/* 단위 (선택된 아이템 정보) */}
                                <Grid item xs={1}>
                                    <TextField
                                        fullWidth
                                        label="단위"
                                        value={item.unit || ''}
                                        InputProps={{
                                            readOnly: true
                                        }}
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
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel id="project-select-label">프로젝트 선택</InputLabel>
                                <Select
                                    labelId="project-select-label"
                                    id="project-select"
                                    value={selectedProjectId}
                                    label="프로젝트 선택"
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    required
                                >
                                    {projects.map((project) => (
                                        <MenuItem key={project.id} value={project.id}>
                                            {project.projectName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
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
