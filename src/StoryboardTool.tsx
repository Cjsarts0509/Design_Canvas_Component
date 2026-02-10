// 📌 주석(Annotation) 데이터 타입
export interface Annotation {
  id: string;
  number: number;
  x: number;
  y: number;
  color: string;
  note: string; // 내용 (Rich Text)
  style: {
    fontSize: string;
    textAlign: 'left' | 'center' | 'right';
    backgroundColor: string;
    textColor: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
  };
}

// 📌 슬라이드(Slide) 데이터 타입
export interface Slide {
  id: string;
  name: string;       // [관리용] 좌측 패널 이름 (예: 슬라이드 1)
  taskName: string;   // 📌 [신규] 화면별 업무명 (예: 통합회계 시스템 구축) - 사용자 입력
  screenName: string; // 📌 [기존] 화면별 화면명 (예: 로그인 화면) - 사용자 입력
  annotations: Annotation[];
  imageUrl: string | null;
}

// 📌 문서 정보(DocumentInfo) 데이터 타입
// 'title'은 이제 Slide별로 관리되므로 제거했습니다.
export interface DocumentInfo {
  author: string; // 작성자 (공통)
  date: string;   // 날짜 (공통)
}