import pptxgen from 'pptxgenjs';
import { Slide, DocumentInfo } from '../StoryboardTool';

// 1280x720 캔버스 기준 (웹 좌표)
const VIRTUAL_WIDTH = 1280;
const VIRTUAL_HEIGHT = 720;

// 교보문고 스타일 컬러 팔레트
const COLORS = {
  KYOBO_GREEN: '3F8C48',    
  KYOBO_LIGHT_BG: 'F7F8FA', 
  KYOBO_DARK_TEXT: '333333',
  BORDER_GRAY: 'E5E7EB',   
  WHITE: 'FFFFFF',          
  HEADER_LABEL: 'A8D5AC',
  NOTE_BG: 'FFF8E1'
};

const getImageDimensions = (src: string): Promise<{ w: number; h: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.width, h: img.height });
    img.onerror = () => resolve({ w: VIRTUAL_WIDTH, h: VIRTUAL_HEIGHT }); 
    img.src = src;
  });
};

const rgbToHex = (color: string): string | undefined => {
  if (!color) return undefined;
  if (color.startsWith('#')) return color.replace('#', '');
  const result = color.match(/\d+/g);
  if (result && result.length >= 3) {
    return ((1 << 24) + (parseInt(result[0]) << 16) + (parseInt(result[1]) << 8) + parseInt(result[2])).toString(16).slice(1).toUpperCase();
  }
  return undefined;
};

const parseHtmlToPptxText = (html: string) => {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  const textItems: any[] = [];
  const traverse = (node: Node, currentStyle: any) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (text) textItems.push({ text: text, options: { ...currentStyle } });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const newStyle = { ...currentStyle };
      if (el.tagName === 'B' || Number(el.style.fontWeight) >= 700) newStyle.bold = true;
      if (el.tagName === 'BR') textItems.push({ text: '', options: { breakLine: true } });
      if ((el.tagName === 'DIV' || el.tagName === 'P') && textItems.length > 0) {
         if (!textItems[textItems.length - 1].options?.breakLine) textItems.push({ text: '', options: { breakLine: true } });
      }
      el.childNodes.forEach(child => traverse(child, newStyle));
    }
  };
  traverse(div, {});
  return textItems.length === 0 ? "" : textItems;
};

export const exportToPowerPoint = async (slides: Slide[], docInfo: DocumentInfo): Promise<Blob> => {
  const pptx = new pptxgen();

  const PPT_WIDTH = 10;
  const PPT_HEIGHT = 5.625;
  const HEADER_H = 0.9; 
  const SIDEBAR_W = 3.0; 

  pptx.defineLayout({ name: 'KYOBO_STYLE', width: PPT_WIDTH, height: PPT_HEIGHT });
  pptx.layout = 'KYOBO_STYLE';
  
  pptx.title = 'Manual Document'; 
  pptx.author = docInfo.author;

  // 📌 [수정] 목차 생성 로직 제거됨 (사용자 요청)

  for (const slideData of slides) {
    const slide = pptx.addSlide();

    // 1. NOTE 타입 슬라이드 (간지/챕터)
    if (slideData.type === 'NOTE') {
      slide.background = { color: COLORS.NOTE_BG };
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.3, h: PPT_HEIGHT, fill: { color: COLORS.KYOBO_GREEN } });
      
      slide.addText(slideData.title || '제목 없음', {
        x: 1.0, y: 2.0, w: 8.0, h: 1.0,
        fontSize: 32, bold: true, color: COLORS.KYOBO_DARK_TEXT
      });
      slide.addText(slideData.description || '', {
        x: 1.0, y: 3.2, w: 8.0, h: 1.5,
        fontSize: 16, color: '555555', valign: 'top'
      });
    } 
    // 2. IMAGE 타입 슬라이드 (일반 화면)
    else {
      // 상단 헤더
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: PPT_WIDTH, h: HEADER_H, fill: { color: COLORS.KYOBO_GREEN } });

      slide.addText("업무", { x: 0.2, y: 0.1, w: 3.5, h: 0.2, fontSize: 8, color: COLORS.HEADER_LABEL, bold: true });
      slide.addText(slideData.taskName || '-', { x: 0.2, y: 0.35, w: 3.5, h: 0.4, fontSize: 14, color: COLORS.WHITE, bold: true, valign: 'top' });

      slide.addText("화면명", { x: 4.0, y: 0.1, w: 3.5, h: 0.2, fontSize: 8, color: COLORS.HEADER_LABEL, bold: true });
      slide.addText(slideData.screenName || '-', { x: 4.0, y: 0.35, w: 3.5, h: 0.4, fontSize: 14, color: COLORS.WHITE, bold: true, valign: 'top' });

      slide.addText("작성자", { x: 8.0, y: 0.1, w: 1.8, h: 0.2, fontSize: 8, color: COLORS.HEADER_LABEL, bold: true });
      slide.addText(docInfo.author || '-', { x: 8.0, y: 0.35, w: 1.8, h: 0.4, fontSize: 14, color: COLORS.WHITE, bold: true, valign: 'top' });

      // 구분선
      slide.addShape(pptx.ShapeType.line, { x: 3.8, y: 0.15, w: 0, h: 0.6, line: { color: COLORS.HEADER_LABEL, width: 0.5, transparency: 50 } });
      slide.addShape(pptx.ShapeType.line, { x: 7.8, y: 0.15, w: 0, h: 0.6, line: { color: COLORS.HEADER_LABEL, width: 0.5, transparency: 50 } });

      // 우측 설명 영역
      const SIDEBAR_X = PPT_WIDTH - SIDEBAR_W;
      const SIDEBAR_Y = HEADER_H;
      const SIDEBAR_H = PPT_HEIGHT - HEADER_H;

      slide.addShape(pptx.ShapeType.rect, {
        x: SIDEBAR_X, y: SIDEBAR_Y, w: SIDEBAR_W, h: SIDEBAR_H,
        fill: { color: COLORS.KYOBO_LIGHT_BG },
        line: { color: COLORS.BORDER_GRAY, width: 1 }
      });

      const tableRows: pptxgen.TableRow[] = [
        [
          { text: "No", options: { fill: COLORS.KYOBO_GREEN, color: COLORS.WHITE, bold: true, align: 'center', w: 0.4, border: { color: COLORS.WHITE, pt: 1 } } },
          { text: "화면 설명", options: { fill: COLORS.KYOBO_GREEN, color: COLORS.WHITE, bold: true, align: 'center', w: SIDEBAR_W - 0.4, border: { color: COLORS.WHITE, pt: 1 } } }
        ]
      ];

      if (slideData.annotations && slideData.annotations.length > 0) {
        slideData.annotations.forEach(ann => {
          const richText = parseHtmlToPptxText(ann.note || '');
          tableRows.push([
            { text: ann.number.toString(), options: { align: 'center', valign: 'middle', fontSize: 8, fill: COLORS.WHITE, color: COLORS.KYOBO_DARK_TEXT } },
            { text: richText, options: { align: 'left', valign: 'top', fontSize: 8, fill: COLORS.WHITE, color: COLORS.KYOBO_DARK_TEXT, margin: 0.05 } }
          ]);
        });
        slide.addTable(tableRows, { x: SIDEBAR_X + 0.1, y: SIDEBAR_Y + 0.1, w: SIDEBAR_W - 0.2, colW: [0.4, SIDEBAR_W - 0.6], border: { type: 'solid', pt: 1, color: COLORS.BORDER_GRAY }, fontSize: 8, fontFace: 'Malgun Gothic' });
      } else {
        slide.addText("등록된 주석이 없습니다.", { x: SIDEBAR_X, y: SIDEBAR_Y + 1, w: SIDEBAR_W, h: 1, align: 'center', color: '888888', fontSize: 10 });
      }

      // 이미지 및 마커
      if (slideData.imageUrl) {
        const IMG_AREA_W = PPT_WIDTH - SIDEBAR_W;
        const IMG_AREA_H = PPT_HEIGHT - HEADER_H;
        
        const dims = await getImageDimensions(slideData.imageUrl);
        const imgRatio = dims.w / dims.h;
        const areaRatio = IMG_AREA_W / IMG_AREA_H;
        
        let w = IMG_AREA_W, h = IMG_AREA_H, x = 0, y = HEADER_H;
        
        if (imgRatio > areaRatio) {
            h = IMG_AREA_W / imgRatio;
            y = HEADER_H + (IMG_AREA_H - h) / 2;
        } else {
            w = IMG_AREA_H * imgRatio;
            x = (IMG_AREA_W - w) / 2;
        }
        
        slide.addImage({ data: slideData.imageUrl, x, y, w, h });

        const V_W = 1280, V_H = 720;
        let webW = V_W, webH = V_H, webX = 0, webY = 0;
        if (imgRatio > V_W/V_H) { webH = V_W / imgRatio; webY = (V_H - webH)/2; }
        else { webW = V_H * imgRatio; webX = (V_W - webW)/2; }

        if (slideData.annotations) {
          slideData.annotations.forEach(ann => {
             const normX = (ann.x - webX) / webW;
             const normY = (ann.y - webY) / webH;
             const pptMarkerX = x + normX * w - 0.075;
             const pptMarkerY = y + normY * h - 0.075;
             
             slide.addShape(pptx.ShapeType.ellipse, { x: pptMarkerX, y: pptMarkerY, w: 0.15, h: 0.15, fill: { color: ann.color.replace('#','') }, line: { color: COLORS.WHITE, width: 1 } });
             slide.addText(ann.number.toString(), { x: pptMarkerX, y: pptMarkerY, w: 0.15, h: 0.15, align: 'center', valign: 'middle', fontSize: 7, bold: true, color: COLORS.WHITE });
          });
        }
      }
    }
  }

  // 📌 [수정] 파일 생성 방식을 기존(blob string)으로 롤백하여 호환성 확보
  return await pptx.write("blob") as Promise<Blob>;
};