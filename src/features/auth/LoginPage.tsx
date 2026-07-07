import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "./AuthContext";

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(username, password);
      navigate("/");
    } catch {
      setError(t("auth.invalidCredentials"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ruby-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-ruby-800 bg-ruby-900 p-6"
      >
        <h1 className="mb-4 text-lg font-bold text-blush-200">{t("app.name")}</h1>
        <label className="mb-1 block text-sm text-blush-100/80">{t("auth.username")}</label>
        <input
          className="mb-3 w-full rounded border border-ruby-700 bg-ruby-950 px-3 py-2 text-blush-100"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoFocus
        />
        <label className="mb-1 block text-sm text-blush-100/80">{t("auth.password")}</label>
        <input
          type="password"
          className="mb-4 w-full rounded border border-ruby-700 bg-ruby-950 px-3 py-2 text-blush-100"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-ruby-600 py-2 font-semibold text-blush-100 hover:bg-ruby-500 disabled:opacity-50"
        >
          {t("auth.signIn")}
        </button>
      </form>
    </div>
  );
}
