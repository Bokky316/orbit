// utils/dateUtils.js
export const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
};
