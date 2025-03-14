// src/components/CommonCodeSelector.jsx

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input, FormGroup, Label, FormFeedback, Spinner } from 'reactstrap';
import { fetchChildCodes } from '../redux/commonCodeSlice';

/**
 * 공통 코드 선택 컴포넌트
 * 특정 엔티티 타입과 코드 그룹의 자식 코드를 선택할 수 있는 셀렉트 박스를 제공합니다.
 *
 * @param {Object} props
 * @param {string} props.entityType - 엔티티 타입 (예: PROJECT, PURCHASE_REQUEST 등)
 * @param {string} props.codeGroup - 코드 그룹 (예: STATUS, TYPE 등)
 * @param {string} props.value - 현재 선택된 값
 * @param {Function} props.onChange - 값 변경 시 호출될 함수
 * @param {string} props.name - 폼 필드 이름
 * @param {string} props.id - 요소 ID
 * @param {string} props.label - 라벨 텍스트
 * @param {boolean} props.required - 필수 입력 여부
 * @param {string} props.error - 에러 메시지
 */
const CommonCodeSelector = ({
  entityType,
  codeGroup,
  value,
  onChange,
  name,
  id,
  label,
  required = false,
  error = null,
  ...rest
}) => {
  const dispatch = useDispatch();

  // 자식 코드 목록 조회
  const childCodes = useSelector(state =>
    state.commonCode.childCodesByTypeAndGroup[`${entityType}-${codeGroup}`] || []);

  // 로딩 상태 조회
  const isLoading = useSelector(state => state.commonCode.isLoading);

  // 컴포넌트 마운트 시 자식 코드 목록 가져오기
  useEffect(() => {
    dispatch(fetchChildCodes({ entityType, codeGroup }));
  }, [dispatch, entityType, codeGroup]);

  // 선택 변경 핸들러
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <FormGroup>
      {label && <Label for={id}>{label}{required && <span className="text-danger">*</span>}</Label>}
      <Input
        type="select"
        name={name}
        id={id}
        value={value || ''}
        onChange={handleChange}
        invalid={!!error}
        disabled={isLoading}
        {...rest}
      >
        <option value="">선택하세요</option>
        {childCodes.map(code => (
          <option key={code.id} value={code.codeValue}>
            {code.codeName}
          </option>
        ))}
      </Input>
      {isLoading && (
        <div className="mt-1">
          <Spinner size="sm" color="primary" /> 로딩 중...
        </div>
      )}
      {error && <FormFeedback>{error}</FormFeedback>}
    </FormGroup>
  );
};

export default CommonCodeSelector;