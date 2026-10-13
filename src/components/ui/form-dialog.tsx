import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/**
 * FormDialog — a viewport-bound dialog shell with a fixed header, a scrollable
 * body and a fixed footer. Built on the shared Dialog so Escape/overlay/focus
 * behaviour is unchanged. The footer sits outside the scrolling area, so the
 * submit button associates with the in-body form via its `form` attribute.
 */
const FormDialog = Dialog;

const FormDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof DialogContent>
>(({ className, children, onOpenAutoFocus, ...props }, forwardedRef) => {
  const contentRef = React.useRef<React.ElementRef<typeof DialogContent>>(null);

  React.useImperativeHandle(forwardedRef, () => contentRef.current as React.ElementRef<typeof DialogContent>);

  // Focus the first field without letting the browser scroll the body (which
  // would push the header out of view). Respect an explicit override.
  const handleOpenAutoFocus = React.useCallback(
    (event: Event) => {
      onOpenAutoFocus?.(event);
      if (onOpenAutoFocus) return;
      event.preventDefault();
      requestAnimationFrame(() => {
        const el = contentRef.current?.querySelector<HTMLElement>(
          '[data-dialog-autofocus], input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])',
        );
        el?.focus({ preventScroll: true });
      });
    },
    [onOpenAutoFocus],
  );

  return (
    <DialogContent ref={contentRef} onOpenAutoFocus={handleOpenAutoFocus} className={cn('p-0', className)} {...props}>
      {children}
    </DialogContent>
  );
});
FormDialogContent.displayName = 'FormDialogContent';

const FormDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('shrink-0 space-y-1.5 border-b px-6 pb-4 pr-12 pt-6 text-left', className)} {...props} />
);
FormDialogHeader.displayName = 'FormDialogHeader';

const FormDialogBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('dialog-scroll min-h-0 flex-1 overflow-y-auto px-6 py-4', className)} {...props} />
  ),
);
FormDialogBody.displayName = 'FormDialogBody';

const FormDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex shrink-0 flex-col-reverse gap-2 border-t bg-background px-6 py-4 sm:flex-row sm:justify-end',
      className,
    )}
    {...props}
  />
);
FormDialogFooter.displayName = 'FormDialogFooter';

export {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogBody,
  FormDialogFooter,
  DialogTitle as FormDialogTitle,
  DialogDescription as FormDialogDescription,
};
