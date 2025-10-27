import { useState, useCallback, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/routes/-components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';

interface ConfirmOptions {
  title: ReactNode;
  description: ReactNode;
  confirmText?: ReactNode;
  cancelText?: ReactNode;
  onConfirm?: () => void;
  content?: ReactNode;
}

export function useConfirmationDialog() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolve, setResolve] = useState<(value: boolean) => void>(() => {});

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((res) => {
      setOptions(opts);
      setIsOpen(true);
      setResolve(() => res);
    });
  }, []);

  const handleClose = (confirmed: boolean) => {
    setIsOpen(false);
    resolve(confirmed);
  };

  const ConfirmationDialog = options ? (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => !open && handleClose(false)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options.title}</AlertDialogTitle>
          <AlertDialogDescription>{options.description}</AlertDialogDescription>
        </AlertDialogHeader>
        {options.content}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => handleClose(false)}>
            {options.cancelText || t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              handleClose(true);
              options.onConfirm && options.onConfirm();
            }}
          >
            {options.confirmText || t('common.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : null;

  return { confirm, ConfirmationDialog };
}
