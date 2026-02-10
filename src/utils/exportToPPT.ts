import pptxgen from 'pptxgenjs';
// 상위 폴더의 StoryboardTool import
import { Slide, DocumentInfo } from '../StoryboardTool';

// 1280x720 캔버스 기준 (웹 좌표)
const VIRTUAL_WIDTH = 1280;
const VIRTUAL_HEIGHT = 720;

// 교보문고 스타일 컬러 팔레트
const COLORS = {
  KYOBO_GREEN: '3F8C48',    // 헤더 배경
  KYOBO_LIGHT_BG: 'F7F8FA', // 우측 사이드바 배경
  KYOBO_DARK_TEXT: '333333',// 본문 텍스트
  BORDER_GRAY: 'E5E7EB',    // 테두리
  WHITE: 'FFFFFF',          // 흰색
  HEADER_LABEL: 'A8D5AC'    // 헤더 안의 작은 라벨 색상 (연한 그린)
};

const getImageDimensions = (src: string): Promise<{ w: number; h: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.width, h: img.height });
    img.onerror = () => resolve({ w: VIRTUAL_WIDTH, h: VIRTUAL_HEIGHT }); // 로드 실패 시 기본값
    img.src = src;
  });
};

// 📌 [신규] RGB 색상 문자열을 Hex 코드로 변환 (pptxgenjs 호환용)
const rgbToHex = (color: string): string | undefined => {
  if (!color) return undefined;
  if (color.startsWith('#')) return color.replace('#', '');
  
  const result = color.match(/\d+/g);
  if (result && result.length >= 3) {
    // RGB to Hex 변환
    const hex = ((1 << 24) + (parseInt(result[0]) << 16) + (parseInt(result[1]) << 8) + parseInt(result[2])).toString(16).slice(1).toUpperCase();
    return hex;
  }
  return undefined;
};

// 📌 [신규] HTML 문자열을 파싱하여 pptxgenjs Rich Text 객체 배열로 변환
const parseHtmlToPptxText = (html: string) => {
  if (!html) return "";

  // 브라우저 환경을 이용해 HTML 파싱
  const div = document.createElement("div");
  div.innerHTML = html;

  const textItems: any[] = [];

  // 재귀적으로 노드 탐색
  const traverse = (node: Node, currentStyle: { bold?: boolean; italic?: boolean; underline?: boolean; color?: string }) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (text) {
        textItems.push({ text: text, options: { ...currentStyle } });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const newStyle = { ...currentStyle };

      // 스타일 추출
      if (el.tagName === 'B' || el.tagName === 'STRONG' || el.style.fontWeight === 'bold' || Number(el.style.fontWeight) >= 700) newStyle.bold = true;
      if (el.tagName === 'I' || el.tagName === 'EM' || el.style.fontStyle === 'italic') newStyle.italic = true;
      if (el.tagName === 'U' || el.style.textDecoration.includes('underline')) newStyle.underline = true;
      
      // 색상 추출 (<font color="..."> 또는 style="color: ...")
      const colorAttr = el.getAttribute('color') || el.style.color;
      if (colorAttr) {
        const hex = rgbToHex(colorAttr);
        if (hex) newStyle.color = hex;
      }

      // 줄바꿈 처리 (<br>, <div>, <p> 등)
      if (el.tagName === 'BR') {
        textItems.push({ text: '', options: { breakLine: true } });
      }
      
      // 블록 요소의 시작 시 줄바꿈 (첫 요소가 아니고, 이전이 줄바꿈이 아닐 때)
      if ((el.tagName === 'DIV' || el.tagName === 'P') && textItems.length > 0) {
         const lastItem = textItems[textItems.length - 1];
         if (!lastItem.options?.breakLine) {
             textItems.push({ text: '', options: { breakLine: true } });
         }
      }

      // 자식 노드 탐색
      el.childNodes.forEach(child => traverse(child, newStyle));

      // 블록 요소 끝난 후 줄바꿈은 일반적으로 다음 블록 시작에서 처리됨
    }
  };

  traverse(div, {});

  // 빈 결과 처리
  if (textItems.length === 0) return "";
  
  return textItems;
};


export const exportToPowerPoint = async (slides: Slide[], docInfo: DocumentInfo): Promise<Blob> => {
  const pptx = new pptxgen();

  const PPT_WIDTH = 10;
  const PPT_HEIGHT = 5.625;
  
  const HEADER_H = 0.9; 
  const SIDEBAR_W = 3.0; 
  
  const IMG_AREA_X = 0;
  const IMG_AREA_Y = HEADER_H;
  const IMG_AREA_W = PPT_WIDTH - SIDEBAR_W; 
  const IMG_AREA_H = PPT_HEIGHT - HEADER_H; 

  const SIDEBAR_X = IMG_AREA_W;
  const SIDEBAR_Y = HEADER_H;
  const SIDEBAR_H = IMG_AREA_H;

  // 레이아웃 정의
  pptx.defineLayout({ name: 'KYOBO_STYLE', width: PPT_WIDTH, height: PPT_HEIGHT });
  pptx.layout = 'KYOBO_STYLE';
  
  // 메타데이터
  pptx.title = slides[0]?.taskName || 'Manual Document'; 
  pptx.author = docInfo.author;

  for (const slideData of slides) {
    const slide = pptx.addSlide();

    // =======================================================
    // [A] 상단 정보 영역
    // =======================================================
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: PPT_WIDTH, h: HEADER_H,
      fill: { color: COLORS.KYOBO_GREEN },
    });

    // (1) 업무 영역
    slide.addText("업무", {
      x: 0.2, y: 0.1, w: 3.5, h: 0.2,
      fontSize: 8, color: COLORS.HEADER_LABEL, bold: true 
    });
    slide.addText(slideData.taskName || '-', {
      x: 0.2, y: 0.35, w: 3.5, h: 0.4,
      fontSize: 14, color: COLORS.WHITE, bold: true, valign: 'top'
    });

    // (2) 화면명 영역
    slide.addText("화면명", {
      x: 4.0, y: 0.1, w: 3.5, h: 0.2,
      fontSize: 8, color: COLORS.HEADER_LABEL, bold: true
    });
    slide.addText(slideData.screenName || '-', {
      x: 4.0, y: 0.35, w: 3.5, h: 0.4,
      fontSize: 14, color: COLORS.WHITE, bold: true, valign: 'top'
    });

    // (3) 작성자 영역
    slide.addText("작성자", {
      x: 8.0, y: 0.1, w: 1.8, h: 0.2,
      fontSize: 8, color: COLORS.HEADER_LABEL, bold: true
    });
    slide.addText(docInfo.author || '-', {
      x: 8.0, y: 0.35, w: 1.8, h: 0.4,
      fontSize: 14, color: COLORS.WHITE, bold: true, valign: 'top'
    });

    // 구분선
    slide.addShape(pptx.ShapeType.line, { x: 3.8, y: 0.15, w: 0, h: 0.6, line: { color: COLORS.HEADER_LABEL, width: 0.5, transparency: 50 } });
    slide.addShape(pptx.ShapeType.line, { x: 7.8, y: 0.15, w: 0, h: 0.6, line: { color: COLORS.HEADER_LABEL, width: 0.5, transparency: 50 } });


    // =======================================================
    // [B] 우측 설명 영역
    // =======================================================
    slide.addShape(pptx.ShapeType.rect, {
      x: SIDEBAR_X, y: SIDEBAR_Y, w: SIDEBAR_W, h: SIDEBAR_H,
      fill: { color: COLORS.KYOBO_LIGHT_BG },
      line: { color: COLORS.BORDER_GRAY, width: 1 }
    });

    // 테이블 헤더
    const tableRows: pptxgen.TableRow[] = [
      [
        { 
          text: "No", 
          options: { 
            fill: COLORS.KYOBO_GREEN, 
            color: COLORS.WHITE, 
            bold: true, 
            align: 'center', 
            w: 0.4, 
            border: { color: COLORS.WHITE, pt: 1 }
          } 
        },
        { 
          text: "화면 설명", 
          options: { 
            fill: COLORS.KYOBO_GREEN, 
            color: COLORS.WHITE, 
            bold: true, 
            align: 'center', 
            w: SIDEBAR_W - 0.4,
            border: { color: COLORS.WHITE, pt: 1 }
          } 
        }
      ]
    ];

    // 테이블 내용
    slideData.annotations.forEach(ann => {
      // 📌 [수정됨] stripHtml 대신 parseHtmlToPptxText 사용 (스타일 유지)
      const richText = parseHtmlToPptxText(ann.note || '');
      
      tableRows.push([
        { 
          text: ann.number.toString(), 
          options: { 
            align: 'center', 
            valign: 'middle', 
            fontSize: 8, 
            fill: COLORS.WHITE, 
            color: COLORS.KYOBO_DARK_TEXT
          } 
        },
        { 
          text: richText, // Rich Text 객체 배열 전달
          options: { 
            align: 'left', 
            valign: 'top', 
            fontSize: 8, 
            fill: COLORS.WHITE, 
            color: COLORS.KYOBO_DARK_TEXT,
            margin: 0.05
          } 
        }
      ]);
    });

    if (slideData.annotations.length > 0) {
      slide.addTable(tableRows, {
        x: SIDEBAR_X + 0.1, 
        y: SIDEBAR_Y + 0.1, 
        w: SIDEBAR_W - 0.2,
        colW: [0.4, SIDEBAR_W - 0.6],
        border: { type: 'solid', pt: 1, color: COLORS.BORDER_GRAY },
        fontSize: 8,
        fontFace: 'Malgun Gothic'
      });
    } else {
      slide.addText("등록된 주석이 없습니다.", { 
        x: SIDEBAR_X, y: SIDEBAR_Y + 1, w: SIDEBAR_W, h: 1, 
        align: 'center', color: '888888', fontSize: 10 
      });
    }

    // =======================================================
    // [C] 좌측 이미지 영역 및 좌표 계산
    // =======================================================
    
    // 1. 이미지가 Web Canvas(1280x720)에서 차지하는 영역 계산
    // (DesignCanvas의 object-contain 로직 재현)
    let webRenderX = 0, webRenderY = 0, webRenderW = VIRTUAL_WIDTH, webRenderH = VIRTUAL_HEIGHT;
    let pptRenderX = IMG_AREA_X, pptRenderY = IMG_AREA_Y, pptRenderW = IMG_AREA_W, pptRenderH = IMG_AREA_H;

    if (slideData.imageUrl) {
      const dims = await getImageDimensions(slideData.imageUrl);
      const imgRatio = dims.w / dims.h;
      
      // 1-1. Web Canvas에서의 이미지 레이아웃 계산
      const canvasRatio = VIRTUAL_WIDTH / VIRTUAL_HEIGHT;
      if (imgRatio > canvasRatio) {
        // 이미지가 가로로 더 긴 경우 (가로 꽉 채움, 상하 여백)
        webRenderW = VIRTUAL_WIDTH;
        webRenderH = VIRTUAL_WIDTH / imgRatio;
        webRenderX = 0;
        webRenderY = (VIRTUAL_HEIGHT - webRenderH) / 2;
      } else {
        // 이미지가 세로로 더 긴 경우 (세로 꽉 채움, 좌우 여백)
        webRenderH = VIRTUAL_HEIGHT;
        webRenderW = VIRTUAL_HEIGHT * imgRatio;
        webRenderY = 0;
        webRenderX = (VIRTUAL_WIDTH - webRenderW) / 2;
      }

      // 1-2. PPT Slide에서의 이미지 레이아웃 계산
      const pptAreaRatio = IMG_AREA_W / IMG_AREA_H;
      if (imgRatio > pptAreaRatio) {
         pptRenderW = IMG_AREA_W;
         pptRenderH = IMG_AREA_W / imgRatio;
         pptRenderX = IMG_AREA_X;
         pptRenderY = IMG_AREA_Y + (IMG_AREA_H - pptRenderH) / 2;
      } else {
         pptRenderH = IMG_AREA_H;
         pptRenderW = IMG_AREA_H * imgRatio;
         pptRenderY = IMG_AREA_Y;
         pptRenderX = IMG_AREA_X + (IMG_AREA_W - pptRenderW) / 2;
      }

      // 이미지 추가
      slide.addImage({ data: slideData.imageUrl, x: pptRenderX, y: pptRenderY, w: pptRenderW, h: pptRenderH });
    }

    // =======================================================
    // [D] 이미지 위 마커 찍기 (좌표 보정 적용)
    // =======================================================
    slideData.annotations.forEach((ann) => {
      const markerSizeInch = 0.15;
      
      // 📌 [수정됨] 좌표 변환 로직 변경
      // 1. 마커가 Web Canvas 상의 이미지 영역(webRenderBox) 내에서 상대적으로 어디에 위치하는지(0.0 ~ 1.0) 계산
      //    (만약 이미지가 레터박스로 인해 작게 그려졌다면, 여백을 제외한 이미지 시작점 기준으로 계산해야 함)
      const normX = (ann.x - webRenderX) / webRenderW;
      const normY = (ann.y - webRenderY) / webRenderH;

      // 2. 그 상대 위치를 PPT 상의 이미지 영역(pptRenderBox)에 적용
      const pptX = pptRenderX + (normX * pptRenderW) - (markerSizeInch / 2);
      const pptY = pptRenderY + (normY * pptRenderH) - (markerSizeInch / 2);

      if (slideData.imageUrl) {
        // 마커 원
        slide.addShape(pptx.ShapeType.ellipse, { 
          x: pptX, y: pptY, w: markerSizeInch, h: markerSizeInch, 
          fill: { color: ann.color.replace('#', '') }, 
          line: { color: COLORS.WHITE, width: 1.5 } 
        });
        
        // 마커 숫자
        slide.addText(ann.number.toString(), { 
          x: pptX, y: pptY, w: markerSizeInch, h: markerSizeInch, 
          align: 'center', valign: 'middle', 
          fontSize: 7, 
          bold: true, color: COLORS.WHITE 
        });
      }
    });
  }
  
  return await pptx.write("blob") as Promise<Blob>;
};
