import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useTranslation } from "react-i18next";

import { usersApi } from "../../api/users";
import type { UserAccountEntry, UserAccountWritePayload } from "../../api/types";

// Maps the backend's field names to their translated labels, so a
// validation error naming e.g. "birth_date" reads as "Fecha de
// nacimiento" instead of the raw snake_case key.
const FIELD_LABEL_KEYS: Record<string, string> = {
  phone: "users.phone",
  birth_date: "users.birthDate",
  gender: "users.gender",
  document_type: "users.documentType",
  document_number: "users.documentNumber",
  hire_date: "users.hireDate",
  address: "users.address",
  username: "users.username",
  password: "users.password",
  email: "users.email",
};

const EMPTY_FORM: UserAccountWritePayload = {
  username: "",
  password: "",
  email: "",
  first_name: "",
  last_name: "",
  is_staff: false,
  is_active: true,
  phone: "",
  birth_date: null,
  gender: "",
  document_type: "",
  document_number: "",
  hire_date: null,
  address: "",
};

export function UserFormModal({
  user,
  onClose,
}: {
  user: UserAccountEntry | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditing = !!user;
  const [form, setForm] = useState<UserAccountWritePayload>(
    user
      ? {
          username: user.username,
          password: "",
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_staff: user.is_staff,
          is_active: user.is_active,
          phone: user.phone,
          birth_date: user.birth_date,
          gender: user.gender,
          document_type: user.document_type,
          document_number: user.document_number,
          hire_date: user.hire_date,
          address: user.address,
        }
      : EMPTY_FORM
  );
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof UserAccountWritePayload>(key: K, value: UserAccountWritePayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const mutation = useMutation({
    mutationFn: () => {
      // Never send a blank password on edit: that would mean "leave it
      // unchanged" to the user, but the backend treats any provided
      // value as a real reset, so an empty string must never reach it.
      const payload = { ...form };
      if (isEditing && !payload.password) delete payload.password;
      return isEditing ? usersApi.update(user.id, payload) : usersApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-accounts"] });
      onClose();
    },
    onError: (err) => {
      const data = isAxiosError(err) ? err.response?.data : null;
      if (data && typeof data === "object" && !Array.isArray(data)) {
        const messages = Object.entries(data).map(([field, msgs]) => {
          const label = FIELD_LABEL_KEYS[field] ? t(FIELD_LABEL_KEYS[field]) : field;
          const text = Array.isArray(msgs) ? String(msgs[0]) : String(msgs);
          return `${label}: ${text}`;
        });
        setError(messages.join(" · "));
      } else {
        setError(t("users.saveError"));
      }
    },
  });

  const fieldClass = "w-full rounded border border-ruby-700 bg-ruby-900 px-2 py-1.5 text-blush-100";
  const labelClass = "mb-1 block text-xs text-blush-100/60";

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded border border-ruby-700 bg-ruby-950 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-blush-200">
            {isEditing ? t("users.editUser") : t("users.newUser")}
          </h2>
          <button className="text-blush-100/60 hover:text-blush-100" onClick={onClose}>
            ✕
          </button>
        </div>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t("users.username")}</label>
              <input
                className={fieldClass}
                value={form.username}
                onChange={(event) => set("username", event.target.value)}
                required
                disabled={isEditing}
              />
            </div>
            <div>
              <label className={labelClass}>
                {t("users.password")} {isEditing && `(${t("users.passwordHint")})`}
              </label>
              <input
                type="password"
                className={fieldClass}
                value={form.password}
                onChange={(event) => set("password", event.target.value)}
                required={!isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t("users.firstName")}</label>
              <input
                className={fieldClass}
                value={form.first_name}
                onChange={(event) => set("first_name", event.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>{t("users.lastName")}</label>
              <input
                className={fieldClass}
                value={form.last_name}
                onChange={(event) => set("last_name", event.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("users.email")}</label>
            <input
              type="email"
              className={fieldClass}
              value={form.email}
              onChange={(event) => set("email", event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t("users.phone")}</label>
              <input
                className={fieldClass}
                value={form.phone}
                onChange={(event) => set("phone", event.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>{t("users.birthDate")}</label>
              <input
                type="date"
                className={fieldClass}
                value={form.birth_date ?? ""}
                onChange={(event) => set("birth_date", event.target.value || null)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t("users.gender")}</label>
              <select
                className={fieldClass}
                value={form.gender}
                onChange={(event) => set("gender", event.target.value as UserAccountWritePayload["gender"])}
              >
                <option value="">N/A</option>
                <option value="M">{t("users.genderMale")}</option>
                <option value="F">{t("users.genderFemale")}</option>
                <option value="O">{t("users.genderOther")}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t("users.hireDate")}</label>
              <input
                type="date"
                className={fieldClass}
                value={form.hire_date ?? ""}
                onChange={(event) => set("hire_date", event.target.value || null)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t("users.documentType")}</label>
              <select
                className={fieldClass}
                value={form.document_type}
                onChange={(event) =>
                  set("document_type", event.target.value as UserAccountWritePayload["document_type"])
                }
              >
                <option value="">N/A</option>
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t("users.documentNumber")}</label>
              <input
                className={fieldClass}
                value={form.document_number}
                onChange={(event) => set("document_number", event.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("users.address")}</label>
            <input
              className={fieldClass}
              value={form.address}
              onChange={(event) => set("address", event.target.value)}
            />
          </div>

          <div className="flex items-center gap-4 border-t border-ruby-800 pt-3">
            <label className="flex items-center gap-2 text-sm text-blush-100/80">
              <input
                type="checkbox"
                checked={form.is_staff}
                onChange={(event) => set("is_staff", event.target.checked)}
              />
              {t("users.roleAdmin")}
            </label>
            <label className="flex items-center gap-2 text-sm text-blush-100/80">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => set("is_active", event.target.checked)}
              />
              {t("users.active")}
            </label>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded bg-ruby-600 py-2 font-semibold text-blush-100 hover:bg-ruby-500 disabled:opacity-50"
          >
            {t("common.save")}
          </button>
        </form>
      </div>
    </div>
  );
}
