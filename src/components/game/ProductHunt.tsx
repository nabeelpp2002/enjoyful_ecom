"use client";
import Link from "next/link";
import {
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { PointerEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";
import styles from "./ProductHunt.module.css";
const PRODUCTS = [
  "Sunshine SPF 50+",
  "Amber Glow",
  "Baby Powder",
  "Aloe Bliss",
  "Orange Face Wash",
  "Coffee Face Scrub",
  "Lemon Face Wash",
  "Gentle Baby Wash",
  "Coastal Pulse",
  "Morning Buzz",
  "Vanilla Aura",
  "Walnut Face Scrub",
  "Blossom Veil",
  "Gentle Baby Rash Cream",
  "Noir Element",
];
const SCENES = [
  {
    name: "The cozy boutique",
    image: "/assets/game/joyful-boutique.webp",
    products: [0, 1, 2, 3, 4],
    supportBounds: [28, 82],
    spots: [
      [43, 46],
      [59, 46],
      [75, 46],
      [43, 69],
      [59, 69],
      [75, 69],
    ],
  },
  {
    name: "The seaside market",
    image: "/assets/game/joyful-beach.webp",
    products: [5, 6, 7, 8, 9],
    supportBounds: [25, 77],
    spots: [
      [43, 39],
      [59, 39],
      [75, 39],
      [43, 59],
      [59, 59],
      [75, 59],
    ],
  },
  {
    name: "The family bathroom",
    image: "/assets/game/joyful-bathroom.webp",
    products: [10, 11, 12, 13, 14],
    supportBounds: [24, 79],
    spots: [
      [43, 37],
      [59, 37],
      [75, 37],
      [43, 56],
      [59, 56],
      [75, 56],
    ],
  },
] as const;
function projectSpot(
  position: readonly number[],
  size: { width: number; height: number; mobile: boolean },
) {
  const scale = size.mobile
    ? Math.min(size.width / 1536, size.height / 1024)
    : Math.max(size.width / 1536, size.height / 1024);
  return [
    ((position[0] * 0.01 * 1536 * scale - (1536 * scale - size.width) / 2) /
      size.width) *
      100,
    ((position[1] * 0.01 * 1024 * scale - (1024 * scale - size.height) / 2) /
      size.height) *
      100,
  ];
}
function sceneFor(level: number) {
  return SCENES[(level - 1) % SCENES.length];
}
const KEY = "enjoyful-product-hunt-v1";
let memoryBest = 0;
function readBest() {
  try {
    const value = Number(localStorage.getItem(KEY));
    if (Number.isSafeInteger(value) && value >= 0)
      return Math.max(memoryBest, value);
  } catch {
    /* Storage is optional. */
  }
  return memoryBest;
}
function subscribeBest(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(KEY, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(KEY, callback);
  };
}
type Round = {
  level: number;
  score: number;
  targets: number[];
  spots: number[];
  found: number[];
  hinted: number[];
  hint: number | null;
  started: boolean;
  message: string;
  roundId: number;
};
const initial: Round = {
  level: 1,
  score: 0,
  targets: [0, 1, 2],
  spots: [0, 2, 4, 1, 3],
  found: [],
  hinted: [],
  hint: null,
  started: true,
  message: "Move a cover, then tap the product you find.",
  roundId: 0,
};
function shuffle(values: number[]) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
type Action =
  | { type: "round"; targets: number[]; spots: number[]; restart?: boolean }
  | { type: "find"; id: number }
  | { type: "hint" };
function reducer(state: Round, action: Action): Round {
  if (action.type === "round")
    return {
      ...initial,
      started: true,
      level: action.restart ? 1 : state.started ? state.level + 1 : 1,
      score: action.restart ? 0 : state.score,
      targets: action.targets,
      spots: action.spots,
      message: "Find the products shown below. Take your time!",
      roundId: state.roundId + 1,
    };
  if (!state.started || state.found.length === state.targets.length)
    return state;
  if (action.type === "hint") {
    const id = state.targets.find((value) => !state.found.includes(value));
    if (id === undefined) return state;
    return {
      ...state,
      hint: id,
      hinted: [...new Set([...state.hinted, id])],
      message: `Look for the glowing ${PRODUCTS[id]}. Hinted finds earn 50 points.`,
    };
  }
  if (state.found.includes(action.id)) return state;
  if (!state.targets.includes(action.id))
    return {
      ...state,
      message: "Lovely find, but not on this round’s list. Try another!",
    };
  const found = [...state.found, action.id];
  const points = state.hinted.includes(action.id) ? 50 : 100;
  const complete = found.length === state.targets.length;
  return {
    ...state,
    found,
    hint: state.hint === action.id ? null : state.hint,
    score: state.score + points + (complete ? 200 : 0),
    message: complete
      ? "Beautifully spotted! All products found. +200 completion bonus."
      : `${PRODUCTS[action.id]} found! +${points} points.`,
  };
}
function ProductSprite({ id }: { id: number }) {
  const atlasId = id % 5;
  return (
    <span
      aria-hidden="true"
      className={styles.sprite}
      style={{
        backgroundImage: `url('/assets/game/product-atlas${id < 5 ? "" : id < 10 ? "-2" : "-3"}.webp')`,
        backgroundPosition: `${(atlasId % 3) * 50}% ${Math.floor(atlasId / 3) * 100}%`,
      }}
    />
  );
}
function HiddenProduct({
  id,
  slot,
  position,
  supportBounds,
  stageWidth,
  active,
  found,
  hinted,
  onFind,
}: {
  id: number;
  slot: number;
  position: readonly number[];
  supportBounds: readonly number[];
  stageWidth: number;
  active: boolean;
  found: boolean;
  hinted: boolean;
  onFind: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const drag = useRef<{
    x: number;
    y: number;
    startX: number;
    dragged: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const prop = slot % 5;
  const minOffset =
    ((Math.max(10, supportBounds[0]) - position[0]) * stageWidth) / 100;
  const maxOffset =
    ((Math.min(90, supportBounds[1]) - position[0]) * stageWidth) / 100;
  const parkedOffset = () => {
    const left = Math.max(-100, minOffset);
    const right = Math.min(100, maxOffset);
    return Math.abs(left) > Math.abs(right) ? left : right;
  };
  function moveAside() {
    if (!active || found || suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    setRevealed(true);
    setOffset(parkedOffset());
  }
  function pointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (!active || found) return;
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      startX: offset,
      dragged: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    if (Math.hypot(dx, dy) > 10) drag.current.dragged = true;
    if (drag.current.dragged)
      setOffset(
        Math.max(minOffset, Math.min(maxOffset, drag.current.startX + dx)),
      );
  }
  function pointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (!drag.current) return;
    if (drag.current.dragged) {
      setRevealed(true);
      if (Math.abs(offset) < 60) setOffset(parkedOffset());
      suppressClick.current = true;
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 0);
    }
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return (
    <div
      className={`${styles.hideout} ${hinted ? styles.hinted : ""}`}
      style={{ left: `${position[0]}%`, top: `${position[1]}%` }}
    >
      <button
        type="button"
        aria-label={`Select ${PRODUCTS[id]}`}
        disabled={!active || !revealed || found}
        onClick={onFind}
        className={`${styles.object} ${found ? styles.found : ""}`}
      >
        <ProductSprite id={id} />
        {found && (
          <span className={styles.check}>
            <Check size={18} />
          </span>
        )}
      </button>
      {!found && (
        <button
          type="button"
          aria-label={`Move the object hiding ${PRODUCTS[id]}`}
          disabled={!active}
          aria-pressed={revealed}
          className={styles.cover}
          onClick={moveAside}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={() => {
            drag.current = null;
          }}
          style={{
            transform: `translateX(${offset}px) scale(${revealed ? 0.72 : 1})`,
          }}
        >
          <span
            className={styles.coverSprite}
            style={{
              backgroundPosition: `${(prop % 3) * 50}% ${Math.floor(prop / 3) * 100}%`,
            }}
          />
        </button>
      )}
    </div>
  );
}
export function ProductHunt() {
  const [showGame, setShowGame] = useState(false);
  const [state, dispatch] = useReducer(reducer, initial);
  const best = useSyncExternalStore(subscribeBest, readBest, () => 0);
  const nextButton = useRef<HTMLButtonElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [sceneSize, setSceneSize] = useState({ width: 1000, height: 667, mobile: false });
  const complete = state.started && state.found.length === state.targets.length;
  const scene = sceneFor(state.level);
  useEffect(() => {
    const node = sceneRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setSceneSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
        mobile: window.matchMedia("(max-width: 640px)").matches,
      });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [showGame]);
  useEffect(() => {
    if (complete) nextButton.current?.focus({ preventScroll: true });
  }, [complete]);
  useEffect(() => {
    if (state.score <= readBest()) return;
    memoryBest = state.score;
    try {
      localStorage.setItem(KEY, String(state.score));
    } catch {
      /* Playing works without storage. */
    }
    window.dispatchEvent(new Event(KEY));
  }, [state.score]);
  function newRound(restart = false) {
    const level = restart || !state.started ? 1 : state.level + 1;
    const roundScene = sceneFor(level);
    dispatch({
      type: "round",
      restart,
      targets: shuffle([...roundScene.products]).slice(
        0,
        Math.min(5, level + 2),
      ),
      spots: shuffle([0, 1, 2, 3, 4, 5]).slice(0, 5),
    });
  }
  if (!showGame) {
    return (
      <main className={styles.intro} aria-labelledby="lost-page-title">
        <div className={styles.introCopy}>
          <span className={styles.introEyebrow}>404 · Enjoyful Life</span>
          <h1 id="lost-page-title">
            Wrong turn?
            <br />
            <em>Find a little joy.</em>
          </h1>
          <p>
            This page isn&apos;t here. Don&apos;t worry—we can find some products
            together.
          </p>
          <div className={styles.introActions}>
            <button type="button" onClick={() => setShowGame(true)}>
              Find Joyful <ArrowRight size={20} />
            </button>
            <Link href="/">
              <ArrowLeft size={20} /> Go home
            </Link>
          </div>
        </div>
        <div className={styles.introVisual} aria-hidden="true">
          <div className={styles.introScene} />
        </div>
      </main>
    );
  }
  return (
    <section className={styles.page} aria-label="Enjoyful Life product hunt">
      <div className={styles.gameLayout}>
        <aside
          className={styles.sidebar}
          aria-label="Treasure list and game controls"
        >
          <div className={styles.sidebarHeader}>
            <span className={styles.brandMark}>✦ Enjoyful Life</span>
            <h1>Treasure list</h1>
            <p>
              {state.found.length} of {state.targets.length} found
            </p>
          </div>
          <ul className={styles.targets} aria-label="Products to find">
            {state.targets.map((id) => (
              <li
                key={id}
                className={state.found.includes(id) ? styles.targetFound : ""}
              >
                <span className={styles.thumbnail}>
                  <ProductSprite id={id} />
                </span>
                <span className={styles.targetName}>{PRODUCTS[id]}</span>
                {state.found.includes(id) && (
                  <Check
                    className={styles.targetCheck}
                    size={18}
                    aria-label="Found"
                  />
                )}
              </li>
            ))}
          </ul>
          <div className={styles.sidebarFooter}>
            <p role="status" aria-live="polite">
              {state.message}
            </p>
            <div className={styles.controls}>
              <button
                type="button"
                onClick={() => dispatch({ type: "hint" })}
                disabled={complete}
              >
                <Lightbulb size={18} /> Hint
              </button>
              <button
                type="button"
                onClick={() => newRound(true)}
                aria-label="Restart game"
              >
                <RotateCcw size={18} /> Restart
              </button>
            </div>
          </div>
          <nav className={styles.bottomNav} aria-label="Leave the game">
            <Link href="/" aria-label="Back to home">
              <ArrowLeft size={20} />
              <span className={styles.fullLabel}>Back to home</span>
              <span className={styles.shortLabel}>Home</span>
            </Link>
            <Link href="/category/all" aria-label="Shop products">
              <span className={styles.fullLabel}>Shop products</span>
              <span className={styles.shortLabel}>Shop</span>
              <ArrowRight size={20} />
            </Link>
          </nav>
        </aside>
        <div className={styles.playArea}>
          <div className={styles.toolbar}>
            <span>
              <Sparkles size={18} /> Level {state.level}{" "}
              <span className={styles.sceneName}>· {scene.name}</span>
            </span>
            <span className={styles.scores}>
              Score <strong>{state.score}</strong>
              <Trophy size={16} /> Best{" "}
              <strong>{Math.max(best, state.score)}</strong>
            </span>
          </div>
          <div
            ref={sceneRef}
            className={styles.scene}
            aria-label={`Search ${scene.name.toLowerCase()} for your target products`}
          >
            <div
              className={styles.sceneArtwork}
              data-scene-artwork
              style={{ backgroundImage: `url('${scene.image}')` }}
              aria-hidden="true"
            />
            {scene.products.map((id, slot) => (
              <HiddenProduct
                key={`${state.roundId}-${id}`}
                id={id}
                slot={slot}
                position={projectSpot(
                  scene.spots[state.spots[slot]],
                  sceneSize,
                )}
                supportBounds={[
                  projectSpot([scene.supportBounds[0], 50], sceneSize)[0],
                  projectSpot([scene.supportBounds[1], 50], sceneSize)[0],
                ]}
                stageWidth={sceneSize.width}
                active={!complete}
                found={state.found.includes(id)}
                hinted={state.hint === id}
                onFind={() => dispatch({ type: "find", id })}
              />
            ))}
            {complete && (
              <div className={styles.overlay}>
                <div className={styles.invite}>
                  <Trophy className={styles.trophyIcon} size={30} />
                  <p>LEVEL {state.level} COMPLETE</p>
                  <h2>You found them all!</h2>
                  <p>+200 bonus points</p>
                  <button
                    ref={nextButton}
                    className={styles.primary}
                    onClick={() => newRound()}
                  >
                    Next level <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
