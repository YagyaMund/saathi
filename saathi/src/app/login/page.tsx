"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("sunita@saathi.demo");
  const [password, setPassword] = useState("sunita123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not sign in");
      return;
    }
    router.push("/app");
    router.refresh();
  }

  async function googleStub() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/google-stub", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "sunita.handicrafts@gmail.com",
        name: "Sunita Deshmukh",
        connectSheet: true,
        useDemoShop: true,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Google stub failed");
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
        <h1>Your shop on Instagram</h1>
        <p className="lead">
          Sign in to approve catalogue drafts, answer buyers, and keep your
          Sheet as the source of truth. Hindi and English.
        </p>
        <form onSubmit={login}>
          <label className="fld">
            <span className="fl">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </label>
          <label className="fld">
            <span className="fl">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>
          {error ? (
            <div
              style={{
                marginTop: 12,
                color: "var(--warn)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          ) : null}
          <button className="btn" style={{ marginTop: 18 }} disabled={busy}>
            Sign in
          </button>
        </form>
        <button
          className="btn ghost"
          style={{ marginTop: 10 }}
          type="button"
          disabled={busy}
          onClick={googleStub}
        >
          Continue with Google (stub)
        </button>
        <p className="fh" style={{ marginTop: 14, textAlign: "center" }}>
          Demo: sunita@saathi.demo / sunita123
          <br />
          <Link href="/signup">Create a new shop</Link>
        </p>
      </div>
    </div>
  );
}
