import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ClothingItem } from '@/types/clothing';
import { TryOnDialog, HistoryResultData } from '@/components/tryOn/TryOnDialog';

/**
 * Options for opening the TryOn dialog
 * Matches the props of TryOnDialog component
 */
export interface TryOnDialogOptions {
  /** Initial clothing item to try on */
  initialItem?: ClothingItem;
  /** Body image URL to reuse */
  reuseBodyImage?: string;
  /** Clothing items to reuse from previous session */
  reuseClothingItems?: ClothingItem[];
  /** History result data for retry flow */
  historyResult?: HistoryResultData;
  /** Garment URL for Quick Try flow */
  initialGarmentUrl?: string;
  /** Garment ID if from internal DB */
  initialGarmentId?: string;
  /** Auto-start AI processing when ready */
  autoStart?: boolean;
  /** Callback when try-on completes successfully */
  onSuccess?: (resultImageUrl: string) => void;
}

/**
 * Return type for useTryOnDialog hook
 */
export interface UseTryOnDialogReturn {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Open dialog with optional initial data */
  openDialog: (options?: TryOnDialogOptions) => void;
  /** Close dialog */
  closeDialog: () => void;
  /** Current dialog options */
  options: TryOnDialogOptions | null;
}

// Default context value for when provider is not available
const defaultContextValue: UseTryOnDialogReturn = {
  isOpen: false,
  openDialog: () => {
    console.warn('TryOnDialogProvider not found. Make sure to wrap your app with TryOnDialogProvider.');
  },
  closeDialog: () => {},
  options: null,
};

const TryOnDialogContext = createContext<UseTryOnDialogReturn>(defaultContextValue);

/**
 * TryOnDialogProvider - Provides TryOn dialog state management across the app
 * 
 * Wrap your app with this provider to enable opening the TryOn dialog
 * from anywhere using the useTryOnDialog hook.
 * 
 * Requirements: 1.1
 */
export const TryOnDialogProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<TryOnDialogOptions | null>(null);

  const openDialog = useCallback((dialogOptions?: TryOnDialogOptions) => {
    setOptions(dialogOptions || null);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    // Clear options after a short delay to allow close animation
    setTimeout(() => {
      setOptions(null);
    }, 300);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      closeDialog();
    }
  }, [closeDialog]);

  return (
    <TryOnDialogContext.Provider value={{
      isOpen,
      openDialog,
      closeDialog,
      options,
    }}>
      {children}
      <TryOnDialog
        open={isOpen}
        onOpenChange={handleOpenChange}
        initialItem={options?.initialItem}
        reuseBodyImage={options?.reuseBodyImage}
        reuseClothingItems={options?.reuseClothingItems}
        historyResult={options?.historyResult}
        initialGarmentUrl={options?.initialGarmentUrl}
        initialGarmentId={options?.initialGarmentId}
        autoStart={options?.autoStart}
        onSuccess={options?.onSuccess}
      />
    </TryOnDialogContext.Provider>
  );
};

/**
 * useTryOnDialog - Hook to control the TryOn dialog from anywhere in the app
 * 
 * Usage:
 * ```tsx
 * const { openDialog, closeDialog, isOpen } = useTryOnDialog();
 * 
 * // Open with initial item
 * openDialog({ initialItem: clothingItem });
 * 
 * // Open for Quick Try
 * openDialog({ initialGarmentUrl: 'https://...', autoStart: true });
 * 
 * // Open for history retry
 * openDialog({ historyResult: { ... } });
 * ```
 * 
 * Requirements: 1.1
 */
export const useTryOnDialog = (): UseTryOnDialogReturn => {
  return useContext(TryOnDialogContext);
};
