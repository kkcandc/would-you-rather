interface Bit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  spin: number;
  life: number;
}

let burstToken = 0;

const COLORS = ["#ff5d3a", "#ffe066", "#2a9d8f", "#4361ee", "#ff8fab", "#ffffff", "#7209b7"];

export function burstConfetti(canvas: HTMLCanvasElement): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const context = canvas.getContext("2d");
  if (!context) return;

  const token = ++burstToken;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  const bits: Bit[] = Array.from({ length: 96 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 8;
    return {
      x: width / 2 + (Math.random() - 0.5) * 80,
      y: height * 0.38,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 5,
      size: 7 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      rot: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.28,
      life: 1,
    };
  });

  let frame = 0;
  const step = () => {
    if (token !== burstToken) return;
    frame += 1;
    context.clearRect(0, 0, width, height);
    for (const bit of bits) {
      bit.vy += 0.16;
      bit.x += bit.vx;
      bit.y += bit.vy;
      bit.rot += bit.spin;
      bit.life -= 0.007;
      context.save();
      context.translate(bit.x, bit.y);
      context.rotate(bit.rot);
      context.globalAlpha = Math.max(0, bit.life);
      context.fillStyle = bit.color;
      context.fillRect(-bit.size / 2, -bit.size / 4, bit.size, bit.size * 0.55);
      context.restore();
    }
    if (frame < 170) requestAnimationFrame(step);
    else context.clearRect(0, 0, width, height);
  };

  requestAnimationFrame(step);
}
