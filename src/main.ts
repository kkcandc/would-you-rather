import "@fontsource/fredoka/latin-500.css";
import "@fontsource/fredoka/latin-700.css";
import "./style.css";
import { Soundboard } from "./audio";
import { Game } from "./game";

const stage = document.querySelector<HTMLElement>("#stage");
const roster = document.querySelector<HTMLDialogElement>("#roster");
const confetti = document.querySelector<HTMLCanvasElement>("#confetti");
const mute = document.querySelector<HTMLButtonElement>("#mute");

if (!stage || !roster || !confetti || !mute) {
  throw new Error("Game markup is missing");
}

const sounds = new Soundboard();
const game = new Game(stage, roster, confetti, sounds);

function paintMute(): void {
  const muted = sounds.isMuted;
  mute?.setAttribute("aria-pressed", String(muted));
  mute?.replaceChildren(document.createTextNode(muted ? "Muted" : "Sound on"));
}

mute.addEventListener("click", () => {
  void sounds.unlock();
  sounds.toggleMute();
  paintMute();
});

document.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement) return;
  if (event.key === "m" || event.key === "M") {
    void sounds.unlock();
    sounds.toggleMute();
    paintMute();
  }
});

paintMute();
game.render();
