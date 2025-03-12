import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
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
    IconButton
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

    // 상태 관리
    const [projectName, setProjectName] = useState('');
    const [businessCategory, setBusinessCategory] = useState('');
    const [clientCompany, setClientCompany] = useState('');
    const [contractType, setContractType] = useState('');
    const [totalBudget, setTotalBudget] = useState('');
    const [remarks, setRemarks] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [basicStatus, setBasicStatus] = useState('PROJECT-STATUS-REQUESTED'); // 유효한 기본값 설정
    const [procurementStatus, setProcurementStatus] = useState('PROJECT-PROCUREMENT-REQUEST_RECEIVED'); // 유효한 기본값 설정
    const [requestDepartment, setRequestDepartment] = useState('');

    // 첨부 파일 상태
    const [attachments, setAttachments] = useState([]);

    /**
     * 폼 제출 핸들러
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 첨부 파일이 있는 경우 multipart/form-data로 처리
        if (attachments.length > 0) {
            await handleSubmitWithFiles();
        } else {
            await handleSubmitJson();
        }
    };

    /**
     * JSON 형식으로 제출 (파일 없을 때)
     */
    const handleSubmitJson = async () => {
        // 요청 데이터 구성
        const requestData = {
            projectName,
            businessCategory,
            clientCompany,
            contractType,
            totalBudget: parseFloat(totalBudget) || 0,
            remarks,
            projectPeriod: {
                startDate: startDate ? startDate.format('YYYY-MM-DD') : null,
                endDate: endDate ? endDate.format('YYYY-MM-DD') : null,
            },
            basicStatus,
            procurementStatus,
            requestDepartment,
        };

        try {
            // API 요청
            const response = await fetchWithAuth(`${API_URL}projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (response.ok) {
                alert('프로젝트가 성공적으로 생성되었습니다.');
                navigate('/projects'); // 프로젝트 목록 페이지로 이동
            } else {
                const errorData = await response.text();
                alert(`오류 발생: ${errorData}`);
            }
        } catch (error) {
            alert(`오류 발생: ${error.message}`);
        }
    };

    /**
     * Multipart/form-data로 제출 (파일 있을 때)
     */
    const handleSubmitWithFiles = async () => {
        // FormData 구성
        const formData = new FormData();

        // 프로젝트 데이터를 JSON으로 변환하여 추가
        const projectData = {
            projectName,
            businessCategory,
            clientCompany,
            contractType,
            totalBudget: parseFloat(totalBudget) || 0,
            remarks,
            projectPeriod: {
                startDate: startDate ? startDate.format('YYYY-MM-DD') : null,
                endDate: endDate ? endDate.format('YYYY-MM-DD') : null,
            },
            basicStatus,
            procurementStatus,
            requestDepartment,
        };

        // 프로젝트 데이터를 Blob으로 변환하여 FormData에 추가
        const projectBlob = new Blob([JSON.stringify(projectData)], { type: 'application/json' });
        formData.append('projectRequestDTO', projectBlob);

        // 첨부 파일 추가
        attachments.forEach(file => {
            formData.append('files', file);
        });

        try {
            // API 요청
            const response = await fetchWithAuth(`${API_URL}projects`, {
                method: 'POST',
                body: formData, // Content-Type은 자동으로 설정됨
            });

            if (response.ok) {
                alert('프로젝트가 성공적으로 생성되었습니다.');
                navigate('/projects'); // 프로젝트 목록 페이지로 이동
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
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="고객사"
                                value={clientCompany}
                                onChange={(e) => setClientCompany(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="계약 유형"
                                value={contractType}
                                onChange={(e) => setContractType(e.target.value)}
                            />
                        </Grid>
                         <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="요청 부서"
                                value={requestDepartment}
                                onChange={(e) => setRequestDepartment(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="총 예산"
                                value={totalBudget}
                                onChange={(e) => setTotalBudget(e.target.value)}
                            />
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
                         <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel id="basic-status-label">기본 상태</InputLabel>
                                <Select
                                    labelId="basic-status-label"
                                    value={basicStatus}
                                    label="기본 상태"
                                    onChange={(e) => setBasicStatus(e.target.value)}
                                >
                                    <MenuItem value="PROJECT-STATUS-REQUESTED">프로젝트 요청</MenuItem>
                                    <MenuItem value="PROJECT-STATUS-RECEIVED">프로젝트 접수</MenuItem>
                                    <MenuItem value="PROJECT-STATUS-REJECTED">프로젝트 반려</MenuItem>
                                    <MenuItem value="PROJECT-STATUS-TERMINATED">프로젝트 중도 종결</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel id="procurement-status-label">조달 상태</InputLabel>
                                <Select
                                    labelId="procurement-status-label"
                                    value={procurementStatus}
                                    label="조달 상태"
                                    onChange={(e) => setProcurementStatus(e.target.value)}
                                >
                                    <MenuItem value="PROJECT-PROCUREMENT-REQUEST_RECEIVED">구매요청 접수</MenuItem>
                                    <MenuItem value="PROJECT-PROCUREMENT-VENDOR_SELECTION">업체 선정</MenuItem>
                                    <MenuItem value="PROJECT-PROCUREMENT-CONTRACT_PENDING">구매계약 대기</MenuItem>
                                    <MenuItem value="PROJECT-PROCUREMENT-INSPECTION">검수 진행</MenuItem>
                                    <MenuItem value="PROJECT-PROCUREMENT-INVOICE_ISSUED">인보이스 발행</MenuItem>
                                    <MenuItem value="PROJECT-PROCUREMENT-PAYMENT_COMPLETED">대급지급 완료</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
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