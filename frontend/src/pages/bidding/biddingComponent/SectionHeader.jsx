import React from "react";
import { Box, Typography, IconButton, Divider } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

function SectionHeader({ title, icon, expanded, onToggle, actionButton }) {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1
        }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {icon && <Box sx={{ mr: 1, color: "text.secondary" }}>{icon}</Box>}
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          <IconButton onClick={onToggle} sx={{ ml: 1 }}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        {actionButton && <Box>{actionButton}</Box>}
      </Box>
      <Divider sx={{ mb: 2 }} />
    </Box>
  );
}

export default SectionHeader;
