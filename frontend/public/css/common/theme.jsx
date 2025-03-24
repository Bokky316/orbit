import { createTheme } from "@mui/material/styles";

// common 폰트 패밀리
const fontFamily = `"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif`;

const theme = createTheme({
  typography: {
    fontFamily: fontFamily // 공통 폰트 패밀리 적용
  },
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
  shape: {
    borderRadius: 4
  },
  components: {
    // 공통으로 폰트 패밀리 적용
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: fontFamily,
          fontSize: 14,
          lineHeight: 1.5,
          color: "#333"
        }
      }
    },
    // 버튼 스타일 커스터마이징
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: fontFamily,
          textTransform: "none",
          borderRadius: 4,
          minHeight: "38px",
          padding: "7px 16px",
          fontWeight: 500,
          boxShadow: "none",
          lineHeight: 1.2,
          "&:hover": {
            boxShadow: "none"
          }
        },
        // 기본 버튼 스타일 (basics button)
        contained: {
          backgroundColor: "#FF7F3E",
          color: "#FFFFFF",
          "&.Mui-disabled": {
            backgroundColor: "#BDBDBD", // Disabled 상태 색상
            color: "rgba(255, 255, 255, 0.7)"
          }
        },
        // 아웃라인 버튼 스타일 (outline button)
        outlined: {
          border: "1px solid #FF7F3E",
          color: "#FF7F3E",
          backgroundColor: "#fff",
          "&:hover": {
            backgroundColor: "#F6C3A9",
            border: "1px solid #FF7F3E"
          },
          "&.Mui-disabled": {
            border: "1px solid rgba(0, 0, 0, 0.12)",
            color: "rgba(0, 0, 0, 0.38)"
          }
        },
        text: {
          color: "#FF7F3E",
          "&:hover": {
            backgroundColor: "rgba(252, 141, 77, 0.08)"
          }
        }
      },
      variants: [
        {
          props: { variant: "outlinedThick" },
          style: {
            border: "1px solid #D9D9D9",
            color: "#333",
            backgroundColor: "transparent",
            borderRadius: 4,
            padding: "7px 16px",
            minHeight: "38px",
            fontWeight: 400,
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
              fontWeight: 500
            }
          }
        },
        {
          props: { variant: "restartThick" },
          style: {
            backgroundColor: "#F4F4F6",
            borderRadius: "4px",
            minWidth: "38px",
            minHeight: "38px",
            padding: "8px",
            "& .MuiSvgIcon-root": {
              fontSize: "18px",
              "& path": {
                fill: "#aaa"
              }
            }
          }
        },
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
              border: "1px solid #4FC787",
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
              border: "1px solid #F9D682",
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
              border: "1px solid #FA6B6B",
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
          fontFamily: fontFamily,
          "& .MuiOutlinedInput-root": {
            height: "42px",
            fontSize: "14px",
            boxSizing: "border-box",
            "&.MuiTextField-root": {
              "& .MuiFilledInput-root": {
                backgroundColor: "transparent",
                borderColor: "#E0E0E0"
              },
              "& .MuiFilledInput-underline:before": {
                borderBottomColor: "#E0E0E0" // 언더라인 색상
              },
              "& .MuiFilledInput-underline:after": {
                borderBottomColor: "#FF7F3E" // 포커스 시 언더라인 색상
              }
            },
            "& fieldset": {
              border: "1px solid #E5E7EB",
              borderRadius: 4,
              backgroundColor: "transparent"
            },
            "&:hover fieldset": {
              borderColor: "#FC8D4D"
            },
            "&.Mui-focused fieldset": {
              borderColor: "#FF7F3E",
              border: "1px solid #FF7F3E"
            },
            "&.Mui-error fieldset": {
              borderColor: "#FA6B6B"
            }
          },
          "& .MuiInputLabel-root": {
            fontFamily: fontFamily,
            transform: "translate(14px, 40%) scale(1)",
            fontSize: "14px",
            backgroundColor: "transparent",
            padding: "0 4px",

            "&.MuiInputLabel-shrink": {
              transform: "translate(12px, -12px) scale(0.75)",
              backgroundColor: "transparent"
            },
            color: "#9CA3AF",
            "&.Mui-focused": {
              color: "#FF7F3E"
            },
            "&.Mui-error": {
              color: "#FA6B6B"
            }
          },
          "& .MuiInputBase-input": {
            fontFamily: fontFamily,
            height: "24px",
            padding: "9px 12px",
            fontSize: "14px",
            color: "#333",
            boxSizing: "border-box",
            "&::placeholder": {
              color: "#9CA3AF",
              opacity: 1,
              position: "relative"
            }
          }
        }
      }
    },
    // MuiOutlinedInput 스타일 커스터마이징
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          height: "42px",
          fontSize: "14px",
          boxSizing: "border-box",
          backgroundColor: "#fff",
          "& .MuiOutlinedInput-notchedOutline": {
            backgroundColor: "transparent",
            borderWidth: "1px",
            borderRadius: 4
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#FC8D4D" // 호버 시 테두리 색상
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#FF7F3E", // 포커스 시 테두리 색상
            borderWidth: "1px" // 포커스 시 테두리 두께 유지
          },
          backgroundColor: "#fff"
        },
        input: {
          height: "24px",
          padding: "9px 16px",
          fontSize: "14px",
          boxSizing: "border-box",
          "&::placeholder": {
            opacity: 1, // 플레이스홀더 투명도
            position: "relative",
            color: "#9CA3AF"
          }
        },
        // notchedOutline 전체 보더 제거 (두번째 보더 해결)
        notchedOutline: {
          border: "1px solid #E5E7EB",
          boxSizing: "border-box",
          zIndex: 0
        }
      }
    },
    // 셀렉트 박스 스타일 커스터마이징
    MuiSelect: {
      styleOverrides: {
        root: {
          fontFamily: fontFamily,
          height: "42px",
          boxSizing: "border-box"
        },
        select: {
          padding: "9px 12px",
          minHeight: "unset !important",
          display: "flex",
          alignItems: "center",
          boxSizing: "border-box",
          "&:focus": {
            backgroundColor: "transparent"
          },
          "&.MuiInputBase-input": {
            // 셀렉트 박스 텍스트 위치 조정
            display: "flex",
            alignItems: "center"
          },
          ".MuiSelect-nativeInput::placeholder": {
            opacity: 1,
            color: "#9CA3AF"
          }
        },
        outlined: {
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#FC8D4D"
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#FF7F3E",
            borderWidth: "1px"
          }
        },

        // 텍스트 위치 추가 조정
        outlined: {
          transform: "translate(14px, 0) scale(1)",
          fontSize: "14px",
          backgroundColor: "transparent",
          padding: "0 4px",
          top: "0"
        },
        icon: {
          right: "12px",
          top: "calc(50% - 0.5em)",
          color: "#666"
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: fontFamily,
          transform: "translate(14px, 0) scale(1)",
          fontSize: "14px",
          backgroundColor: "transparent",
          padding: "0 4px",
          top: "4px"
        }
      }
    },
    // FormHelperText 스타일 추가
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontFamily: fontFamily,
          fontSize: "12px",
          marginTop: "4px"
        }
      }
    },
    // 입력 필드 스타일 커스터마이징 (비밀번호용)
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: fontFamily,
          fontWeight: "normal",
          "&.Mui-disabled": {
            backgroundColor: "#F5F5F5"
          }
        }
      }
    },
    // DatePicker 관련 스타일 수정
    MuiIconButton: {
      styleOverrides: {
        root: {
          // DatePicker 아이콘 버튼 위치 조정
          "&.MuiPickersArrowSwitcher-button": {
            padding: 0
          }
        }
      }
    },
    // DatePicker 아이콘 위치 조정
    MuiInputAdornment: {
      styleOverrides: {
        root: {
          // 입력 필드 끝에 붙는 아이콘(달력 등) 위치 조정
          height: "42px",
          maxHeight: "none",
          marginTop: 0,
          marginBottom: 0,
          boxSizing: "border-box",
          "& .MuiIconButton-root": {
            marginTop: 0,
            marginBottom: 0,
            height: "32px",
            width: "32px",
            boxSizing: "border-box"
          },
          "& .MuiSvgIcon-root": {
            fontSize: "18px"
          }
        },
        positionEnd: {
          marginTop: "4px",
          marginRight: "2px"
        }
      }
    },
    // 메뉴아이템 스타일 커스터마이징
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: fontFamily,
          minHeight: 48,
          "&:hover": {
            backgroundColor: "rgba(252, 141, 77, 0.08)"
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(252, 141, 77, 0.16)",
            "&:hover": {
              backgroundColor: "rgba(252, 141, 77, 0.24)"
            }
          }
        }
      }
    },
    // FormControl 스타일 커스터마이징
    MuiFormControl: {
      styleOverrides: {
        root: {
          fontFamily: fontFamily,
          "& .MuiInputLabel-root": {
            // 셀렉트 박스용 레이블 위치 조정
            "&.MuiInputLabel-formControl": {
              transform: "translate(14px, 40%) scale(1)",
              backgroundColor: "transparent",
              "&.MuiInputLabel-shrink": {
                backgroundColor: "transparent",
                transform: "translate(12px, -12px) scale(0.75)"
              }
            }
          }
        }
      }
    },
    // 카드 스타일 커스터마이징 - 그림자 제거
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          borderRadius: 8
        }
      }
    },
    // 페이퍼 스타일 커스터마이징 - 그림자 제거
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          "&.MuiMenu-paper": {
            boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.1)" // 메뉴는 그림자 유지
          }
        },
        elevation1: {
          boxShadow: "none",
          border: "1px solid #e5e7eb"
        }
      }
    },
    // 그리드 스타일 커스터마이징
    MuiGrid: {
      styleOverrides: {
        root: {
          // 그리드에 특별한 스타일링 필요 없음
        }
      }
    },
    // 박스 스타일 커스터마이징
    MuiBox: {
      styleOverrides: {
        root: {
          // 박스에 특별한 스타일링 필요 없음
        }
      }
    },
    // 테이블 스타일 커스터마이징
    MuiTable: {
      styleOverrides: {
        root: {
          fontFamily: fontFamily,
          borderRadius: 8,
          boxShadow: "none",
          fontSize: 14
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: fontFamily,
          fontSize: 14,
          padding: "16px", // 테이블 셀 패딩 조정
          borderBottom: "1px solid #F7F8FA"
        },
        head: {
          fontWeight: 600,
          backgroundColor: "#F7F8FA"
        }
      }
    },
    // 테이블 행 스타일 커스터마이징
    MuiTableRow: {
      styleOverrides: {
        root: {
          fontSize: 14,
          padding: "16px", // 테이블 셀 패딩 조정
          "&:hover": {
            backgroundColor: "#F7F8FA"
          }
        },
        head: {
          backgroundColor: "#F7F8FA !important"
        }
      }
    },
    // 체크박스 스타일 커스터마이징
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: "#BDBDBD",
          "&.Mui-checked": {
            color: "#4FC787"
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
            color: "#4FC787"
          }
        }
      }
    },
    // 탭 스타일 커스터마이징
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: fontFamily,
          textTransform: "none",
          fontWeight: 500,
          "&.Mui-selected": {
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
              backgroundColor: "#4FC787",
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
          fontFamily: fontFamily,
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
          fontFamily: fontFamily,
          backgroundColor: "#323232"
        }
      }
    },
    // 테이블 페이지네이션 스타일 커스터마이징
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          fontFamily: fontFamily,
          boxShadow: "none",
          "&.Mui-selected": {
            backgroundColor: "rgba(252, 141, 77, 0.16)",
            color: "#FC8D4D",
            "&:hover": {
              backgroundColor: "rgba(252, 141, 77, 0.24)"
            }
          }
        }
      }
    },
    // 데이트피커 스타일 커스터마이징
    MuiPickersDay: {
      styleOverrides: {
        root: {
          fontFamily: fontFamily
        },
        today: {
          borderColor: "#FC8D4D !important"
        },
        daySelected: {
          backgroundColor: "#FC8D4D !important",
          "&:hover": {
            backgroundColor: "#AA3800 !important"
          }
        }
      }
    }
  },
  // 추가적인 사용자 정의 테마 속성
  customStyles: {
    inputBorder: {
      color: "#4FC787",
      width: "1px" // 테두리 두께 1px로 변경
    },
    placeholderColor: "#9CA3AF", // 플레이스홀더 색상 변경
    disabledBackground: "#F5F5F5",
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
