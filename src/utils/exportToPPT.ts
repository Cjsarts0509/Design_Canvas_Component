import pptxgen from 'pptxgenjs';
import { Slide, DocumentInfo } from '../StoryboardTool';

// 1280x720 캔버스 기준 (웹 가상 좌표)
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

const getImageDimensions = (src: string): Promise<{ w: number; h: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.width, h: img.height });
    img.src = src;
  });
};

const rgbToHex = (color: string) => {
  if (!color) return undefined;
  if (color.startsWith('#')) return color.replace('#', '');
  const rgb = color.match(/\d+/g);
  if (rgb && rgb.length >= 3) {
    return ((1 << 24) + (parseInt(rgb[0]) << 16) + (parseInt(rgb[1]) << 8) + parseInt(rgb[2]))
      .toString(16).slice(1).toUpperCase();
  }
  return undefined;
};

// HTML 문자열을 pptxgenjs Text Object 배열로 정밀하게 변환
const parseHtmlToTextObjects = (html: string) => {
  if (!html) return [];
  const div = document.createElement('div');
  div.innerHTML = html;
  const textObjects: any[] = [];

  const traverse = (node: Node, style: any) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text) {
        textObjects.push({ text: text, options: { ...style } });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const newStyle = { ...style };

      // 1. 굵기 및 기울임 스타일 추출
      if (['B', 'STRONG'].includes(el.tagName) || el.style.fontWeight === 'bold' || parseInt(el.style.fontWeight) >= 600) {
        newStyle.bold = true;
      }
      if (['I', 'EM'].includes(el.tagName) || el.style.fontStyle === 'italic') {
        newStyle.italic = true;
      }
      if (['U'].includes(el.tagName) || el.style.textDecoration.includes('underline')) {
        newStyle.underline = true;
      }

      // 2. 색상 추출 (style.color 및 속성 color 대응)
      const colorVal = el.style.color || el.getAttribute('color');
      if (colorVal) {
        const hex = rgbToHex(colorVal);
        if (hex) newStyle.color = hex;
      }

      if (el.tagName === 'BR') {
        textObjects.push({ text: '\n', options: {} });
      }

      el.childNodes.forEach(child => traverse(child, newStyle));
      
      if (['DIV', 'P', 'LI'].includes(el.tagName)) {
         textObjects.push({ text: '\n', options: {} });
      }
    }
  };

  traverse(div, { fontSize: 8, color: COLORS.KYOBO_DARK_TEXT });
  return textObjects;
};

export const exportToPowerPoint = async (slides: Slide[], docInfo: DocumentInfo) => {
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

  pptx.defineLayout({ name: 'KYOBO_STYLE', width: PPT_WIDTH, height: PPT_HEIGHT });
  pptx.layout = 'KYOBO_STYLE';
  
  pptx.title = slides[0]?.taskName || 'Manual Document'; 
  pptx.author = docInfo.author;

  for (const slideData of slides) {
    const slide = pptx.addSlide();

    // 헤더 및 사이드바 배경 (기존 로직 유지)
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: PPT_WIDTH, h: HEADER_H, fill: { color: COLORS.KYOBO_GREEN } });
    slide.addShape(pptx.ShapeType.rect, { x: SIDEBAR_X, y: SIDEBAR_Y, w: SIDEBAR_W, h: SIDEBAR_H, fill: { color: COLORS.KYOBO_LIGHT_BG }, line: { color: COLORS.BORDER_GRAY, width: 1 } });

    // 헤더 텍스트 정보 (기존 로직 유지)
    slide.addText(slideData.taskName || '-', { x: 0.2, y: 0.35, w: 3.5, h: 0.4, fontSize: 14, color: COLORS.WHITE, bold: true });
    slide.addText(slideData.screenName || '-', { x: 4.0, y: 0.35, w: 3.5, h: 0.4, fontSize: 14, color: COLORS.WHITE, bold: true });
    slide.addText(docInfo.author || '-', { x: 8.0, y: 0.35, w: 1.8, h: 0.4, fontSize: 14, color: COLORS.WHITE, bold: true });

    // [B] 주석 테이블 (스타일 적용 수정)
    const tableRows: any[] = [[
      { text: "No", options: { fill: COLORS.KYOBO_GREEN, color: COLORS.WHITE, bold: true, align: 'center', w: 0.4 } },
      { text: "화면 설명", options: { fill: COLORS.KYOBO_GREEN, color: COLORS.WHITE, bold: true, align: 'center', w: SIDEBAR_W - 0.4 } }
    ]];

    slideData.annotations.forEach(ann => {
      const noteObjects = parseHtmlToTextObjects(ann.note || '');
      tableRows.push([
        { text: ann.number.toString(), options: { align: 'center', valign: 'middle', fill: COLORS.WHITE } },
        { text: noteObjects.length ? noteObjects : "", options: { align: 'left', valign: 'top', fill: COLORS.WHITE, margin: 0.05 } }
      ]);
    });

    if (slideData.annotations.length > 0) {
      slide.addTable(tableRows, {
        x: SIDEBAR_X + 0.1, y: SIDEBAR_Y + 0.1, w: SIDEBAR_W - 0.2,
        colW: [0.4, SIDEBAR_W - 0.6],
        border: { type: 'solid', pt: 1, color: COLORS.BORDER_GRAY },
        fontFace: 'Malgun Gothic'
      });
    }

    // [C] 이미지 및 마커 좌표 (정밀 보정)
    const canvasRatio = VIRTUAL_WIDTH / VIRTUAL_HEIGHT;
    let canvasPPTW = IMG_AREA_W;
    let canvasPPTH = canvasPPTW / canvasRatio;

    if (canvasPPTH > IMG_AREA_H) {
      canvasPPTH = IMG_AREA_H;
      canvasPPTW = canvasPPTH * canvasRatio;
    }

    const canvasPPTX = IMG_AREA_X + (IMG_AREA_W - canvasPPTW) / 2;
    const canvasPPTY = IMG_AREA_Y + (IMG_AREA_H - canvasPPTH) / 2;

    if (slideData.imageUrl) {
      const dims = await getImageDimensions(slideData.imageUrl);
      const imgRatio = dims.w / dims.h;
      let displayW, displayH;
      
      if (imgRatio > canvasRatio) {
        displayW = VIRTUAL_WIDTH;
        displayH = VIRTUAL_WIDTH / imgRatio;
      } else {
        displayH = VIRTUAL_HEIGHT;
        displayW = VIRTUAL_HEIGHT * imgRatio;
      }

      const displayX_in_Canvas = (VIRTUAL_WIDTH - displayW) / 2;
      const displayY_in_Canvas = (VIRTUAL_HEIGHT - displayH) / 2;
      const finalImgX = canvasPPTX + (displayX_in_Canvas / VIRTUAL_WIDTH) * canvasPPTW;
      const finalImgY = canvasPPTY + (displayY_in_Canvas / VIRTUAL_HEIGHT) * canvasPPTH;
      const finalImgW = (displayW / VIRTUAL_WIDTH) * canvasPPTW;
      const finalImgH = (displayH / VIRTUAL_HEIGHT) * canvasPPTH;

      slide.addImage({ data: slideData.imageUrl, x: finalImgX, y: finalImgY, w: finalImgW, h: finalImgH });

      // 마커 좌표 정밀 보정
      slideData.annotations.forEach((ann) => {
        const markerSizeInch = 0.16; // 마커 크기 소폭 조정
        const ratioX = ann.x / VIRTUAL_WIDTH;
        const ratioY = ann.y / VIRTUAL_HEIGHT;
        
        // 화면과 PPT의 좌표 기준점을 일치시키기 위해 중심 오프셋 반영
        const pptX = canvasPPTX + (ratioX * canvasPPTW) - (markerSizeInch / 2);
        const pptY = canvasPPTY + (ratioY * canvasPPTH) - (markerSizeInch / 2);

        slide.addShape(pptx.ShapeType.ellipse, { 
          x: pptX, y: pptY, w: markerSizeInch, h: markerSizeInch, 
          fill: { color: ann.color.replace('#', '') }, 
          line: { color: COLORS.WHITE, width: 1 } 
        });
        
        slide.addText(ann.number.toString(), { 
          x: pptX, y: pptY, w: markerSizeInch, h: markerSizeInch, 
          align: 'center', valign: 'middle', fontSize: 7, bold: true, color: COLORS.WHITE 
        });
      });
    }
  }
  const fileName = `${slides[0]?.taskName.replace(/\s+/g, '_') || 'Manual'}.pptx`;
  await pptx.writeFile({ fileName });
};
