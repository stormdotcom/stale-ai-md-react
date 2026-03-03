import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";
import { Input } from "./input";

export interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
  onCancel?: () => void;
}

export function PromptDialog({
  open,
  onOpenChange,
  title,
  description,
  defaultValue = "",
  placeholder,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value?.trim() ?? defaultValue;
    onConfirm(value || defaultValue);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} onEscapeKeyDown={handleCancel} onPointerDownOutside={handleCancel}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="py-4">
            <Input
              ref={inputRef}
              defaultValue={defaultValue}
              placeholder={placeholder}
              className="w-full"
              onKeyDown={(e) => e.key === "Escape" && handleCancel()}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              {cancelLabel}
            </Button>
            <Button type="submit">{confirmLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
