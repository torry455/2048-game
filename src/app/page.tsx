"use client";

import { useState, useEffect, useCallback } from "react";

type Direction = "left" | "right" | "up" | "down";

const SIZE = 4;

const getEmptyBoard = (): number[][] =>
  Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

const addRandomTile = (board: number[][]): number[][] => {
  const emptyPositions = board.flatMap((row, r) =>
    row
      .map((cell, c) => (cell === 0 ? { r, c } : null))
      .filter((pos): pos is { r: number; c: number } => pos !== null)
  );

  if (emptyPositions.length === 0) return board;

  const { r, c } = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
  const newBoard = board.map(row => [...row]);
  newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;

  return newBoard;
};

const boardsEqual = (a: number[][], b: number[][]): boolean =>
  a.every((row, r) => row.every((val, c) => val === b[r][c]));

const moveLeftCustom = (board: number[][], collectFromBottom = false): number[][] => {
  const reverseRow = (row: number[]) => [...row].reverse();

  return board.map(row => {
    const processedRow = collectFromBottom ? reverseRow(row) : row;
    const filtered = processedRow.filter(n => n !== 0);

    const merged: number[] = [];
    let skip = false;
    for (let i = 0; i < filtered.length; i++) {
      if (skip) {
        skip = false;
        continue;
      }
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        merged.push(filtered[i] * 2);
        skip = true;
      } else {
        merged.push(filtered[i]);
      }
    }

    while (merged.length < SIZE) merged.push(0);

    return collectFromBottom ? reverseRow(merged) : merged;
  });
};

const rotate = (board: number[][]): number[][] => {
  const newBoard = getEmptyBoard();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      newBoard[c][SIZE - 1 - r] = board[r][c];
    }
  }
  return newBoard;
};

const move = (board: number[][], direction: Direction): number[][] => {
  switch (direction) {
    case "left":
      return moveLeftCustom(board, false);
    case "right": {
      const rotated = rotate(rotate(board));
      const moved = moveLeftCustom(rotated, false);
      return rotate(rotate(moved));
    }
    case "up": {
      const rotated = rotate(board);
      const moved = moveLeftCustom(rotated, false);
      return rotate(rotate(rotate(moved)));
    }
    case "down": {
      const rotated = rotate(rotate(rotate(board)));
      const moved = moveLeftCustom(rotated, true);
      return rotate(moved);
    }
  }
};

const getTileColor = (num: number): string => {
  const colors: Record<number, string> = {
    2: "bg-yellow-200 text-yellow-900",
    4: "bg-yellow-300 text-yellow-900",
    8: "bg-orange-400 text-white",
    16: "bg-orange-500 text-white",
    32: "bg-red-400 text-white",
    64: "bg-red-600 text-white",
    128: "bg-green-400 text-white",
    256: "bg-green-600 text-white",
    512: "bg-blue-400 text-white",
    1024: "bg-blue-600 text-white",
    2048: "bg-purple-600 text-white",
  };
  return colors[num] ?? "bg-gray-300 text-gray-800";
};

export default function Game2048() {
  const [board, setBoard] = useState<number[][]>(getEmptyBoard);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("board");
    if (saved) {
      setBoard(JSON.parse(saved));
    } else {
      setBoard(addRandomTile(getEmptyBoard()));
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("board", JSON.stringify(board));
    }
  }, [board, isInitialized]);

  const handleMove = useCallback(
    (dir: Direction) => {
      setBoard(prevBoard => {
        const newBoard = move(prevBoard, dir);
        if (boardsEqual(newBoard, prevBoard)) return prevBoard;
        return addRandomTile(newBoard);
      });
    },
    []
  );

  useEffect(() => {
    const keyToDir: Record<string, Direction | undefined> = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
    };

    const handleKey = (e: KeyboardEvent) => {
      const dir = keyToDir[e.key];
      if (dir) {
        e.preventDefault();
        handleMove(dir);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleMove]);

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    const handleMouseDown = (e: MouseEvent) => {
      startX = e.clientX;
      startY = e.clientY;
      isDragging = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging) return;
      isDragging = false;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;

      const dir: Direction = Math.abs(dx) > Math.abs(dy)
        ? dx > 0 ? "right" : "left"
        : dy > 0 ? "down" : "up";

      handleMove(dir);
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMove]);

  const resetGame = () => {
    localStorage.removeItem("board");
    setBoard(addRandomTile(getEmptyBoard()));
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-4xl font-bold mb-6">2048 Game</h1>
      <div className="grid grid-cols-4 gap-4 bg-gray-300 p-4 rounded-lg shadow-lg">
        {board.flat().map((num, i) => (
          <div
            key={i}
            className={`cursor-pointer flex items-center justify-center w-20 h-20 rounded-md font-bold text-2xl select-none
              ${num === 0 ? "bg-gray-200" : getTileColor(num)}
            `}
          >
            {num !== 0 ? num : ""}
          </div>
        ))}
      </div>
      <button
        onClick={resetGame}
        className="cursor-pointer mt-6 px-4 py-2 bg-red-400 text-white rounded hover:bg-red-500 transition"
      >
        Start again
      </button>
    </main>
  );
}
