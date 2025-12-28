import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { useLanguage } from '@/contexts/LanguageContext';
import { Heart, ExternalLink, Tag, Shirt, User, Check, Loader2 } from 'lucide-react';

interface ClothingDetailsFormProps {
  item: ClothingItem;
  imageUrl: string;
  onSave: (item: ClothingItem) => void;
  onCancel: () => void;
  mode?: 'create' | 'edit';
  isSaving?: boolean;
}

const CATEGORIES: ClothingCategory[] = ['top', 'bottom', 'dress', 'shoes', 'accessory'];
const GENDERS = ['male', 'female', 'unisex'] as const;

export const ClothingDetailsForm = ({ 
  item, 
  imageUrl,
  onSave, 
  onCancel,
  mode = 'create',
  isSaving = false
}: ClothingDetailsFormProps) => {
  const { t } = useLanguage();
  
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState<ClothingCategory>(item.category);
  const [gender, setGender] = useState<'male' | 'female' | 'unisex'>(
    (item.gender as 'male' | 'female' | 'unisex') || 'unisex'
  );
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchaseUrl, setPurchaseUrl] = useState(item.shopUrl || '');

  const handleSave = () => {
    const updatedItem: ClothingItem = {
      ...item,
      name: name.trim() || item.name,
      category,
      gender,
      shopUrl: purchaseUrl.trim() || undefined,
    };
    onSave(updatedItem);
  };

  return (
    <div className="space-y-5">
      {/* Preview Image */}
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border">
          <img 
            src={imageUrl} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground mb-1">{t('clothing_form_detected')}</p>
          <p className="font-medium text-foreground truncate">{item.name}</p>
          {item.color && (
            <p className="text-sm text-muted-foreground">{item.color}</p>
          )}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2 text-sm">
          <Tag size={14} className="text-muted-foreground" />
          {t('clothing_form_name')}
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('clothing_form_name_placeholder')}
          className="h-10"
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm">
          <Shirt size={14} className="text-muted-foreground" />
          {t('clothing_form_category')}
        </Label>
        <Select value={category} onValueChange={(v) => setCategory(v as ClothingCategory)}>
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {t(`slot_${cat}` as any)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm">
          <User size={14} className="text-muted-foreground" />
          {t('clothing_form_gender')}
        </Label>
        <RadioGroup 
          value={gender} 
          onValueChange={(v) => setGender(v as 'male' | 'female' | 'unisex')}
          className="flex gap-4"
        >
          {GENDERS.map((g) => (
            <div key={g} className="flex items-center space-x-2">
              <RadioGroupItem value={g} id={`gender-${g}`} />
              <Label htmlFor={`gender-${g}`} className="text-sm font-normal cursor-pointer">
                {t(`clothing_form_gender_${g}` as any)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Is Purchased / Owned */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{t('clothing_form_owned')}</p>
            <p className="text-xs text-muted-foreground">{t('clothing_form_owned_desc')}</p>
          </div>
        </div>
        <Switch 
          checked={isPurchased} 
          onCheckedChange={setIsPurchased}
        />
      </div>

      {/* Purchase URL */}
      <div className="space-y-2">
        <Label htmlFor="purchaseUrl" className="flex items-center gap-2 text-sm">
          <ExternalLink size={14} className="text-muted-foreground" />
          {t('clothing_form_purchase_url')}
        </Label>
        <Input
          id="purchaseUrl"
          type="url"
          value={purchaseUrl}
          onChange={(e) => setPurchaseUrl(e.target.value)}
          placeholder="https://..."
          className="h-10"
        />
        <p className="text-xs text-muted-foreground">{t('clothing_form_purchase_url_hint')}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="flex-1 h-11"
          disabled={isSaving}
        >
          {t('btn_cancel')}
        </Button>
        <Button 
          onClick={handleSave}
          className="flex-1 h-11 bg-gradient-to-r from-primary to-accent text-primary-foreground"
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 size={16} className="mr-2 animate-spin" />
          ) : (
            <Check size={16} className="mr-2" />
          )}
          {t('btn_save')}
        </Button>
      </div>
    </div>
  );
};
