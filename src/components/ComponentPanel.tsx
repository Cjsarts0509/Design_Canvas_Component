import { Type, Square, CheckSquare, Circle, Image, Upload, Table, Minus } from 'lucide-react';
import { DesignElement } from '../StoryboardTool';

interface ComponentPanelProps {
  onAddElement: (type: DesignElement['type']) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ComponentPanel({ onAddElement, onImageUpload }: ComponentPanelProps) {
  const components = [
    { type: 'button' as const, icon: Square, label: 'Button' },
    { type: 'input' as const, icon: Square, label: 'Input' },
    { type: 'heading' as const, icon: Type, label: 'Heading' },
    { type: 'text' as const, icon: Type, label: 'Text' },
    { type: 'container' as const, icon: Square, label: 'Container' },
    { type: 'checkbox' as const, icon: CheckSquare, label: 'Checkbox' },
    { type: 'radio' as const, icon: Circle, label: 'Radio' },
    { type: 'image' as const, icon: Image, label: 'Image' },
    { type: 'table' as const, icon: Table, label: 'Table' },
    { type: 'line' as const, icon: Minus, label: 'Line' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-300 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-gray-900 mb-4">Components</h2>
        <div className="space-y-2">
          {components.map((component) => (
            <button
              key={component.type}
              onClick={() => onAddElement(component.type)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded flex items-center gap-3 transition-colors"
            >
              <component.icon className="size-5 text-gray-600" />
              <span className="text-sm text-gray-900">{component.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <h3 className="text-sm text-gray-900 mb-3">Background Image</h3>
          <label className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded flex items-center gap-3 cursor-pointer transition-colors">
            <Upload className="size-5 text-gray-600" />
            <span className="text-sm text-gray-900">Upload Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}