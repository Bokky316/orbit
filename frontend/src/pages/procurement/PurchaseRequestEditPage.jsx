import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box, Typography, Paper, TextField, Button, Grid, Alert, CircularProgress,
    IconButton, List, ListItem, ListItemAvatar, ListItemText,
    Avatar, InputAdornment, FormControl, InputLabel, Select, MenuItem,
    Chip, Divider, Autocomplete
} from '@mui/material';
import { Delete as DeleteIcon, AttachFile as AttachFileIcon, Add as AddIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from 'moment';
import { API_URL } from '@/utils/constants';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { updatePurchaseRequest, fetchItems, fetchCategories } from '@/redux/purchaseRequestSlice';

function PurchaseRequestEditPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();

    // Redux 상태 가져오기
    const { items: availableItems, categories } = useSelector(state => state.purchaseRequest);
    const loading = useSelector(state => state.purchaseRequest.loading);
    const error = useSelector(state => state.purchaseRequest.error);

    // 현재 로그인한 사용자 정보 가져오기
    const { user } = useSelector(state => state.auth);

    // 초기 상태
    const [purchaseRequest, setPurchaseRequest] = useState(null);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // 프로젝트 목록 상태
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');

    // 부서 및 담당자 데이터 상태
    const [departments, setDepartments] = useState([]);
    const [members, setMembers] = useState([]);
    const [departmentMembers, setDepartmentMembers] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [selectedManager, setSelectedManager] = useState(null);

    // 공통 필드 상태
    const [businessType, setBusinessType] = useState('');
    const [requestName, setRequestName] = useState('');
    const [requestDate, setRequestDate] = useState(moment());
    // 고객사는 빈 값으로 설정하고 UI에서 숨김
    const [customer, setCustomer] = useState('');
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
    const initItem = {
        itemId: '',
        quantity: '',
        unitPrice: '',
        totalPrice: 0,
        deliveryRequestDate: null,
        deliveryLocation: ''
    };
    const [items, setItems] = useState([initItem]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [filteredItems, setFilteredItems] = useState([]);

    // 첨부 파일 상태
    const [existingAttachments, setExistingAttachments] = useState([]);
    const [newAttachments, setNewAttachments] = useState([]);
    const [attachmentsToDelete, setAttachmentsToDelete] = useState([]);

    // 구매 요청 정보 가져오기
    useEffect(() => {
        const fetchPurchaseRequest = async () => {
            try {
                setFetchLoading(true);
                const response = await fetchWithAuth(`${API_URL}purchase-requests/${id}`);
                if (!response.ok) {
                    throw new Error('구매 요청을 불러오는데 실패했습니다.');
                }

                const data = await response.json();
                setPurchaseRequest(data);

                // 기본 정보 설정
                setBusinessType(data.businessType || '');
                setRequestName(data.requestName || '');
                setRequestDate(data.requestDate ? moment(data.requestDate) : moment());
                setCustomer(data.customer || '');
                setBusinessBudget(data.businessBudget ? data.businessBudget.toString() : '');
                setSpecialNotes(data.specialNotes || '');
                setManagerPhoneNumber(data.managerPhoneNumber || '');

                // 프로젝트 ID 설정
                if (data.projectId) {
                    setSelectedProjectId(data.projectId);
                }

                // 사업 구분별 필드 설정
                if (data.businessType === 'SI') {
                    setProjectStartDate(data.projectStartDate ? moment(data.projectStartDate) : null);
                    setProjectEndDate(data.projectEndDate ? moment(data.projectEndDate) : null);
                    setProjectContent(data.projectContent || '');
                }
                else if (data.businessType === 'MAINTENANCE') {
                    setContractStartDate(data.contractStartDate ? moment(data.contractStartDate) : null);
                    setContractEndDate(data.contractEndDate ? moment(data.contractEndDate) : null);
                    setContractAmount(data.contractAmount ? data.contractAmount.toString() : '');
                    setContractDetails(data.contractDetails || '');
                }
                else if (data.businessType === 'GOODS' && Array.isArray(data.items)) {
                    const formattedItems = data.items.map(item => ({
                        id: item.id,
                        itemId: item.itemId,
                        itemName: item.itemName,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,
                        specification: item.specification,
                        unitParentCode: item.unitParentCode,
                        unitChildCode: item.unitChildCode,
                        deliveryRequestDate: item.deliveryRequestDate ? moment(item.deliveryRequestDate) : null,
                        deliveryLocation: item.deliveryLocation || ''
                    }));

                    setItems(formattedItems.length > 0 ? formattedItems : [initItem]);
                }

                // 첨부파일 설정
                if (data.attachments && Array.isArray(data.attachments)) {
                    setExistingAttachments(data.attachments);
                }

                setFetchError(null);
            } catch (err) {
                console.error("구매 요청 로드 오류:", err);
                setFetchError(err.message);
            } finally {
                setFetchLoading(false);
            }
        };

        fetchPurchaseRequest();

        // Redux를 통해 아이템과 카테고리 목록 가져오기
        dispatch(fetchItems());
        dispatch(fetchCategories());
    }, [id, dispatch]);

    // 컴포넌트 마운트 시 필요한 데이터 로드
    useEffect(() => {
        // 프로젝트 목록 가져오기
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
                console.error(`프로젝트 목록을 가져오는 중 오류가 발생했습니다: ${error.message}`);
            }
        };

        // 부서 목록 가져오기
        const fetchDepartments = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}organization/departments`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) {
                    throw new Error(`부서 목록을 가져오는데 실패했습니다: ${response.status}`);
                }
                const departmentsData = await response.json();
                setDepartments(departmentsData);

                // 현재 구매요청의 부서 찾기
                if (purchaseRequest && purchaseRequest.businessDepartment) {
                    const requestDept = departmentsData.find(dept => dept.name === purchaseRequest.businessDepartment);
                    if (requestDept) {
                        setSelectedDepartment(requestDept);
                    }
                }
            } catch (error) {
                console.error(`부서 목록을 가져오는 중 오류가 발생했습니다: ${error.message}`);
            }
        };

        // 모든 멤버 목록 가져오기
        const fetchAllMembers = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}organization/members`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) {
                    throw new Error(`사용자 목록을 가져오는데 실패했습니다: ${response.status}`);
                }
                const membersData = await response.json();
                setMembers(membersData);
            } catch (error) {
                console.error(`사용자 목록을 가져오는 중 오류가 발생했습니다: ${error.message}`);
            }
        };

        if (!fetchLoading && purchaseRequest) {
            fetchAllProjects();
            fetchDepartments();
            fetchAllMembers();
        }
    }, [purchaseRequest, fetchLoading]);

    // 초기에 filteredItems 설정
    useEffect(() => {
        setFilteredItems(availableItems);
    }, [availableItems]);

    // 카테고리 선택 시 아이템 필터링
    useEffect(() => {
        if (selectedCategory) {
            const filtered = availableItems.filter(item => item.categoryId === selectedCategory);
            setFilteredItems(filtered);
        } else {
            setFilteredItems(availableItems);
        }
    }, [selectedCategory, availableItems]);

    // 부서 선택 시 해당 부서의 멤버 필터링
    useEffect(() => {
        if (selectedDepartment) {
            const fetchDepartmentMembers = async () => {
                try {
                    const response = await fetchWithAuth(`${API_URL}organization/members/department/${selectedDepartment.id}`);
                    if (response.ok) {
                        const data = await response.json();
                        setDepartmentMembers(data);

                        // 현재 구매요청의 담당자 찾기
                        if (purchaseRequest && purchaseRequest.businessManager) {
                            const manager = data.find(member => member.name === purchaseRequest.businessManager);
                            if (manager) {
                                setSelectedManager(manager);
                            }
                        }
                    } else {
                        console.error('부서 멤버를 가져오는데 실패했습니다.');
                    }
                } catch (error) {
                    console.error('부서 멤버 조회 중 오류 발생:', error);
                }
            };

            fetchDepartmentMembers();
        } else {
            setDepartmentMembers([]);
        }
    }, [selectedDepartment, purchaseRequest]);

    // 담당자 변경 시 전화번호 자동 설정
    useEffect(() => {
        if (selectedManager && selectedManager.contactNumber) {
            setManagerPhoneNumber(selectedManager.contactNumber.replace(/[^0-9]/g, ''));
        }
    }, [selectedManager]);

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
                itemId: selectedItem.id,
                itemName: selectedItem.name,
                categoryId: selectedItem.categoryId,
                categoryName: selectedItem.categoryName,
                specification: selectedItem.specification,
                unitParentCode: selectedItem.unitParentCode,
                unitChildCode: selectedItem.unitChildCode,
                unitPrice: selectedItem.standardPrice || 0,
            };

            // 가격이 있으면 총액 자동 계산
            if (selectedItem.standardPrice && newItems[index].quantity) {
                const quantity = Number(newItems[index].quantity) || 0;
                const unitPrice = Number(selectedItem.standardPrice) || 0;
                newItems[index].totalPrice = quantity * unitPrice;
            }

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

    // 기존 첨부파일 삭제 핸들러
    const handleRemoveExistingAttachment = (attachmentId) => {
        // 삭제할 첨부파일 ID 목록에 추가
        setAttachmentsToDelete([...attachmentsToDelete, attachmentId]);

        // 화면에서 첨부파일 제거
        setExistingAttachments(existingAttachments.filter(att => att.id !== attachmentId));
    };

    // 새 첨부파일 삭제 핸들러
    const handleRemoveNewAttachment = (index) => {
        const newFiles = [...newAttachments];
        newFiles.splice(index, 1);
        setNewAttachments(newFiles);
    };

    /**
     * 폼 제출 핸들러
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 공통 데이터
        let requestData = {
            id: purchaseRequest.id,
            businessType,
            requestName,
            requestDate: requestDate.format('YYYY-MM-DD'),
            customer: '', // 고객사는 빈 값으로 전송
            businessDepartment: selectedDepartment ? selectedDepartment.name : '',
            businessDepartmentId: selectedDepartment ? selectedDepartment.id : null,
            businessManager: selectedManager ? selectedManager.name : '',
            businessManagerId: selectedManager ? selectedManager.id : null,
            businessBudget: parseFloat(businessBudget.replace(/,/g, '')) || 0,
            specialNotes,
            managerPhoneNumber: managerPhoneNumber || '',
            projectId: selectedProjectId,

            // 현재 로그인한 사용자 정보 추가
            memberId: user?.id,
            memberName: user?.name,
            memberCompany: user?.companyName,

            // 상태 값 유지
            status: purchaseRequest.status
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
            requestData.items = items.map(item => {
                // unitPrice가 문자열인지 확인하고 적절히 처리
                let unitPrice = 0;
                if (typeof item.unitPrice === 'string') {
                    unitPrice = parseFloat(item.unitPrice.replace(/,/g, '')) || 0;
                } else if (typeof item.unitPrice === 'number') {
                    unitPrice = item.unitPrice;
                }

                return {
                    id: item.id, // 기존 아이템 ID 유지
                    itemId: item.itemId,
                    quantity: parseInt(item.quantity) || 0,
                    unitPrice: unitPrice,
                    totalPrice: parseFloat(item.totalPrice) || 0,
                    deliveryRequestDate: item.deliveryRequestDate ? item.deliveryRequestDate.format('YYYY-MM-DD') : null,
                    deliveryLocation: item.deliveryLocation
                };
            });
        }

        try {
            // Redux 액션을 사용하여 업데이트
            await dispatch(updatePurchaseRequest({
                id: purchaseRequest.id,
                requestData
            })).unwrap();

            // 첨부 파일 처리
            if (newAttachments.length > 0) {
                const fileFormData = new FormData();
                newAttachments.forEach(file => {
                    fileFormData.append('files', file);
                });

                try {
                    const fileResponse = await fetchWithAuth(`${API_URL}purchase-requests/${purchaseRequest.id}/attachments`, {
                        method: 'POST',
                        body: fileFormData
                    });

                    if (!fileResponse.ok) {
                        const errorMsg = await fileResponse.text();
                        console.error(`첨부 파일 업로드에 실패했습니다: ${errorMsg}`);
                        alert(`첨부 파일 업로드에 실패했습니다: ${errorMsg}`);
                    }
                } catch (fileError) {
                    console.error(`첨부 파일 업로드 중 오류 발생: ${fileError.message}`);
                    alert(`첨부 파일 업로드 중 오류 발생: ${fileError.message}`);
                }
            }

            // 삭제할 첨부파일이 있으면 처리
            if (attachmentsToDelete.length > 0) {
                for (const attachmentId of attachmentsToDelete) {
                    try {
                        const response = await fetchWithAuth(`${API_URL}purchase-requests/attachments/${attachmentId}`, {
                            method: 'DELETE'
                        });

                        if (!response.ok) {
                            console.warn(`첨부파일 ID ${attachmentId} 삭제 실패`);
                        }
                    } catch (error) {
                        console.error(`첨부파일 삭제 오류:`, error);
                    }
                }
            }

            alert('구매 요청이 성공적으로 수정되었습니다.');
            navigate(`/purchase-requests/${purchaseRequest.id}`);
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
                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                <DatePicker
                                    label="프로젝트 시작일"
                                    value={projectStartDate}
                                    onChange={setProjectStartDate}
                                    slotProps={{
                                      textField: {
                                        fullWidth: true,
                                        error: false } }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={6}>
                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                <DatePicker
                                    label="프로젝트 종료일"
                                    value={projectEndDate}
                                    onChange={setProjectEndDate}
                                    slotProps={{
                                      textField: {
                                        fullWidth: true,
                                        error: false } }}
                                />
                            </LocalizationProvider>
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
                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                <DatePicker
                                    label="계약 시작일"
                                    value={contractStartDate}
                                    onChange={setContractStartDate}
                                    slotProps={{
                                      textField: {
                                        fullWidth: true,
                                        error: false } }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={6}>
                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                <DatePicker
                                    label="계약 종료일"
                                    value={contractEndDate}
                                    onChange={setContractEndDate}
                                    slotProps={{
                                      textField: {
                                        fullWidth: true,
                                        error: false } }}
                                />
                            </LocalizationProvider>
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
                        {/* 카테고리 선택 필드 추가 */}
                        <Grid item xs={12} sx={{ mb: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel id="category-select-label">카테고리 선택</InputLabel>
                                <Select
                                    labelId="category-select-label"
                                    id="category-select"
                                    value={selectedCategory}
                                    label="카테고리 선택"
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <MenuItem value="">모든 카테고리</MenuItem>
                                    {categories.map(category => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* 물품 아이템 레이아웃 */}
                        {items.map((item, index) => (
                          <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 2, mx: 0, width: '100%' }}>
                            {/* 아이템 선택 */}
                            <Grid item xs={3}>
                              <FormControl fullWidth size="small">
                                <InputLabel id={`item-select-label-${index}`}>품목 선택 *</InputLabel>
                                <Select
                                  labelId={`item-select-label-${index}`}
                                  id={`item-select-${index}`}
                                  value={item.itemId || ''}
                                  label="품목 선택 *"
                                  onChange={(e) => handleItemSelect(index, e)}
                                  required
                                >
                                  {filteredItems.map(availableItem => (
                                    <MenuItem key={availableItem.id} value={availableItem.id}>
                                      {availableItem.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>

                            {/* 사양 */}
                            <Grid item xs={2}>
                              <TextField
                                fullWidth
                                size="small"
                                label="사양"
                                value={item.specification || ''}
                                InputProps={{ readOnly: true }}
                              />
                            </Grid>

                            {/* 단위 */}
                            <Grid item xs={1}>
                              <TextField
                                fullWidth
                                size="small"
                                label="단위"
                                value={item.unitChildCode || ''}
                                InputProps={{ readOnly: true }}
                              />
                            </Grid>

                            {/* 수량 */}
                            <Grid item xs={1}>
                              <TextField
                                fullWidth
                                size="small"
                                label="수량 *"
                                value={item.quantity || ''}
                                onChange={(e) => handleNumericItemChange(index, 'quantity')(e)}
                                required
                              />
                            </Grid>

                            {/* 단가 */}
                            <Grid item xs={2}>
                              <TextField
                                fullWidth
                                size="small"
                                label="단가 *"
                                value={item.unitPrice || ''}
                                onChange={(e) => handleNumericItemChange(index, 'unitPrice')(e)}
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">₩</InputAdornment>,
                                  inputProps: { maxLength: 15 }
                                }}
                                required
                              />
                            </Grid>

                            {/* 총액 */}
                            <Grid item xs={2}>
                              <TextField
                                fullWidth
                                size="small"
                                label="총액"
                                value={item.totalPrice ? item.totalPrice.toLocaleString() : '0'}
                                InputProps={{
                                  readOnly: true,
                                  startAdornment: <InputAdornment position="start">₩</InputAdornment>
                                }}
                              />
                            </Grid>

                            {/* 삭제 버튼 */}
                            <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <IconButton
                                aria-label="delete"
                                onClick={() => handleRemoveItem(index)}
                                color="error"
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Grid>
                          </Grid>
                        ))}

                        {/* 품목 추가 버튼 */}
                        <Grid item xs={12} sx={{ mt: 1, display: 'flex', justifyContent: 'flex-start' }}>
                          <Button
                            variant="outlined"
                            onClick={() => setItems([...items, initItem])}
                            startIcon={<AddIcon />}
                            size="small"
                            sx={{ px: 2, py: 1 }}
                          >
                            품목 추가
                          </Button>
                        </Grid>
                    </>
                );

            default:
                return null;
        }
    };

    if (fetchLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (fetchError) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error">{fetchError}</Alert>
                <Button sx={{ mt: 2 }} onClick={() => navigate('/purchase-requests')}>
                    목록으로 돌아가기
                </Button>
            </Box>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    구매 요청 수정
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
                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                <DatePicker
                                    label="요청일 *"
                                    value={requestDate}
                                    onChange={(date) => setRequestDate(date)}
                                    slotProps={{
                                      textField: {
                                        fullWidth: true,
                                        error: false } }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        {/* 부서 선택 Autocomplete */}
                        <Grid item xs={6}>
                            <Autocomplete
                                id="business-department-select"
                                options={departments}
                                getOptionLabel={(option) => option.name}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                value={selectedDepartment}
                                onChange={(event, newValue) => {
                                    setSelectedDepartment(newValue);
                                    // 부서가 변경되면 담당자 초기화
                                    setSelectedManager(null);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="사업 부서 *"
                                        required
                                    />
                                )}
                            />
                        </Grid>
                        {/* 사업 담당자 Autocomplete */}
                        <Grid item xs={6}>
                            <Autocomplete
                                id="business-manager-select"
                                options={departmentMembers}
                                getOptionLabel={(option) => `${option.name} (${option.position ? option.position.name : '직급없음'})`}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                value={selectedManager}
                                onChange={(event, newValue) => {
                                    setSelectedManager(newValue);
                                }}
                                disabled={!selectedDepartment}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="사업 담당자 *"
                                        required
                                        helperText={!selectedDepartment ? "먼저 사업 부서를 선택해주세요" : ""}
                                    />
                                )}
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
                                    disabled={true} // 사업 구분은 수정 불가
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
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">+82</InputAdornment>
                                }}
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

                        {/* 기존 첨부 파일 목록 */}
                        {existingAttachments.length > 0 && (
                            <Grid item xs={12}>
                                <Typography variant="subtitle1">기존 첨부파일</Typography>
                                <List>
                                    {existingAttachments.map((attachment) => (
                                        <ListItem key={attachment.id}>
                                            <ListItemAvatar>
                                                <Avatar><AttachFileIcon /></Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={attachment.fileName}
                                                secondary={`${(attachment.fileSize / 1024).toFixed(2)} KB`}
                                            />
                                            <IconButton
                                                edge="end"
                                                aria-label="delete"
                                                onClick={() => handleRemoveExistingAttachment(attachment.id)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItem>
                                    ))}
                                </List>
                            </Grid>
                        )}

                        {/* 새 파일 첨부 영역 */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1">파일 추가</Typography>
                            <input
                                type="file"
                                multiple
                                onChange={(e) => setNewAttachments(Array.from(e.target.files))}
                                id="file-upload"
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="file-upload">
                                <Button variant="outlined" component="span" startIcon={<AttachFileIcon />}>
                                    파일 첨부
                                </Button>
                            </label>
                            {newAttachments.length > 0 && (
                                <List>
                                    {newAttachments.map((file, index) => (
                                        <ListItem key={index}>
                                            <ListItemAvatar>
                                                <Avatar><AttachFileIcon /></Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={file.name}
                                                secondary={`${(file.size / 1024).toFixed(2)} KB`}
                                            />
                                            <IconButton
                                                edge="end"
                                                aria-label="delete"
                                                onClick={() => handleRemoveNewAttachment(index)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Grid>

                        {/* 제출 버튼 */}
                        <Grid item xs={12} sx={{ textAlign: 'right', mt: 3 }}>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => navigate(`/purchase-requests/${id}`)}
                                sx={{ mr: 2 }}
                            >
                                취소
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                size="large"
                            >
                                수정하기
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </LocalizationProvider>
    );
}

export default PurchaseRequestEditPage;