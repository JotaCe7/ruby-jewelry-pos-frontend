import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { usersApi } from "../../api/users";
import type { UserAccountEntry } from "../../api/types";
import { UserFormModal } from "./UserFormModal";

export function UsersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ["user-accounts"],
    queryFn: () => usersApi.list(),
  });

  const [editingUser, setEditingUser] = useState<UserAccountEntry | null>(null);
  const [showModal, setShowModal] = useState(false);

  const toggleActiveMutation = useMutation({
    mutationFn: (user: UserAccountEntry) => usersApi.update(user.id, { is_active: !user.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-accounts"] }),
  });

  return (
    <section className="max-w-4xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-blush-200">{t("users.title")}</h2>
        <button
          className="rounded bg-ruby-600 px-4 py-1.5 font-medium text-blush-100 hover:bg-ruby-500"
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
        >
          {t("users.newUser")}
        </button>
      </div>

      {isLoading ? (
        <p className="text-blush-100/70">{t("common.loading")}</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-blush-100/60">
              <th className="py-1 pr-3">{t("users.username")}</th>
              <th className="py-1 pr-3">{t("users.fullName")}</th>
              <th className="py-1 pr-3">{t("users.role")}</th>
              <th className="py-1 pr-3">{t("users.phone")}</th>
              <th className="py-1 text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => (
              <tr key={user.id} className="border-b border-ruby-800">
                <td className="py-2 pr-3">
                  <span className={user.is_active ? "" : "text-blush-100/40 line-through"}>
                    {user.username}
                  </span>
                </td>
                <td className="py-2 pr-3">
                  {user.first_name} {user.last_name}
                </td>
                <td className="py-2 pr-3">
                  {user.is_staff ? t("users.roleAdmin") : t("users.roleVendedor")}
                </td>
                <td className="py-2 pr-3">{user.phone}</td>
                <td className="py-2 text-right whitespace-nowrap">
                  <button
                    className="mr-3 text-sm text-blush-100/70 hover:text-blush-200"
                    onClick={() => toggleActiveMutation.mutate(user)}
                  >
                    {user.is_active ? t("common.deactivate") : t("common.activate")}
                  </button>
                  <button
                    className="text-sm text-blush-100/70 hover:text-blush-200"
                    onClick={() => {
                      setEditingUser(user);
                      setShowModal(true);
                    }}
                  >
                    {t("common.edit")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && <UserFormModal user={editingUser} onClose={() => setShowModal(false)} />}
    </section>
  );
}
