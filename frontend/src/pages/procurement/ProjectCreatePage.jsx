import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    IconButton,
    Autocomplete
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Delete as DeleteIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import moment from 'moment';
import { API_URL } from '@/utils/constants';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

/**
 * 프로젝트 생성 페이지 컴포넌트
 */
function ProjectCreatePage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Redux에서 사용자 정보 가져오기
    const { user } = useSelector((state) => state.auth);
    console.log('현재 로그인한 사용자 정보:', user);

    // 상태 관리
    const [projectName, setProjectName] = useState('');
    const [businessCategory, setBusinessCategory] = useState('');
    const [totalBudget, setTotalBudget] = useState('');
    const [budgetCode, setBudgetCode] = useState('');
    const [remarks, setRemarks] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    // 부서 및 멤버 관련 상태
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [departmentMembers, setDepartmentMembers] = useState([]);
    const [selectedManager, setSelectedManager] = useState(null);

    // 예산 코드와 사업 유형을 위한 공통 코드 상태
    const [budgetCodes, setBudgetCodes] = useState([]);
    const [businessCategories, setBusinessCategories] = useState([]);

    // 첨부 파일 상태
    const [attachments, setAttachments] = useState([]);

    // 컴포넌트 마운트 시 필요한 데이터 로드
    useEffect(() => {
        // 부서 목록 가져오기
        const fetchDepartments = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}organization/departments`);
                if (response.ok) {
                    const data = await response.json();
                    setDepartments(data);

                    // Redux에서 가져온 사용자 정보에 부서 정보가 있다면 자동 선택
                    if (user && user.department) {
                        const userDept = data.find(dept => dept.id === user.department.id);
                        if (userDept) {
                            setSelectedDepartment(userDept);
                        }
                    }
                } else {
                    console.error('부서 목록을 가져오는데 실패했습니다.');
                }
            } catch (error) {
                console.error('부서 목록 조회 중 오류 발생:', error);
            }
        };

        // 예산 코드 가져오기
        const fetchBudgetCodes = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}common-codes/PROJECT/BUDGET_CODE`);
                if (response.ok) {
                    const data = await response.json();
                    setBudgetCodes(data);
                } else {
                    console.error('예산 코드를 가져오는데 실패했습니다.');
                }
            } catch (error) {
                console.error('예산 코드 조회 중 오류 발생:', error);
            }
        };

        // 사업 유형 가져오기
        const fetchBusinessCategories = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}common-codes/PROJECT/BUSINESS_CATEGORY`);
                if (response.ok) {
                    const data = await response.json();
                    setBusinessCategories(data);
                } else {
                    console.error('사업 유형을 가져오는데 실패했습니다.');
                }
            } catch (error) {
                console.error('사업 유형 조회 중 오류 발생:', error);
            }
        };

        fetchDepartments();
        fetchBudgetCodes();
        fetchBusinessCategories();
    }, [user]);

    // 부서 선택 시 해당 부서의 멤버 조회
    useEffect(() => {
            if (selectedDepartment) {
                const fetchDepartmentMembers = async () => {
                    try {
                        const response = await fetchWithAuth(`${API_URL}organization/members/department/${selectedDepartment.id}`);
                        if (response.ok) {
                            const data = await response.json();
                            setDepartmentMembers(data);

                            // 현재 로그인한 사용자가 이 부서의 멤버라면 자동 선택
                            if (user && user.id) {
                                const currentMember = data.find(member => member.id === user.id);
                                if (currentMember) {
                                    setSelectedManager(currentMember);
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
                setSelectedManager(null);
            }
        }, [selectedDepartment, user]);

    /**
     * 폼 제출 핸들러
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 요청 데이터 구성 (첨부파일 제외)
        const requestData = {
            projectName,
            businessCategory,
            totalBudget: parseFloat(totalBudget) || 0,
            budgetCode,
            remarks,
            projectPeriod: {
                startDate: startDate ? startDate.format('YYYY-MM-DD') : null,
                endDate: endDate ? endDate.format('YYYY-MM-DD') : null,
            },
            // 기본 상태는 서버에서 항상 'REGISTERED'(등록) 상태로 자동 설정됨
            requestDepartment: selectedDepartment ? selectedDepartment.name : '',
            requestDepartmentId: selectedDepartment ? selectedDepartment.id : null,
            requesterName: selectedManager ? selectedManager.name : null,
            requesterId: selectedManager ? selectedManager.id : null,
        };

        try {
            // 1. 먼저 JSON으로 프로젝트 생성
            const response = await fetchWithAuth(`${API_URL}projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (response.ok) {
                const createdProject = await response.json();

                // 2. 파일 첨부가 있는 경우, 별도 요청으로 처리
                if (attachments.length > 0) {
                    const fileFormData = new FormData();

                    attachments.forEach(file => {
                        fileFormData.append('files', file);
                    });

                    try {
                        const fileResponse = await fetch(`${API_URL}projects/${createdProject.id}/attachments`, {
                            method: 'POST',
                            credentials: 'include', // 쿠키 포함
                            body: fileFormData
                        });

                        if (fileResponse.ok) {
                            console.log('첨부 파일이 성공적으로 업로드되었습니다.');
                            alert('첨부 파일이 성공적으로 업로드되었습니다.');
                        } else {
                            const errorMsg = await fileResponse.text();
                            console.error(`첨부 파일 업로드에 실패했습니다: ${errorMsg}`);
                            alert(`첨부 파일 업로드에 실패했습니다: ${errorMsg}`);
                        }
                    } catch (fileError) {
                        console.error(`첨부 파일 업로드 중 오류 발생: ${fileError.message}`);
                        alert(`첨부 파일 업로드 중 오류 발생: ${fileError.message}`);
                    }
                }

                alert('프로젝트가 성공적으로 생성되었습니다.');
                navigate('/projects');
            } else {
                const errorData = await response.text();
                alert(`오류 발생: ${errorData}`);
            }
        } catch (error) {
            alert(`오류 발생: ${error.message}`);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" component="h2">
                프로젝트 생성
            </Typography>
            <Paper sx={{ p: 2, mt: 1 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="프로젝트명"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                required
                            />
                        </Grid>

                        {/* 사업 유형 드롭다운 */}
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel id="business-category-label">사업 유형</InputLabel>
                                <Select
                                    labelId="business-category-label"
                                    value={businessCategory}
                                    label="사업 유형"
                                    onChange={(e) => setBusinessCategory(e.target.value)}
                                >
                                    {businessCategories.map(category => (
                                        <MenuItem key={category.id} value={category.codeValue}>
                                            {category.codeName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* 부서 Autocomplete */}
                        <Grid item xs={6}>
                            <Autocomplete
                                id="request-department-select"
                                options={departments}
                                getOptionLabel={(option) => option.name || ''}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                value={selectedDepartment}
                                onChange={(event, newValue) => {
                                    setSelectedDepartment(newValue);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="요청 부서"
                                        helperText={selectedDepartment && user && user.department &&
                                                  selectedDepartment.id === user.department.id ?
                                                  "현재 로그인한 사용자의 부서입니다." : ""}
                                    />
                                )}
                            />
                        </Grid>

                        {/* 담당자 Autocomplete */}
                        <Grid item xs={6}>
                            <Autocomplete
                                id="requester-select"
                                options={departmentMembers}
                                getOptionLabel={(option) => option.name || ''}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                value={selectedManager}
                                onChange={(event, newValue) => {
                                    setSelectedManager(newValue);
                                }}
                                disabled={!selectedDepartment}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="담당자"
                                        helperText={!selectedDepartment ? "먼저 요청 부서를 선택해주세요" :
                                                  (selectedManager && user && selectedManager.id === user.id) ?
                                                  "현재 로그인한 사용자입니다." : ""}
                                    />
                                )}
                            />
                        </Grid>

                        {/* 총 예산 */}
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="총 예산"
                                value={totalBudget}
                                onChange={(e) => setTotalBudget(e.target.value.replace(/[^0-9]/g, ''))}
                            />
                        </Grid>

                        {/* 예산 코드 드롭다운 */}
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel id="budget-code-label">예산 코드</InputLabel>
                                <Select
                                    labelId="budget-code-label"
                                    value={budgetCode}
                                    label="예산 코드"
                                    onChange={(e) => setBudgetCode(e.target.value)}
                                >
                                    {budgetCodes.map(code => (
                                        <MenuItem key={code.id} value={code.codeValue}>
                                            {code.codeName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="비고"
                                multiline
                                rows={4}
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            />
                        </Grid>

                        {/* 날짜 선택 */}
                        <Grid item xs={6}>
                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                <DatePicker
                                    label="시작일"
                                    value={startDate}
                                    onChange={(date) => setStartDate(date)}
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
                                    label="종료일"
                                    value={endDate}
                                    onChange={(date) => setEndDate(date)}
                                    slotProps={{
                                      textField: {
                                        fullWidth: true,
                                        error: false } }}
                                />
                            </LocalizationProvider>
                        </Grid>

                        {/* 파일 첨부 영역 */}
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
                                <List>
                                    {attachments.map((file, index) => (
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
                                                onClick={() => {
                                                    const newFiles = [...attachments];
                                                    newFiles.splice(index, 1);
                                                    setAttachments(newFiles);
                                                }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Grid>

                        <Grid item xs={12}>
                            <Button type="submit" variant="contained">
                                제출하기
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
}

export default ProjectCreatePage;