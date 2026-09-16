import { lazy, Suspense, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PhoneFrame, ShopScreen, TrackingScreen } from "../components/AppShowcase";
import { BrandMark } from "../components/BrandMark";
import { DURATION, DURATION_CINEMA, RISE, STAGGER, STAGGER_CINEMA } from "../lib/motion";
import { CHAPTERS, sceneScroll } from "../lib/sceneScroll";
import can from "../assets/can.png";

gsap.registerPlugin(ScrollTrigger);

// three.js, drei and postprocessing live in their own chunk, loaded only when
// the scene actually runs (never on reduced-motion).
const Scene3D = lazy(() =>
  import("../components/Scene3D").then((m) => ({ default: m.Scene3D })),
);

const RISE_CINEMA = 24;
const HEADER = 64;
// Where each beat is fully on screen inside the pinned timeline (text swaps at 0.3 and 0.63).
const BEAT_FOCUS = [0.15, 0.48, 0.83];

const beats = [
  {
    n: "01",
    kicker: "Rotina",
    title: "Lata 350ml.",
    line: "Pausa de trabalho e estudo. Um gole, de volta à linha.",
  },
  {
    n: "02",
    kicker: "Refeição",
    title: "O acompanhamento.",
    line: "Almoço, lanche, o dia inteiro. Sem cerimônia.",
  },
  {
    n: "03",
    kicker: "Lazer",
    title: "Gelada.",
    line: "Confraternização e descanso. Alto apelo, zero álcool.",
  },
];

const plates = [
  {
    n: "01",
    kicker: "Produção",
    title: "Envase automatizado.",
    line: "SCADA + sensores IoT. Calda, água, CO₂ — dosagem em tempo real.",
    gain: "Desperdício < 0,5%. Sabor idêntico em cada lote.",
  },
  {
    n: "02",
    kicker: "Vendas & logística",
    title: "Pedidos e rotas.",
    line: "ERP + roteirizador GPS. Do varejo ao caminhão, o trajeto mais curto.",
    gain: "Reposição rápida. Combustível para baixo.",
  },
  {
    n: "03",
    kicker: "Marketing",
    title: "Escuta o mercado.",
    line: "CRM + social listening. Edição sazonal só entra com dado, não palpite.",
    gain: "Campanha no público certo.",
  },
];

export function Landing() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLElement>(null);
  const reduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useGSAP(
    () => {
      // ---- page-wide scroll progress line ----
      const line = document.querySelector<HTMLDivElement>(".page-line");
      if (line) {
        gsap.set(line, { transformOrigin: "0 50%", scaleX: reduce ? 1 : 0 });
        if (!reduce) {
          const setScale = gsap.quickSetter(line, "scaleX") as (v: number) => void;
          ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: (self) => setScale(self.progress),
          });
        }
      }

      if (reduce) {
        gsap.set(".curtain", { autoAlpha: 0 });
        return;
      }

      // ---- cinematic hero entrance: curtain lifts, camera dollies in ----
      gsap
        .timeline({ defaults: { ease: "expo.out" } })
        .set(".curtain", { autoAlpha: 1 })
        .to(".curtain", { autoAlpha: 0, duration: DURATION_CINEMA * 1.3 }, 0)
        .fromTo(sceneScroll, { intro: 0 }, { intro: 1, duration: 2.4 }, 0)
        .from(".chic-rule", { scaleX: 0, duration: DURATION_CINEMA }, STAGGER_CINEMA * 2)
        .from(
          ".cinema-hero-copy .kicker",
          { autoAlpha: 0, y: RISE_CINEMA, duration: DURATION_CINEMA },
          "<",
        )
        .from(
          ".cinema-hero-copy h1",
          { autoAlpha: 0, y: RISE_CINEMA, duration: DURATION_CINEMA },
          STAGGER_CINEMA * 3,
        )
        .from(
          ".cinema-hero-copy h1 span",
          { autoAlpha: 0, y: RISE_CINEMA, duration: DURATION_CINEMA },
          `<${STAGGER_CINEMA}`,
        )
        .from(
          ".hero-actions",
          { autoAlpha: 0, y: RISE_CINEMA, duration: DURATION_CINEMA },
          `<${STAGGER_CINEMA}`,
        )
        .to(".chic-scroll", { autoAlpha: 1, duration: DURATION_CINEMA }, STAGGER_CINEMA * 5);

      // ---- pin-track: beats cross-fade while the camera orbits the can ----
      let pinTrigger: ScrollTrigger | undefined;
      if (pinRef.current) {
        const beatEls = gsap.utils.toArray<HTMLElement>(".pin-copy", pinRef.current);
        gsap.set(beatEls, { autoAlpha: (i) => (i === 0 ? 1 : 0) });

        const beatsTl = gsap
          .timeline({
            scrollTrigger: {
              trigger: pinRef.current,
              start: `top ${HEADER}px`,
              end: "+=200%",
              scrub: 1,
              pin: true,
            },
            defaults: { ease: "none" },
          })
          .to(beatEls[0], { autoAlpha: 0, duration: 0.03 }, 0.3)
          .fromTo(beatEls[1], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.33)
          .to(beatEls[1], { autoAlpha: 0, duration: 0.03 }, 0.63)
          .fromTo(beatEls[2], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.66)
          .to({}, { duration: 0.34 }, 0.66);
        pinTrigger = beatsTl.scrollTrigger;
      }

      // ---- reveal on scroll into view ----
      const reveal = (trigger: Element, items: Element[] | NodeListOf<Element>, start: string) =>
        gsap.from(items, {
          autoAlpha: 0,
          y: RISE,
          duration: DURATION,
          stagger: STAGGER,
          ease: "power2.out",
          scrollTrigger: { trigger, start, toggleActions: "play none none none" },
        });

      gsap.utils.toArray<HTMLElement>(".plate").forEach((plate) => {
        reveal(plate, plate.querySelectorAll(".plate-copy"), "top 85%");
      });
      gsap.utils.toArray<HTMLElement>(".showcase").forEach((section) => {
        reveal(
          section,
          section.querySelectorAll(".kicker, h2, .showcase-lede, .showcase-points li"),
          "top 75%",
        );
        // Phones drift slower than the page: depth without touching their tilt.
        gsap.fromTo(
          section.querySelector(".showcase-stage"),
          { y: 110 },
          {
            y: -70,
            ease: "none",
            scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
      const closeEl = document.querySelector<HTMLElement>(".cinema-close");
      if (closeEl) reveal(closeEl, closeEl.querySelectorAll(".close-copy > *"), "top 80%");

      // ---- 3D scene: one chapter per can slot, marked where that slot is in focus ----
      const focus = (selector: string) => {
        const el = document.querySelector(selector);
        if (!el) return 0;
        const r = el.getBoundingClientRect();
        return r.top + window.scrollY + r.height / 2 - window.innerHeight / 2;
      };
      let marks: number[] = [0];
      const toChapter = (y: number) => {
        for (let i = 0; i < marks.length - 1; i++) {
          if (y < marks[i + 1]) return i + Math.max(0, y - marks[i]) / (marks[i + 1] - marks[i]);
        }
        return marks.length - 1;
      };
      const measure = () => {
        const max = ScrollTrigger.maxScroll(window);
        const pinStart = pinTrigger?.start ?? 0;
        const pinSpan = (pinTrigger?.end ?? pinStart) - pinStart;
        marks = [
          0,
          ...BEAT_FOCUS.map((p) => pinStart + pinSpan * p),
          focus('[data-can-anchor="plate-1"]'),
          focus('[data-can-anchor="plate-2"]'),
          focus('[data-can-anchor="plate-3"]'),
          focus('[data-can-anchor="sistema"]'),
          focus('[data-can-anchor="varejo"]'),
          focus('[data-can-anchor="close"]'),
        ]
          .slice(0, CHAPTERS)
          .map((m) => Math.min(Math.max(m, 0), max));
        for (let i = 1; i < marks.length; i++) marks[i] = Math.max(marks[i], marks[i - 1] + 1);
        sceneScroll.chapter = toChapter(window.scrollY);
      };
      measure();
      ScrollTrigger.addEventListener("refresh", measure);

      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          sceneScroll.chapter = toChapter(self.scroll());
          sceneScroll.velocity = self.getVelocity();
        },
      });

      return () => ScrollTrigger.removeEventListener("refresh", measure);
    },
    { scope: rootRef, dependencies: [reduce] },
  );

  return (
    <div className={reduce ? "landing" : "landing has-scene"} ref={rootRef}>
      {!reduce && (
        <Suspense fallback={null}>
          <Scene3D />
        </Suspense>
      )}

      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="landing-top">
        <BrandMark />
        <nav className="landing-nav" aria-label="Entrada">
          {/* One door: signed out it asks for the login, signed in it opens Rotas directly. */}
          <Link className="btn btn-primary" to="/rotas" viewTransition>
            Entrar
          </Link>
        </nav>
        <div className="page-line" aria-hidden="true" />
      </header>

      <section className="cinema-hero chic-hero" id="conteudo">
        <div className="chic-vignette" aria-hidden="true" />
        <div className="curtain" aria-hidden="true" />
        {!reduce && <div className="can-slot can-slot-hero" data-can-anchor="hero" aria-hidden="true" />}

        {reduce && (
          <div className="cinema-hero-stage" aria-hidden="true">
            <span className="chic-blob chic-blob-a" />
            <span className="chic-blob chic-blob-b" />
            <span className="orb chic-orb" />
            <img className="pixel cinema-can" src={can} alt="" />
          </div>
        )}

        <div className="cinema-hero-copy">
          <p className="kicker chic-kicker">
            <span className="chic-rule" aria-hidden="true" />
            Indústria de bebidas não alcoólicas
          </p>
          <h1>
            Joja Cola.
            <span>Consumo adequado para qualquer situação.</span>
          </h1>
          <div className="hero-actions">
            <Link className="btn btn-primary btn-lg" to="/produtos" viewTransition>
              Fazer um pedido
            </Link>
            <a className="hero-link" href="#app">
              Ver como funciona
            </a>
          </div>
        </div>

        <p className="scroll-hint chic-scroll">
          <span className="chic-scroll-line" aria-hidden="true" />
          Rolar
        </p>
      </section>

      <section
        className={reduce ? "pin-track pin-track-static" : "pin-track"}
        ref={pinRef}
      >
        <div className="pin-stage">
          {!reduce && (
            <div className="can-slot can-slot-beats" data-can-anchor="beats" aria-hidden="true" />
          )}
          {reduce && (
            <div className="pin-can" aria-hidden="true">
              <span className="orb" />
              <img className="pixel" src={can} alt="" />
            </div>
          )}
          {beats.map((beat) => (
            <div key={beat.n} className="pin-copy">
              <p className="kicker">
                {beat.n} · {beat.kicker}
              </p>
              <h2>{beat.title}</h2>
              <p>{beat.line}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="plates" id="sistemas">
        <header className="plates-head">
          <p className="kicker">Infraestrutura operacional</p>
          <h2>Três sistemas. Uma linha.</h2>
        </header>
        {plates.map((plate, i) => (
          <article key={plate.n} className="plate">
            <div className="plate-copy">
              <p className="kicker">
                {plate.n} · {plate.kicker}
              </p>
              <h3>{plate.title}</h3>
              <p>{plate.line}</p>
              <p className="sys-gain">{plate.gain}</p>
            </div>
            <div className="plate-can" data-can-anchor={`plate-${i + 1}`} aria-hidden="true">
              {reduce && <img className="pixel" src={can} alt="" />}
            </div>
          </article>
        ))}
      </section>

      <section className="showcase" id="app">
        <div className="showcase-copy">
          <p className="kicker">O sistema</p>
          <h2>
            Acompanhe seus <em>pedidos</em>.
          </h2>
          <p className="showcase-lede">
            Da linha de envase até a sua porta, cada caixa rastreada em tempo real.
          </p>
          <ul className="showcase-points">
            <li>
              <b>Ao vivo</b>
              <span>Onde está o caminhão e a que horas chega.</span>
            </li>
            <li>
              <b>1 toque</b>
              <span>Repita o último pedido sem montar o carrinho.</span>
            </li>
            <li>
              <b>Histórico</b>
              <span>Notas, valores e entregas num só lugar.</span>
            </li>
          </ul>
        </div>
        <div className="showcase-stage">
          <PhoneFrame>
            <TrackingScreen flatCan={reduce} />
          </PhoneFrame>
        </div>
      </section>

      <section className="showcase showcase-reverse">
        <div className="showcase-copy">
          <p className="kicker">Varejo</p>
          <h2>
            Receba recomendações <em>personalizadas</em>.
          </h2>
          <p className="showcase-lede">
            O app aprende o giro da sua gôndola e sugere a reposição antes de faltar.
          </p>
          <ul className="showcase-points">
            <li>
              <b>Sob medida</b>
              <span>Sugestões pelo histórico de vendas da loja.</span>
            </li>
            <li>
              <b>Sem ruptura</b>
              <span>Aviso antes do estoque zerar.</span>
            </li>
            <li>
              <b>Preço claro</b>
              <span>Caixa fechada, valor final na tela.</span>
            </li>
          </ul>
        </div>
        <div className="showcase-stage">
          <PhoneFrame>
            <ShopScreen flatCan={reduce} />
          </PhoneFrame>
        </div>
      </section>

      <section className="cinema-close">
        <div className="close-copy">
          <p className="kicker">Joja Co.</p>
          <h2>Da linha de envase à gôndola.</h2>
          <p>Controle integrado de ponta a ponta. Fábrica, frota, mercado.</p>
          <Link className="btn btn-primary btn-lg" to="/login" viewTransition>
            Abrir o sistema
          </Link>
        </div>
        {!reduce && <div className="can-slot can-slot-close" data-can-anchor="close" aria-hidden="true" />}
      </section>
    </div>
  );
}
