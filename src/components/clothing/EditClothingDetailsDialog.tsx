import { X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClothingItem } from '@/types/clothing';
import { useLanguage } from '@/contexts/LanguageContext';
import { ClothingDetailsForm } from './ClothingDetailsForm';

interface EditClothingDetailsDialogProps {
  item: ClothingItem;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (item: ClothingItem) => Promise<boolean>;
}

export const EditClothingDetailsDialog = ({
  item,
  isOpen,
  isSaving,
  onClose,
  onSave,
}: EditClothingDetailsDialogProps) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleSave = async (updatedItem: ClothingItem) => {
    const success = await onSave(updatedItem);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card rounded-2xl w-full max-w-sm shadow-medium overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="iconSm" onClick={onClose}>
              <ArrowLeft size={18} />
            </Button>
            <h3 className="font-display font-bold text-lg text-foreground">
              {t('clothing_form_edit_title')}
            </h3>
          </div>
          <Button variant="ghost" size="iconSm" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {/* Form */}
        <div className="p-4">
          <ClothingDetailsForm
            item={item}
            imageUrl={item.imageUrl}
            onSave={handleSave}
            onCancel={onClose}
            mode="edit"
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
};
