// src/pages/approval/ApprovalLineAdministration.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import {
  fetchApprovalTemplates,
  createApprovalTemplate,
  updateApprovalTemplate,
  deleteApprovalTemplate,
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  fetchPositions,
  createPosition,
  updatePosition,
  deletePosition
} from '@/redux/approvalAdminSlice';

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`approval-admin-tabpanel-${index}`}
      aria-labelledby={`approval-admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Department Management Component
function DepartmentManagement() {
  const dispatch = useDispatch();
  const { data: departments, loading, error } = useSelector(state => state.approvalAdmin.departments);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState({
    name: '',
    code: '',
    description: '',
    teamLeaderLevel: 5,
    middleManagerLevel: 7,
    upperManagerLevel: 8,
    executiveLevel: 10
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  const handleOpenDialog = (department = null) => {
    if (department) {
      setCurrentDepartment({...department});
      setIsEditing(true);
    } else {
      setCurrentDepartment({
        name: '',
        code: '',
        description: '',
        teamLeaderLevel: 5,
        middleManagerLevel: 7,
        upperManagerLevel: 8,
        executiveLevel: 10
      });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentDepartment({
      ...currentDepartment,
      [name]: name.includes('Level') ? parseInt(value) : value
    });
  };

  const handleSave = () => {
    if (isEditing) {
      dispatch(updateDepartment({
        id: currentDepartment.id,
        departmentData: currentDepartment
      }));
    } else {
      dispatch(createDepartment(currentDepartment));
    }
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    if (window.confirm('이 부서를 삭제하시겠습니까?')) {
      dispatch(deleteDepartment(id));
    }
  };

  if (loading && departments.length === 0) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">부서 관리</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          부서 추가
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>부서명</TableCell>
              <TableCell>코드</TableCell>
              <TableCell>설명</TableCell>
              <TableCell>팀장 레벨</TableCell>
              <TableCell>중간관리자 레벨</TableCell>
              <TableCell>상위관리자 레벨</TableCell>
              <TableCell>임원 레벨</TableCell>
              <TableCell>관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map((department) => (
              <TableRow key={department.id}>
                <TableCell>{department.name}</TableCell>
                <TableCell>{department.code}</TableCell>
                <TableCell>{department.description}</TableCell>
                <TableCell>{department.teamLeaderLevel}</TableCell>
                <TableCell>{department.middleManagerLevel}</TableCell>
                <TableCell>{department.upperManagerLevel}</TableCell>
                <TableCell>{department.executiveLevel}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(department)}
                    size="small"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(department.id)}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Department Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? '부서 수정' : '부서 추가'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                name="name"
                label="부서명"
                value={currentDepartment.name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="code"
                label="부서 코드"
                value={currentDepartment.code}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="설명"
                value={currentDepartment.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="teamLeaderLevel"
                label="팀장 직급 레벨"
                type="number"
                value={currentDepartment.teamLeaderLevel}
                onChange={handleInputChange}
                fullWidth
                InputProps={{ inputProps: { min: 1, max: 10 } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="middleManagerLevel"
                label="중간관리자 직급 레벨"
                type="number"
                value={currentDepartment.middleManagerLevel}
                onChange={handleInputChange}
                fullWidth
                InputProps={{ inputProps: { min: 1, max: 10 } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="upperManagerLevel"
                label="상위관리자 직급 레벨"
                type="number"
                value={currentDepartment.upperManagerLevel}
                onChange={handleInputChange}
                fullWidth
                InputProps={{ inputProps: { min: 1, max: 10 } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="executiveLevel"
                label="임원 직급 레벨"
                type="number"
                value={currentDepartment.executiveLevel}
                onChange={handleInputChange}
                fullWidth
                InputProps={{ inputProps: { min: 1, max: 10 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Position Management Component
function PositionManagement() {
  const dispatch = useDispatch();
  const { data: positions, loading, error } = useSelector(state => state.approvalAdmin.positions);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({
    name: '',
    level: 1,
    description: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    dispatch(fetchPositions());
  }, [dispatch]);

  const handleOpenDialog = (position = null) => {
    if (position) {
      setCurrentPosition({...position});
      setIsEditing(true);
    } else {
      setCurrentPosition({
        name: '',
        level: 1,
        description: ''
      });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentPosition({
      ...currentPosition,
      [name]: name === 'level' ? parseInt(value) : value
    });
  };

  const handleSave = () => {
    if (isEditing) {
      dispatch(updatePosition({
        id: currentPosition.id,
        positionData: currentPosition
      }));
    } else {
      dispatch(createPosition(currentPosition));
    }
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    if (window.confirm('이 직급을 삭제하시겠습니까?')) {
      dispatch(deletePosition(id));
    }
  };

  if (loading && positions.length === 0) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">직급 관리</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          직급 추가
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>직급명</TableCell>
              <TableCell>레벨</TableCell>
              <TableCell>설명</TableCell>
              <TableCell>관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {positions.map((position) => (
              <TableRow key={position.id}>
                <TableCell>{position.name}</TableCell>
                <TableCell>{position.level}</TableCell>
                <TableCell>{position.description}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(position)}
                    size="small"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(position.id)}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Position Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? '직급 수정' : '직급 추가'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                name="name"
                label="직급명"
                value={currentPosition.name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="level"
                label="직급 레벨"
                type="number"
                value={currentPosition.level}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{ inputProps: { min: 1, max: 10 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="설명"
                value={currentPosition.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Approval Template Management Component
function ApprovalTemplateManagement() {
  const dispatch = useDispatch();
  const { data: templates, loading, error } = useSelector(state => state.approvalAdmin.templates);
  const { data: departments } = useSelector(state => state.approvalAdmin.departments);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState({
    name: '',
    description: '',
    steps: [],
    active: true
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    dispatch(fetchApprovalTemplates());
    if (departments.length === 0) {
      dispatch(fetchDepartments());
    }
  }, [dispatch, departments.length]);

  const handleOpenDialog = (template = null) => {
    if (template) {
      setCurrentTemplate({...template});
      setIsEditing(true);
    } else {
      setCurrentTemplate({
        name: '',
        description: '',
        steps: [],
        active: true
      });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setCurrentTemplate({
      ...currentTemplate,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleAddStep = () => {
    const newStep = {
      step: currentTemplate.steps.length + 1,
      department: null,
      minLevel: 1,
      maxLevel: 10,
      description: ''
    };
    setCurrentTemplate({
      ...currentTemplate,
      steps: [...currentTemplate.steps, newStep]
    });
  };

  const handleUpdateStep = (index, field, value) => {
    const updatedSteps = [...currentTemplate.steps];

    if (field === 'department') {
      if (value) {
        // 부서 ID로 부서 객체 찾기
        const departmentObj = departments.find(d => d.id === parseInt(value));
        if (departmentObj) {
          // 필요한 부서 정보만 포함한 DepartmentDTO로 변환
          updatedSteps[index][field] = {
            id: departmentObj.id,
            name: departmentObj.name,
            code: departmentObj.code || '',
            description: departmentObj.description || '',
            teamLeaderLevel: departmentObj.teamLeaderLevel || 5,
            middleManagerLevel: departmentObj.middleManagerLevel || 7,
            upperManagerLevel: departmentObj.upperManagerLevel || 8,
            executiveLevel: departmentObj.executiveLevel || 10
          };
        } else {
          updatedSteps[index][field] = null;
        }
      } else {
        updatedSteps[index][field] = null;
      }
    } else if (field === 'minLevel' || field === 'maxLevel') {
      updatedSteps[index][field] = parseInt(value) || 1;
    } else {
      updatedSteps[index][field] = value;
    }

    setCurrentTemplate({
      ...currentTemplate,
      steps: updatedSteps
    });
  };

  const handleDeleteStep = (index) => {
    const updatedSteps = currentTemplate.steps.filter((_, i) => i !== index);

    // Renumber steps
    updatedSteps.forEach((step, i) => {
      step.step = i + 1;
    });

    setCurrentTemplate({
      ...currentTemplate,
      steps: updatedSteps
    });
  };

  const handleMoveStep = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === currentTemplate.steps.length - 1)
    ) {
      return;
    }

    const updatedSteps = [...currentTemplate.steps];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap steps
    [updatedSteps[index], updatedSteps[newIndex]] = [updatedSteps[newIndex], updatedSteps[index]];

    // Update step numbers
    updatedSteps.forEach((step, i) => {
      step.step = i + 1;
    });

    setCurrentTemplate({
      ...currentTemplate,
      steps: updatedSteps
    });
  };

  const handleSave = () => {
    if (isEditing) {
      dispatch(updateApprovalTemplate({
        id: currentTemplate.id,
        templateData: currentTemplate
      }));
    } else {
      dispatch(createApprovalTemplate(currentTemplate));
    }
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    if (window.confirm('이 결재선 템플릿을 삭제하시겠습니까?')) {
      dispatch(deleteApprovalTemplate(id));
    }
  };

  const handleToggleActive = (template) => {
    const updatedTemplate = { ...template, active: !template.active };
    dispatch(updateApprovalTemplate({
      id: template.id,
      templateData: updatedTemplate
    }));
  };

  if (loading && templates.length === 0) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">결재선 템플릿 관리</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          템플릿 추가
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                opacity: template.active ? 1 : 0.7
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" component="div">
                    {template.name}
                  </Typography>
                  <Chip
                    label={template.active ? '활성' : '비활성'}
                    color={template.active ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {template.description}
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="subtitle2" gutterBottom>
                  결재 단계 ({template.steps.length})
                </Typography>
                {template.steps.map((step, index) => (
                  <Box key={index} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '24px' }}>
                      {step.step}.
                    </Typography>
                    <Box>
                      <Typography variant="body2">
                        {step.department?.name || '부서 없음'} ({step.minLevel}-{step.maxLevel} 레벨)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {step.description || ''}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
                <IconButton
                  color={template.active ? 'warning' : 'success'}
                  onClick={() => handleToggleActive(template)}
                  size="small"
                >
                  {template.active ? <CancelIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                </IconButton>
                <Box>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(template)}
                    size="small"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(template.id)}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Template Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? '결재선 템플릿 수정' : '결재선 템플릿 추가'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={8}>
              <TextField
                name="name"
                label="템플릿명"
                value={currentTemplate.name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={4} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControl component="fieldset">
                <label>
                  <input
                    type="checkbox"
                    name="active"
                    checked={currentTemplate.active}
                    onChange={handleInputChange}
                  />
                  활성 상태
                </label>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="설명"
                value={currentTemplate.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">결재 단계</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddStep}
                size="small"
              >
                단계 추가
              </Button>
            </Box>

            {currentTemplate.steps.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                결재 단계를 추가해주세요.
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width="60">순서</TableCell>
                      <TableCell>부서</TableCell>
                      <TableCell>최소 레벨</TableCell>
                      <TableCell>최대 레벨</TableCell>
                      <TableCell>설명</TableCell>
                      <TableCell width="150">관리</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentTemplate.steps.map((step, index) => (
                      <TableRow key={index}>
                        <TableCell>{step.step}</TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Select
                              value={step.department?.id || ''}
                              onChange={(e) => handleUpdateStep(index, 'department', e.target.value)}
                            >
                              {departments.map((dept) => (
                                <MenuItem key={dept.id} value={dept.id}>
                                  {dept.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={step.minLevel}
                            onChange={(e) => handleUpdateStep(index, 'minLevel', e.target.value)}
                            InputProps={{ inputProps: { min: 1, max: 10 } }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={step.maxLevel}
                            onChange={(e) => handleUpdateStep(index, 'maxLevel', e.target.value)}
                            InputProps={{ inputProps: { min: 1, max: 10 } }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={step.description || ''}
                            onChange={(e) => handleUpdateStep(index, 'description', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleMoveStep(index, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUpIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleMoveStep(index, 'down')}
                            disabled={index === currentTemplate.steps.length - 1}
                          >
                            <ArrowDownIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteStep(index)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={currentTemplate.name === '' || currentTemplate.steps.length === 0}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Main Component
function ApprovalLineAdministration() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>결재선 관리</Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="결재선 템플릿" icon={<SettingsIcon />} iconPosition="start" />
          <Tab label="부서 관리" />
          <Tab label="직급 관리" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <ApprovalTemplateManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <DepartmentManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <PositionManagement />
        </TabPanel>
      </Paper>
    </Box>
  );
}

export default ApprovalLineAdministration;