import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Janela de confirmação própria do app (não depende do window.confirm do navegador). */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  message,
  confirmLabel = 'Excluir',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-5 bg-black/85">
      <div className="w-full max-w-sm bg-[#161619] border border-[#282830] rounded-2xl p-5 shadow-2xl text-white">
        <p className="text-sm text-zinc-200 leading-relaxed">{message}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-bold text-white transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 h-11 rounded-xl bg-[#E50914] hover:bg-[#c20811] text-sm font-bold text-white transition cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
