"use client";

import { useEffect } from "react";

// A "onda" amarela da logo sai do lugar, voa descontrolada pela borda da tela e pousa de volta em cima do KO.
// Toca uma vez por visita (sessão). Respeita quem pediu para reduzir animações. Clique em qualquer lugar pula.
const ONDA = "M 34.03 171.29 C 79.42 176.70 134.32 182.12 196.84 185.91 C 217.81 187.18 275.12 190.42 350.56 191.05 C 425.37 191.67 480.16 189.40 554.87 186.31 C 626.90 183.33 682.41 179.78 716.10 177.61 C 768.04 174.27 770.94 173.57 867.46 166.55 C 928.44 162.11 996.80 157.33 1074.26 152.49 C 1162.69 146.95 1191.73 145.78 1217.56 145.03 C 1227.61 144.74 1272.47 143.49 1331.40 143.63 C 1365.73 143.71 1391.22 144.23 1419.92 144.81 C 1462.84 145.69 1479.23 146.46 1487.44 146.88 C 1499.41 147.5 1522.57 148.71 1551.59 151.47 C 1577.94 153.99 1611.99 158.05 1651.82 164.97 L 1651.82 89.11 C 1588.29 82.39 1532.23 78.30 1485.58 75.73 C 1462.94 74.48 1415.03 72.07 1353.54 71.07 C 1321.01 70.55 1270.30 70.19 1208.10 71.77 C 1157.31 73.07 1118.78 75.25 1041.73 79.61 C 1028.15 80.38 984.92 82.85 927.52 86.72 C 898.83 88.66 883.65 89.79 807.39 95.42 C 714.91 102.24 668.40 105.66 655.16 106.49 C 577.77 111.28 519.51 113.15 505.08 113.59 C 467.28 114.76 410.18 116.46 335.15 115.57 C 273.98 114.84 212.07 113.98 130.76 106.49 C 91.42 102.86 58.75 98.72 35.75 95.53 C 35.17 120.78 34.60 146.03 34.03 171.29 ";
const VB = { x: 34, y: 70, w: 1618, h: 122 }; // caixa da onda dentro do desenho da logo
const LOGO = { x: 0, y: 60, w: 2206 }; // viewBox da logo

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export function OndaVoadora() {
  useEffect(() => {
    const svg = document.querySelector<SVGSVGElement>(".hero-mark svg");
    const caixa = svg?.closest(".hero-mark");
    if (!svg || !caixa) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.scrollY > 200) return;
    try {
      if (sessionStorage.getItem("onda-voou")) return;
      sessionStorage.setItem("onda-voou", "1");
    } catch {}

    const r = svg.getBoundingClientRect();
    const s = r.width / LOGO.w;
    const W = VB.w * s;
    const H = VB.h * s;
    const alvo = { x: r.left + (VB.x - LOGO.x) * s, y: r.top + (VB.y - LOGO.y) * s };
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // pontos pela borda da tela, no sentido horário, começando num lado aleatório
    const k = Math.min(0.55, (vw * 0.42) / W); // na borda ela fica menor
    const m = 10; // distância da borda
    const borda = (lado: number) => {
      // (x, y) = canto do elemento sem escala; a escala gira em torno do centro
      const w = W * k, h = H * k;
      const pos = (cx: number, cy: number, rot: number) => ({ x: cx - W / 2, y: cy - H / 2, rot });
      switch (lado % 4) {
        case 0: return pos(rnd(m + w / 2, vw - m - w / 2), m + h / 2, rnd(-18, 18)); // topo
        case 1: return pos(vw - m - h / 2, rnd(vh * 0.2, vh * 0.8), 90 + rnd(-20, 20)); // direita
        case 2: return pos(rnd(m + w / 2, vw - m - w / 2), vh - m - h / 2, 180 + rnd(-18, 18)); // baixo
        default: return pos(m + h / 2, rnd(vh * 0.2, vh * 0.8), 270 + rnd(-20, 20)); // esquerda
      }
    };
    const inicio = Math.floor(rnd(0, 4));
    const passos = 7 + Math.floor(rnd(0, 3));
    let giro = 0;
    const quadros: Keyframe[] = [{ transform: `translate(${alvo.x}px, ${alvo.y}px) rotate(0deg) scale(1)`, offset: 0 }];
    for (let i = 0; i < passos; i++) {
      const p = borda(inicio + Math.floor(i * 1.4));
      if (Math.random() < 0.3) giro += 360 * (Math.random() < 0.5 ? -1 : 1); // um rodopio de vez em quando
      const vira = Math.random() < 0.35 ? -1 : 1;
      quadros.push({
        transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rot + giro}deg) scale(${k * rnd(0.85, 1.15)}, ${k * vira * rnd(0.8, 1.3)})`,
        offset: 0.08 + (0.8 * i) / passos,
        easing: Math.random() < 0.5 ? "cubic-bezier(.7,0,.3,1)" : "cubic-bezier(.2,.9,.3,1.3)",
      });
    }
    quadros.push({ transform: `translate(${alvo.x}px, ${alvo.y - H * 1.2}px) rotate(${giro + 360 * Math.sign(giro || 1)}deg) scale(1.15)`, offset: 0.93, easing: "cubic-bezier(.3,0,.2,1)" });
    quadros.push({ transform: `translate(${alvo.x}px, ${alvo.y}px) rotate(${giro + 360 * Math.sign(giro || 1)}deg) scale(1)`, offset: 1 });

    const ns = "http://www.w3.org/2000/svg";
    const criar = (opacidade: number) => {
      const el = document.createElementNS(ns, "svg");
      el.setAttribute("viewBox", `${VB.x} ${VB.y} ${VB.w} ${VB.h}`);
      el.setAttribute("aria-hidden", "true");
      Object.assign(el.style, {
        position: "fixed", left: "0", top: "0", width: `${W}px`, height: `${H}px`, zIndex: "80",
        pointerEvents: "none", transformOrigin: "50% 50%", opacity: String(opacidade), overflow: "visible",
        filter: opacidade === 1 ? "drop-shadow(0 6px 10px rgba(0,0,0,.25))" : "none",
      } as Partial<CSSStyleDeclaration>);
      const p = document.createElementNS(ns, "path");
      p.setAttribute("d", ONDA);
      p.setAttribute("fill", "#FED261");
      el.appendChild(p);
      document.body.appendChild(el);
      return el;
    };

    caixa.classList.add("onda-voando");
    const duracao = 4200;
    const rastro = [0.28, 0.14].map((o, i) => ({ el: criar(o), atraso: 70 * (i + 1) }));
    const principal = criar(1);
    const anims = [
      ...rastro.map((t) => t.el.animate(quadros, { duration: duracao, delay: t.atraso, fill: "both" })),
      principal.animate(quadros, { duration: duracao, fill: "both" }),
    ];

    let acabou = false;
    const terminar = () => {
      if (acabou) return;
      acabou = true;
      anims.forEach((a) => a.cancel());
      [principal, ...rastro.map((t) => t.el)].forEach((el) => el.remove());
      caixa.classList.remove("onda-voando");
      caixa.classList.add("onda-pousou");
      setTimeout(() => caixa.classList.remove("onda-pousou"), 700);
      window.removeEventListener("pointerdown", terminar);
      window.removeEventListener("scroll", aoRolar);
    };
    const aoRolar = () => window.scrollY > 120 && terminar();
    anims[anims.length - 1].onfinish = terminar;
    window.addEventListener("pointerdown", terminar, { once: true });
    window.addEventListener("scroll", aoRolar, { passive: true });
    return terminar;
  }, []);

  return null;
}
