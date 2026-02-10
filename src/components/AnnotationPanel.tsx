import React from 'react';
import { Annotation } from '../StoryboardTool';
import { Trash2, Type, Palette, Bold, Italic, Underline } from 'lucide-react';

interface AnnotationPanelProps {
  annotations: Annotation[];
  onAddAnnotation: () => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation: (id: string) => void;
}

const TEXT_COLORS = ['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ffffff'];

export function AnnotationPanel({
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
}: AnnotationPanelProps) {
  
  // 텍스트 스타일 적용 함수 (execCommand 사용)
  const applyStyle = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="font-semibold text-gray-700">Annotations</h2>
        <button
          onClick={onAddAnnotation}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1 transition-colors shadow-sm"
        >
          <Type className="size-4" />
          Add Note
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
        {annotations.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">No annotations yet.</div>
        ) : (
          annotations.map((ann) => (
            <div
              key={ann.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: ann.color }}
                  >
                    {ann.number}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={ann.color}
                    onChange={(e) => onUpdateAnnotation(ann.id, { color: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer border-none p-0 bg-transparent"
                  />
                  <button
                    onClick={() => onDeleteAnnotation(ann.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded overflow-hidden">
                {/* 툴바 영역 */}
                <div className="flex items-center gap-1 p-1 bg-gray-100 border-b border-gray-200 overflow-x-auto">
                  {/* 스타일 버튼 그룹 */}
                  <div className="flex items-center border-r border-gray-300 pr-2 mr-2 gap-1">
                    <button
                      onMouseDown={(e) => { e.preventDefault(); applyStyle('bold'); }}
                      className="p-1 hover:bg-gray-200 rounded text-gray-700"
                      title="Bold"
                    >
                      <Bold className="size-3.5" />
                    </button>
                    <button
                      onMouseDown={(e) => { e.preventDefault(); applyStyle('italic'); }}
                      className="p-1 hover:bg-gray-200 rounded text-gray-700"
                      title="Italic"
                    >
                      <Italic className="size-3.5" />
                    </button>
                    <button
                      onMouseDown={(e) => { e.preventDefault(); applyStyle('underline'); }}
                      className="p-1 hover:bg-gray-200 rounded text-gray-700"
                      title="Underline"
                    >
                      <Underline className="size-3.5" />
                    </button>
                  </div>

                  {/* 색상 팔레트 */}
                  <Palette className="size-3 text-gray-400 mr-1 shrink-0" />
                  <div className="flex gap-1">
                    {TEXT_COLORS.map((color) => (
                      <button
                        key={color}
                        onMouseDown={(e) => { e.preventDefault(); applyStyle('foreColor', color); }}
                        className="w-4 h-4 rounded-full border border-gray-300 hover:scale-110 transition-transform shrink-0"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* 에디터 영역 */}
                <div
                  className="p-2 min-h-[60px] text-sm focus:outline-none focus:bg-blue-50/10"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateAnnotation(ann.id, { note: e.currentTarget.innerHTML })}
                  dangerouslySetInnerHTML={{ __html: ann.note || '' }}
                  style={{ whiteSpace: 'pre-wrap', color: '#374151', lineHeight: '1.5' }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 text-right">Select text to apply style</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}