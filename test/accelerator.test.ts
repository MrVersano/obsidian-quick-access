import { describe, expect, it } from "vitest";
import { toAccelerator } from "../src/accelerator";

describe("toAccelerator", () => {
	it("maps modifiers in Electron's order", () => {
		expect(toAccelerator({ modifiers: ["Shift", "Mod"], key: "o" })).toBe("CommandOrControl+Shift+O");
		expect(toAccelerator({ modifiers: ["Alt", "Ctrl", "Meta"], key: "K" })).toBe("Control+Super+Alt+K");
	});

	it("renames keys Electron spells differently", () => {
		expect(toAccelerator({ modifiers: ["Mod"], key: " " })).toBe("CommandOrControl+Space");
		expect(toAccelerator({ modifiers: ["Mod"], key: "ArrowUp" })).toBe("CommandOrControl+Up");
		expect(toAccelerator({ modifiers: ["Mod"], key: "+" })).toBe("CommandOrControl+Plus");
		expect(toAccelerator({ modifiers: ["Alt"], key: "Enter" })).toBe("Alt+Return");
	});

	it("keeps punctuation and function keys", () => {
		expect(toAccelerator({ modifiers: ["Mod"], key: "/" })).toBe("CommandOrControl+/");
		expect(toAccelerator({ modifiers: [], key: "F13" })).toBe("F13");
	});

	it("rejects keys Electron can't register", () => {
		expect(toAccelerator({ modifiers: ["Mod"], key: "Dead" })).toBeNull();
		expect(toAccelerator({ modifiers: ["Mod"], key: "F25" })).toBeNull();
	});
});
