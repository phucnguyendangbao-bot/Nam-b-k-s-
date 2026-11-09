/**
 * Tranh nét cho sáu chương của trang chủ. Vẽ tay bằng SVG, chỉ là minh họa của trang (không phải tư liệu):
 * nét tự vẽ ra khi chương hiện, rồi một chuyển động nhỏ sống tiếp (nước trôi, ghe dập dềnh, trăng lên, chữ đổi lượt).
 * Mọi nét dùng pathLength=1 để CSS vẽ bằng stroke-dashoffset (app/design/narrative.css).
 */
const L = { pathLength: 1 } as const;

function Waves({ y, cls = 'a a2', slow = false }: { y: number; cls?: string; slow?: boolean }) {
  // Sóng dài hơn khung 40px để trôi sang trái mà không lộ đầu sóng (khung có clipPath).
  return <path {...L} className={`${cls} loop-drift ${slow ? 'slow' : ''}`} d={`M-10 ${y} q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0`} />;
}

const art: Record<string, React.ReactNode> = {
  /* Nước: mây, mưa rơi, ba lớp sóng phù sa */
  nuoc: <>
    <path {...L} className="a" d="M58 46c-12 0-18-12-8-18 0-12 18-16 24-6 6-10 26-8 26 6 12 0 14 18 0 18z" />
    <path {...L} className="a a2 loop-fall" d="M66 60v8" /><path {...L} className="a a2 loop-fall" d="M80 58v10" /><path {...L} className="a a2 loop-fall" d="M94 60v8" />
    <circle className="f loop-glow" cx="168" cy="40" r="20" />
    <path {...L} className="a" d="M168 12v6M168 62v6M140 40h6M190 40h6M148 20l4 4M184 56l4 4M148 60l4-4M184 24l4-4" />
    <g clipPath="url(#clip-nuoc)"><Waves y={100} /><Waves y={118} slow /><Waves y={136} /></g>
    <path className="f f2" d="M0 104q60 -10 120 0t120 0V146q-60 8 -120 0t-120 0z" />
  </>,
  /* Dấu vết: các lớp đất, một chiếc bình gốm nằm trong lớp sâu, cái mai đào */
  'dau-vet': <>
    <path {...L} className="a" d="M8 58q58-10 112 0t112 0" />
    <path {...L} className="a" d="M8 84q58 8 112 0t112 0" />
    <path {...L} className="a" d="M8 112q58-8 112 0t112 0" />
    <path {...L} className="a" d="M8 140q58 6 112 0t112 0" />
    <path className="f" d="M8 84q58 8 112 0t112 0V112q-56-8-112 0t-112 0z" />
    <path {...L} className="a a2" d="M132 92c-8 0-12 6-10 14 2 10 6 20 16 20s14-10 16-20c2-8-2-14-10-14z" />
    <path {...L} className="a a2" d="M134 92v-5h8v5M126 106h26" />
    <path {...L} className="a a2" d="M60 98l8 4-3 6-7-2z" />
    <g className="loop-dig"><path {...L} className="a" d="M196 18v34" /><path {...L} className="a" d="M188 52h16l-3 12h-10z" /></g>
  </>,
  /* Bến sông: ghe hàng dập dềnh, cột bến, sóng */
  'ben-song': <>
    <path {...L} className="a" d="M24 30v86M18 30h12" />
    <g className="loop-bob">
      <path {...L} className="a" d="M58 96h132l-14 18H74z" />
      <path className="f" d="M58 96h132l-14 18H74z" />
      <path {...L} className="a" d="M86 96V74h40v22M126 80h28v16" />
      <path {...L} className="a a2" d="M96 74c0-10 20-10 20 0" />
      <circle {...L} className="a a2" cx="140" cy="88" r="5" /><circle {...L} className="a a2" cx="150" cy="88" r="4" />
      <path {...L} className="a" d="M170 96l-6-46M164 50l18 10" />
    </g>
    <g clipPath="url(#clip-ben-song)"><Waves y={122} /><Waves y={140} slow /></g>
  </>,
  /* Nếp nhà: mái ngói cong đầu, hàng cột, cửa vòm, bậc thềm, đèn lồng đung đưa */
  'nep-nha': <>
    <path {...L} className="a" d="M20 58q100-40 200 0M34 52l-14 6 10 4M206 52l14 6-10 4" />
    <path {...L} className="a" d="M36 62h168v66H36z" />
    <path className="f" d="M36 62h168v66H36z" />
    <path {...L} className="a a2" d="M62 128v-30a12 12 0 0 1 24 0v30M108 128v-34a12 12 0 0 1 24 0v34M154 128v-30a12 12 0 0 1 24 0v30" />
    <path {...L} className="a" d="M24 134h192M16 142h208M8 150h224" />
    <g className="loop-swing"><path {...L} className="a" d="M120 62v10" /><path {...L} className="a a2" d="M114 72h12v10h-12z" /><path className="f f2" d="M114 72h12v10h-12z" /></g>
  </>,
  /* Mùa hội: trăng lên, sao, ghe Ngo dài với hàng mái chèo */
  'mua-hoi': <>
    <g className="loop-rise"><circle {...L} className="a" cx="168" cy="40" r="22" /><circle className="f loop-glow" cx="168" cy="40" r="30" /></g>
    <path {...L} className="a loop-twinkle" d="M40 26v8M36 30h8" /><path {...L} className="a loop-twinkle" d="M96 16v6M93 19h6" /><path {...L} className="a loop-twinkle" d="M120 50v6M117 53h6" />
    <path {...L} className="a" d="M10 106q110 22 220 -8l-6 -6q-100 22-208 6z" />
    <path className="f" d="M10 106q110 22 220 -8l-6 -6q-100 22-208 6z" />
    {[40, 62, 84, 106, 128, 150, 172].map(x => <path key={x} {...L} className="a a2 loop-row" d={`M${x} 104l-6 22`} />)}
    <g clipPath="url(#clip-mua-hoi)"><Waves y={136} slow /></g>
  </>,
  /* Tiếng nói: hai bóng thoại, chữ đổi lượt: bậu – qua, mần – hổng */
  'tieng-noi': <>
    <path {...L} className="a" d="M14 30h112v52H54l-18 16V82H14z" />
    <path className="f" d="M14 30h112v52H54l-18 16V82H14z" />
    <path {...L} className="a a2" d="M110 76h116v50h-22v16l-18-16h-76z" />
    <text x="70" y="66" textAnchor="middle" fontSize="26" className="loop-say">bậu</text>
    <text x="70" y="66" textAnchor="middle" fontSize="26" className="loop-say b">mần</text>
    <text x="168" y="110" textAnchor="middle" fontSize="26" className="loop-say b r">qua</text>
    <text x="168" y="110" textAnchor="middle" fontSize="26" className="loop-say r">hổng</text>
  </>,
};

export function ChapterArt({ slug }: { slug: string }) {
  const body = art[slug];
  if (!body) return null;
  return (
    <svg className="ch-art" viewBox="0 0 240 160" aria-hidden="true" focusable="false" data-nx>
      <defs><clipPath id={`clip-${slug}`}><rect x="0" y="80" width="240" height="80" /></clipPath></defs>
      {body}
    </svg>
  );
}

/** Lằn sông giữa hai chương: sông tự vẽ theo cuộn, một chiếc ghe chở người đọc sang chương sau. */
export function ChapterRiver() {
  return (
    <span className="ch-river" aria-hidden="true">
      <svg viewBox="0 0 1200 40" preserveAspectRatio="none">
        <path className="river back" d="M0 20 C 150 8, 300 32, 450 20 S 750 8, 900 20 S 1100 30, 1200 18" />
        <path className="river" pathLength={1} d="M0 20 C 150 8, 300 32, 450 20 S 750 8, 900 20 S 1100 30, 1200 18" />
      </svg>
      <span className="ch-boat">
        <svg viewBox="0 0 44 26" width="44" height="26"><path className="sail" d="M22 2v16H10z" /><path d="M2 18h40l-6 7H8z" /><path d="M22 2v16" stroke="currentColor" strokeWidth="1.4" /></svg>
      </span>
    </span>
  );
}
