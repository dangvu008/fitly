import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clipboard, Settings } from 'lucide-react';

const CLIPBOARD_ENABLED_KEY = 'smart_paste_clipboard_enabled';

/**
 * Get clipboard detection setting from localStorage
 * @returns boolean - true if enabled (default), false if disabled
 */
export function getClipboardEnabled(): boolean {
  try {
    const stored = localStorage.getItem(CLIPBOARD_ENABLED_KEY);
    return stored !== 'false'; // Default to enabled
  } catch {
    return true;
  }
}

/**
 * Set clipboard detection setting in localStorage
 * @param enabled - whether clipboard detection should be enabled
 */
export function setClipboardEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(CLIPBOARD_ENABLED_KEY, String(enabled));
  } catch (e) {
    console.warn('[SettingsDialog] Could not save clipboard setting:', e);
  }
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Settings dialog component with clipboard detection toggle
 * @requirements REQ-13.3
 */
export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { t } = useLanguage();
  const [clipboardEnabled, setClipboardEnabledState] = useState(getClipboardEnabled);

  // Sync state with localStorage on mount
  useEffect(() => {
    setClipboardEnabledState(getClipboardEnabled());
  }, [open]);

  const handleClipboardToggle = (enabled: boolean) => {
    setClipboardEnabledState(enabled);
    setClipboardEnabled(enabled);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('profile_settings')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Clipboard Detection Setting */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-start gap-3">
              <Clipboard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <Label htmlFor="clipboard-detection" className="text-sm font-medium">
                  {t('settings_clipboard_detection')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('settings_clipboard_detection_desc')}
                </p>
              </div>
            </div>
            <Switch
              id="clipboard-detection"
              checked={clipboardEnabled}
              onCheckedChange={handleClipboardToggle}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
