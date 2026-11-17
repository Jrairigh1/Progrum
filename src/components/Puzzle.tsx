import { useState } from "react";
import type { DragEvent } from "react";
import { dragMightBeLink, formatAdded, parseHttpsUrl, readDroppedText } from "../lib/links";
import { BOARD_H, BOARD_W, CELL, COLS, STROKE_PAD, cellTabs, piecePath, rowTabs } from "../puzzle/geometry";
import { SceneArt, SceneDefs } from "../puzzle/Scene";
import type { LinkRecord, PieceDef } from "../types";

interface BoardProps {
  pieces: PieceDef[];
  links: Record<string, LinkRecord | undefined>;
  complete: boolean;
  onEdit: (piece: PieceDef) => void;
  onClear: (piece: PieceDef) => void;
  onDropLink: (piece: PieceDef, url: string) => void;
  onReject: (message: string) => void;
}

const viewW = BOARD_W + STROKE_PAD * 2;
const viewH = BOARD_H + STROKE_PAD * 2;

export function PuzzleBoard({ pieces, links, complete, onEdit, onClear, onDropLink, onReject }: BoardProps) {
  const cells = Array.from({ length: COLS * 3 }, (_, index) => {
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    const path = piecePath(col * CELL, row * CELL, CELL, CELL, cellTabs(col, row));
    return { index, path, piece: pieces[index] };
  });

  return (
    <div className="board-scroll">
      <div className={`board-frame ${complete ? "is-complete" : ""}`}>
        <svg
          className="board-svg"
          viewBox={`${-STROKE_PAD} ${-STROKE_PAD} ${viewW} ${viewH}`}
          role="img"
          aria-label="Intake puzzle. Filled pieces reveal the picture."
        >
          <defs>
            <SceneDefs />
            <SceneArt />
            {cells.map((cell) => (
              <clipPath id={`clip-${cell.index}`} key={cell.index}>
                <path d={cell.path} />
              </clipPath>
            ))}
          </defs>
          {cells.map((cell) => {
            const filled = cell.piece ? Boolean(links[cell.piece.id]?.url) : true;
            if (!filled) return <path key={cell.index} d={cell.path} fill="#e4ddd0" />;
            return (
              <g key={cell.index} clipPath={`url(#clip-${cell.index})`}>
                <use href="#scene" />
              </g>
            );
          })}
          {cells.map((cell) => {
            const filled = cell.piece ? Boolean(links[cell.piece.id]?.url) : true;
            return (
              <path
                key={`stroke-${cell.index}`}
                d={cell.path}
                fill="none"
                stroke={filled ? "#f6f1e6" : "#b7ad9c"}
                strokeWidth={filled ? 3 : 2}
                pointerEvents="none"
              />
            );
          })}
        </svg>
        <div
          className="board-grid"
          style={{
            left: `${(STROKE_PAD / viewW) * 100}%`,
            top: `${(STROKE_PAD / viewH) * 100}%`,
            width: `${(BOARD_W / viewW) * 100}%`,
            height: `${(BOARD_H / viewH) * 100}%`,
          }}
        >
          {cells.map((cell) =>
            cell.piece ? (
              <PieceFace
                key={cell.piece.id}
                piece={cell.piece}
                link={links[cell.piece.id]}
                onEdit={onEdit}
                onClear={onClear}
                onDropLink={onDropLink}
                onReject={onReject}
              />
            ) : (
              <div key="seal" className="seal" aria-hidden="true">
                <div className="seal-ring">
                  <strong>CBC</strong>
                  <span>Settlement Funding</span>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

const EXTRA_W = 230;
const EXTRA_H = 176;

export function ExtraStrip({
  pieces,
  links,
  onEdit,
  onClear,
  onDropLink,
  onReject,
}: Omit<BoardProps, "complete">) {
  if (pieces.length === 0) return null;
  const width = EXTRA_W * pieces.length;
  const height = EXTRA_H;
  const pad = STROKE_PAD;
  const viewWidth = width + pad * 2;
  const viewHeight = height + pad * 2;
  return (
    <div className="board-scroll extra-scroll">
      <div className="board-frame extra-frame" style={{ maxWidth: pieces.length * 260 }}>
        <svg className="board-svg" viewBox={`${-pad} ${-pad} ${viewWidth} ${viewHeight}`} aria-hidden="true">
          <defs>
            <linearGradient id="extra-wash" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#123a66" />
              <stop offset="55%" stopColor="#1d5c92" />
              <stop offset="100%" stopColor="#c6a15b" />
            </linearGradient>
            {pieces.map((piece, index) => (
              <clipPath id={`extra-clip-${piece.id}`} key={piece.id}>
                <path d={piecePath(index * EXTRA_W, 0, EXTRA_W, EXTRA_H, rowTabs(index, pieces.length))} />
              </clipPath>
            ))}
          </defs>
          {pieces.map((piece, index) => {
            const d = piecePath(index * EXTRA_W, 0, EXTRA_W, EXTRA_H, rowTabs(index, pieces.length));
            const filled = Boolean(links[piece.id]?.url);
            return (
              <g key={piece.id}>
                {filled ? (
                  <g clipPath={`url(#extra-clip-${piece.id})`}>
                    <rect x="0" y="0" width={width} height={height} fill="url(#extra-wash)" />
                  </g>
                ) : (
                  <path d={d} fill="#e4ddd0" />
                )}
                <path d={d} fill="none" stroke={filled ? "#f6f1e6" : "#b7ad9c"} strokeWidth={filled ? 3 : 2} />
              </g>
            );
          })}
        </svg>
        <div
          className="board-grid extra-grid"
          style={{
            left: `${(pad / viewWidth) * 100}%`,
            top: `${(pad / viewHeight) * 100}%`,
            width: `${(width / viewWidth) * 100}%`,
            height: `${(height / viewHeight) * 100}%`,
            gridTemplateColumns: `repeat(${pieces.length}, 1fr)`,
            gridTemplateRows: "1fr",
          }}
        >
          {pieces.map((piece) => (
            <PieceFace
              key={piece.id}
              piece={piece}
              link={links[piece.id]}
              onEdit={onEdit}
              onClear={onClear}
              onDropLink={onDropLink}
              onReject={onReject}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PieceFace({
  piece,
  link,
  onEdit,
  onClear,
  onDropLink,
  onReject,
}: {
  piece: PieceDef;
  link: LinkRecord | undefined;
  onEdit: (piece: PieceDef) => void;
  onClear: (piece: PieceDef) => void;
  onDropLink: (piece: PieceDef, url: string) => void;
  onReject: (message: string) => void;
}) {
  const [over, setOver] = useState(false);
  const filled = Boolean(link?.url);

  function allowDrop(event: DragEvent) {
    if (!dragMightBeLink(event.dataTransfer) && event.dataTransfer.types.length === 0) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setOver(true);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setOver(false);
    const dropped = readDroppedText(event.dataTransfer);
    if (dropped.kind === "file") {
      onReject("Progrum does not take files. Paste the https link. The file stays on the shared drive.");
      return;
    }
    if (dropped.kind === "empty") {
      onReject("Drop an https link onto the piece.");
      return;
    }
    const parsed = parseHttpsUrl(dropped.value);
    if (!parsed.ok) {
      onReject(parsed.message);
      return;
    }
    onDropLink(piece, parsed.url);
  }

  const label = filled
    ? `${piece.label}, link saved as ${link?.label}, added ${link ? formatAdded(link.addedAt) : ""}. Edit link.`
    : `${piece.label}. Empty. Paste an https link.`;

  return (
    <div
      className={`cell ${filled ? "is-filled" : "is-empty"} ${over ? "is-over" : ""}`}
      data-piece={piece.id}
      onDragEnter={allowDrop}
      onDragOver={allowDrop}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={onDrop}
    >
      <button type="button" className="cell-hit" onClick={() => onEdit(piece)} aria-label={label} title={piece.hint}>
        {filled && (
          <span className="check" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M7 12.5 l3.1 3.1 L17.5 8.5" />
            </svg>
          </span>
        )}
        <span className="cell-label">{piece.short}</span>
        {filled && link ? (
          <>
            <span className="cell-file">{link.label}</span>
            <span className="cell-date">{formatAdded(link.addedAt)}</span>
          </>
        ) : (
          <span className="cell-cue">Paste link</span>
        )}
        {piece.badge && <span className="cell-badge">{piece.badge}</span>}
      </button>
      {filled && link && (
        <div className="cell-actions">
          <a href={link.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
            Open
          </a>
          <button type="button" onClick={() => onClear(piece)}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

export function safeHref(url: string | undefined): string | null {
  if (!url) return null;
  const parsed = parseHttpsUrl(url);
  return parsed.ok ? parsed.url : null;
}
