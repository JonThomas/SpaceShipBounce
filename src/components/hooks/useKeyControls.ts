import { useEffect, useRef } from "react";

export interface KeysState {
  up: boolean;
  left: boolean;
  right: boolean;
}

/**
 * Custom hook to handle Arrow key controls for the game.
 * Returns a ref object containing the current key states.
 */
export function useKeyControls(): React.MutableRefObject<KeysState> {
  const keysRef = useRef<KeysState>({ up: false, left: false, right: false });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowUp") keysRef.current.up = true;
      if (e.code === "ArrowLeft") keysRef.current.left = true;
      if (e.code === "ArrowRight") keysRef.current.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowUp") keysRef.current.up = false;
      if (e.code === "ArrowLeft") keysRef.current.left = false;
      if (e.code === "ArrowRight") keysRef.current.right = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return keysRef;
}
