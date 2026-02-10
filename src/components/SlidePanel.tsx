import React from 'react';
// 📌 상위 폴더의 StoryboardTool import
import { Slide } from '../StoryboardTool';
import { Plus, Trash2, Upload, X } from 'lucide-react';

interface SlidePanelProps {
  slides: Slide[];
  currentSlideId: string;
  onAddSlide: () => void;
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
  onUpdateSlideName,
  onImageUpload,
  onRemoveImage,
}: SlidePanelProps) {
  
  if (!slides) return <div className="p-4 text-gray-500 text-sm">로딩 중...</div>;

  return (
    <div className="w-48 bg-white border-r border-gray-300 flex flex-col h-full shrink-0 transition-all duration-300">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="font-semibold text-gray-700 text-sm">슬라이드 목록</h2>
        <button
          onClick={onAddSlide}
          className="p-1 hover:bg-gray-100 rounded text-gray-600 transition-colors"
          title="슬라이드 추가"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`
              relative group rounded-lg border-2 p-2 transition-all cursor-pointer
              ${currentSlideId === slide.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
            `}
            onClick={() => onSelectSlide(slide.id)}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteSlide(slide.id); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 text-red-500 rounded transition-all"
                title="슬라이드 삭제"
              >
                <X className="size-3" />
              </button>
            </div>

            <input
              type="text"
              value={slide.name}
              onChange={(e) => onUpdateSlideName(slide.id, e.target.value)}
              className="w-full text-xs mb-2 bg-transparent border-none focus:ring-0 p-0 font-medium text-gray-700"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="aspect-video bg-white rounded border border-gray-200 mb-2 overflow-hidden flex items-center justify-center relative shadow-sm">
              {slide.imageUrl ? (
                <img src={slide.imageUrl} alt="Slide content" className="w-full h-full object-contain" />
              ) : (
                <div className="text-[10px] text-gray-300 text-center px-1 select-none leading-tight">비어있음</div>
              )}
            </div>

            <div className="flex gap-1">
              <label className="flex-1 cursor-pointer bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-[10px] py-1 rounded flex items-center justify-center gap-1 transition-colors">
                <Upload className="size-3" />
                <span>변경</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onImageUpload(slide.id, e)} />
              </label>
              <button
                onClick={(e) => { e.stopPropagation(); if (slide.imageUrl) onRemoveImage(slide.id); }}
                className={`flex-1 border text-[10px] py-1 rounded flex items-center justify-center gap-1 transition-colors ${slide.imageUrl ? 'bg-white border-red-200 text-red-600 hover:bg-red-50 cursor-pointer' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'}`}
                disabled={!slide.imageUrl}
              >
                <Trash2 className="size-3" />
                <span>삭제</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}