import React, { createContext, useState, useContext, useEffect } from "react";
import {
  biddingsData,
  suppliersData,
  bidResponsesData,
  purchaseRequestsData,
  usersData,
  statusHistoriesData,
  evaluationsData,
  notificationsData
} from "./dummyData";

// 입찰 데이터 컨텍스트 생성
const BiddingDataContext = createContext(null);

// 컨텍스트 훅
export const useBiddingData = () => {
  const context = useContext(BiddingDataContext);
  if (!context) {
    throw new Error("useBiddingData must be used within a BiddingDataProvider");
  }
  return context;
};

// 데이터 제공자 컴포넌트
export const BiddingDataProvider = ({ children }) => {
  // 더미 데이터 상태
  const [biddings, setBiddings] = useState(biddingsData);
  const [suppliers, setSuppliers] = useState(suppliersData);
  const [bidResponses, setBidResponses] = useState(bidResponsesData);
  const [purchaseRequests, setPurchaseRequests] =
    useState(purchaseRequestsData);
  const [users, setUsers] = useState(usersData);
  const [statusHistories, setStatusHistories] = useState(statusHistoriesData);
  const [evaluations, setEvaluations] = useState(evaluationsData);
  const [notifications, setNotifications] = useState(notificationsData);

  // 계약 더미 데이터 생성
  const [contracts, setContracts] = useState([]);

  // 발주 더미 데이터 생성
  const [orders, setOrders] = useState([]);

  // 초기화 - 계약 및 발주 데이터 생성
  useEffect(() => {
    // 계약 더미 데이터 생성
    const tempContracts = biddings
      .filter(
        (bidding) =>
          bidding.participations &&
          bidding.participations.some((p) => p.isSelectedBidder)
      )
      .map((bidding) => {
        const selectedBidder = bidding.participations.find(
          (p) => p.isSelectedBidder
        );
        const supplier = suppliers.find(
          (s) => s.id === selectedBidder.supplierId
        );

        return {
          id: `CONTRACT-${bidding.id.split("-")[1]}`,
          transactionNumber: `CTR-${bidding.bidNumber.split("-")[2]}`,
          biddingId: bidding.id,
          biddingNumber: bidding.bidNumber,
          supplierId: selectedBidder.supplierId,
          supplierName: supplier?.name || selectedBidder.companyName,
          startDate: new Date().toISOString(),
          endDate: new Date(
            new Date().setMonth(new Date().getMonth() + 12)
          ).toISOString(),
          totalAmount: selectedBidder.totalAmount,
          status:
            Math.random() > 0.3
              ? "활성"
              : Math.random() > 0.5
              ? "서명중"
              : "초안",
          signatureStatus:
            Math.random() > 0.5
              ? "완료"
              : Math.random() > 0.5
              ? "내부서명"
              : "미서명",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          finalContractFilePath: Math.random() > 0.3 ? "계약서_파일.pdf" : null
        };
      });

    setContracts(tempContracts);

    // 발주 더미 데이터 생성
    const tempOrders = biddings
      .filter(
        (bidding) =>
          bidding.participations &&
          bidding.participations.some((p) => p.isSelectedBidder)
      )
      .map((bidding) => {
        const selectedBidder = bidding.participations.find(
          (p) => p.isSelectedBidder
        );
        const supplier = suppliers.find(
          (s) => s.id === selectedBidder.supplierId
        );

        const statuses = [
          "DRAFT",
          "PENDING_APPROVAL",
          "APPROVED",
          "IN_PROGRESS",
          "COMPLETED"
        ];
        const randomStatus =
          statuses[Math.floor(Math.random() * statuses.length)];

        return {
          id: `ORDER-${bidding.id.split("-")[1]}`,
          orderNumber: `ORD-${bidding.bidNumber.split("-")[2]}`,
          biddingId: bidding.id,
          supplierId: selectedBidder.supplierId,
          supplierName: supplier?.name || selectedBidder.companyName,
          title: bidding.title.replace("입찰", "발주"),
          description: `${bidding.title}에 대한 발주`,
          status: randomStatus,
          unitPrice: selectedBidder.unitPrice,
          quantity: selectedBidder.quantity,
          supplyPrice: Math.round(selectedBidder.totalAmount / 1.1),
          vat: Math.round(
            selectedBidder.totalAmount - selectedBidder.totalAmount / 1.1
          ),
          totalAmount: selectedBidder.totalAmount,
          expectedDeliveryDate: new Date(
            new Date().setDate(new Date().getDate() + 30)
          ).toISOString(),
          terms: bidding.conditions,
          biddingParticipationId: selectedBidder.id,
          createdAt: new Date().toISOString(),
          approvedAt:
            randomStatus !== "DRAFT"
              ? new Date(
                  new Date().setDate(new Date().getDate() + 2)
                ).toISOString()
              : null,
          bidderSelectedAt: new Date().toISOString(),
          isSelectedBidder: true
        };
      });

    setOrders(tempOrders);
  }, [biddings, suppliers]);

  // 데이터 액세스 및 업데이트 메서드
  const getBiddingById = (id) =>
    biddings.find((bidding) => bidding.id === id) || null;

  const getSupplierById = (id) =>
    suppliers.find((supplier) => supplier.id === id) || null;

  const updateBidding = (id, updatedData) => {
    const updatedBiddings = biddings.map((bidding) =>
      bidding.id === id ? { ...bidding, ...updatedData } : bidding
    );
    setBiddings(updatedBiddings);
    return updatedBiddings.find((bidding) => bidding.id === id);
  };

  const addBidParticipation = (biddingId, participation) => {
    const bidding = getBiddingById(biddingId);
    if (!bidding) return null;

    const updatedParticipations = bidding.participations
      ? [...bidding.participations, participation]
      : [participation];

    return updateBidding(biddingId, { participations: updatedParticipations });
  };

  const getContractById = (id) =>
    contracts.find((contract) => contract.id === id) || null;

  const getOrderById = (id) => orders.find((order) => order.id === id) || null;

  // 컨텍스트 값
  const value = {
    // 데이터
    biddings,
    suppliers,
    bidResponses,
    purchaseRequests,
    users,
    statusHistories,
    evaluations,
    notifications,
    contracts,
    orders,

    // 메서드
    getBiddingById,
    getSupplierById,
    updateBidding,
    addBidParticipation,
    getContractById,
    getOrderById,

    // 설정 메서드
    setBiddings,
    setSuppliers,
    setBidResponses,
    setPurchaseRequests,
    setUsers,
    setStatusHistories,
    setEvaluations,
    setNotifications,
    setContracts,
    setOrders
  };

  return (
    <BiddingDataContext.Provider value={value}>
      {children}
    </BiddingDataContext.Provider>
  );
};

export default BiddingDataContext;
