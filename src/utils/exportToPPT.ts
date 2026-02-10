import pptxgen from 'pptxgenjs';
import { Slide, DocumentInfo } from '../StoryboardTool';

// 1280x720 캔버스 기준 (웹 좌표)
const VIRTUAL_WIDTH = 1280;
const VIRTUAL_HEIGHT = 720;

const COLORS = {
  KYOBO_GREEN: '3F8C48',
  KYOBO_LIGHT_BG: 'F7F8FA',
  KYOBO_DARK_TEXT: '333333',
  BORDER_GRAY: 'E5E7EB',
  WHITE: 'FFFFFF',
  HEADER_LABEL: 'A8D5AC'
};

// HTML에서 텍스트와 스타일(색상, 굵기 등)을 추출하여 PPT 객체 배열로 변환
const parseHtmlToPptText = (html: string) => {
  if (!html) return [{ text: "" }];

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const textObjects: any[] = [];

  const traverse = (node: Node, parentStyle: any = {}) => {
    node.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        if (child.textContent) {
          textObjects.push({
            text: child.textContent,
            options: { ...parentStyle }
          });
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        const currentStyle = { ...parentStyle };

        // 스타일 분석
        if (element.style.color) {
          currentStyle.color = element.style.color.replace(/rgb\(|\)|rgba\(|\)/g, '').split(',').map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          }).join('').substring(0, 6); // RGB to HEX 간단 변환
        }
        if (element.tagName === 'B' || element.tagName === 'STRONG' || element.style.fontWeight === 'bold') {
          currentStyle.bold = true;
        }
        if (element.tagName === 'I' || element.tagName === 'EM' || element.style.fontStyle === 'italic') {
          currentStyle.italic = true;
        }
        if (element.tagName === 'U' || element.style.textDecoration === 'underline') {
          currentStyle.underline = true;
        }
        if (element.tagName === 'BR') {
          textObjects.push({ text: '\n' });
        }

        traverse(child, currentStyle);
      }
    });
  };

  traverse(tempDiv);
  return textObjects.length > 0 ? textObjects : [{ text: "" }];
};

const getImageDimensions = (src: string): Promise<{ w: number; h: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.width, h: img.height });
    img.src = src;
  });
};

export const exportToPowerPoint = async (slides: Slide[], docInfo: DocumentInfo) => {
  const pptx = new pptxgen();
  const PPT_WIDTH = 10;
  const PPT_HEIGHT = 5.625;
  const HEADER_H = 0.9; 
  const SIDEBAR_W = 3.0; 
  
  const IMG_AREA_X = 0.1; // 여백 추가
  const IMG_AREA_Y = HEADER_H + 0.1;
  const IMG_AREA_W = PPT_WIDTH - SIDEBAR_W - 0.2; 
  const IMG_AREA_H = PPT_HEIGHT - HEADER_H - 0.2; 

  const SIDEBAR_X = PPT_WIDTH - SIDEBAR_W;
  const SIDEBAR_Y = HEADER_H;
  const SIDEBAR_H = PPT_HEIGHT - HEADER_H;

  pptx.defineLayout({ name: 'KYOBO_STYLE', width: PPT_WIDTH, height: PPT_HEIGHT });
  pptx.layout = 'KYOBO_STYLE';

  for (const slideData of slides) {
    const slide = pptx.addSlide();

    // 배경 및 헤더 설정 (생략 - 기존 로직 유지)

    // [B] 우측 설명 영역 테이블
    const tableRows: any[] = [
      [
        { text: "No", options: { fill: COLORS.KYOBO_GREEN, color: COLORS.WHITE, bold: true, align: 'center', w: 0.4 } },
        { text: "화면 설명", options: { fill: COLORS.KYOBO_GREEN, color: COLORS.WHITE, bold: true, align: 'center', w: SIDEBAR_W - 0.4 } }
      ]
    ];

    slideData.annotations.forEach(ann => {
      // 주석 노트를 스타일이 포함된 객체로 변환
      const styledText = parseHtmlToPptText(ann.note);
      tableRows.push([
        { text: ann.number.toString(), options: { align: 'center', valign: 'middle', fontSize: 9, fill: COLORS.WHITE } },
        { text: styledText, options: { align: 'left', valign: 'top', fontSize: 9, fill: COLORS.WHITE, margin: 0.05 } }
      ]);
    });

    if (slideData.annotations.length > 0) {
      slide.addTable(tableRows, {
        x: SIDEBAR_X + 0.05, y: SIDEBAR_Y + 0.1, w: SIDEBAR_W - 0.1,
        colW: [0.4, SIDEBAR_W - 0.6],
        border: { type: 'solid', pt: 0.5, color: COLORS.BORDER_GRAY },
        fontFace: 'Malgun Gothic'
      });
    }

    // [C] 좌측 이미지 및 마커 좌표 계산 최적화
    let renderX = IMG_AREA_X, renderY = IMG_AREA_Y, renderW = IMG_AREA_W, renderH = IMG_AREA_H;

    if (slideData.imageUrl) {
      const dims = await getImageDimensions(slideData.imageUrl);
      const imgRatio = dims.w / dims.h;
      const areaRatio = IMG_AREA_W / IMG_AREA_H;

      if (imgRatio > areaRatio) {
         renderW = IMG_AREA_W; renderH = IMG_AREA_W / imgRatio;
         renderX = IMG_AREA_X; renderY = IMG_AREA_Y + (IMG_AREA_H - renderH) / 2;
      } else {
         renderH = IMG_AREA_H; renderW = IMG_AREA_H * imgRatio;
         renderY = IMG_AREA_Y; renderX = IMG_AREA_X + (IMG_AREA_W - renderW) / 2;
      }
      slide.addImage({ data: slideData.imageUrl, x: renderX, y: renderY, w: renderW, h: renderH });

      // 마커 배치
      slideData.annotations.forEach((ann) => {
        const markerSizeInch = 0.18;
        // 캔버스 중앙(0.5, 0.5) 기준 보정 및 비율 계산 정밀화
        const ratioX = ann.x / VIRTUAL_WIDTH;
        const ratioY = ann.y / VIRTUAL_HEIGHT;
        
        const pptX = renderX + (ratioX * renderW) - (markerSizeInch / 2);
        const pptY = renderY + (ratioY * renderH) - (markerSizeInch / 2);

        slide.addShape(pptx.ShapeType.ellipse, { 
          x: pptX, y: pptY, w: markerSizeInch, h: markerSizeInch, 
          fill: { color: ann.color.replace('#', '') }, 
          line: { color: COLORS.WHITE, width: 1 } 
        });
        
        slide.addText(ann.number.toString(), { 
          x: pptX, y: pptY, w: markerSizeInch, h: markerSizeInch, 
          align: 'center', valign: 'middle', fontSize: 8, bold: true, color: COLORS.WHITE 
        });
      });
    }
  }
  const fileName = `${slides[0]?.taskName.replace(/\s+/g, '_') || 'Manual'}.pptx`;
  await pptx.writeFile({ fileName });
};
