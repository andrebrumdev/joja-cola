import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { BrandMark } from "../components/BrandMark";
import { writeSession } from "../lib/auth";
import { DURATION, EASE_OUT, RISE } from "../lib/motion";

export function Login() {
  const reduce = useReducedMotion() ?? false;
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/produtos";
  const [email, setEmail] = useState("operacao@jojacola.com");
  const [password, setPassword] = useState("joja");
  const [error, setError] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Preencha e-mail e senha.");
      return;
    }
    writeSession({ email: email.trim() });
    navigate(from, { replace: true });
  }

  return (
    <div className="login-wrap">
      <motion.form
        className="login-card"
        onSubmit={onSubmit}
        initial={reduce ? false : { opacity: 0, y: RISE }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION, ease: EASE_OUT }}
      >
        <BrandMark />
        <div>
          <p className="kicker">Acesso operacional</p>
          <h1>Entrar no sistema</h1>
          <p className="hint">Demo acadêmica. Qualquer senha não vazia libera o ERP.</p>
        </div>
        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? (
          <p className="danger" role="alert">
            {error}
          </p>
        ) : null}
        <button className="btn btn-primary" type="submit">
          Entrar
        </button>
        <Link className="hint" to="/" style={{ color: "var(--cyan)" }}>
          ← Voltar à apresentação
        </Link>
      </motion.form>
    </div>
  );
}
