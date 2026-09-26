// La nutria: compañera de campo. Ilustración propia (SVG), con sombrero de naturalista.
// Un solo cuerpo; cambian la expresión y lo que lleva en las patas según el momento.

export type PoseNutria =
  | 'saludo' // empezar una lección
  | 'explica' // explicar una mecánica (con su cuaderno)
  | 'lupa' // concentrada: examen
  | 'celebra' // acierto importante
  | 'animo' // tras fallos: ánimo sin reproche
  | 'medalla'; // mundo superado

const TINTA = '#2b1d15';
const PELO = '#8c5a3a';
const PELO_OSCURO = '#6e4329';
const CREMA = '#f1dcb8';
const SOMBRERO = '#6e7a45';
const SOMBRERO_OSCURO = '#566036';
const trazo = { stroke: TINTA, strokeWidth: 2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

function Ojos({ pose }: { pose: PoseNutria }) {
  if (pose === 'celebra' || pose === 'medalla') {
    // Ojos felices, en arco.
    return (
      <g fill="none" {...trazo} strokeWidth={2.4}>
        <path d="M46 45 Q50 40.5 54 45" />
        <path d="M66 45 Q70 40.5 74 45" />
      </g>
    );
  }
  const guiño = pose === 'saludo';
  return (
    <g>
      <circle cx="50" cy="44" r="3.6" fill={TINTA} />
      <circle cx="51.3" cy="42.7" r="1.1" fill="#fff" />
      {guiño
        ? <path d="M66 44.5 Q70 41 74 44.5" fill="none" {...trazo} strokeWidth={2.4} />
        : <><circle cx="70" cy="44" r="3.6" fill={TINTA} /><circle cx="71.3" cy="42.7" r="1.1" fill="#fff" /></>}
      {pose === 'animo' && <g fill="none" {...trazo} strokeWidth={1.6}><path d="M45 37.5 Q49 35.5 53 37" /><path d="M67 37 Q71 35.5 75 37.5" /></g>}
    </g>
  );
}

function Boca({ pose }: { pose: PoseNutria }) {
  if (pose === 'celebra' || pose === 'medalla') {
    return <path d="M54.5 57 Q60 65 65.5 57 Z" fill="#8f3b2e" {...trazo} strokeWidth={1.6} />;
  }
  if (pose === 'lupa') return <circle cx="60" cy="58.5" r="1.9" fill={TINTA} />;
  return <path d="M55.5 57 Q58 59.6 60 57.4 Q62 59.6 64.5 57" fill="none" {...trazo} strokeWidth={1.7} />;
}

/** Patas y objetos según la pose. */
function Patas({ pose }: { pose: PoseNutria }) {
  const pata = (cx: number, cy: number) => <ellipse cx={cx} cy={cy} rx="5.2" ry="4.6" fill={PELO_OSCURO} {...trazo} strokeWidth={1.8} />;
  switch (pose) {
    case 'saludo':
      return (
        <g>
          <path d="M80 76 Q92 68 94 54" fill="none" stroke={TINTA} strokeWidth="9.5" strokeLinecap="round" />
          <path d="M80 76 Q92 68 94 54" fill="none" stroke={PELO} strokeWidth="6" strokeLinecap="round" />
          {pata(94.5, 51)}
          <g stroke={TINTA} strokeWidth="1.6" strokeLinecap="round"><path d="M101 44 l3 -3" /><path d="M103 50 l4 -1" /></g>
          {pata(50, 84)}
        </g>
      );
    case 'explica':
      // Cuaderno de campo abierto, sujeto con las dos patas.
      return (
        <g>
          <path d="M40 77 L60 81 L80 77 L80 99 L60 103 L40 99 Z" fill="#fffaf0" {...trazo} />
          <path d="M60 81 L60 103" {...trazo} fill="none" />
          <g stroke="#9aa48a" strokeWidth="1.4" strokeLinecap="round"><path d="M45 85 L56 87" /><path d="M45 90 L56 92" /><path d="M64 87 L75 85" /><path d="M64 92 L72 90.5" /></g>
          <path d="M67 97 q3 -5 6 0 q-3 3 -6 0z" fill="#3f8f4f" />
          {pata(40, 88)}{pata(80, 88)}
        </g>
      );
    case 'lupa':
      return (
        <g>
          <path d="M80 76 Q88 72 90 64" fill="none" stroke={TINTA} strokeWidth="9.5" strokeLinecap="round" />
          <path d="M80 76 Q88 72 90 64" fill="none" stroke={PELO} strokeWidth="6" strokeLinecap="round" />
          <path d="M84 56 L91 66" stroke={TINTA} strokeWidth="6" strokeLinecap="round" />
          <path d="M84 56 L91 66" stroke="#b98a4e" strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="75" cy="44" r="10.5" fill="rgb(210 235 240 / 0.45)" {...trazo} strokeWidth={2.6} />
          <circle cx="75" cy="44" r="5.2" fill={TINTA} />
          <circle cx="77" cy="42" r="1.6" fill="#fff" />
          <path d="M69 40 Q71 37 74 36.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          {pata(91, 64)}{pata(50, 86)}
        </g>
      );
    case 'celebra':
      return (
        <g>
          {[['M40 76 Q30 66 28 52', 28, 49], ['M80 76 Q90 66 92 52', 92, 49]].map(([d, x, y]) => (
            <g key={String(d)}>
              <path d={String(d)} fill="none" stroke={TINTA} strokeWidth="9.5" strokeLinecap="round" />
              <path d={String(d)} fill="none" stroke={PELO} strokeWidth="6" strokeLinecap="round" />
              {pata(Number(x), Number(y))}
            </g>
          ))}
          <g fill="#f4a531" stroke={TINTA} strokeWidth="1.3" strokeLinejoin="round">
            <path d="M16 36 l2.2 4.6 4.8 .7 -3.5 3.3 .9 4.8 -4.4 -2.3 -4.4 2.3 .9 -4.8 -3.5 -3.3 4.8 -.7z" />
            <path d="M103 30 l1.6 3.3 3.5 .5 -2.5 2.4 .6 3.5 -3.2 -1.7 -3.2 1.7 .6 -3.5 -2.5 -2.4 3.5 -.5z" />
          </g>
        </g>
      );
    case 'animo':
      // Sujeta un brote: se aprende fallando.
      return (
        <g>
          <path d="M60 92 L60 74" stroke="#3f8f4f" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M60 80 q-9 -2 -10 -10 q8 0 10 10z" fill="#5aa65f" {...trazo} strokeWidth={1.5} />
          <path d="M60 76 q8 -3 11 -10 q-9 0 -11 10z" fill="#7dbb6b" {...trazo} strokeWidth={1.5} />
          {pata(54, 90)}{pata(66, 90)}
        </g>
      );
    case 'medalla':
      return (
        <g>
          <path d="M50 62 L57 80 M70 62 L63 80" stroke="#2f7fd0" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="60" cy="84" r="7.5" fill="#f4a531" {...trazo} />
          <path d="M60 79.5 l1.5 3 3.3 .5 -2.4 2.3 .6 3.3 -3 -1.6 -3 1.6 .6 -3.3 -2.4 -2.3 3.3 -.5z" fill="#fff4d6" />
          {[['M40 76 Q30 66 28 52', 28, 49], ['M80 76 Q90 66 92 52', 92, 49]].map(([d, x, y]) => (
            <g key={String(d)}>
              <path d={String(d)} fill="none" stroke={TINTA} strokeWidth="9.5" strokeLinecap="round" />
              <path d={String(d)} fill="none" stroke={PELO} strokeWidth="6" strokeLinecap="round" />
              {pata(Number(x), Number(y))}
            </g>
          ))}
        </g>
      );
  }
}

interface Props {
  pose: PoseNutria;
  size?: number;
  className?: string;
}

/** Ilustración de la nutria. Decorativa: el texto que la acompaña lleva el mensaje. */
export function Nutria({ pose, size = 96, className }: Props) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      {/* Cola */}
      <path d="M78 104 C101 106 115 93 117 70 C109 84 97 92 80 93 Z" fill={PELO_OSCURO} {...trazo} />
      {/* Cuerpo y pecho */}
      <path d="M34 110 C28 88 34 66 60 62 C86 66 92 88 86 110 Z" fill={PELO} {...trazo} />
      <path d="M45 108 C41 91 46 76 60 74 C74 76 79 91 75 108 Z" fill={CREMA} />
      <ellipse cx="47" cy="110" rx="8" ry="4.2" fill={PELO_OSCURO} {...trazo} strokeWidth={1.8} />
      <ellipse cx="73" cy="110" rx="8" ry="4.2" fill={PELO_OSCURO} {...trazo} strokeWidth={1.8} />
      {/* Cabeza */}
      <circle cx="35" cy="39" r="5" fill={PELO} {...trazo} />
      <circle cx="85" cy="39" r="5" fill={PELO} {...trazo} />
      <circle cx="35" cy="39" r="2.2" fill={PELO_OSCURO} />
      <circle cx="85" cy="39" r="2.2" fill={PELO_OSCURO} />
      <ellipse cx="60" cy="48" rx="28.5" ry="20.5" fill={PELO} {...trazo} />
      <ellipse cx="60" cy="56" rx="17.5" ry="10.5" fill={CREMA} />
      <ellipse cx="44" cy="52" rx="3.6" ry="2.2" fill="#e59a86" opacity="0.55" />
      <ellipse cx="76" cy="52" rx="3.6" ry="2.2" fill="#e59a86" opacity="0.55" />
      <Ojos pose={pose} />
      <path d="M54 50.5 Q60 47 66 50.5 Q63 55 60 55 Q57 55 54 50.5 Z" fill={TINTA} />
      <Boca pose={pose} />
      <g stroke={TINTA} strokeWidth="1.1" strokeLinecap="round" opacity="0.7">
        <path d="M46 55 L35 53" /><path d="M46 58 L36 59" /><path d="M74 55 L85 53" /><path d="M74 58 L84 59" />
      </g>
      {/* Sombrero de campo */}
      <ellipse cx="60" cy="31" rx="26" ry="5" fill={SOMBRERO_OSCURO} {...trazo} />
      <path d="M44 31 C44 16 76 16 76 31 Z" fill={SOMBRERO} {...trazo} />
      <path d="M44.6 27 C51 28.6 69 28.6 75.4 27 L76 31 C69 32.4 51 32.4 44 31 Z" fill="#c9a86a" />
      <Patas pose={pose} />
    </svg>
  );
}
