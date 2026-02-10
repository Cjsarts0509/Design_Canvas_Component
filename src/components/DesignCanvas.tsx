import React, { useState, useRef } from 'react';
// 📌 상위 폴더의 StoryboardTool import
import { Annotation } from '../StoryboardTool';

interface DesignCanvasProps {
  designElements: any[];
  selectedElementId: string | null;
  onSelectElement: (id: string) => void;
  onUpdateElement: (id: string, updates: any) => void;
  annotations: Annotation[];
  onUpdateAnnotationPosition: (id: string, x: number, y: number) => void;
  imageUrl: string | null;
  scale: number;
  setScale: (scale: number) => void;
}

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

export function DesignCanvas({
  annotations,
  onUpdateAnnotationPosition,
  imageUrl,
  scale,
  setScale,
}: DesignCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // 화면 이동(Pan) 상태
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  
  // 마우스 좌표 저장 (드래그 계산용)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // 📌 마커 드래그 상태 (로컬에서만 움직임 처리)
  const [isDraggingMarker, setIsDraggingMarker] = useState(false);
  const [dragMarkerId, setDragMarkerId] = useState<string | null>(null);
  // 드래그 중인 마커의 임시 좌표 (저장 전 시각적 표시용)
  const [tempMarkerPos, setTempMarkerPos] = useState<{x: number, y: number} | null>(null);

  // 줌 기능 (Ctrl + Wheel)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const newScale = scale - e.deltaY * zoomSensitivity;
      setScale(Math.min(Math.max(0.1, newScale), 5));
    }
  };

  // 마우스 다운
  const handleMouseDown = (e: React.MouseEvent, markerId?: string) => {
    e.stopPropagation();

    if (markerId) {
      // 마커 드래그 시작
      setIsDraggingMarker(true);
      setDragMarkerId(markerId);
      
      // 현재 클릭한 마커의 초기 위치를 찾아서 임시 좌표로 설정
      const currentAnn = annotations.find(ann => ann.id === markerId);
      if (currentAnn) {
        setTempMarkerPos({ x: currentAnn.x, y: currentAnn.y });
      }
    } else {
      // 화면 이동(Pan) 시작
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  // 마우스 이동
  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. 화면 이동 (Pan)
    if (isPanning) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      setPan((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }

    // 2. 마커 드래그 (Drag Marker) - 📌 로컬 상태만 업데이트 (App.tsx 업데이트 X)
    if (isDraggingMarker && dragMarkerId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      
      const x = rawX / scale;
      const y = rawY / scale;

      // 화면 밖으로 나가지 않게 제한
      const boundedX = Math.min(Math.max(0, x), CANVAS_WIDTH);
      const boundedY = Math.min(Math.max(0, y), CANVAS_HEIGHT);

      // 📌 여기서 onUpdateAnnotationPosition을 호출하지 않고, 임시 좌표만 업데이트
      setTempMarkerPos({ x: boundedX, y: boundedY });
    }
  };

  // 마우스 업 (드래그 종료)
  const handleMouseUp = () => {
    // 📌 드래그가 끝났을 때만 실제 데이터 업데이트 (이때만 히스토리에 저장됨)
    if (isDraggingMarker && dragMarkerId && tempMarkerPos) {
        onUpdateAnnotationPosition(dragMarkerId, tempMarkerPos.x, tempMarkerPos.y);
    }

    // 상태 초기화
    setIsPanning(false);
    setIsDraggingMarker(false);
    setDragMarkerId(null);
    setTempMarkerPos(null);
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-full overflow-hidden relative bg-gray-200 ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      onWheel={handleWheel}
      onMouseDown={(e) => handleMouseDown(e)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        ref={canvasRef}
        className="absolute bg-white shadow-2xl select-none origin-center top-1/2 left-1/2"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transition: isPanning || isDraggingMarker ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        {/* 격자 배경 */}
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* 이미지 */}
        {imageUrl ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
            <img
              src={imageUrl}
              alt="Slide"
              className="w-full h-full object-contain pointer-events-none"
              draggable={false}
            />
          </div>
        ) : (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-gray-300 pointer-events-none">
            이미지를 붙여넣으세요 (Ctrl + V)
          </div>
        )}

        {/* 주석 마커 */}
        <div className="absolute inset-0 z-20">
          {annotations.map((ann) => {
            // 📌 현재 드래그 중인 마커라면, 실제 데이터(ann.x) 대신 임시 좌표(tempMarkerPos)를 사용
            const isDragging = dragMarkerId === ann.id && tempMarkerPos;
            const displayX = isDragging ? tempMarkerPos!.x : ann.x;
            const displayY = isDragging ? tempMarkerPos!.y : ann.y;

            return (
              <div
                key={ann.id}
                className="absolute flex items-start cursor-move group"
                style={{
                  left: displayX,
                  top: displayY,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isDragging ? 50 : 20, // 드래그 중인건 맨 위로
                  pointerEvents: isPanning ? 'none' : 'auto', // 팬 중일때는 마커 클릭 방지
                }}
                onMouseDown={(e) => handleMouseDown(e, ann.id)}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-white transition-transform hover:scale-110"
                  style={{ backgroundColor: ann.color }}
                >
                  {ann.number}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}