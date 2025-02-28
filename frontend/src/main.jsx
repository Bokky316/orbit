import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
//import theme from "../public/assets/css/mui/theme.jsx";

createRoot(document.getElementById("root")).render(
//   <ThemeProvider theme={theme}>
//     <BrowserRouter>
//       <React.StrictMode>
//         <App />
//       </React.StrictMode>
//     </BrowserRouter>
//   </ThemeProvider> 나중에 mui 테마 적용하게 되면 사용 예정

      <BrowserRouter>
        <React.StrictMode>
          <App />
        </React.StrictMode>
      </BrowserRouter>

);