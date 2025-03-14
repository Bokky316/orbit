import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
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
    Autocomplete,
    CircularProgress,
    Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Delete as DeleteIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import moment from 'moment';
import { API_URL } from '@/utils/constants';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { updateProject, updateProjectWithFiles } from '@/redux/projectSlice';

/**
 * 프로젝트 수정 페이지 컴포넌트
 */
function ProjectEditPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();

    // 기본 상태 관리
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 폼 필드 상태
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
    const [existingAttachments, setExistingAttachments] = useState([]);
    const [newAttachments, setNewAttachments] = useState([]);
    const [attachmentsToDelete, setAttachmentsToDelete] = useState([]);

    // 프로젝트 데이터 로드
    useEffect(() => {
        const fetchProject = async () => {
            try {
                setLoading(true);
                const response = await fetchWithAuth(`${API_URL}projects/${id}`);
                if (!response.ok) {
                    throw new Error('프로젝트를 불러오는데 실패했습니다.');
                }

                const projectData = await response.json();
                setProject(projectData);

                // 폼 필드 초기화
                setProjectName(projectData.projectName || '');
                setBusinessCategory(projectData.businessCategory || '');
                setTotalBudget(projectData.totalBudget ? projectData.totalBudget.toString() : '');
                setBudgetCode(projectData.budgetCode || '');
                setRemarks(projectData.remarks || '');

                // 날짜 데이터 설정
                if (projectData.projectPeriod) {
                    setStartDate(projectData.projectPeriod.startDate ? moment(projectData.projectPeriod.startDate) : null);
                    setEndDate(projectData.projectPeriod.endDate ? moment(projectData.projectPeriod.endDate) : null);
                }

                // 첨부파일 설정
                if (projectData.attachments) {
                    setExistingAttachments(projectData.attachments);
                }

                setError(null);
            } catch (err) {
                console.error("프로젝트 로드 오류:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [id]);

    // 필요한 데이터 로드
    useEffect(() => {
        // 부서 목록 가져오기
        const fetchDepartments = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}organization/departments`);
                if (response.ok) {
                    const data = await response.json();
                    setDepartments(data);

                    // 현재 프로젝트의 부서 찾기
                    if (project && project.requestDepartmentId) {
                        const projectDept = data.find(dept => dept.id === project.requestDepartmentId);
                        if (projectDept) {
                            setSelectedDepartment(projectDept);
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

        if (!loading && project) {
            fetchDepartments();
            fetchBudgetCodes();
            fetchBusinessCategories();
        }
    }, [project, loading]);

    // 부서 선택 시 해당 부서의 멤버 조회
    useEffect(() => {
        if (selectedDepartment) {
            const fetchDepartmentMembers = async () => {
                try {
                    const response = await fetchWithAuth(`${API_URL}organization/members/department/${selectedDepartment.id}`);
                    if (response.ok) {
                        const data = await response.json();
                        setDepartmentMembers(data);

                        // 현재 프로젝트의 담당자 찾기
                        if (project && project.requesterId) {
                            const projectManager = data.find(member => member.id === project.requesterId);
                            if (projectManager) {
                                setSelectedManager(projectManager);
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
    }, [selectedDepartment, project]);

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

        // 요청 데이터 구성
        const requestData = {
            id: project.id,
            projectName,
            businessCategory,
            totalBudget: parseFloat(totalBudget) || 0,
            budgetCode,
            remarks,
            projectPeriod: {
                startDate: startDate ? startDate.format('YYYY-MM-DD') : null,
                endDate: endDate ? endDate.format('YYYY-MM-DD') : null,
            },
            // 기존 상태 코드 유지
            basicStatus: project.basicStatus,
            requestDepartment: selectedDepartment ? selectedDepartment.name : '',
            requestDepartmentId: selectedDepartment ? selectedDepartment.id : null,
            requesterName: selectedManager ? selectedManager.name : null,
            requesterId: selectedManager ? selectedManager.id : null,
            // 업데이트 시 현재 사용자 정보 추가
            updatedBy: localStorage.getItem('username') || '',
        };

        try {
            if (newAttachments.length > 0) {
                // 파일이 있으면 multipart/form-data로 전송
                const formData = new FormData();

                // 객체 데이터를 JSON 문자열로 변환하여 추가
                formData.append('ProjectDTO', JSON.stringify(requestData));

                // 파일 추가
                for (let i = 0; i < newAttachments.length; i++) {
                    formData.append('files', newAttachments[i]);
                }

                const result = await dispatch(updateProjectWithFiles({
                    id: project.id,
                    projectData: formData
                })).unwrap();

                alert('프로젝트가 성공적으로 수정되었습니다.');
                navigate(`/projects/${project.id}`);
            } else {
                // 파일이 없으면 JSON으로 전송
                const result = await dispatch(updateProject({
                    id: project.id,
                    projectData: requestData
                })).unwrap();

                alert('프로젝트가 성공적으로 수정되었습니다.');
                navigate(`/projects/${project.id}`);
            }

            // 삭제할 첨부파일이 있으면 처리
            if (attachmentsToDelete.length > 0) {
                for (const attachmentId of attachmentsToDelete) {
                    try {
                        const response = await fetchWithAuth(`${API_URL}projects/attachments/${attachmentId}`, {
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
        } catch (error) {
            alert(`오류 발생: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error">{error}</Alert>
                <Button sx={{ mt: 2 }} onClick={() => navigate('/projects')}>
                    프로젝트 목록으로 돌아가기
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" component="h2">
                프로젝트 수정
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
                                getOptionLabel={(option) => option.name}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                value={selectedDepartment}
                                onChange={(event, newValue) => {
                                    setSelectedDepartment(newValue);
                                    // 부서가 변경되면 담당자 초기화
                                    if (!newValue || (selectedDepartment && newValue.id !== selectedDepartment.id)) {
                                        setSelectedManager(null);
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="요청 부서"
                                    />
                                )}
                            />
                        </Grid>

                        {/* 담당자 Autocomplete */}
                        <Grid item xs={6}>
                            <Autocomplete
                                id="requester-select"
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
                                        label="담당자"
                                        helperText={!selectedDepartment ? "먼저 요청 부서를 선택해주세요" : ""}
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

                        <Grid item xs={12} sx={{ display: 'flex', gap: 2, mt: 2 }}>
                            <Button type="submit" variant="contained">
                                수정하기
                            </Button>
                            <Button variant="outlined" onClick={() => navigate(`/projects/${id}`)}>
                                취소
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
}

export default ProjectEditPage;