import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useTranslation } from "react-i18next";

import { openRegister } from "../../api/pos";
import type { RegisterStatus } from "../../api/types";

// Blocks POS access until the caller's own register is open — a sale can
// never be created (or a draft finalized) with the register closed, so
// there's no point letting the user into the ticket UI before this.
export function RegisterGate({ status }: { status: RegisterStatus }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: openRegister,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["register-status"] }),
  });

  const errorDetail = isAxiosError(mutation.error) && mutation.error.response?.data?.detail;

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-lg font-semibold text-blush-200">{t("register.openTitle")}</h2>
      <p className="max-w-xs text-sm text-blush-100/70">{t("register.openMessage")}</p>
      <p className="text-xs text-blush-100/50">
        {t("register.processDate")}: {status.process_date}
      </p>
      {typeof errorDetail === "string" && <p className="text-sm text-red-400">{errorDetail}</p>}
      <button
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
        className="rounded bg-ruby-600 px-6 py-2.5 font-semibold text-blush-100 hover:bg-ruby-500 disabled:opacity-50"
      >
        {t("register.openButton")}
      </button>
    </div>
  );
}
