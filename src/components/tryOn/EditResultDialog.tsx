import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentImage: string;
  onEdit: (instruction: string) => Promise<void>;
  isProcessing: boolean;
}

const quickFixes = [
  { label: 'Sửa màu áo', instruction: 'Sửa màu áo cho đúng với ảnh tham chiếu ban đầu' },
  { label: 'Đặt giày đúng chân', instruction: 'Đặt giày vào đúng chân của người, không để bên cạnh' },
  { label: 'Giữ nguyên khuôn mặt', instruction: 'Giữ nguyên khuôn mặt gốc của người trong ảnh' },
  { label: 'Tự nhiên hơn', instruction: 'Làm cho quần áo trông tự nhiên hơn, phù hợp với dáng người' },
  { label: 'Sửa màu quần', instruction: 'Sửa màu quần cho đúng với ảnh tham chiếu' },
  { label: 'Cải thiện ánh sáng', instruction: 'Điều chỉnh ánh sáng và bóng đổ cho phù hợp' },
];

export const EditResultDialog = ({ 
  open, 
  onOpenChange, 
  currentImage, 
  onEdit,
  isProcessing 
}: EditResultDialogProps) => {
  const [instruction, setInstruction] = useState('');

  const handleSubmit = async () => {
    if (!instruction.trim()) return;
    await onEdit(instruction);
    setInstruction('');
  };

  const handleQuickFix = (fix: string) => {
    setInstruction(prev => prev ? `${prev}. ${fix}` : fix);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            Chỉnh sửa kết quả
          </DialogTitle>
          <DialogDescription>
            Mô tả những gì bạn muốn thay đổi, AI sẽ chỉnh sửa cho bạn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current result preview */}
          <div className="relative aspect-[3/4] w-full max-h-48 overflow-hidden rounded-lg bg-muted">
            <img 
              src={currentImage} 
              alt="Current result" 
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <span className="absolute bottom-2 left-2 text-xs text-white/80">Kết quả hiện tại</span>
          </div>

          {/* Quick fix buttons */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Sửa nhanh:</p>
            <div className="flex flex-wrap gap-2">
              {quickFixes.map((fix) => (
                <Button
                  key={fix.label}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickFix(fix.instruction)}
                  disabled={isProcessing}
                >
                  {fix.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom instruction input */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Hoặc mô tả chi tiết:</p>
            <Textarea
              placeholder="Ví dụ: Sửa màu áo thành màu trắng như ảnh gốc, đặt giày vào chân thay vì để bên cạnh..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={3}
              disabled={isProcessing}
              className="resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Hủy
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleSubmit}
              disabled={!instruction.trim() || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Chỉnh sửa
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
