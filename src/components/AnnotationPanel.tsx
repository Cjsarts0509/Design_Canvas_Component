import React, { useRef } from 'react';
import { Annotation } from '../StoryboardTool';
import { Trash2, Type, Palette, Bold, Italic, Underline, GripVertical } from 'lucide-react';
import { useDrag, useDrop } from 'react-dnd';

interface AnnotationPanelProps {
  annotations: Annotation[];
  onAddAnnotation: () => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  onMoveAnnotation: (dragIndex: number, hoverIndex: number) => void;
}

const TEXT_COLORS = ['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ffffff'];
const ITEM_TYPE = 'ANNOTATION';

interface DraggableAnnotationProps {
    annotation: Annotation;
    index: number;
    moveAnnotation: (dragIndex: number, hoverIndex: number) => void;
    onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
    onDeleteAnnotation: (id: string) => void;
    applyStyle: (command: string, value?: string) => void;
}

const DraggableAnnotation = ({
    annotation,
    index,
    moveAnnotation,
    onUpdateAnnotation,
    onDeleteAnnotation,
    applyStyle
}: DraggableAnnotationProps) => {
    const ref = useRef<HTMLDivElement>(null);

    const [{ handlerId }, drop] = useDrop({
        accept: ITEM_TYPE,
        collect(monitor) {
            return {
                handlerId: monitor.getHandlerId(),
            };
        },
        hover(item: any, monitor) {
            if (!ref.current) {
                return;
            }
            const dragIndex = item.index;
            const hoverIndex = index;

            // Don't replace items with themselves
            if (dragIndex === hoverIndex) {
                return;
            }

            // Determine rectangle on screen
            const hoverBoundingRect = ref.current?.getBoundingClientRect();

            // Get vertical middle
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

            // Determine mouse position
            const clientOffset = monitor.getClientOffset();

            // Get pixels to the top
            const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

            // Only perform the move when the mouse has crossed half of the items height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%

            // Dragging downwards
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }

            // Dragging upwards
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }

            // Time to actually perform the action
            moveAnnotation(dragIndex, hoverIndex);

            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag] = useDrag({
        type: ITEM_TYPE,
        item: () => {
            return { id: annotation.id, index };
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const opacity = isDragging ? 0 : 1;
    drag(drop(ref));

    return (
        <div
            ref={ref}
            style={{ opacity }}
            data-handler-id={handlerId}
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 transition-all hover:shadow-md mb-4"
        >
            <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                <div className="cursor-move text-gray-400 hover:text-gray-600">
                   <GripVertical className="size-4" />
                </div>
                <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: annotation.color }}
                >
                {annotation.number}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <input
                type="color"
                value={annotation.color}
                onChange={(e) => onUpdateAnnotation(annotation.id, { color: e.target.value })}
                className="w-5 h-5 rounded cursor-pointer border-none p-0 bg-transparent"
                />
                <button
                onClick={() => onDeleteAnnotation(annotation.id)}
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
                onBlur={(e) => onUpdateAnnotation(annotation.id, { note: e.currentTarget.innerHTML })}
                dangerouslySetInnerHTML={{ __html: annotation.note || '' }}
                style={{ whiteSpace: 'pre-wrap', color: '#374151', lineHeight: '1.5' }}
            />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 text-right">Select text to apply style</p>
        </div>
    );
};

export function AnnotationPanel({
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onMoveAnnotation
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

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {annotations.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">No annotations yet.</div>
        ) : (
          annotations.map((ann, index) => (
            <DraggableAnnotation
                key={ann.id}
                index={index}
                annotation={ann}
                moveAnnotation={onMoveAnnotation}
                onUpdateAnnotation={onUpdateAnnotation}
                onDeleteAnnotation={onDeleteAnnotation}
                applyStyle={applyStyle}
            />
          ))
        )}
      </div>
    </div>
  );
}