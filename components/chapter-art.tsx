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
  /* Bến sông: ghe hàng chợ nổi (mũi cong có mắt ghe, mui cong, cây bẹo treo hàng mẫu), cột bến, sóng */
  'ben-song': <>
    <path {...L} className="a" d="M24 30v86M18 30h12" />
    <g className="loop-bob">
      <path {...L} className="a" d="M46 94h132q14 0 22-14l-6 22q-4 12-18 12H66q-14 0-20-20z" />
      <path className="f" d="M46 94h132q14 0 22-14l-6 22q-4 12-18 12H66q-14 0-20-20z" />
      <path {...L} className="a a2" d="M184 92q4-4 8 0q-4 4-8 0z" />
      <path {...L} className="a" d="M74 94V80q24-18 50 0v14" />
      <path {...L} className="a a2" d="M86 74v20M99 70v24M112 74v20" />
      <circle {...L} className="a a2" cx="136" cy="89" r="5" /><circle {...L} className="a a2" cx="146" cy="90" r="4" />
      <path {...L} className="a" d="M160 94V36" />
      <path {...L} className="a a2" d="M160 40l-9 8M160 40l9 8M160 40v10" />
      <circle {...L} className="a a2" cx="151" cy="52" r="4" /><circle {...L} className="a a2" cx="169" cy="52" r="4" /><circle {...L} className="a a2" cx="160" cy="54" r="3.5" />
    </g>
    <g clipPath="url(#clip-ben-song)"><Waves y={122} /><Waves y={140} slow /></g>
  </>,
  /* Nếp nhà: mái ngói thấp thẳng nét kiểu nhà cổ Bình Thủy, hàng cửa vòm, bậc thềm, hai chậu kiểng hai bên thềm */
  'nep-nha': <>
    <path {...L} className="a" d="M14 62L42 38H198L226 62z" />
    <path className="f" d="M14 62L42 38H198L226 62z" />
    <path {...L} className="a a2" d="M52 40v20M64 40v20M76 40v20M88 40v20M100 40v20M112 40v20M124 40v20M136 40v20M148 40v20M160 40v20M172 40v20M184 40v20" />
    <path {...L} className="a" d="M36 62h168v66H36z" />
    <path className="f" d="M36 62h168v66H36z" />
    <path {...L} className="a a2" d="M62 128v-30a12 12 0 0 1 24 0v30M108 128v-34a12 12 0 0 1 24 0v34M154 128v-30a12 12 0 0 1 24 0v30" />
    <path {...L} className="a" d="M24 134h192M16 142h208M8 150h224" />
    <g><path {...L} className="a a2" d="M14 134h14l-3 12h-8zM21 134v-10M21 124c-6-2-8-8-4-10 3 3 4 6 4 10 0-6 4-10 8-9 1 4-3 8-8 9" /></g>
    <g><path {...L} className="a a2" d="M212 134h14l-3 12h-8zM219 134v-10M219 124c-6-2-8-8-4-10 3 3 4 6 4 10 0-6 4-10 8-9 1 4-3 8-8 9" /></g>
  </>,
  /* Mùa hội (Oóc Om Bóc): trăng lên, sao, ghe Ngo của người Khmer: thân dài thon, mũi và lái cong vút, hàng tay bơi */
  'mua-hoi': <>
    <g className="loop-rise"><circle {...L} className="a" cx="168" cy="40" r="22" /><circle className="f loop-glow" cx="168" cy="40" r="30" /></g>
    <path {...L} className="a loop-twinkle" d="M40 26v8M36 30h8" /><path {...L} className="a loop-twinkle" d="M96 16v6M93 19h6" /><path {...L} className="a loop-twinkle" d="M120 50v6M117 53h6" />
    <path {...L} className="a" d="M16 104q-8-10-6-26q6 14 20 22q90 14 178-2q14-10 18-26q6 18-8 32q-100 22-202 0z" />
    <path className="f" d="M16 104q-8-10-6-26q6 14 20 22q90 14 178-2q14-10 18-26q6 18-8 32q-100 22-202 0z" />
    <path {...L} className="a a2" d="M223 80l4-6M224 84l5-2" />
    {[44, 66, 88, 110, 132, 154, 176].map(x => <circle key={`h${x}`} {...L} className="a a2" cx={x + 3} cy="95" r="3" />)}
    {[44, 66, 88, 110, 132, 154, 176].map(x => <path key={x} {...L} className="a a2 loop-row" d={`M${x} 102l-6 22`} />)}
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
      {/* Ghe Nam Bộ: thân thấp, hai đầu vểnh, mui cong ở giữa, người đội nón lá đứng chèo ở lái. */}
      <span className="ch-boat">
        <svg viewBox="0 0 64 30" width="64" height="30">
          <path className="oar" d="M14 14L4 29" />
          <path className="mui" d="M24 21v-6q10-9 20 0v6z" />
          <path className="rib" d="M29 12.5V21M34 11V21M39 12.5V21" />
          <path className="hull" d="M2 18q6 3 12 3h34q8 0 14-8l-3 9q-3 6-10 6H14q-8 0-12-10z" />
          <path className="hull" d="M12 21l1.6-9h3l1.4 9z" />
          <circle className="hull" cx="15" cy="9.6" r="1.8" />
          <path className="hat" d="M10.5 9.4L15 5.6l4.5 3.8z" />
        </svg>
      </span>
    </span>
  );
}
