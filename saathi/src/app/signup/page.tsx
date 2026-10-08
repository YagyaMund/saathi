"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    shopName: "",
    city: "Jaipur, Rajasthan",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not create shop");
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
          SAATHI
        </div>
        <h1>Open your shop</h1>
        <p className="lead">
          Multi-tenant — anyone can sign up. Connect Google later to put the
          catalogue in your Sheet.
        </p>
        <form onSubmit={onSubmit}>
          {(
            [
              ["name", "Your name"],
              ["email", "Email"],
              ["password", "Password"],
              ["shopName", "Shop name"],
              ["city", "City"],
            ] as const
          ).map(([key, label]) => (
            <label className="fld" key={key}>
              <span className="fl">{label}</span>
              <input
                type={key === "password" ? "password" : key === "email" ? "email" : "text"}
                required
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}
          {error ? (
            <div style={{ marginTop: 12, color: "var(--warn)", fontSize: 13 }}>
              {error}
            </div>
          ) : null}
          <button className="btn" style={{ marginTop: 18 }} disabled={busy}>
            Create shop
          </button>
        </form>
        <p className="fh" style={{ marginTop: 14, textAlign: "center" }}>
          <Link href="/login">Already have an account</Link>
        </p>
      </div>
    </div>
  );
}
