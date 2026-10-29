/**
 * Lò xo vật lý nhỏ gọn theo cách Apple mô tả (WWDC 2018 “Designing Fluid Interfaces”):
 * - Hai tham số cho người thiết kế: `damping` (1 = không nảy, < 1 = nảy) và `response` (giây, càng nhỏ càng nhanh).
 * - Luôn chạy từ giá trị đang hiển thị và giữ nguyên vận tốc khi đổi đích, nên có thể ngắt và đảo chiều bất kỳ lúc nào.
 * Không phụ thuộc thư viện ngoài.
 */
export type SpringConfig = { damping?: number; response?: number };

export const springs = {
  /** Mặc định cho giao diện: không nảy. */
  ui: { damping: 1, response: 0.35 },
  /** Ngăn kéo, tấm trượt. */
  sheet: { damping: 0.8, response: 0.3 },
  /** Chỉ dùng khi cử chỉ trước đó có quán tính (vuốt, ném). */
  flick: { damping: 0.8, response: 0.4 },
} as const;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Điểm dừng dự kiến của cú vuốt, đúng hàm Apple dùng (giảm tốc theo hàm mũ). Vận tốc tính bằng px/giây. */
export function project(velocity: number, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Lực cản tăng dần khi kéo quá biên: càng kéo xa càng ít theo tay. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/** Đo vận tốc con trỏ từ vài mẫu gần nhất (px/giây). */
export class VelocityTracker {
  private samples: { t: number; v: number }[] = [];
  add(value: number, time = performance.now()) {
    this.samples.push({ t: time, v: value });
    while (this.samples.length > 2 && time - this.samples[0].t > 100) this.samples.shift();
  }
  velocity() {
    const s = this.samples;
    if (s.length < 2) return 0;
    const a = s[0], b = s[s.length - 1];
    const dt = (b.t - a.t) / 1000;
    return dt > 0 ? (b.v - a.v) / dt : 0;
  }
  reset() { this.samples = []; }
}

/** Một giá trị số chạy theo lò xo. Gọi `to()` bao nhiêu lần cũng được: chuyển động liền mạch từ chỗ đang đứng. */
export class SpringValue {
  value: number;
  velocity = 0;
  private target: number;
  private config: Required<SpringConfig> = { ...springs.ui };
  private frame = 0;
  private last = 0;
  private done?: () => void;

  constructor(initial: number, private onUpdate: (value: number) => void) {
    this.value = initial;
    this.target = initial;
  }

  /** Đích hiện tại (để cộng dồn khi người dùng bấm tiếp trong lúc đang chạy). */
  get destination() { return this.target; }

  /** Đặt giá trị tức thì (bám theo ngón tay 1:1), dừng mọi chuyển động. */
  set(value: number) {
    this.stop();
    this.value = value;
    this.velocity = 0;
    this.onUpdate(value);
  }

  /** Chạy tới đích. `velocity` (px/giây) để nối liền vận tốc của cử chỉ vừa thả. */
  to(target: number, options: SpringConfig & { velocity?: number; onRest?: () => void } = {}) {
    this.target = target;
    this.config = { damping: options.damping ?? springs.ui.damping, response: options.response ?? springs.ui.response };
    if (options.velocity !== undefined) this.velocity = options.velocity;
    this.done = options.onRest;
    if (prefersReducedMotion()) { this.set(target); this.done?.(); return; }
    if (!this.frame) { this.last = performance.now(); this.frame = requestAnimationFrame(this.tick); }
  }

  stop() { if (this.frame) cancelAnimationFrame(this.frame); this.frame = 0; }

  private tick = (now: number) => {
    const { damping, response } = this.config;
    const stiffness = Math.pow((2 * Math.PI) / response, 2);
    const friction = 4 * Math.PI * damping / response;
    let dt = Math.min((now - this.last) / 1000, 1 / 20);
    this.last = now;
    // Tích phân Euler bán ẩn, chia nhỏ bước cho ổn định ở mọi tần số khung hình.
    while (dt > 0) {
      const step = Math.min(dt, 1 / 240);
      const force = -stiffness * (this.value - this.target) - friction * this.velocity;
      this.velocity += force * step;
      this.value += this.velocity * step;
      dt -= step;
    }
    const resting = Math.abs(this.value - this.target) < 0.05 && Math.abs(this.velocity) < 0.5;
    if (resting) { this.value = this.target; this.velocity = 0; }
    this.onUpdate(this.value);
    if (resting) { this.frame = 0; const done = this.done; this.done = undefined; done?.(); return; }
    this.frame = requestAnimationFrame(this.tick);
  };
}
