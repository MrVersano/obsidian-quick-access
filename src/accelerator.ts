import type { Hotkey } from "obsidian";

// Obsidian's modifier names, in the order Electron expects them.
const MODIFIERS: [Hotkey["modifiers"][number], string][] = [
	["Mod", "CommandOrControl"],
	["Ctrl", "Control"],
	["Meta", "Super"],
	["Alt", "Alt"],
	["Shift", "Shift"],
];

// Keys whose Obsidian name differs from Electron's accelerator name.
const KEYS: Record<string, string> = {
	" ": "Space",
	"+": "Plus",
	ArrowUp: "Up",
	ArrowDown: "Down",
	ArrowLeft: "Left",
	ArrowRight: "Right",
	Enter: "Return",
};

const ELECTRON_KEYS = new Set([
	"Space", "Plus", "Up", "Down", "Left", "Right", "Return", "Tab", "Backspace",
	"Delete", "Insert", "Home", "End", "PageUp", "PageDown", "Escape",
]);

/**
 * Converts an Obsidian hotkey into an Electron accelerator string, such as
 * `{ modifiers: ["Mod", "Shift"], key: "O" }` → `"CommandOrControl+Shift+O"`.
 * Returns null for keys Electron can't register globally.
 */
export function toAccelerator(hotkey: Hotkey): string | null {
	const key = toElectronKey(hotkey.key);
	if (!key) return null;
	const modifiers = MODIFIERS.filter(([name]) => hotkey.modifiers.includes(name)).map(([, electron]) => electron);
	return [...modifiers, key].join("+");
}

function toElectronKey(key: string): string | null {
	const mapped = KEYS[key] ?? key;
	if (mapped.length === 1) return mapped.toUpperCase();
	if (/^F([1-9]|1\d|2[0-4])$/.test(mapped)) return mapped;
	return ELECTRON_KEYS.has(mapped) ? mapped : null;
}
