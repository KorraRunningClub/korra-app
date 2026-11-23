import { CORES_NIVEL, type Nivel } from "@/lib/conquistas";

// Medalha original da Korrá: fita + disco com o número da meta. Cinza quando ainda está bloqueada.
export function Medalha({ nivel, numero, liberada, tamanho = 112, simbolo }: { nivel: Nivel; numero: number; liberada: boolean; tamanho?: number; simbolo?: "aviao" }) {
  const c = liberada ? CORES_NIVEL[nivel] : { a: "#dedcc6", b: "#a9a794", fita: "#b9b7a4" };
  const id = `m-${nivel}-${numero}-${liberada ? 1 : 0}`;
  return (
    <svg width={tamanho} height={tamanho * 1.25} viewBox="0 0 100 125" aria-hidden="true" className={`medalha-svg${liberada ? "" : " bloqueada"}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c.a} />
          <stop offset="1" stopColor={c.b} />
        </linearGradient>
      </defs>
      <path d="M28 0h18l10 40H38Z" fill={c.fita} />
      <path d="M72 0H54L44 40h18Z" fill={c.fita} opacity=".85" />
      <path d="M36 0h4l10 40h-4Z" fill="#FED261" opacity={liberada ? 1 : 0.35} />
      <circle cx="50" cy="80" r="38" fill={`url(#${id})`} />
      <circle cx="50" cy="80" r="30" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2.5" strokeDasharray="3 4" />
      {simbolo === "aviao" ? (
        <path transform="translate(50 80) rotate(-35) scale(1.15)" fill={liberada ? "#1f251e" : "#8f8d7b"}
          d="M-2 -18c0-2 4-2 4 0v12l14 8v4l-14-4v9l4 3v3l-6-2-6 2v-3l4-3v-9l-14 4v-4l14-8Z" />
      ) : (
      <text x="50" y="92" textAnchor="middle" fontFamily="Archivo, Arial Black, sans-serif" fontWeight="900" fontSize={numero >= 10 ? 32 : 36} fill={liberada ? "#1f251e" : "#8f8d7b"}>
        {numero}
      </text>
      )}
      {!liberada && (
        <g transform="translate(64 96)">
          <circle r="11" fill="#8f8d7b" />
          <path d="M-4 -1v-3a4 4 0 0 1 8 0v3" stroke="#fff" strokeWidth="2" fill="none" />
          <rect x="-5.5" y="-1" width="11" height="8" rx="2" fill="#fff" />
        </g>
      )}
    </svg>
  );
}
