import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from "@mui/icons-material";

/**
 * 섹션 헤더 컴포넌트 - 접기/펼치기 기능이 있는 섹션 제목
 */
function SectionHeader({ title, icon, expanded, onToggle, actionButton }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2
      }}>
      <Typography
        variant="h5"
        color="primary"
        sx={{ display: "flex", alignItems: "center" }}>
        {icon && React.cloneElement(icon, { sx: { mr: 1 } })}
        {title}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {actionButton}
        <IconButton onClick={onToggle}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
    </Box>
  );
}

export default SectionHeader;
