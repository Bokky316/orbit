import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  CircularProgress,
  Alert,
  IconButton
} from "@mui/material";
import {
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";

// 헬퍼 함수 import
import {
  BiddingStatus,
  BiddingMethod,
  BillingUnits,
  ItemSourcingCategoryMap,
  ItemCategories
} from "./helpers/biddingTypes";
import {
  getStatusText,
  getBidMethodText,
  transformFormDataToApiFormat,
  mapBiddingDataToFormData
} from "./helpers/commonBiddingHelpers";
import { validateBiddingForm } from "./helpers/BuyerBiddingHelpers";

import PermissionService, { usePermission } from "./helpers/permissionUtils";
import useWebSocket from "@/hooks/useWebSocket";

// Dialog 컴포넌트 import
import SupplierSelectionDialog from "./biddingComponent/SupplierSelectionDialog";
import PurchaseRequestSelectionDialog from "./biddingComponent/PurchaseRequestSelectionDialog";

// 초기 폼 데이터
const INITIAL_FORM_DATA = {
  requestNumber: "", // 구매 요청 번호
  requestName: "", // 구매 요청 이름
  title: "", // 입찰 공고 제목 (필수)
  purchaseRequestId: null, // 구매 요청 ID (숫자 형식)
  purchaseRequestItemId: null, // 구매 요청 품목 ID (숫자 형식)
  purchaseRequestItems: [], // 복수의 품목 선택 가능하도록 변경
  selectedItems: [], // 선택된 품목 ID 배열
  description: "",
  suppliers: [],
  bidMethod: BiddingMethod.FIXED_PRICE,
  status: {
    parentCode: "BIDDING",
    childCode: BiddingStatus.PENDING
  },
  startDate: new Date().toISOString().split("T")[0], // 오늘 날짜
  deadline: "", // 입찰 마감일 (필수)
  quantity: 1,
  unitPrice: 0,
  supplyPrice: 0,
  vat: 0,
  totalAmount: 0,
  biddingConditions: "", // 입찰 조건
  conditions: "", // 백엔드에서 사용하는 필드명
  internalNote: "",
  deliveryLocation: "", // 납품 장소
  deliveryDate: "", // 납품 예정일
  billingUnit: "EA", // 과금 단위 기본값
  files: []
};

function BiddingFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const mode = id ? "edit" : "create";
  const biddingId = id ? parseInt(id) : null;

  // Redux에서 인증 상태 가져오기
  const { user } = useSelector((state) => state.auth);

  // 권한 훅 사용
  const permissions = usePermission(user);

  // 상태 관리
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [originalBidMethod, setOriginalBidMethod] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null); // 선택된 구매 요청 추가
  const [hasPermission, setHasPermission] = useState(false);

  // 모달 상태
  const [isPurchaseRequestModalOpen, setIsPurchaseRequestModalOpen] =
    useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // 현재 선택된 구매 요청 객체 가져오기
  const selectedPurchaseRequest = useMemo(() => {
    if (!formData.requestNumber) return null;
    return purchaseRequests.find(
      (req) => req.id === Number(formData.requestNumber)
    );
  }, [formData.requestNumber, purchaseRequests]);

  // 웹소켓 훅 사용 - 입찰 기능만 활성화
  const websocket = useWebSocket(user, {
    enablePurchaseRequests: false,
    enableBiddings: true,
    enableNotifications: true
  });

  // 알림 전송 함수 수정 - 웹소켓 서비스 존재 여부 확인
  const sendNotification = async (type, message) => {
    try {
      // REST API를 통한 알림 전송
      await fetchWithAuth(`${API_URL}notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message,
          senderId: user?.id,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.warn("알림 전송 실패 (무시됨):", error);
    }
  };

  // 페이지 로드 시 권한 체크
  useEffect(() => {
    const checkPermission = () => {
      if (!user) {
        setHasPermission(false);
        return;
      }

      if (mode === "create") {
        const createPermission = permissions.canCreateBidding;
        setHasPermission(createPermission);
      } else if (mode === "edit" && formData.status) {
        const updatePermission = permissions.canUpdateBidding(formData);
        setHasPermission(updatePermission);
      }
    };

    checkPermission();
  }, [mode, user, formData.status, permissions]);

  // 페이지 로드 시 suppliers 데이터 가져오기 함수
  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      console.log("공급업체 목록 API 호출 시작");
      const response = await fetchWithAuth(
        `${API_URL}biddings/suppliers/active`
      );

      if (!response.ok) {
        throw new Error("공급사 목록을 가져오는데 실패했습니다.");
      }

      const data = await response.json();
      console.log("공급업체 API 응답 데이터:", data);

      // 공급업체 데이터 형식 정규화
      const normalizedSuppliers = data.map((supplier) => ({
        id: supplier.id,
        name: supplier.name || supplier.companyName,
        businessNo: supplier.businessNo || supplier.businessNumber,
        businessType: supplier.businessType,
        businessCategory: supplier.businessCategory,
        sourcingCategory: supplier.sourcingCategory,
        sourcingSubCategory: supplier.sourcingSubCategory,
        contact: supplier.phoneNumber || supplier.contactPhone,
        email: supplier.contactEmail || supplier.email
      }));

      setSuppliers(normalizedSuppliers);
    } catch (error) {
      console.error("공급사 목록 가져오기 실패:", error);
      setRequestError("공급사 정보를 불러오는데 실패했습니다.");
      setSuppliers([]); // 빈 배열로 설정하여 무한 루프 방지
    } finally {
      setIsLoading(false);
    }
  };

  // 구매 요청 목록 가져오기
  const fetchPurchaseRequests = async () => {
    try {
      console.log("구매 요청 목록 API 호출 시작");
      const response = await fetchWithAuth(
        `${API_URL}biddings/purchase-requests/active`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || "구매 요청 목록을 가져오는데 실패했습니다."
        );
      }

      const data = await response.json();
      //console.log("구매 요청 API 응답 데이터:", data);

      setPurchaseRequests(data || []);
    } catch (error) {
      setRequestError(error.message || "구매 요청 목록을 불러올 수 없습니다.");
    }
  };

  // 사용자 권한 체크 함수 - 중복을 제거하고 usePermission 훅과 통합
  const checkUserPermissions = () => {
    // 이미 usePermission 훅을 통해 권한을 확인하므로
    // 해당 함수를 간소화하고 permissions 객체를 반환
    return {
      hasPermission: (permission) => {
        if (permission === "canCreateBidding") {
          return permissions.canCreateBidding;
        }
        if (permission === "canUpdateBidding") {
          return permissions.canUpdateBidding(formData);
        }
        if (permission === "changeStatus") {
          return permissions.canChangeBiddingStatus;
        }
        return false;
      },
      canModifyBidding: (status) => {
        return permissions.canUpdateBidding({
          ...formData,
          status: status
        });
      }
    };
  };

  // 입력 필드 변경 핸들러
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      switch (name) {
        case "status":
          // 상세 페이지에서만 상태 변경 가능하도록 수정 모드에서는 변경 방지
          return mode === "create"
            ? {
                ...prev,
                status: {
                  parentCode: "BIDDING",
                  childCode: value
                }
              }
            : prev;

        case "bidMethod":
          // 최초 등록 시에만 입찰 방식 변경 가능
          return mode === "create"
            ? {
                ...prev,
                bidMethod: value,
                ...(value === BiddingMethod.OPEN_PRICE && {
                  itemQuantity: 0,
                  unitPrice: 0
                })
              }
            : prev;

        case "biddingConditions": // 입찰 조건 필드 수정
          return {
            ...prev,
            biddingConditions: value,
            conditions: value // API 요청 시 conditions 필드로 매핑되도록
          };

        case "deliveryDate": // 납품일 처리
          return {
            ...prev,
            deliveryDate: value
          };

        case "deliveryLocation": // 납품 장소 처리
          return {
            ...prev,
            deliveryLocation: value
          };

        default:
          return {
            ...prev,
            [name]: type === "checkbox" ? checked : value
          };
      }
    });

    // 오류 메시지 초기화
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // 날짜 변경 핸들러
  const handleDateChange = (fieldName, newDate) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: newDate ? moment(newDate).format("YYYY-MM-DD") : ""
    }));
  };

  // 구매 요청 및 품목 선택 완료 핸들러
  const handlePurchaseRequestComplete = (
    request,
    selectedItemId,
    selectedItem
  ) => {
    console.log("구매 요청 선택 완료 - 전체 요청:", request);
    console.log("선택된 품목 ID:", selectedItemId);
    console.log("선택된 품목:", selectedItem);

    if (!request || !selectedItem) {
      console.error("선택된 요청이나 품목이 없습니다.");
      return;
    }

    // 문자열로 된 가격 정보 처리 함수
    const parsePrice = (priceStr) => {
      if (typeof priceStr === "number") return priceStr;
      if (!priceStr) return 0;
      return parseFloat(String(priceStr).replace(/,/g, "")) || 0;
    };

    // DB 테이블 필드명과 클라이언트 필드명 모두 처리
    const requestNumber =
      request.request_number ||
      request.requestNumber ||
      request.id?.toString() ||
      "";
    const requestName =
      request.requestName || request.request_name || request.title || "";

    // 납품 관련 정보 (DB 필드명 우선)
    const deliveryLocation =
      selectedItem.delivery_location || selectedItem.deliveryLocation || "";
    const deliveryDate =
      selectedItem.delivery_request_date ||
      selectedItem.deliveryRequestDate ||
      null;

    // 단위 코드 처리
    const unitChildCode =
      selectedItem.unit_child_code || selectedItem.unitChildCode || "49"; // 기본값 49 (개)

    // 단위 코드 ID를 코드값(EA, BOX 등)으로 변환하는 함수
    const getUnitCodeById = (codeId) => {
      // DB 테이블 기준 매핑
      const codeMap = {
        49: "EA",
        50: "BOX",
        51: "BAG",
        52: "SET",
        53: "KG",
        54: "M"
      };
      return codeMap[String(codeId)] || "EA";
    };

    // 단위 코드값 구하기
    const billingUnit = getUnitCodeById(unitChildCode);

    // 가격 정보 처리
    const unitPrice = parsePrice(
      selectedItem.unit_price || selectedItem.unitPrice
    );
    const quantity = parseFloat(selectedItem.quantity) || 1;
    const totalPrice =
      parsePrice(selectedItem.total_price || selectedItem.totalPrice) ||
      unitPrice * quantity;
    const vat = Math.round(totalPrice * 0.1);
    const totalAmount = totalPrice + vat;

    // formData에 매핑할 데이터 - 타입 변환 확실히 적용
    const mappedData = {
      // 구매 요청 정보
      requestNumber: requestNumber,
      requestName: requestName,
      // 중요: 숫자 타입으로 변환
      purchaseRequestId: parseInt(request.id, 10),
      title: requestName, // title 필드 추가 - 필수 필드

      // 선택된 품목 정보 - 숫자 타입으로 변환
      purchaseRequestItems: [selectedItem],
      selectedItems: [parseInt(selectedItemId, 10)],
      purchaseRequestItemId: parseInt(selectedItemId, 10),
      purchase_request_item_id: parseInt(selectedItemId, 10),

      // 수량 및 가격 정보
      quantity: quantity,
      unitPrice: unitPrice,
      unit_price: unitPrice,
      supplyPrice: totalPrice,
      supply_price: totalPrice,
      vat: vat,
      totalAmount: totalAmount,
      total_amount: totalAmount,

      // 납품 관련 정보
      deliveryLocation: deliveryLocation,
      delivery_location: deliveryLocation,
      deliveryDate: deliveryDate
        ? moment(deliveryDate).format("YYYY-MM-DD")
        : "",
      delivery_date: deliveryDate
        ? moment(deliveryDate).format("YYYY-MM-DD")
        : "",

      // 품목 규격 정보
      specification: selectedItem.specification || "",

      // 과금 단위
      billingUnit: billingUnit,
      billing_unit: billingUnit,

      // 입찰 마감일
      deadline: request.deadline
        ? moment(request.deadline).format("YYYY-MM-DD")
        : "",

      // 상태 정보 확인 (PENDING = 대기중)
      status: {
        parentCode: "BIDDING",
        childCode: "PENDING"
      }
    };

    console.log("폼에 설정할 데이터:", mappedData);

    // 기존 폼 데이터와 병합
    setFormData((prev) => {
      const updatedData = {
        ...prev,
        ...mappedData
      };

      // 병합 후 값 확인
      console.log(
        "최종 폼 데이터의 purchaseRequestId:",
        updatedData.purchaseRequestId,
        "타입:",
        typeof updatedData.purchaseRequestId
      );

      return updatedData;
    });

    // 모달 닫기
    setIsPurchaseRequestModalOpen(false);

    // 선택된 요청 저장
    setSelectedRequest(request);
  };

  // 공급자 선택 핸들러
  const handleSupplierSelect = (supplier) => {
    setFormData((prev) => {
      // 이미 선택된 공급자인지 확인
      const isSelected = prev.suppliers.some((s) => s.id === supplier.id);

      if (isSelected) {
        // 이미 선택된 경우 제거
        return {
          ...prev,
          suppliers: prev.suppliers.filter((s) => s.id !== supplier.id)
        };
      } else {
        // 새로 선택한 경우 추가
        return {
          ...prev,
          suppliers: [...prev.suppliers, supplier]
        };
      }
    });
  };

  // 공급자 선택 완료 핸들러
  const handleSupplierSelectionComplete = () => {
    setIsSupplierModalOpen(false);
  };

  // 수량 및 단가 변경 핸들러
  const handleNumberChange = (name, value) => {
    // 안전한 숫자 변환 적용
    const safeValue = Math.max(0, Number(value) || 0);

    setFormData((prev) => ({
      ...prev,
      [name]: safeValue
    }));

    // 수량이나 단가가 변경되면 금액 재계산
    if (name === "itemQuantity" || name === "unitPrice") {
      const quantity =
        name === "itemQuantity"
          ? safeValue
          : Math.max(0, Number(formData.itemQuantity) || 0);
      const unitPrice =
        name === "unitPrice"
          ? safeValue
          : Math.max(0, Number(formData.unitPrice) || 0);
      const supplyPrice = quantity * unitPrice;
      const vat = Math.round(supplyPrice * 0.1);
      const totalAmount = supplyPrice + vat;

      setFormData((prev) => ({
        ...prev,
        supplyPrice,
        vat,
        totalAmount
      }));
    }
  };

  // 파일 타입 제한 및 최대 크기 설정
  const ALLOWED_FILE_TYPES = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  // 파일 변경 핸들러
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter((file) => {
      // 파일 타입 및 크기 검증
      const isValidType = ALLOWED_FILE_TYPES.includes(file.type);
      const isValidSize = file.size <= MAX_FILE_SIZE;

      if (!isValidType) {
        alert(`지원되지 않는 파일 형식입니다: ${file.name}`);
      }

      if (!isValidSize) {
        alert(`파일 크기가 너무 큽니다 (최대 50MB): ${file.name}`);
      }

      return isValidType && isValidSize;
    });

    // 기존 파일과 새 파일 병합
    setFileList((prev) => {
      const updatedFiles = [...prev, ...validFiles];

      // formData에도 파일 정보 업데이트
      setFormData((prevForm) => ({
        ...prevForm,
        files: updatedFiles
      }));

      return updatedFiles;
    });
  };

  // 파일 다운로드 핸들러
  const handleFileDownload = async (filename) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}biddings/download-file?filename=${encodeURIComponent(
          filename
        )}`,
        { method: "GET" }
      );

      if (!response.ok) {
        throw new Error("파일을 다운로드할 수 없습니다.");
      }

      // Blob으로 변환 및 다운로드
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("파일 다운로드 중 오류:", error);
      alert("파일을 다운로드할 수 없습니다.");
    }
  };

  // 파일 삭제 핸들러
  const handleFileDelete = (fileToDelete) => {
    setFileList((prev) => {
      const updatedFiles = prev.filter(
        (file) => file.name !== fileToDelete.name && file !== fileToDelete
      );

      // formData의 files도 업데이트
      setFormData((prevForm) => ({
        ...prevForm,
        files: updatedFiles
      }));

      return updatedFiles;
    });
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 로컬 스토리지 또는 쿠키에서 액세스 토큰 가져오기
    const accessToken = localStorage.getItem("accessToken");

    // 토큰 및 사용자 정보 로깅
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    const token = localStorage.getItem("token");
    const accToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("accToken="))
      ?.split("=")[1];

    console.log("로그인된 사용자:", loggedInUser);
    console.log("localStorage 토큰:", token);
    console.log("쿠키 토큰:", accToken);

    try {
      setIsSubmitting(true);
      setRequestError("");

      // 구매 요청 및 품목 ID 확인 - 숫자 타입 보장
      const purchaseRequestId = parseInt(formData.purchaseRequestId, 10);
      const purchaseRequestItemId = parseInt(
        formData.purchaseRequestItemId,
        10
      );

      if (isNaN(purchaseRequestId) || isNaN(purchaseRequestItemId)) {
        setRequestError(
          "구매 요청 정보가 올바른 형식이 아닙니다. 다시 선택해주세요."
        );
        setIsSubmitting(false);
        return;
      }

      // title 필드가 있는지 확인 (구매 요청명을 title로 사용)
      if (!formData.title && formData.requestName) {
        setFormData((prev) => ({
          ...prev,
          title: formData.requestName
        }));
      }

      if (!formData.deadline) {
        setErrors((prev) => ({
          ...prev,
          deadline: "입찰 마감일을 설정해주세요."
        }));
        setRequestError("입찰 마감일은 필수 항목입니다.");
        setIsSubmitting(false);
        return;
      }

      // 폼 유효성 검사
      const { isValid, errors: validationErrors } = validateBiddingForm(
        formData,
        mode
      );

      if (!isValid) {
        setErrors(validationErrors);
        alert("입력 정보를 확인해주세요.");
        setIsSubmitting(false);
        return;
      }

      // API 데이터 준비
      const apiData = transformFormDataToApiFormat(formData, user);

      console.log("API 요청 전송 데이터:", apiData);

      // 필수 필드 검사
      const requiredFields = [
        "purchaseRequestId",
        "purchaseRequestItemId",
        "title",
        "status",
        "bidMethod",
        "quantity",
        "unitPrice"
      ];

      // biddingPeriod.endDate가 deadline에 해당
      if (!apiData.biddingPeriod?.endDate) {
        requiredFields.push("deadline");
      }

      const missingFields = requiredFields.filter((field) => {
        if (field === "deadline") {
          return !apiData.biddingPeriod?.endDate;
        }

        // null, undefined, 빈 문자열 체크
        if (
          field === "purchaseRequestId" ||
          field === "purchaseRequestItemId"
        ) {
          return (
            apiData[field] === null ||
            apiData[field] === undefined ||
            isNaN(apiData[field])
          );
        }

        return (
          apiData[field] === null ||
          apiData[field] === undefined ||
          apiData[field] === ""
        );
      });

      if (missingFields.length > 0) {
        console.error("필수 필드 누락:", missingFields);
        setRequestError(
          `다음 필수 필드가 누락되었습니다: ${missingFields.join(", ")}`
        );
        setIsSubmitting(false);
        return;
      }

      // API 요청 URL 및 메서드 설정
      const url =
        mode === "create" ? `${API_URL}biddings` : `${API_URL}biddings/${id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const requestOptions = {
        method: method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(apiData)
      };

      //const response = await fetchMethod(url, requestOptions);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("서버 오류 응답:", errorText);

        // JSON 형식의 오류인지 확인하고 파싱 시도
        let errorMessage = `입찰 공고 ${
          mode === "create" ? "등록" : "수정"
        }에 실패했습니다. (${response.status})`;

        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage += `: ${errorJson.message}`;
          } else if (errorJson.error) {
            errorMessage += `: ${errorJson.error}`;
          } else {
            errorMessage += `: ${errorText}`;
          }
        } catch (e) {
          errorMessage += `: ${errorText}`;
        }

        throw new Error(errorMessage);
      }

      // 성공 응답 처리
      const data = await response.json();
      console.log("API 응답 성공:", data);
      // 알림 전송 - try/catch로 감싸서 실패해도 다음 단계 진행
      try {
        if (mode === "create") {
          // 입찰 공고 생성 알림 (관리자, 구매팀)
          await sendNotification(
            "BIDDING_CREATED",
            `새로운 입찰 공고 "${formData.requestName}"이 생성되었습니다.`
          );
        } else {
          // 입찰 공고 수정 알림
          await sendNotification(
            "BIDDING_UPDATED",
            `입찰 공고 "${formData.requestName}"이 수정되었습니다.`
          );
        }
      } catch (notificationError) {
        console.warn("알림 전송 실패:", notificationError);
        // 알림 전송 실패는 사용자 경험에 큰 영향을 주지 않으므로 진행
      }

      // 파일이 있는 경우 별도의 첨부파일 업로드 요청
      if (formData.files && formData.files.length > 0) {
        try {
          const formDataForFiles = new FormData();
          formData.files.forEach((file) => {
            // File 객체인지 확인
            if (file instanceof File) {
              formDataForFiles.append("files", file);
            }
          });

          // 파일이 추가된 경우에만 요청
          if (formDataForFiles.has("files")) {
            const fileUploadResponse = await fetchWithAuth(
              `${API_URL}biddings/${data.id}/attachments`,
              {
                method: "POST",
                body: formDataForFiles
              }
            );

            if (!fileUploadResponse.ok) {
              console.warn(
                "파일 업로드 실패:",
                await fileUploadResponse.text()
              );
              // 파일 업로드 실패는 경고만 표시하고 진행
            }
          }
        } catch (fileError) {
          console.error("파일 업로드 중 오류:", fileError);
          // 파일 업로드 실패는 경고만 표시하고 진행
        }
      }

      alert(
        `입찰 공고가 성공적으로 ${
          mode === "create" ? "등록" : "수정"
        }되었습니다.`
      );

      // 성공 후 상세 페이지로 이동
      navigate(`/biddings/${data.id}`);
    } catch (error) {
      console.error("입찰 공고 제출 오류:", error);
      setRequestError(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 수정 모드일 경우 데이터 가져오기
  useEffect(() => {
    const fetchBiddingData = async () => {
      if (mode === "edit" && biddingId) {
        try {
          setIsLoading(true);

          // API를 통해 입찰 공고 상세 정보 가져오기
          const response = await fetchWithAuth(
            `${API_URL}biddings/${biddingId}`
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const biddingData = await response.json();
          console.log("서버에서 받은 데이터:", biddingData);

          // DB 필드명과 클라이언트 필드명 매핑 보강
          if (biddingData.purchaseRequest) {
            biddingData.purchaseRequest.request_number =
              biddingData.purchaseRequest.requestNumber ||
              biddingData.purchaseRequest.id;
          }

          if (biddingData.purchaseRequestItem) {
            biddingData.purchaseRequestItem.purchase_request_item_id =
              biddingData.purchaseRequestItem.id;
            biddingData.purchaseRequestItem.delivery_location =
              biddingData.purchaseRequestItem.deliveryLocation;
            biddingData.purchaseRequestItem.delivery_request_date =
              biddingData.purchaseRequestItem.deliveryRequestDate;
          }

          // biddingHelpers의 mapBiddingDataToFormData 함수 사용
          const mappedFormData = mapBiddingDataToFormData(biddingData);

          // 입찰 조건 필드 매핑 보장
          if (biddingData.conditions && !mappedFormData.biddingConditions) {
            mappedFormData.biddingConditions = biddingData.conditions;
          }

          // 납품 관련 정보 매핑
          if (biddingData.deliveryLocation) {
            mappedFormData.deliveryLocation = biddingData.deliveryLocation;
            mappedFormData.delivery_location = biddingData.deliveryLocation;
          }

          if (biddingData.deliveryDate) {
            mappedFormData.deliveryDate = biddingData.deliveryDate;
            mappedFormData.delivery_date = biddingData.deliveryDate;
          }

          console.log("매핑된 데이터:", mappedFormData);

          setFormData(mappedFormData);
          setOriginalBidMethod(mappedFormData.bidMethod);

          // 첨부 파일 정보 처리
          if (biddingData.filePath) {
            setFileList([{ name: biddingData.filePath }]);
          }

          // 선택된 요청 저장
          if (biddingData.purchaseRequest) {
            setSelectedRequest(biddingData.purchaseRequest);
          }
        } catch (error) {
          console.error("입찰 공고 데이터 로딩 중 오류:", error);
          setRequestError(error.message);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchSuppliers();
    fetchPurchaseRequests();
    fetchBiddingData();
  }, [mode, biddingId]);

  // 취소 핸들러
  const handleCancel = () => {
    const confirmCancel = window.confirm(
      "작업을 취소하시겠습니까? 입력한 데이터는 저장되지 않습니다."
    );
    if (confirmCancel) {
      navigate("/biddings");
    }
  };

  // 권한 렌더링
  const renderSubmitButton = () => {
    // user 객체를 직접 전달
    const { hasPermission, canModifyBidding } = checkUserPermissions(user);

    // 생성 모드에서 권한 체크
    if (mode === "create" && !hasPermission("canCreateBidding")) {
      return null; // 버튼 숨김
    }

    // 수정 모드에서 권한 체크
    if (mode === "edit" && !canModifyBidding(formData.status)) {
      return null; // 버튼 숨김
    }

    return (
      <Button
        variant="contained"
        color="primary"
        type="submit"
        disabled={isSubmitting}>
        {isSubmitting ? (
          <CircularProgress size={24} />
        ) : mode === "create" ? (
          "등록"
        ) : (
          "수정"
        )}
      </Button>
    );
  };

  // 상태 변경 핸들러 추가
  const handleStatusChange = async (newStatus) => {
    const { hasPermission } = checkUserPermissions();

    if (!hasPermission("canChangeBiddingStatus")) {
      alert("입찰 공고 상태를 변경할 권한이 없습니다.");
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. API를 통한 상태 변경
      const response = await fetchWithAuth(
        `${API_URL}biddings/${biddingId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            reason: `상태가 ${newStatus}로 변경되었습니다.`
          })
        }
      );

      if (!response.ok) {
        throw new Error("상태 변경에 실패했습니다.");
      }

      // 2. 웹소켓으로 상태 변경 알림
      websocket.sendBiddingStatusChange(
        biddingId,
        formData.status.childCode,
        newStatus
      );

      // 3. 알림 전송
      sendNotification(
        "BIDDING_STATUS_CHANGED",
        `입찰 공고 "${formData.title}"의 상태가 ${newStatus}로 변경되었습니다.`
      );

      // 4. 로컬 상태 업데이트
      setFormData((prev) => ({
        ...prev,
        status: {
          ...prev.status,
          childCode: newStatus
        }
      }));
    } catch (error) {
      console.error("상태 변경 중 오류:", error);
      setRequestError(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 파일 리스트 렌더링
  const renderFileList = () => {
    return (
      <Box sx={{ mt: 2 }}>
        {fileList.map((file, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
              p: 1,
              border: "1px solid #e0e0e0",
              borderRadius: 1
            }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <AttachFileIcon sx={{ mr: 1 }} />
              <Typography variant="body2">
                {typeof file === "string" ? file : file.name}
              </Typography>
            </Box>
            <Box>
              {/* 다운로드 버튼 (서버에서 온 파일인 경우만) */}
              {typeof file === "string" && (
                <IconButton
                  size="small"
                  onClick={() => handleFileDownload(file)}
                  title="다운로드">
                  <DownloadIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton
                size="small"
                onClick={() => handleFileDelete(file)}
                title="삭제">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  // 파일 첨부 input 컴포넌트
  const renderFileUploadInput = () => (
    <>
      <input
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
        onChange={handleFileChange}
        id="contained-button-file"
        style={{ display: "none" }}
      />
      <label htmlFor="contained-button-file">
        <Button
          variant="contained"
          component="span"
          startIcon={<AttachFileIcon />}
          disabled={mode === "edit"}>
          파일 첨부
        </Button>
      </label>
    </>
  );

  // 로딩 중 표시
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        {mode === "create" ? "입찰 공고 등록" : "입찰 공고 수정"}
      </Typography>

      {/* 에러 메시지 표시 */}
      {requestError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {requestError}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            {/* 구매 요청 선택 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="구매 요청 코드"
                name="requestNumber"
                value={formData.requestNumber}
                onClick={() => {
                  setIsPurchaseRequestModalOpen(true);
                }}
                InputProps={{
                  readOnly: mode === "edit",
                  style: { cursor: mode === "create" ? "pointer" : "default" }
                }}
                error={!!errors.requestNumber}
                helperText={
                  errors.requestNumber ||
                  (mode === "create" ? "클릭하여 구매 요청을 선택하세요" : "")
                }
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="구매 요청명"
                name="requestName"
                value={formData.requestName}
                InputProps={{ readOnly: true }}
                margin="normal"
              />
            </Grid>

            {/* 공급자 선택 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                거래처(공급자)
              </Typography>
              <Box
                sx={{
                  p: 2,
                  border: `1px solid ${
                    errors.suppliers ? "#d32f2f" : "#e0e0e0"
                  }`,
                  borderRadius: 1,
                  minHeight: "100px",
                  mb: 1
                }}>
                {mode === "create" || mode === "edit" ? (
                  formData.suppliers && formData.suppliers.length > 0 ? (
                    <Grid container spacing={1}>
                      {formData.suppliers.map((supplier) => (
                        <Grid item key={supplier.id}>
                          <Box
                            sx={{
                              bgcolor: "primary.light",
                              color: "white",
                              p: 1,
                              borderRadius: 1,
                              display: "flex",
                              alignItems: "center",
                              gap: 1
                            }}>
                            <Typography variant="body2">
                              {supplier.name}
                            </Typography>
                            <Button
                              size="small"
                              sx={{ minWidth: "auto", p: 0, color: "white" }}
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  suppliers: prev.suppliers.filter(
                                    (s) => s.id !== supplier.id
                                  )
                                }));
                              }}>
                              ×
                            </Button>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}>
                      선택된 공급자가 없습니다.
                    </Typography>
                  )
                ) : null}
              </Box>
              {errors.suppliers && (
                <Typography color="error" variant="caption">
                  {errors.suppliers}
                </Typography>
              )}
              {(mode === "create" || mode === "edit") && (
                <Button
                  variant="outlined"
                  onClick={() => setIsSupplierModalOpen(true)}
                  startIcon={<span>+</span>}>
                  공급자 선택
                </Button>
              )}
            </Grid>

            {/* 입찰 정보 */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="bid-method-label">입찰 방식</InputLabel>
                <Select
                  labelId="bid-method-label"
                  name="bidMethod"
                  value={
                    mode === "create" ? formData.bidMethod : originalBidMethod
                  }
                  label="입찰 방식"
                  onChange={handleChange}
                  disabled={mode === "edit"}>
                  <MenuItem value={BiddingMethod.FIXED_PRICE}>
                    정가제안
                  </MenuItem>
                  <MenuItem value={BiddingMethod.OPEN_PRICE}>가격제안</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="status-label">상태</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={
                    mode === "create" ? formData.status.childCode : "PENDING"
                  }
                  label="상태"
                  onChange={handleChange}
                  disabled={mode === "edit"}>
                  <MenuItem value={BiddingStatus.PENDING}>대기중</MenuItem>
                  <MenuItem value={BiddingStatus.ONGOING}>진행중</MenuItem>
                  <MenuItem value={BiddingStatus.CLOSED}>마감</MenuItem>
                  <MenuItem value={BiddingStatus.CANCELED}>취소</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* 납품 관련 정보 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="납품 장소"
                name="deliveryLocation"
                value={formData.deliveryLocation}
                onChange={handleChange}
                margin="normal"
                error={!!errors.deliveryLocation}
                helperText={errors.deliveryLocation}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                  label="납품 요청일"
                  value={
                    formData.deliveryDate ? moment(formData.deliveryDate) : null
                  }
                  onChange={(newDate) =>
                    handleDateChange("deliveryDate", newDate)
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: "normal",
                      error: !!errors.deliveryDate,
                      helperText: errors.deliveryDate
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            {/* 수량 및 단가 정보 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="품목 수량"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  handleNumberChange("quantity", Number(e.target.value))
                }
                disabled={
                  mode === "edit" ||
                  formData.bidMethod === BiddingMethod.OPEN_PRICE
                }
                error={!!errors.quantity}
                helperText={errors.quantity}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="단가"
                name="unitPrice"
                type="number"
                value={formData.unitPrice}
                onChange={(e) =>
                  handleNumberChange("unitPrice", Number(e.target.value))
                }
                disabled={
                  mode === "edit" ||
                  formData.bidMethod === BiddingMethod.OPEN_PRICE ||
                  formData.selectedItems.length > 1 // 다중 선택 시 비활성화
                }
                error={!!errors.unitPrice}
                helperText={errors.unitPrice}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="billing-unit-label">과금 단위</InputLabel>
                <Select
                  labelId="billing-unit-label"
                  name="billingUnit"
                  value={formData.billingUnit}
                  label="과금 단위"
                  onChange={handleChange}
                  disabled={formData.selectedItems.length > 1} // 다중 선택 시 비활성화
                >
                  {BillingUnits.map((unit) => (
                    <MenuItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                  label="입찰 마감 일자"
                  value={formData.deadline ? moment(formData.deadline) : null}
                  onChange={(newDate) => handleDateChange("deadline", newDate)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.deadline,
                      helperText: errors.deadline,
                      margin: "normal"
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            {/* 금액 표시 (읽기 전용) */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="공급가액"
                value={formData.supplyPrice.toLocaleString()}
                InputProps={{
                  readOnly: true,
                  endAdornment: <Typography variant="caption">원</Typography>
                }}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="부가세"
                value={formData.vat.toLocaleString()}
                InputProps={{
                  readOnly: true,
                  endAdornment: <Typography variant="caption">원</Typography>
                }}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="합계 금액"
                value={formData.totalAmount.toLocaleString()}
                InputProps={{
                  readOnly: true,
                  endAdornment: <Typography variant="caption">원</Typography>
                }}
                margin="normal"
              />
            </Grid>

            {/* 입찰 조건 필드 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="입찰 조건"
                name="biddingConditions"
                multiline
                variant="filled"
                minRows={4}
                maxRows={8}
                value={formData.biddingConditions}
                onChange={handleChange}
                placeholder="예: 1. 납품 일정 2. 품질 요구사항 3. 결제 조건 등"
                error={!!errors.biddingConditions}
                helperText={errors.biddingConditions}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="비고 (내부용)"
                name="internalNote"
                multiline
                variant="filled"
                minRows={4}
                maxRows={8}
                value={formData.internalNote}
                onChange={handleChange}
                placeholder="내부 참고사항을 입력하세요"
                margin="normal"
              />
            </Grid>
          </Grid>
          {/* 첨부 파일 */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              첨부 파일
            </Typography>
            {renderFileList()}
            {renderFileUploadInput()}
          </Box>
        </Paper>

        <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={isSubmitting}>
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : mode === "create" ? (
              "등록"
            ) : (
              "수정"
            )}
          </Button>
          <Button
            variant="outlined"
            type="button"
            disabled={isSubmitting}
            onClick={handleCancel}>
            취소
          </Button>
        </Box>
      </form>

      {/* 통합된 구매 요청 및 품목 선택 모달 */}
      <PurchaseRequestSelectionDialog
        open={isPurchaseRequestModalOpen}
        onClose={() => setIsPurchaseRequestModalOpen(false)}
        purchaseRequests={purchaseRequests}
        onComplete={handlePurchaseRequestComplete}
        initialPurchaseRequest={selectedPurchaseRequest}
        initialSelectedItems={formData.selectedItems}
      />

      {/* 공급자 선택 모달 */}
      <SupplierSelectionDialog
        open={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        suppliers={suppliers}
        selectedSuppliers={formData.suppliers}
        onSelect={handleSupplierSelect}
        onComplete={handleSupplierSelectionComplete}
        purchaseRequest={selectedPurchaseRequest}
      />
    </Box>
  );
}

// PropTypes 정의
BiddingFormPage.propTypes = {
  mode: PropTypes.oneOf(["create", "edit"]),
  biddingId: PropTypes.number,
  onSave: PropTypes.func,
  onCancel: PropTypes.func
};

export default BiddingFormPage;
