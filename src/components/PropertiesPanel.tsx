import { Trash2, Upload, AlignLeft, AlignCenter, AlignRight, Plus, Minus } from 'lucide-react';
import { DesignElement } from '../StoryboardTool';
import { useState } from 'react';

// 20 popular colors palette
const COLOR_PALETTE = [
  '#FFFFFF', '#F5F5F5', '#D1D5DB', '#9CA3AF', '#6B7280', '#374151', '#1F2937', '#000000',
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#14B8A6', '#0EA5E9', '#3B82F6',
  '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E'
];

interface PropertiesPanelProps {
  selectedElement: DesignElement | undefined;
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void;
  onDeleteElement: () => void;
}

export function PropertiesPanel({ selectedElement, onUpdateElement, onDeleteElement }: PropertiesPanelProps) {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  if (!selectedElement) {
    return (
      <div className="p-4 border-b border-gray-300">
        <h2 className="text-gray-900 mb-2">Properties</h2>
        <p className="text-sm text-gray-500">Select an element to edit its properties</p>
      </div>
    );
  }

  const handleStyleUpdate = (styleUpdates: Partial<DesignElement['style']>) => {
    onUpdateElement(selectedElement.id, {
      style: { ...selectedElement.style, ...styleUpdates },
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateElement(selectedElement.id, { imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Table functions
  const handleAddRow = () => {
    if (selectedElement.type === 'table' && selectedElement.tableData) {
      const newRow = Array(selectedElement.tableData.cols).fill('Cell');
      const newCells = [...selectedElement.tableData.cells, newRow];
      onUpdateElement(selectedElement.id, {
        tableData: {
          ...selectedElement.tableData,
          rows: selectedElement.tableData.rows + 1,
          cells: newCells,
        },
      });
    }
  };

  const handleRemoveRow = () => {
    if (selectedElement.type === 'table' && selectedElement.tableData && selectedElement.tableData.rows > 1) {
      const newCells = selectedElement.tableData.cells.slice(0, -1);
      onUpdateElement(selectedElement.id, {
        tableData: {
          ...selectedElement.tableData,
          rows: selectedElement.tableData.rows - 1,
          cells: newCells,
        },
      });
    }
  };

  const handleAddColumn = () => {
    if (selectedElement.type === 'table' && selectedElement.tableData) {
      const newCells = selectedElement.tableData.cells.map(row => [...row, 'Cell']);
      onUpdateElement(selectedElement.id, {
        tableData: {
          ...selectedElement.tableData,
          cols: selectedElement.tableData.cols + 1,
          cells: newCells,
        },
      });
    }
  };

  const handleRemoveColumn = () => {
    if (selectedElement.type === 'table' && selectedElement.tableData && selectedElement.tableData.cols > 1) {
      const newCells = selectedElement.tableData.cells.map(row => row.slice(0, -1));
      onUpdateElement(selectedElement.id, {
        tableData: {
          ...selectedElement.tableData,
          cols: selectedElement.tableData.cols - 1,
          cells: newCells,
        },
      });
    }
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    if (selectedElement.type === 'table' && selectedElement.tableData) {
      const newCells = selectedElement.tableData.cells.map((r, rowIdx) =>
        rowIdx === row ? r.map((c, colIdx) => (colIdx === col ? value : c)) : r
      );
      onUpdateElement(selectedElement.id, {
        tableData: {
          ...selectedElement.tableData,
          cells: newCells,
        },
      });
    }
  };

  return (
    <div className="p-4 border-b border-gray-300 overflow-y-auto max-h-[50vh]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900">Properties</h2>
        <button
          onClick={onDeleteElement}
          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Delete element"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Content */}
        {(selectedElement.type === 'button' || selectedElement.type === 'heading' || selectedElement.type === 'text' || selectedElement.type === 'input') && (
          <div>
            <label className="block text-sm text-gray-700 mb-1">Content</label>
            <input
              type="text"
              value={selectedElement.content || ''}
              onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
        )}

        {/* Table Editor */}
        {selectedElement.type === 'table' && selectedElement.tableData && (
          <div>
            <label className="block text-sm text-gray-700 mb-2">Table Content</label>
            <div className="mb-2 flex gap-2">
              <button
                onClick={handleAddRow}
                className="flex-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded text-xs flex items-center justify-center gap-1"
              >
                <Plus className="size-3" />
                Row
              </button>
              <button
                onClick={handleRemoveRow}
                disabled={selectedElement.tableData.rows <= 1}
                className="flex-1 px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-300 rounded text-xs flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="size-3" />
                Row
              </button>
              <button
                onClick={handleAddColumn}
                className="flex-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded text-xs flex items-center justify-center gap-1"
              >
                <Plus className="size-3" />
                Col
              </button>
              <button
                onClick={handleRemoveColumn}
                disabled={selectedElement.tableData.cols <= 1}
                className="flex-1 px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-300 rounded text-xs flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="size-3" />
                Col
              </button>
            </div>
            <div className="max-h-40 overflow-auto border border-gray-300 rounded">
              <table className="w-full text-xs">
                <tbody>
                  {selectedElement.tableData.cells.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((cell, colIdx) => (
                        <td key={colIdx} className="border border-gray-300 p-0">
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                            className="w-full px-1 py-0.5 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            onFocus={() => setSelectedCell({ row: rowIdx, col: colIdx })}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Image Upload for Image Components */}
        {selectedElement.type === 'image' && (
          <div>
            <label className="block text-sm text-gray-700 mb-2">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded text-sm cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Upload className="size-4" />
              {selectedElement.imageUrl ? 'Change Image' : 'Select Image'}
            </label>
            {selectedElement.imageUrl && (
              <div className="mt-2">
                <img
                  src={selectedElement.imageUrl}
                  alt="Preview"
                  className="w-full h-24 object-contain border border-gray-300 rounded"
                />
              </div>
            )}
          </div>
        )}

        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-gray-700 mb-1">X</label>
            <input
              type="number"
              value={selectedElement.x}
              onChange={(e) => onUpdateElement(selectedElement.id, { x: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Y</label>
            <input
              type="number"
              value={selectedElement.y}
              onChange={(e) => onUpdateElement(selectedElement.id, { y: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        {/* Size */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Width</label>
            <input
              type="number"
              value={selectedElement.width}
              onChange={(e) => onUpdateElement(selectedElement.id, { width: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Height</label>
            <input
              type="number"
              value={selectedElement.height}
              onChange={(e) => onUpdateElement(selectedElement.id, { height: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        {/* Font Size - for text-based elements */}
        {(selectedElement.type === 'button' || selectedElement.type === 'heading' || selectedElement.type === 'text' || selectedElement.type === 'input' || selectedElement.type === 'table') && (
          <div>
            <label className="block text-sm text-gray-700 mb-1">Font Size</label>
            <input
              type="text"
              value={selectedElement.style?.fontSize || '9pt'}
              onChange={(e) => handleStyleUpdate({ fontSize: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              placeholder="e.g., 9pt, 12pt"
            />
          </div>
        )}

        {/* Text Alignment - for text-based elements */}
        {(selectedElement.type === 'button' || selectedElement.type === 'heading' || selectedElement.type === 'text' || selectedElement.type === 'input' || selectedElement.type === 'table') && (
          <div>
            <label className="block text-sm text-gray-700 mb-1">Text Align</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleStyleUpdate({ textAlign: 'left' })}
                className={`flex-1 px-3 py-2 border rounded flex items-center justify-center ${
                  selectedElement.style?.textAlign === 'left' ? 'bg-blue-100 border-blue-500' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <AlignLeft className="size-4" />
              </button>
              <button
                onClick={() => handleStyleUpdate({ textAlign: 'center' })}
                className={`flex-1 px-3 py-2 border rounded flex items-center justify-center ${
                  selectedElement.style?.textAlign === 'center' ? 'bg-blue-100 border-blue-500' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <AlignCenter className="size-4" />
              </button>
              <button
                onClick={() => handleStyleUpdate({ textAlign: 'right' })}
                className={`flex-1 px-3 py-2 border rounded flex items-center justify-center ${
                  selectedElement.style?.textAlign === 'right' ? 'bg-blue-100 border-blue-500' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <AlignRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Line Width - for line elements */}
        {selectedElement.type === 'line' && (
          <div>
            <label className="block text-sm text-gray-700 mb-1">Line Width</label>
            <input
              type="number"
              value={selectedElement.style?.lineWidth || 2}
              onChange={(e) => handleStyleUpdate({ lineWidth: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              min="1"
              max="20"
            />
          </div>
        )}

        {/* Background Color */}
        {selectedElement.type !== 'text' && selectedElement.type !== 'heading' && selectedElement.type !== 'line' && (
          <div>
            <label className="block text-sm text-gray-700 mb-1">Background</label>
            <div className="grid grid-cols-10 gap-1">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  onClick={() => handleStyleUpdate({ backgroundColor: color })}
                  className={`w-full h-5 rounded border transition-all hover:scale-110 ${
                    selectedElement.style?.backgroundColor === color
                      ? 'border-blue-500 ring-1 ring-blue-500'
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Text Color */}
        {(selectedElement.type === 'button' || selectedElement.type === 'heading' || selectedElement.type === 'text' || selectedElement.type === 'table') && (
          <div>
            <label className="block text-sm text-gray-700 mb-1">Text Color</label>
            <div className="grid grid-cols-10 gap-1">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  onClick={() => handleStyleUpdate({ textColor: color })}
                  className={`w-full h-5 rounded border transition-all hover:scale-110 ${
                    selectedElement.style?.textColor === color
                      ? 'border-blue-500 ring-1 ring-blue-500'
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Border/Line Color */}
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            {selectedElement.type === 'line' ? 'Line Color' : 'Border Color'}
          </label>
          <div className="grid grid-cols-10 gap-1">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color}
                onClick={() => handleStyleUpdate({ borderColor: color })}
                className={`w-full h-5 rounded border transition-all hover:scale-110 ${
                  selectedElement.style?.borderColor === color
                    ? 'border-blue-500 ring-1 ring-blue-500'
                    : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
