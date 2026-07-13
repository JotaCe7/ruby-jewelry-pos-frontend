import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useTranslation } from "react-i18next";

import { voidDocument } from "../../api/pos";
import type { SaleDocumentEntry } from "../../api/types";

export function VoidModal({
  document,
  onClose,
  onVoided,
}: {
  document: SaleDocumentEntry;
  onClose: () => void;
  onVoided: () => void;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [pin, setPin] = useState("");
  const [creditNoteNumber, setCreditNoteNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => voidDocument(document.id, { reason, pin }),
    onSuccess: (data) => {
      setCreditNoteNumber(data.credit_note.document_number);
      setError(null);
      onVoided();
    },
    onError: (err) => {
      const detail = isAxiosError(err) && err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : t("register.invalidPin"));
    },
  });

  function handleSubmit() {
    if (!confirm(t("ventas.voidWarning"))) return;
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded border border-ruby-700 bg-ruby-950 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-blush-200">
            {t("ventas.voidTitle")} — {document.document_number}
          </h2>
          <button className="text-blush-100/60 hover:text-blush-100" onClick={onClose}>
            ✕
          </button>
        </div>

        {!creditNoteNumber ? (
          <div className="space-y-3">
            <p className="text-sm text-amber-400">{t("ventas.voidWarning")}</p>

            <div>
              <label className="mb-1 block text-xs text-blush-100/60">{t("ventas.reason")}</label>
              <input
                className="w-full rounded border border-ruby-700 bg-ruby-900 px-2 py-1.5 text-blush-100"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t("ventas.reasonPlaceholder")}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-blush-100/60">{t("register.pin")}</label>
              <input
                type="password"
                inputMode="numeric"
                className="w-full rounded border border-ruby-700 bg-ruby-900 px-2 py-1.5 text-blush-100"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                placeholder={t("register.pinPlaceholder")}
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              disabled={!reason || !pin || mutation.isPending}
              onClick={handleSubmit}
              className="w-full rounded bg-ruby-600 py-2 font-semibold text-blush-100 hover:bg-ruby-500 disabled:opacity-50"
            >
              {t("ventas.void")}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="rounded bg-green-900/40 px-2 py-1 text-sm text-green-300">
              {t("ventas.voidSuccess")}
            </p>
            <p className="text-sm text-blush-100/80">
              {t("ventas.creditNoteIssued")}: <span className="font-mono">{creditNoteNumber}</span>
            </p>
            <button
              className="w-full rounded bg-ruby-600 py-2 font-semibold text-blush-100 hover:bg-ruby-500"
              onClick={onClose}
            >
              {t("register.close")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
