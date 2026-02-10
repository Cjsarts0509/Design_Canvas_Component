import React from 'react';
import { Slide } from '../StoryboardTool';
import { Plus, Trash2, Upload, X, StickyNote, Image as ImageIcon } from 'lucide-react';

interface SlidePanelProps {
  slides: Slide[];
  currentSlideId: string;
  onAddSlide: (type: 'IMAGE' | 'NOTE') => void;
  onSelectSlide: (id: string) => void;
  onDeleteSlide: (id: string) => void;
  onUpdateSlideName: (id: string, name: string) => void;
  onImageUpload: (slideId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (slideId: string) => void;
}

export default function SlidePanel({
  slides = [],
  currentSlideId,
  onAddSlide,
  onSelectSlide,
  onDeleteSlide,
  onImageUpload,
  onRemoveImage,
}: SlidePanelProps) {
  
  if (!slides) return <div className="p-4 text-gray-500 text-sm">로딩 중...</div>;

  return (
    <div className="w-56 bg-white border-r border-gray-300 flex flex-col h-full shrink-0 transition-all duration-300">
      {/* 상단: 추가 버튼 영역 */}
      <div className="p-3 border-b border-gray-200">
        <h2 className="font-semibold text-gray-700 text-sm mb-2">슬라이드 목록</h2>
        <div className="flex gap-1">
          <button
            onClick={() => onAddSlide('IMAGE')}
            className="flex-1 flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded py-1.5 text-xs font-medium transition-colors"
            title="화면 슬라이드 추가"
          >
            <ImageIcon className="size-3" />
            <span>화면</span>
          </button>
          <button
            onClick={() => onAddSlide('NOTE')}
            className="flex-1 flex items-center justify-center gap-1 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded py-1.5 text-xs font-medium transition-colors"
            title="주석(챕터) 슬라이드 추가"
          >
            <StickyNote className="size-3" />
            <span>주석</span>
          </button>
        </div>
      </div>

      {/* 리스트 영역 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {slides.map((slide, index) => {
          const isSelected = currentSlideId === slide.id;
          const isNote = slide.type === 'NOTE';

          return (
            <div
              key={slide.id}
              onClick={() => onSelectSlide(slide.id)}
              className={`
                relative group rounded-lg border-2 cursor-pointer transition-all
                ${isSelected 
                  ? (isNote ? 'border-orange-400 bg-orange-50' : 'border-blue-500 bg-blue-50') 
                  : 'border-gray-200 hover:border-gray-300 bg-white'}
                ${isNote ? 'p-3' : 'p-2'} 
              `}
            >
              {/* 1. NOTE 타입: 라벨과 제목을 위아래(flex-col)로 배치 */}
              {isNote ? (
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col gap-1 overflow-hidden flex-1">
                     {/* 상단: NOTE 아이콘 및 라벨 */}
                     <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-orange-600">
                        <StickyNote className="size-3" />
                        NOTE
                     </span>
                     {/* 하단: 제목 (최대 두 줄) */}
                     <span className="text-xs text-gray-700 font-medium leading-snug break-all line-clamp-2">
                        {slide.title || '새로운 챕터/주석'}
                     </span>
                  </div>
                  
                  {/* 삭제 버튼 */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSlide(slide.id); }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 text-red-500 rounded transition-all"
                    title="삭제"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : (
                // 2. IMAGE 타입: 기존 유지
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteSlide(slide.id); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 text-red-500 rounded transition-all"
                      title="삭제"
                    >
                      <X className="size-3" />
                    </button>
                  </div>

                  <div className="aspect-video bg-white rounded border border-gray-200 mb-2 overflow-hidden flex items-center justify-center relative shadow-sm">
                    {slide.imageUrl ? (
                      <img src={slide.imageUrl} alt="Slide content" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-[10px] text-gray-300 text-center px-1 select-none leading-tight">이미지 없음</div>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <label className="flex-1 cursor-pointer bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-[10px] py-1 rounded flex items-center justify-center gap-1 transition-colors">
                      <Upload className="size-3" />
                      <span>이미지</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => onImageUpload(slide.id, e)} />
                    </label>
                    {slide.imageUrl && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveImage(slide.id); }}
                        className="flex-1 border bg-white border-red-200 text-red-600 hover:bg-red-50 text-[10px] py-1 rounded flex items-center justify-center gap-1 transition-colors"
                      >
                        <Trash2 className="size-3" />
                        <span>삭제</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}