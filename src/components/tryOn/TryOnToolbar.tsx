import { Maximize2, RotateCw, FlipHorizontal, Trash2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface TryOnToolbarProps {
  opacity: number;
  onOpacityChange: (value: number) => void;
  onResize: () => void;
  onRotate: () => void;
  onFlip: () => void;
  onDelete: () => void;
  onLayer: () => void;
  disabled?: boolean;
}

const tools = [
  { id: 'resize', icon: Maximize2, label: 'Kích thước' },
  { id: 'rotate', icon: RotateCw, label: 'Xoay' },
  { id: 'flip', icon: FlipHorizontal, label: 'Lật' },
  { id: 'delete', icon: Trash2, label: 'Xoá', destructive: true },
  { id: 'layer', icon: Layers, label: 'Lớp' },
];

export const TryOnToolbar = ({
  opacity,
  onOpacityChange,
  onResize,
  onRotate,
  onFlip,
  onDelete,
  onLayer,
  disabled,
}: TryOnToolbarProps) => {
  const handlers: Record<string, () => void> = {
    resize: onResize,
    rotate: onRotate,
    flip: onFlip,
    delete: onDelete,
    layer: onLayer,
  };

  return (
    <div className="space-y-4">
      {/* Opacity slider */}
      <div className="flex items-center gap-4 px-2">
        <span className="text-sm text-muted-foreground min-w-[50px]">Độ mờ</span>
        <Slider
          value={[opacity * 100]}
          onValueChange={([value]) => onOpacityChange(value / 100)}
          max={100}
          min={10}
          step={5}
          className="flex-1"
          disabled={disabled}
        />
        <span className="text-sm font-medium text-foreground min-w-[40px] text-right">
          {Math.round(opacity * 100)}%
        </span>
      </div>

      {/* Tool buttons */}
      <div className="flex items-center justify-around">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Button
              key={tool.id}
              variant="toolbar"
              size="sm"
              onClick={handlers[tool.id]}
              disabled={disabled}
              className={tool.destructive ? "text-destructive hover:text-destructive" : ""}
            >
              <Icon size={18} />
              <span className="text-[10px] ml-1">{tool.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
