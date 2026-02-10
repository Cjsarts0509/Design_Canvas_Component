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
    img.src = src;
  });
};

// HTML 태그를 줄바꿈 문자(\n)로 변환하여 텍스트 추출
const stripHtml = (html: string) => {
   if (!html) return "";

   // 1. 줄바꿈 태그(<br>, </div>, </p>)를 강제로 개행문자(\n)로 치환
   let processed = html.replace(/<br\s*\/?>/gi, '\n'); 
   processed = processed.replace(/<\/div>/gi, '\n');
   processed = processed.replace(/<\/p>/gi, '\n');

   // 2. 나머지 HTML 태그 제거
   const tmp = document.createElement("DIV");
   tmp.innerHTML = processed;
   let text = tmp.textContent || tmp.innerText || "";
   
   // 3. 양쪽 공백 제거
   return text.trim();
};

// 📌 [수정됨] 반환 타입이 Promise<void>에서 Promise<Blob>으로 변경되었습니다.
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
      const cleanNote = stripHtml(ann.note || '');
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
          text: cleanNote, 
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
    // [C] 좌측 이미지 영역
    // =======================================================
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
    }

    // =======================================================
    // [D] 이미지 위 마커 찍기 (60% 축소 적용)
    // =======================================================
    slideData.annotations.forEach((ann) => {
      // 마커 크기 축소 (0.25 -> 0.15) 약 60%
      const markerSizeInch = 0.15;
      
      const ratioX = ann.x / VIRTUAL_WIDTH;
      const ratioY = ann.y / VIRTUAL_HEIGHT;
      // 이미지 렌더링 영역 기준 상대 좌표 계산
      const pptX = renderX + (ratioX * renderW) - (markerSizeInch / 2); // 📌 마커 중심 보정
      const pptY = renderY + (ratioY * renderH) - (markerSizeInch / 2); // 📌 마커 중심 보정

      if (slideData.imageUrl) {
        // 마커 원
        slide.addShape(pptx.ShapeType.ellipse, { 
          x: pptX, y: pptY, w: markerSizeInch, h: markerSizeInch, 
          fill: { color: ann.color.replace('#', '') }, 
          line: { color: COLORS.WHITE, width: 1.5 } 
        });
        
        // 마커 숫자 (글자 크기도 10 -> 7로 축소)
        slide.addText(ann.number.toString(), { 
          x: pptX, y: pptY, w: markerSizeInch, h: markerSizeInch, 
          align: 'center', valign: 'middle', 
          fontSize: 7, 
          bold: true, color: COLORS.WHITE 
        });
      }
    });
  }

  // 📌 [수정됨] 파일 저장이 아니라 Blob 데이터를 반환하도록 변경
  // const fileName = `${slides[0]?.taskName.replace(/\s+/g, '_') || 'Manual'}.pptx`;
  // await pptx.writeFile({ fileName });
  
  return await pptx.write("blob") as Promise<Blob>;
};