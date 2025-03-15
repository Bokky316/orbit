import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      light: "#FFB998",
      main: "#FC8D4D", // Primary (Main Color) - 01 #FF7F3E
      dark: "#AA3800", // 02 #AA3800
      darker: "#5d0000", // 03 #5d0000
      contrastText: "#FFFFFF"
    },
    secondary: {
      light: "#F6C3A9", // 04 #F6C3A9
      main: "#FFE6C9", // 05 #FFE6C9
      dark: "#FFFDF0", // 06 #FFFDF0
      contrastText: "#121212"
    },
    neutral: {
      light: "#F6F5F0", // 07 #F6F5F0
      main: "#6F6F6F",
      dark: "#121212",
      contrastText: "#FFFFFF"
    },
    success: {
      main: "#4FC787", // success #4FC787
      light: "#D1FFE7",
      dark: "#0B7D4F",
      contrastText: "#FFFFFF"
    },
    warning: {
      main: "#F9D682", // warning #F9D682
      light: "#FFF6DE",
      dark: "#A16C00",
      contrastText: "#121212"
    },
    error: {
      main: "#FA6B6B", // danger #FA6B6B
      light: "#FFE8E8",
      dark: "#9F0000",
      contrastText: "#FFFFFF"
    },
    background: {
      default: "#F5F5F5",
      paper: "#FFFFFF"
    },
    text: {
      primary: "#121212",
      secondary: "#6F6F6F",
      disabled: "rgba(0, 0, 0, 0.38)"
    },
    divider: "rgba(0, 0, 0, 0.12)",
    action: {
      active: "rgba(0, 0, 0, 0.54)",
      hover: "rgba(0, 0, 0, 0.04)",
      selected: "rgba(0, 0, 0, 0.08)",
      disabled: "rgba(0, 0, 0, 0.26)",
      disabledBackground: "rgba(0, 0, 0, 0.12)"
    }
  },
  typography: {
    fontFamily: ["Noto Sans KR", "Roboto", "Arial", "sans-serif"].join(","),
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700
  },
  shape: {
    borderRadius: 4
  },
  components: {
    // 버튼 스타일 커스터마이징
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 4,
          padding: "8px 16px",
          fontWeight: 500,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none"
          }
        },
        // 기본 버튼 스타일 (basics button)
        contained: {
          backgroundColor: "#6F6F6F", // 기본 회색
          color: "#FFFFFF",
          "&:hover": {
            backgroundColor: "#AA3800"
          },
          "&.Mui-disabled": {
            backgroundColor: "#BDBDBD", // Disabled 상태 색상
            color: "rgba(255, 255, 255, 0.7)"
          }
        },
        // 아웃라인 버튼 스타일 (outline button)
        outlined: {
          borderColor: "#FC8D4D", // primary.main
          color: "#FC8D4D",
          backgroundColor: "transparent",
          "&:hover": {
            backgroundColor: "rgba(252, 141, 77, 0.08)",
            borderColor: "#FC8D4D"
          },
          "&.Mui-disabled": {
            borderColor: "rgba(0, 0, 0, 0.12)",
            color: "rgba(0, 0, 0, 0.38)"
          }
        },
        text: {
          color: "#FC8D4D",
          "&:hover": {
            backgroundColor: "rgba(252, 141, 77, 0.08)"
          }
        }
      },
      variants: [
        {
          props: { color: "success" },
          style: {
            "&.MuiButton-contained": {
              backgroundColor: "#4FC787",
              "&:hover": {
                backgroundColor: "#0B7D4F"
              }
            },
            "&.MuiButton-outlined": {
              borderColor: "#4FC787",
              color: "#4FC787",
              "&:hover": {
                backgroundColor: "rgba(79, 199, 135, 0.08)"
              }
            }
          }
        },
        {
          props: { color: "warning" },
          style: {
            "&.MuiButton-contained": {
              backgroundColor: "#F9D682",
              color: "#121212",
              "&:hover": {
                backgroundColor: "#A16C00",
                color: "#FFFFFF"
              }
            },
            "&.MuiButton-outlined": {
              borderColor: "#F9D682",
              color: "#121212",
              "&:hover": {
                backgroundColor: "rgba(249, 214, 130, 0.08)"
              }
            }
          }
        },
        {
          props: { color: "error" },
          style: {
            "&.MuiButton-contained": {
              backgroundColor: "#FA6B6B",
              "&:hover": {
                backgroundColor: "#9F0000"
              }
            },
            "&.MuiButton-outlined": {
              borderColor: "#FA6B6B",
              color: "#FA6B6B",
              "&:hover": {
                backgroundColor: "rgba(250, 107, 107, 0.08)"
              }
            }
          }
        }
      ]
    },
    // 입력 필드 스타일 커스터마이징
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "#E5E7EB",
              borderWidth: "1px"
            },
            "&:hover fieldset": {
              borderColor: "#FC8D4D"
            },
            "&.Mui-focused fieldset": {
              borderColor: "#4FC787",
              borderWidth: "2px"
            },
            "&.Mui-error fieldset": {
              borderColor: "#FA6B6B"
            }
          },
          "& .MuiInputLabel-root": {
            color: "#6C3A3F",
            "&.Mui-focused": {
              color: "#4FC787"
            },
            "&.Mui-error": {
              color: "#FA6B6B"
            }
          },
          "& .MuiInputBase-input": {
            color: "#333",
            "&::placeholder": {
              color: "#9CA3AF"
            }
          }
        }
      }
    },
    // 입력 필드 스타일 커스터마이징 (비밀번호용)
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontWeight: "normal",
          "&.Mui-disabled": {
            backgroundColor: "#F5F5F5"
          }
        }
      }
    },
    // 카드 스타일 커스터마이징
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.05)",
          borderRadius: 8
        }
      }
    },
    // 탭 스타일 커스터마이징
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          "&.Mui-selected": {
            color: "#FC8D4D"
          }
        }
      }
    },
    // 표 스타일 커스터마이징
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:nth-of-type(odd)": {
            backgroundColor: "rgba(0, 0, 0, 0.02)"
          },
          "&:hover": {
            backgroundColor: "rgba(252, 141, 77, 0.08)"
          }
        },
        head: {
          backgroundColor: "rgba(0, 0, 0, 0.04) !important"
        }
      }
    },
    // 체크박스 스타일 커스터마이징
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: "#BDBDBD",
          "&.Mui-checked": {
            color: "#FC8D4D"
          }
        }
      }
    },
    // 라디오 버튼 스타일 커스터마이징
    MuiRadio: {
      styleOverrides: {
        root: {
          color: "#BDBDBD",
          "&.Mui-checked": {
            color: "#FC8D4D"
          }
        }
      }
    },
    // 스위치 스타일 커스터마이징
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 42,
          height: 26,
          padding: 0,
          margin: 8
        },
        switchBase: {
          padding: 1,
          "&.Mui-checked": {
            transform: "translateX(16px)",
            color: "#fff",
            "& + .MuiSwitch-track": {
              backgroundColor: "#FC8D4D",
              opacity: 1
            }
          }
        },
        thumb: {
          width: 24,
          height: 24
        },
        track: {
          borderRadius: 13,
          backgroundColor: "#BDBDBD"
        }
      }
    },
    // 툴팁 스타일 커스터마이징
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "rgba(18, 18, 18, 0.9)",
          fontSize: "0.75rem",
          padding: "8px 12px"
        }
      }
    },
    // 스낵바 스타일 커스터마이징
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          backgroundColor: "#323232"
        }
      }
    },
    // 딜로그 스타일 커스터마이징
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow: "0px 8px 30px rgba(0, 0, 0, 0.12)"
        }
      }
    },
    // 테이블 페이지네이션 스타일 커스터마이징
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            backgroundColor: "rgba(252, 141, 77, 0.16)",
            color: "#FC8D4D",
            "&:hover": {
              backgroundColor: "rgba(252, 141, 77, 0.24)"
            }
          }
        }
      }
    }
  },
  // 추가적인 사용자 정의 테마 속성
  customStyles: {
    inputBorder: {
      color: "#4FC787",
      width: "2px"
    },
    placeholderColor: "#6C3A3F",
    disabledBackground: "#BDBDBD",
    iconSizes: {
      small: 16,
      medium: 24,
      large: 32
    },
    borderStyles: {
      light: "1px solid #E5E7EB",
      normal: "1px solid #4FC787",
      warning: "1px solid #F9D682",
      error: "1px solid #FA6B6B"
    }
  }
});

export default theme;
