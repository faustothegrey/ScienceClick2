"use client";

import { Delete } from "lucide-react";

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

interface LetterKeyboardProps {
  onLetter: (letter: string) => void;
  onBackspace: () => void;
}

// On-screen keyboard: behaves the same with a mouse, a finger or a pen, and
// doesn't depend on the OS touch keyboard showing up on the board.
export default function LetterKeyboard({ onLetter, onBackspace }: LetterKeyboardProps) {
  const key =
    "h-12 flex-1 min-w-0 rounded-lg bg-white text-slate-800 text-xl font-semibold shadow-sm border border-slate-300 active:bg-sky-100 select-none touch-manipulation";
  return (
    <div className="flex flex-col gap-1.5">
      {ROWS.map((row, i) => (
        <div key={row} className="flex gap-1.5" style={{ paddingInline: `${i * 4}%` }}>
          {[...row].map((letter) => (
            <button key={letter} type="button" className={key} onClick={() => onLetter(letter)}>
              {letter}
            </button>
          ))}
          {i === ROWS.length - 1 && (
            <button type="button" aria-label="Cancella" className={`${key} flex-[1.6] flex items-center justify-center`} onClick={onBackspace}>
              <Delete className="w-6 h-6" />
            </button>
          )}
        </div>
      ))}
      <div className="flex gap-1.5 px-[12%]">
        <button type="button" className={key} onClick={() => onLetter(" ")}>
          spazio
        </button>
      </div>
    </div>
  );
}
