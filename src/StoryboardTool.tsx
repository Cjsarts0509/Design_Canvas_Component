// 📌 주석(Annotation) 데이터 타입 (이미지 위 마커용)
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
  type: 'IMAGE' | 'NOTE'; // 📌 [신규] 슬라이드 종류 구분
  
  // 공통 필드
  name: string;       // [관리용] 좌측 패널 이름 (예: 슬라이드 1)
  
  // IMAGE 타입용 필드
  taskName?: string;   // 화면별 업무명
  screenName?: string; // 화면명
  imageUrl?: string | null;
  annotations?: Annotation[];

  // NOTE 타입용 필드 (목차 및 간지용)
  title?: string;      // 챕터/주석 제목
  description?: string;// 상세 설명
}

// 📌 문서 정보(DocumentInfo) 데이터 타입
export interface DocumentInfo {
  author: string; 
  date: string;  
}