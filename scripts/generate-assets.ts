import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets/products");
mkdirSync(dir, { recursive: true });

type Piece = { file: string; bg: string; ink: string; accent: string; mark: string };

const pieces: Piece[] = [
  {
    file: "harbor-weekender.svg",
    bg: "#e4efe6",
    ink: "#1e332b",
    accent: "#b5693a",
    mark: `<path d="M150 310h340c18 0 30 14 30 32v210c0 22-16 38-38 38H158c-22 0-38-16-38-38V342c0-18 12-32 30-32z" fill="none" stroke="currentColor" stroke-width="14"/>
      <path d="M230 310c8-70 50-110 90-110s82 40 90 110" fill="none" stroke="currentColor" stroke-width="14"/>
      <path d="M250 430h140" stroke="#b5693a" stroke-width="14" stroke-linecap="round"/>`,
  },
  {
    file: "tide-merino.svg",
    bg: "#efe6da",
    ink: "#3a2a22",
    accent: "#8c4a32",
    mark: `<path d="M210 250h220l40 330H170z" fill="none" stroke="currentColor" stroke-width="14" stroke-linejoin="round"/>
      <path d="M250 250c20 40 40 40 70 0c30 40 50 40 70 0" fill="none" stroke="currentColor" stroke-width="12"/>
      <path d="M230 390h180" stroke="#8c4a32" stroke-width="10"/>`,
  },
  {
    file: "camp-enamel.svg",
    bg: "#f3ecdf",
    ink: "#2c2924",
    accent: "#6d7370",
    mark: `<ellipse cx="250" cy="430" rx="78" ry="28" fill="none" stroke="currentColor" stroke-width="12"/>
      <path d="M172 430v-70c0-70 156-70 156 0v70" fill="none" stroke="currentColor" stroke-width="12"/>
      <ellipse cx="400" cy="470" rx="70" ry="24" fill="none" stroke="currentColor" stroke-width="12"/>
      <path d="M330 470v-64c0-62 140-62 140 0v64" fill="none" stroke="currentColor" stroke-width="12"/>`,
  },
  {
    file: "drift-throw.svg",
    bg: "#efe8dc",
    ink: "#3d342c",
    accent: "#a15b3a",
    mark: `<path d="M160 280h280c22 0 40 18 40 40v240H200c-22 0-40-18-40-40z" fill="none" stroke="currentColor" stroke-width="14"/>
      <path d="M200 360h240M200 420h200" stroke="#a15b3a" stroke-width="8"/>
      <path d="M430 340c40 20 50 70 20 110" fill="none" stroke="currentColor" stroke-width="10"/>`,
  },
  {
    file: "beacon-lantern.svg",
    bg: "#f4efe4",
    ink: "#3a3228",
    accent: "#c47a45",
    mark: `<path d="M250 220h140l20 40H230z" fill="#c47a45"/>
      <rect x="230" y="270" width="180" height="220" rx="16" fill="none" stroke="currentColor" stroke-width="14"/>
      <path d="M250 330h140M250 400h140" stroke="#c47a45" stroke-width="8"/>
      <path d="M300 490h40v40h-40z" fill="none" stroke="currentColor" stroke-width="10"/>`,
  },
  {
    file: "salt-linen.svg",
    bg: "#f7f1e6",
    ink: "#2f3330",
    accent: "#7d8a78",
    mark: `<path d="M250 230l70 40 70-40 50 90-40 300H240L200 320z" fill="none" stroke="currentColor" stroke-width="14" stroke-linejoin="round"/>
      <path d="M290 280c10 30 50 30 60 0" fill="none" stroke="#7d8a78" stroke-width="10"/>
      <circle cx="320" cy="430" r="6" fill="#7d8a78"/>
      <circle cx="320" cy="480" r="6" fill="#7d8a78"/>`,
  },
  {
    file: "field-journal.svg",
    bg: "#efe4d4",
    ink: "#3a2c22",
    accent: "#8d5a32",
    mark: `<rect x="200" y="210" width="250" height="340" rx="8" fill="none" stroke="currentColor" stroke-width="14"/>
      <path d="M200 230c-30 40-30 260 0 310" fill="none" stroke="#8d5a32" stroke-width="12"/>
      <path d="M250 300h140M250 350h120M250 400h140" stroke="currentColor" stroke-width="6"/>`,
  },
  {
    file: "kiln-bottle.svg",
    bg: "#e7eef0",
    ink: "#24343a",
    accent: "#3f6f78",
    mark: `<path d="M280 200h80v70c40 20 70 70 70 130v150c0 30-24 50-54 50H264c-30 0-54-20-54-50V400c0-60 30-110 70-130z" fill="none" stroke="currentColor" stroke-width="14"/>
      <rect x="292" y="168" width="56" height="36" rx="8" fill="#3f6f78"/>
      <path d="M250 430h140" stroke="#3f6f78" stroke-width="10"/>`,
  },
  {
    file: "weather-shell.svg",
    bg: "#e5ebe7",
    ink: "#1d2b27",
    accent: "#8a5a32",
    mark: `<path d="M230 240h180l60 80v280H170V320z" fill="none" stroke="currentColor" stroke-width="14" stroke-linejoin="round"/>
      <path d="M250 250c20 50 40 60 70 40c30 20 50 10 70-40" fill="none" stroke="currentColor" stroke-width="10"/>
      <path d="M320 360v180" stroke="#8a5a32" stroke-width="8"/>
      <circle cx="320" cy="420" r="6" fill="#8a5a32"/>`,
  },
  {
    file: "cedar-trees.svg",
    bg: "#f3ecdf",
    ink: "#4a3424",
    accent: "#8f5b32",
    mark: `<path d="M180 470c40-20 90-20 120 10c10 70-20 120-70 130c-60-10-90-70-50-140z" fill="none" stroke="currentColor" stroke-width="12"/>
      <path d="M330 450c50-10 110 10 130 40c0 80-40 130-90 130c-40-20-60-80-40-170z" fill="none" stroke="currentColor" stroke-width="12"/>
      <path d="M250 500c30 10 40 40 20 70" stroke="#8f5b32" stroke-width="8" fill="none"/>`,
  },
  {
    file: "coast-glass.svg",
    bg: "#e7eef2",
    ink: "#243038",
    accent: "#b5693a",
    mark: `<circle cx="250" cy="390" r="78" fill="none" stroke="currentColor" stroke-width="14"/>
      <circle cx="400" cy="390" r="78" fill="none" stroke="currentColor" stroke-width="14"/>
      <path d="M328 390h24" stroke="#b5693a" stroke-width="12"/>
      <circle cx="250" cy="390" r="28" fill="none" stroke="#b5693a" stroke-width="8"/>
      <circle cx="400" cy="390" r="28" fill="none" stroke="#b5693a" stroke-width="8"/>`,
  },
  {
    file: "trail-socks.svg",
    bg: "#f6efe6",
    ink: "#3a2e28",
    accent: "#9a6244",
    mark: `<path d="M230 220h70v210l90 70c30 24 20 70-20 80h-90c-40 0-70-30-70-70z" fill="none" stroke="currentColor" stroke-width="12"/>
      <path d="M330 250h60v190l70 54c24 18 14 56-18 64h-70" fill="none" stroke="#9a6244" stroke-width="12"/>`,
  },
];

for (const piece of pieces) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 800" role="img">
  <rect width="640" height="800" fill="${piece.bg}"/>
  <g color="${piece.ink}" fill="none" stroke-linecap="round" stroke-linejoin="round">
    ${piece.mark}
  </g>
</svg>
`;
  writeFileSync(path.join(dir, piece.file), svg);
}

console.log(`wrote ${pieces.length} assets`);
