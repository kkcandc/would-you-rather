import { renderScene } from "./art";
import type { Soundboard } from "./audio";
import { burstConfetti } from "./confetti";
import { DARES, type Dare } from "./dares";
import { drawPair, shuffle } from "./deck";

const NAMES_KEY = "wyr-names";
const MAX_PLAYERS = 8;

interface Player {
  id: string;
  name: string;
  score: number;
}

type Phase = "title" | "choose" | "countdown" | "ask" | "result";

const YES_LINES = [
  "Yes! The living room believes you.",
  "Point scored. The couch is proud.",
  "You actually did it. Legendary.",
  "That is a real point. Brag gently.",
  "The timer never stood a chance.",
  "Nailed it. Pass the screen like a champion.",
];

const SKIP_LINES = [
  "Wow. A bold skip. The points stayed home.",
  "The pillows saw that, and they support you anyway.",
  "Skipping is allowed. The points are shy about it.",
  "A mysterious force called nope has entered the living room.",
  "No point this time. The next dare is already warming up.",
  "The couch respects your honesty.",
  "Skip logged. Your legend can handle it.",
  "Fine, fine. The scoreboard remains unimpressed.",
];

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function loadNames(): string[] {
  try {
    const raw = localStorage.getItem(NAMES_KEY);
    if (!raw) return ["Player 1", "Player 2"];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return ["Player 1", "Player 2"];
    const names = parsed
      .filter((item): item is string => typeof item === "string")
      .map((name) => name.slice(0, 18))
      .slice(0, MAX_PLAYERS);
    return names.length > 0 ? names : ["Player 1", "Player 2"];
  } catch {
    return ["Player 1", "Player 2"];
  }
}

function lineFrom(pool: readonly string[]): string {
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0]!;
}

export class Game {
  private phase: Phase = "title";
  private players: Player[];
  private nextId = 1;
  private turn = 0;
  private draw: Dare[] = [];
  private discard: Dare[] = [];
  private options: [Dare, Dare] | null = null;
  private chosen: Dare | null = null;
  private reshuffled = false;
  private endsAt = 0;
  private total = 0;
  private lastSecond = -1;
  private drummed = false;
  private tickHandle = 0;
  private result: { didIt: boolean; line: string } | null = null;
  private bump = false;

  constructor(
    private stage: HTMLElement,
    private roster: HTMLDialogElement,
    private confetti: HTMLCanvasElement,
    private sounds: Soundboard,
  ) {
    this.players = loadNames().map((name) => this.makePlayer(name));
    this.stage.addEventListener("click", (event) => this.onClick(event));
    this.stage.addEventListener("input", (event) => this.onInput(event));
    this.roster.addEventListener("click", (event) => this.onClick(event));
    this.roster.addEventListener("input", (event) => this.onInput(event));
    document.addEventListener("keydown", (event) => this.onKey(event));
  }

  render(): void {
    if (this.phase === "title") this.stage.innerHTML = this.titleHtml();
    else this.stage.innerHTML = this.playHtml();
  }

  private makePlayer(name: string): Player {
    const player = { id: `p${this.nextId}`, name, score: 0 };
    this.nextId += 1;
    return player;
  }

  private displayName(player: Player, index: number): string {
    const trimmed = player.name.trim();
    return trimmed.length > 0 ? trimmed : `Player ${index + 1}`;
  }

  private current(): Player {
    return this.players[this.turn] ?? this.players[0]!;
  }

  private currentIndex(): number {
    return Math.min(this.turn, this.players.length - 1);
  }

  private nextIndex(): number {
    return (this.currentIndex() + 1) % this.players.length;
  }

  private persist(): void {
    try {
      localStorage.setItem(NAMES_KEY, JSON.stringify(this.players.map((player) => player.name)));
    } catch {
      /* ignore quota / private mode */
    }
  }

  private titleHtml(): string {
    return `
      <section class="title-screen">
        <p class="ribbon">Living-room championship</p>
        <h1><span>Would</span> <span>you rather</span></h1>
        <p class="howto">Pick a card, actually do it before the buzzer, then pass the screen.</p>
        <p class="sticker">${DARES.length} living-room dares</p>
        <div class="roster-block">
          <h2>Who's playing?</h2>
          <p class="hint">Names are optional.</p>
          ${this.playerFields()}
          <button type="button" class="texty" data-action="add-player" ${this.players.length >= MAX_PLAYERS ? "disabled" : ""}>Add a player</button>
        </div>
        <button type="button" class="primary giant" data-action="start">Let's play</button>
      </section>
    `;
  }

  private playerFields(): string {
    return this.players
      .map((player, index) => {
        return `
          <label class="name-row">
            <span>${index + 1}</span>
            <input data-player-id="${player.id}" maxlength="18" value="${escapeHtml(player.name)}" aria-label="Name for player ${index + 1}" />
            <button type="button" data-action="remove-player" data-id="${player.id}" ${this.players.length === 1 ? "disabled" : ""}>Remove</button>
          </label>
        `;
      })
      .join("");
  }

  private playHtml(): string {
    return `${this.header()}${this.phaseBody()}`;
  }

  private header(): string {
    const bump = this.bump;
    this.bump = false;
    const scores = this.players
      .map((player, index) => {
        const current = index === this.currentIndex();
        const classes = ["score", current ? "current" : "", current && bump ? "bump" : ""]
          .filter(Boolean)
          .join(" ");
        return `<li class="${classes}"><span class="pname">${escapeHtml(this.displayName(player, index))}</span><span class="points">${player.score}</span></li>`;
      })
      .join("");
    return `
      <header class="top">
        <p class="brand">Would you rather</p>
        <ol class="scores">${scores}</ol>
        <button type="button" class="texty" data-action="open-roster">Players</button>
      </header>
    `;
  }

  private phaseBody(): string {
    if (this.phase === "choose" && this.options) return this.chooseHtml(this.options);
    if (this.phase === "countdown" && this.chosen) return this.countdownHtml(this.chosen);
    if (this.phase === "ask" && this.chosen) return this.askHtml(this.chosen);
    if (this.phase === "result" && this.chosen && this.result) return this.resultHtml();
    return "";
  }

  private chooseHtml(options: [Dare, Dare]): string {
    const name = escapeHtml(this.displayName(this.current(), this.currentIndex()));
    const banner = this.reshuffled ? `<p class="banner">Shuffling the deck!</p>` : "";
    return `
      <section class="choose">
        ${banner}
        <h2 class="prompt"><span>${name}</span>, would you rather…</h2>
        <div class="cards">
          ${this.cardHtml(options[0], 0, "left")}
          <div class="or" aria-hidden="true"><span>OR</span></div>
          ${this.cardHtml(options[1], 1, "right")}
        </div>
      </section>
    `;
  }

  private cardHtml(dare: Dare, index: number, side: "left" | "right"): string {
    const label = dare.propLabel ? `<span class="tape">${escapeHtml(dare.propLabel)}</span>` : "";
    return `
      <button type="button" class="card ${side}" data-action="choose" data-index="${index}">
        <span class="art">${renderScene(dare.scene)}<span class="time-pill">${dare.seconds}s</span></span>
        <span class="card-copy">
          ${label}
          <span class="dare-text">${escapeHtml(dare.text)}</span>
        </span>
      </button>
    `;
  }

  private countdownHtml(dare: Dare): string {
    const left = Math.max(0, Math.ceil((this.endsAt - Date.now()) / 1000));
    const name = escapeHtml(this.displayName(this.current(), this.currentIndex()));
    return `
      <section class="countdown ${left <= 3 ? "urgent" : ""}">
        <p class="who">${name}</p>
        <p class="stamp">You have to…</p>
        <article class="chosen">
          <div class="art">${renderScene(dare.scene)}</div>
          <p class="dare-text">${escapeHtml(dare.text)}</p>
        </article>
        <div class="timer" aria-live="polite">
          <svg viewBox="0 0 120 120" class="timer-svg" aria-hidden="true">
            <circle cx="60" cy="60" r="52" class="ring-bg"></circle>
            <circle cx="60" cy="60" r="52" class="ring" stroke-dasharray="326.73" stroke-dashoffset="0"></circle>
          </svg>
          <p class="count-num">${left}</p>
        </div>
        <button type="button" class="texty" data-action="done-early">We finished</button>
      </section>
    `;
  }

  private askHtml(dare: Dare): string {
    return `
      <section class="ask">
        <p class="stamp ask-stamp">Time!</p>
        <h2>Did you do it?</h2>
        <p class="dare-text reminder">${escapeHtml(dare.text)}</p>
        <div class="answer-row">
          <button type="button" class="primary yes" data-action="yes">Yes!</button>
          <button type="button" class="skip" data-action="skip">Skip</button>
        </div>
      </section>
    `;
  }

  private resultHtml(): string {
    const result = this.result!;
    const next = this.players[this.nextIndex()]!;
    const nextName = escapeHtml(this.displayName(next, this.nextIndex()));
    const passLabel = this.players.length === 1 ? "Next dare" : `Pass to ${nextName}`;
    return `
      <section class="result ${result.didIt ? "good" : "skipped"}">
        <p class="stamp">${result.didIt ? "You did it" : "Skipped"}</p>
        <p class="reaction">${escapeHtml(result.line)}</p>
        <button type="button" class="primary giant" data-action="pass">${passLabel}</button>
      </section>
    `;
  }

  private rosterHtml(): string {
    return `
      <form method="dialog" class="roster-card">
        <h2>Players</h2>
        <p class="hint">Names are optional.</p>
        ${this.playerFields()}
        <div class="row-actions">
          <button type="button" class="texty" data-action="add-player" ${this.players.length >= MAX_PLAYERS ? "disabled" : ""}>Add a player</button>
          <button type="button" class="texty" data-action="new-game">Reset scores and reshuffle</button>
          <button type="button" class="texty" data-action="title">Back to title</button>
          <button type="submit" class="primary">Done</button>
        </div>
      </form>
    `;
  }

  private onClick(event: Event): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLElement>("[data-action]");
    if (!button || button.hasAttribute("disabled")) return;
    const action = button.dataset.action;
    if (action === "start") this.start();
    else if (action === "add-player") this.addPlayer();
    else if (action === "remove-player" && button.dataset.id) this.removePlayer(button.dataset.id);
    else if (action === "choose" && button.dataset.index) this.choose(Number(button.dataset.index));
    else if (action === "done-early") this.finishEarly();
    else if (action === "yes") this.answer(true);
    else if (action === "skip") this.answer(false);
    else if (action === "pass") this.pass();
    else if (action === "open-roster") this.openRoster();
    else if (action === "new-game") this.resetMatch();
    else if (action === "title") this.backToTitle();
  }

  private onInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const id = target.dataset.playerId;
    if (!id) return;
    const player = this.players.find((item) => item.id === id);
    if (!player) return;
    player.name = target.value;
    this.persist();
    this.paintNames();
  }

  private onKey(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (this.roster.open) return;
    if (this.phase === "choose") {
      if (event.key === "1" || event.key === "ArrowLeft") this.choose(0);
      if (event.key === "2" || event.key === "ArrowRight") this.choose(1);
    } else if (this.phase === "ask") {
      if (event.key === "y" || event.key === "Y") this.answer(true);
      if (event.key === "s" || event.key === "S") this.answer(false);
    } else if (this.phase === "result" && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      this.pass();
    } else if (this.phase === "title" && event.key === "Enter") {
      this.start();
    }
  }

  private paintNames(): void {
    const scores = this.stage.querySelectorAll<HTMLElement>(".score .pname");
    scores.forEach((node, index) => {
      const player = this.players[index];
      if (player) node.textContent = this.displayName(player, index);
    });
  }

  private start(): void {
    void this.sounds.unlock();
    this.players.forEach((player) => {
      player.score = 0;
    });
    this.turn = 0;
    this.draw = shuffle(DARES);
    this.discard = [];
    this.options = null;
    this.chosen = null;
    this.result = null;
    this.persist();
    this.deal();
    this.phase = "choose";
    this.sounds.reveal();
    this.render();
  }

  private deal(): void {
    const avoid = this.options ? this.options.map((dare) => dare.id) : [];
    if (this.options) this.discard.push(this.options[0], this.options[1]);
    const dealt = drawPair(this.draw, this.discard, avoid);
    this.options = dealt.pair;
    this.chosen = null;
    this.result = null;
    this.reshuffled = dealt.reshuffled;
  }

  private choose(index: number): void {
    if (this.phase !== "choose" || !this.options) return;
    const dare = this.options[index];
    if (!dare) return;
    void this.sounds.unlock();
    this.sounds.pop();
    this.chosen = dare;
    this.total = dare.seconds;
    this.endsAt = Date.now() + dare.seconds * 1000;
    this.lastSecond = dare.seconds;
    this.drummed = false;
    this.phase = "countdown";
    this.render();
    this.sounds.stamp();
    window.clearInterval(this.tickHandle);
    this.tickHandle = window.setInterval(() => this.tick(), 100);
  }

  private tick(): void {
    if (this.phase !== "countdown" || !this.chosen) {
      window.clearInterval(this.tickHandle);
      return;
    }
    const remainingMs = Math.max(0, this.endsAt - Date.now());
    const seconds = Math.ceil(remainingMs / 1000);
    const number = this.stage.querySelector(".count-num");
    if (number) number.textContent = String(seconds);
    const ring = this.stage.querySelector<SVGCircleElement>(".ring");
    if (ring) {
      const progress = 1 - remainingMs / (this.total * 1000);
      ring.style.strokeDashoffset = String(326.73 * progress);
    }
    const box = this.stage.querySelector(".countdown");
    box?.classList.toggle("urgent", seconds <= 3 && seconds > 0);
    if (seconds !== this.lastSecond) {
      this.lastSecond = seconds;
      if (seconds > 0 && seconds < this.total) this.sounds.tick(seconds);
      if (seconds > 0 && seconds <= 3 && !this.drummed) {
        this.drummed = true;
        this.sounds.drumroll(Math.min(3, seconds));
      }
    }
    if (remainingMs <= 0) this.finishCountdown();
  }

  private finishEarly(): void {
    if (this.phase !== "countdown") return;
    this.finishCountdown();
  }

  private finishCountdown(): void {
    window.clearInterval(this.tickHandle);
    if (this.phase !== "countdown") return;
    this.phase = "ask";
    this.sounds.ding();
    this.render();
  }

  private answer(didIt: boolean): void {
    if (this.phase !== "ask" || !this.chosen) return;
    if (didIt) {
      this.current().score += 1;
      this.bump = true;
      this.sounds.cheer();
      burstConfetti(this.confetti);
    } else {
      this.sounds.buzzer();
    }
    this.result = { didIt, line: lineFrom(didIt ? YES_LINES : SKIP_LINES) };
    this.phase = "result";
    this.render();
  }

  private pass(): void {
    if (this.phase !== "result") return;
    this.turn = this.nextIndex();
    this.deal();
    this.phase = "choose";
    this.sounds.reveal();
    this.render();
  }

  private addPlayer(): void {
    if (this.players.length >= MAX_PLAYERS) return;
    const player = this.makePlayer(`Player ${this.players.length + 1}`);
    this.players.push(player);
    this.persist();
    this.refreshEditors();
  }

  private removePlayer(id: string): void {
    if (this.players.length === 1) return;
    const index = this.players.findIndex((player) => player.id === id);
    if (index < 0) return;
    this.players.splice(index, 1);
    if (this.turn >= this.players.length) this.turn = 0;
    else if (index < this.turn) this.turn -= 1;
    this.persist();
    this.refreshEditors();
  }

  private refreshEditors(): void {
    if (this.roster.open) this.roster.innerHTML = this.rosterHtml();
    this.render();
    if (this.phase === "countdown") this.syncRing();
  }

  private syncRing(): void {
    const ring = this.stage.querySelector<SVGCircleElement>(".ring");
    if (!ring || this.total <= 0) return;
    const remainingMs = Math.max(0, this.endsAt - Date.now());
    ring.style.strokeDashoffset = String(326.73 * (1 - remainingMs / (this.total * 1000)));
  }

  private openRoster(): void {
    this.roster.innerHTML = this.rosterHtml();
    if (!this.roster.open) this.roster.showModal();
  }

  private resetMatch(): void {
    window.clearInterval(this.tickHandle);
    this.players.forEach((player) => {
      player.score = 0;
    });
    this.turn = 0;
    this.draw = shuffle(DARES);
    this.discard = [];
    this.options = null;
    this.deal();
    this.phase = "choose";
    this.roster.close();
    this.sounds.reveal();
    this.render();
  }

  private backToTitle(): void {
    window.clearInterval(this.tickHandle);
    this.phase = "title";
    this.roster.close();
    this.render();
  }
}
