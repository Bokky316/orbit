import globals from "globals";
import tseslint from "@typescript-eslint/eslint-plugin";
import pluginReact from "eslint-plugin-react";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    files: ["**/*.{js,jsx}"], // 적용할 파일 확장자
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: globals.browser // 브라우저 환경 활성화
    },
    plugins: {
      react: pluginReact,
      "@typescript-eslint": tseslint
    },
    rules: {
      // 기본 ESLint 규칙
      ...tseslint.configs.recommended.rules, // TypeScript 추천 규칙 가져오기
      ...pluginReact.configs.recommended.rules, // React 추천 규칙 가져오기

      // 커스텀 규칙 추가
      "react/react-in-jsx-scope": "off", // React 17 이상에서는 불필요한 규칙 비활성화
      "react/prop-types": "off", // PropTypes 사용하지 않는 경우 비활성화
      "no-unused-vars": ["warn", { varsIgnorePattern: "^React$" }], // React import 경고 무시
      "react-hooks/rules-of-hooks": "error", // Hook 규칙 강제
      "react-hooks/exhaustive-deps": "warn" // useEffect 종속성 검사 경고
    }
  },
  {
    files: ["**/*.js"], // JS 파일에만 적용할 추가 설정 (선택 사항)
    languageOptions: {
      sourceType: "script" // CommonJS 모듈 지원 (예: Node.js)
    }
  }
];
