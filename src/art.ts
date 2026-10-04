export type Face =
  | "grin"
  | "wow"
  | "bleh"
  | "focus"
  | "gag"
  | "tongue"
  | "smug"
  | "ooh"
  | "shut"
  | "robot";

export type Arms = "down" | "up" | "out" | "wave" | "one-up" | "akimbo";

export type Legs = "stand" | "jump" | "hop" | "split" | "waddle" | "sit" | "crab";

export type Icon =
  | "none"
  | "pillow"
  | "paper"
  | "shoe"
  | "crown"
  | "bug"
  | "balloon"
  | "stack"
  | "board"
  | "fort"
  | "star"
  | "question"
  | "duck"
  | "puff"
  | "sock";

export interface Scene {
  sky: string;
  hill: string;
  shirt: string;
  face: Face;
  arms: Arms;
  legs: Legs;
  prop: Icon;
}

const INK = "#241533";
const SKIN = "#ffd7c2";
const HAIR = "#3a2a4d";
const CHEEK = "#ff8fab";

function limb(d: string): string {
  return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${SKIN}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function face(kind: Face, cx: number, cy: number): string {
  const eye = (x: number, open: "open" | "shut" | "spiral" | "rect") => {
    if (open === "shut") {
      return `<path d="M${x - 8} ${cy - 2} Q${x} ${cy - 10} ${x + 8} ${cy - 2}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    }
    if (open === "spiral") {
      return `<circle cx="${x}" cy="${cy - 4}" r="7" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M${x - 3} ${cy - 4} Q${x} ${cy - 8} ${x + 2} ${cy - 3}" fill="none" stroke="${INK}" stroke-width="2"/>`;
    }
    if (open === "rect") {
      return `<rect x="${x - 7}" y="${cy - 10}" width="14" height="10" rx="2" fill="#fff" stroke="${INK}" stroke-width="3"/>`;
    }
    return `<circle cx="${x}" cy="${cy - 4}" r="7" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="${x + 2}" cy="${cy - 3}" r="3" fill="${INK}"/>`;
  };

  const blush =
    kind === "gag"
      ? `<circle cx="${cx - 22}" cy="${cy + 8}" r="6" fill="#b7e4c7"/><circle cx="${cx + 22}" cy="${cy + 8}" r="6" fill="#b7e4c7"/>`
      : `<circle cx="${cx - 20}" cy="${cy + 8}" r="5" fill="${CHEEK}"/><circle cx="${cx + 20}" cy="${cy + 8}" r="5" fill="${CHEEK}"/>`;

  let eyes = `${eye(cx - 12, "open")}${eye(cx + 12, "open")}`;
  let mouth = `<path d="M${cx - 10} ${cy + 14} Q${cx} ${cy + 24} ${cx + 10} ${cy + 14}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;

  if (kind === "wow" || kind === "ooh") {
    mouth = `<ellipse cx="${cx}" cy="${cy + 16}" rx="${kind === "wow" ? 8 : 5}" ry="${kind === "wow" ? 10 : 7}" fill="#241533"/>`;
  } else if (kind === "bleh") {
    eyes = `${eye(cx - 12, "shut")}${eye(cx + 12, "open")}`;
    mouth = `<path d="M${cx - 12} ${cy + 16} Q${cx - 4} ${cy + 10} ${cx + 4} ${cy + 18} T${cx + 14} ${cy + 12}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  } else if (kind === "focus") {
    mouth = `<path d="M${cx - 8} ${cy + 16} H${cx + 8}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  } else if (kind === "gag") {
    eyes = `${eye(cx - 12, "spiral")}${eye(cx + 12, "open")}`;
    mouth = `<path d="M${cx - 12} ${cy + 14} Q${cx - 4} ${cy + 24} ${cx + 2} ${cy + 14} T${cx + 14} ${cy + 22}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  } else if (kind === "tongue") {
    mouth = `<path d="M${cx - 10} ${cy + 12} Q${cx} ${cy + 20} ${cx + 10} ${cy + 12}" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M${cx - 4} ${cy + 16} Q${cx} ${cy + 32} ${cx + 6} ${cy + 16}" fill="#ff8fab" stroke="${INK}" stroke-width="3"/>`;
  } else if (kind === "smug") {
    eyes = `${eye(cx - 12, "shut")}${eye(cx + 12, "open")}`;
    mouth = `<path d="M${cx - 8} ${cy + 14} Q${cx + 2} ${cy + 22} ${cx + 12} ${cy + 12}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  } else if (kind === "shut") {
    eyes = `${eye(cx - 12, "shut")}${eye(cx + 12, "shut")}`;
  } else if (kind === "robot") {
    eyes = `${eye(cx - 12, "rect")}${eye(cx + 12, "rect")}`;
    mouth = `<rect x="${cx - 10}" y="${cy + 12}" width="20" height="8" rx="2" fill="none" stroke="${INK}" stroke-width="3"/>`;
  }

  return `${blush}${eyes}${mouth}`;
}

function hair(cx: number, cy: number, r: number): string {
  return `<ellipse cx="${cx}" cy="${cy - r + 6}" rx="${r - 6}" ry="14" fill="${HAIR}"/><path d="M${cx - 6} ${cy - r - 2} Q${cx} ${cy - r - 18} ${cx + 8} ${cy - r + 2}" fill="${HAIR}"/>`;
}

function arms(kind: Arms): string {
  switch (kind) {
    case "up":
      return limb("M148 142 L116 78 M188 142 L220 76");
    case "out":
      return limb("M146 148 L86 132 M190 148 L250 128");
    case "wave":
      return limb("M148 148 L112 176 M190 142 L232 92");
    case "one-up":
      return limb("M148 150 L108 184 M190 140 L214 74");
    case "akimbo":
      return limb("M148 148 L116 170 L128 196 M190 148 L222 170 L210 196");
    default:
      return limb("M148 148 L114 190 M190 148 L226 188");
  }
}

function legs(kind: Legs): string {
  switch (kind) {
    case "jump":
      return `${limb("M158 176 L120 142 M178 176 L218 140")}<ellipse cx="112" cy="136" rx="12" ry="7" fill="${INK}"/><ellipse cx="226" cy="134" rx="12" ry="7" fill="${INK}"/>`;
    case "hop":
      return `${limb("M160 178 L148 214 M176 172 L206 148")}<ellipse cx="146" cy="218" rx="13" ry="7" fill="${INK}"/>`;
    case "split":
      return `${limb("M158 176 L102 210 M178 176 L238 206")}<ellipse cx="94" cy="214" rx="13" ry="7" fill="${INK}"/><ellipse cx="248" cy="210" rx="13" ry="7" fill="${INK}"/>`;
    case "waddle":
      return `${limb("M156 178 L128 212 M180 178 L210 212")}<ellipse cx="120" cy="216" rx="13" ry="7" fill="${INK}"/><ellipse cx="218" cy="216" rx="13" ry="7" fill="${INK}"/>`;
    case "sit":
      return limb("M150 176 L236 188 M154 186 L228 214");
    default:
      return `${limb("M158 178 L142 214 M178 178 L198 214")}<ellipse cx="136" cy="218" rx="13" ry="7" fill="${INK}"/><ellipse cx="206" cy="218" rx="13" ry="7" fill="${INK}"/>`;
  }
}

function prop(icon: Icon): string {
  switch (icon) {
    case "pillow":
      return `<g><rect x="108" y="52" width="120" height="40" rx="18" fill="#fff" stroke="${INK}" stroke-width="4"/><path d="M168 56 V88" stroke="${INK}" stroke-width="3" stroke-dasharray="3 3"/><path d="M124 72 H212" stroke="#ffb3c7" stroke-width="5" stroke-linecap="round"/></g>`;
    case "paper":
      return `<g><rect x="204" y="142" width="74" height="58" rx="6" fill="#fff" stroke="${INK}" stroke-width="4"/><path d="M216 160 Q232 148 248 166 T274 158" fill="none" stroke="#4361ee" stroke-width="3" stroke-linecap="round"/><path d="M254 176 H270" stroke="#ff5d3a" stroke-width="3" stroke-linecap="round"/></g>`;
    case "shoe":
      return `<g><path d="M206 96 Q206 78 230 76 H262 Q286 78 284 98 L250 116 Q206 120 206 96Z" fill="#fff" stroke="${INK}" stroke-width="4"/><circle cx="236" cy="92" r="3" fill="${INK}"/><circle cx="250" cy="90" r="3" fill="${INK}"/><circle cx="264" cy="92" r="3" fill="${INK}"/><path d="M214 104 H250" stroke="#ff5d3a" stroke-width="4" stroke-linecap="round"/></g>`;
    case "crown":
      return `<polygon points="140,74 150,46 168,66 180,40 194,66 210,48 214,78" fill="#ffe066" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    case "bug":
      return `<g><ellipse cx="232" cy="118" rx="18" ry="12" fill="#8fd14f" stroke="${INK}" stroke-width="3"/><path d="M220 112 L206 100 M244 112 L258 98" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><circle cx="206" cy="98" r="3" fill="${INK}"/><circle cx="258" cy="96" r="3" fill="${INK}"/><circle cx="226" cy="116" r="2" fill="${INK}"/><circle cx="238" cy="116" r="2" fill="${INK}"/></g>`;
    case "balloon":
      return `<g><ellipse cx="250" cy="48" rx="22" ry="28" fill="#ef476f" stroke="${INK}" stroke-width="4"/><path d="M250 76 C246 98 226 120 206 146" fill="none" stroke="${INK}" stroke-width="3"/><path d="M244 74 H256 L250 82 Z" fill="#ef476f" stroke="${INK}" stroke-width="3"/></g>`;
    case "stack":
      return `<g stroke="${INK}" stroke-width="4"><rect x="210" y="168" width="82" height="24" rx="4" fill="#4361ee"/><rect x="218" y="144" width="68" height="24" rx="4" fill="#ffe066"/><rect x="226" y="120" width="52" height="24" rx="4" fill="#ef476f"/></g>`;
    case "board": {
      let squares = "";
      for (let y = 0; y < 4; y += 1) {
        for (let x = 0; x < 4; x += 1) {
          if ((x + y) % 2 === 0) {
            squares += `<rect x="${x * 16}" y="${y * 16}" width="16" height="16" fill="#e07a3d"/>`;
          }
        }
      }
      return `<g transform="translate(204 132)"><rect width="64" height="64" rx="6" fill="#f6e7c1" stroke="${INK}" stroke-width="4"/>${squares}</g>`;
    }
    case "fort":
      return `<g><rect x="36" y="124" width="70" height="36" rx="12" fill="#fff" stroke="${INK}" stroke-width="4"/><rect x="78" y="108" width="70" height="36" rx="12" fill="#d7e3fc" stroke="${INK}" stroke-width="4"/><path d="M48 124 L92 78 L150 120" fill="#ffd6e0" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></g>`;
    case "star":
      return `<polygon points="250,40 258,64 284,66 264,82 270,106 250,92 230,106 236,82 216,66 242,64" fill="#ffe066" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    case "question":
      return `<text x="228" y="108" font-family="Fredoka, sans-serif" font-size="78" font-weight="700" fill="#4361ee" stroke="${INK}" stroke-width="6" paint-order="stroke">?</text>`;
    case "duck":
      return `<g><ellipse cx="244" cy="160" rx="30" ry="18" fill="#ffe066" stroke="${INK}" stroke-width="4"/><circle cx="268" cy="146" r="14" fill="#ffe066" stroke="${INK}" stroke-width="4"/><path d="M280 146 L298 152 L280 158" fill="#f4a261" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="272" cy="142" r="2.5" fill="${INK}"/></g>`;
    case "puff":
      return `<g fill="#d8f8c8" stroke="${INK}" stroke-width="3"><circle cx="214" cy="124" r="14"/><circle cx="232" cy="112" r="18"/><circle cx="252" cy="124" r="13"/></g>`;
    case "sock":
      return `<path d="M228 64 H258 V118 Q258 142 236 142 H214 Q200 142 204 126 L220 116 V64 Z" fill="#cfe8ff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    default:
      return "";
  }
}

function kid(scene: Scene): string {
  if (scene.legs === "crab") {
    return `
      <ellipse cx="176" cy="162" rx="58" ry="28" fill="${scene.shirt}" stroke="${INK}" stroke-width="4"/>
      <circle cx="112" cy="146" r="30" fill="${SKIN}" stroke="${INK}" stroke-width="4"/>
      ${hair(112, 146, 30)}
      ${face(scene.face, 112, 148)}
      ${limb("M150 176 L132 214 M170 182 L166 218 M198 182 L206 218 M220 170 L246 208")}
    `;
  }

  const headY = scene.legs === "sit" ? 118 : 104;
  return `
    ${arms(scene.arms)}
    <rect x="142" y="${headY + 28}" width="52" height="56" rx="22" fill="${scene.shirt}" stroke="${INK}" stroke-width="4"/>
    <circle cx="160" cy="${headY + 46}" r="5" fill="#fff"/>
    <circle cx="176" cy="${headY + 46}" r="5" fill="#fff"/>
    ${legs(scene.legs)}
    <circle cx="168" cy="${headY}" r="34" fill="${SKIN}" stroke="${INK}" stroke-width="4"/>
    ${hair(168, headY, 34)}
    ${face(scene.face, 168, headY)}
  `;
}

function motion(scene: Scene): string {
  if (scene.legs === "stand" || scene.legs === "sit") return "";
  return `<g fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity="0.55"><path d="M64 78 L42 66"/><path d="M68 96 L40 98"/><path d="M58 112 L34 124"/></g>`;
}

export function renderScene(scene: Scene): string {
  const behind = scene.prop === "fort" ? prop(scene.prop) : "";
  const front = scene.prop === "fort" ? "" : prop(scene.prop);
  return `
    <svg class="scene" viewBox="0 0 320 230" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">
      <rect width="320" height="230" fill="${scene.sky}"/>
      <circle cx="42" cy="40" r="16" fill="#fff4b8" stroke="${INK}" stroke-width="3"/>
      <g fill="#fff" opacity="0.9">
        <ellipse cx="250" cy="42" rx="28" ry="14"/>
        <ellipse cx="274" cy="48" rx="16" ry="11"/>
        <ellipse cx="230" cy="50" rx="14" ry="10"/>
      </g>
      <ellipse cx="160" cy="214" rx="120" ry="28" fill="${scene.hill}"/>
      ${behind}
      ${motion(scene)}
      ${kid(scene)}
      ${front}
    </svg>
  `;
}
