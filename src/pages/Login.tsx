import { type FormEvent, lazy, Suspense, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { BrandMark } from "../components/BrandMark";
import { products } from "../data/mock";
import { writeSession } from "../lib/auth";
import { sceneScroll } from "../lib/sceneScroll";
import can from "../assets/can.png";

// Same scene as the landing hero, same lazy chunk (cached when the visitor came from there).
const Scene3D = lazy(() =>
  import("../components/Scene3D").then((m) => ({ default: m.Scene3D })),
);

/**
 * The only places a visitor may return to after signing in: an explicit list of this system's
 * own pages, compared as exact strings. Anything else, including query strings, lands on Rotas.
 */
const RETURN_TARGETS = new Set([
  "/rotas",
  "/producao",
  "/marketing",
  "/produtos",
  "/carrinho",
  "/pedidos",
  "/pagamentos",
  ...products.map((p) => `/produtos/${p.id}`),
]);

function returnTarget(from: unknown) {
  return typeof from === "string" && RETURN_TARGETS.has(from) ? from : "/rotas";
}

export function Login() {
  const rootRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const reduce = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const navigate = useNavigate();
  const location = useLocation();
  const from = returnTarget((location.state as { from?: unknown } | null)?.from);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<"email" | "password" | null>(null);
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  // The scene's canvases are fixed to the viewport (shared with the landing); on this
  // page they show only through the visual panel, clipped to its box and corners.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const panel = visualRef.current;
    if (reduce || !root || !panel) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = panel.getBoundingClientRect();
      const { clientWidth, clientHeight } = document.documentElement;
      const radius = getComputedStyle(panel).borderRadius;
      root.style.setProperty(
        "--scene-clip",
        `inset(${r.top}px ${clientWidth - r.right}px ${clientHeight - r.bottom}px ${r.left}px round ${radius})`,
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    const observer = new ResizeObserver(schedule);
    observer.observe(panel);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
    };
  }, [reduce]);

  useGSAP(
    () => {
      // The panel is the hero chapter: the can parks in its slot, no travel from the last page.
      sceneScroll.chapter = 0;
      sceneScroll.velocity = 0;
      sceneScroll.snap = true;
      if (reduce) {
        sceneScroll.intro = 1;
        return;
      }

      // Short entrance (~1s). The form is usable from the first frame (opacity only,
      // never visibility); the scene lifts its curtain and the second can swings in.
      gsap
        .timeline({ defaults: { ease: "expo.out" } })
        .set(".login-curtain", { autoAlpha: 1 })
        .to(".login-curtain", { autoAlpha: 0, duration: 0.7 }, 0.05)
        .fromTo(sceneScroll, { intro: 0 }, { intro: 1, duration: 1.1 }, 0)
        .fromTo(sceneScroll, { duo: 0 }, { duo: 1, duration: 1, ease: "power3.out" }, 0.45)
        .from(".login-form > *", { opacity: 0, duration: 0.6, stagger: 0.05 }, 0.05)
        .from(".login-visual-copy > *", { opacity: 0, y: 16, duration: 0.7, stagger: 0.08 }, 0.35);

      return () => {
        sceneScroll.duo = 0;
      };
    },
    { scope: rootRef, dependencies: [reduce] },
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return setError("email");
    if (!password.trim()) return setError("password");
    writeSession({ email: email.trim() });
    navigate(from, { replace: true, viewTransition: true });
  }

  const errorText = error === "email" ? "Informe o e-mail para entrar." : "Informe a senha para entrar.";

  return (
    <div className="login-page" ref={rootRef}>
      {reduce ? null : (
        <Suspense fallback={null}>
          <Scene3D layout="panel" />
        </Suspense>
      )}

      <main className="login-card">
        <section className="login-form-side" aria-labelledby="login-title">
          <Link className="login-back" to="/" viewTransition>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            Voltar à apresentação
          </Link>

          <form className="login-form" onSubmit={onSubmit} noValidate>
            <div className="login-head">
              <h1 id="login-title">Entrar no sistema</h1>
              <p>Rotas, produção, marketing e pedidos da Joja Cola em um só lugar.</p>
            </div>

            <div className="login-field">
              <label htmlFor={emailId}>E-mail</label>
              <div className="login-control">
                <input
                  id={emailId}
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  placeholder="nome@empresa.com"
                  spellCheck={false}
                  value={email}
                  aria-invalid={error === "email" || undefined}
                  aria-describedby={error === "email" ? errorId : undefined}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor={passwordId}>Senha</label>
              <div className="login-control">
                <input
                  id={passwordId}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  value={password}
                  aria-invalid={error === "password" || undefined}
                  aria-describedby={error === "password" ? errorId : undefined}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                />
                <button
                  type="button"
                  className="login-reveal"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                    {showPassword ? <path d="M4 4l16 16" /> : null}
                  </svg>
                </button>
              </div>
            </div>

            {error ? (
              <p className="login-error" id={errorId} role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16h.01" />
                </svg>
                {errorText}
              </p>
            ) : null}

            <button className="btn btn-primary btn-lg login-submit" type="submit">
              Entrar
            </button>
          </form>

          <p className="login-note">Demo acadêmica. Qualquer senha não vazia libera o ERP.</p>
        </section>

        <div className={reduce ? "login-visual is-static" : "login-visual"} ref={visualRef}>
          <Link className="login-logo" to="/" viewTransition aria-label="Joja Cola, página inicial">
            <BrandMark />
          </Link>
          <div className="can-slot can-slot-login" data-can-anchor="hero" aria-hidden="true">
            {reduce ? (
              <>
                <img className="pixel" src={can} alt="" />
                <img className="pixel" src={can} alt="" />
              </>
            ) : null}
          </div>
          <div className="login-visual-copy">
            <p className="login-visual-title">
              Joja Cola.
              <span>Consumo adequado para qualquer situação.</span>
            </p>
            <p>Indústria de bebidas não alcoólicas</p>
          </div>
          {reduce ? null : <div className="login-curtain" aria-hidden="true" />}
        </div>
      </main>
    </div>
  );
}
