import { around } from "monkey-around";
import { Notice, Platform, Plugin, type Hotkey } from "obsidian";
import { toAccelerator } from "./accelerator";

// The parts of Electron's main-process API this plugin uses, reached through
// the `remote` module Obsidian exposes to the renderer.
interface ElectronWindow {
	isMinimized(): boolean;
	restore(): void;
	show(): void;
	focus(): void;
	minimize(): void;
}

interface ElectronRemote {
	app: { hide(): void; show(): void; focus(options?: { steal: boolean }): void };
	BrowserWindow: { getFocusedWindow(): ElectronWindow | null };
	getCurrentWindow(): ElectronWindow;
	globalShortcut: {
		register(accelerator: string, callback: () => void): boolean;
		unregister(accelerator: string): void;
		isRegistered(accelerator: string): boolean;
	};
}

// Obsidian's undocumented hotkey store, behind Settings → Hotkeys.
interface HotkeyManager {
	getHotkeys(id: string): Hotkey[] | undefined;
	getDefaultHotkeys(id: string): Hotkey[] | undefined;
	setHotkeys(id: string, hotkeys: Hotkey[]): void;
	removeHotkeys(id: string): void;
	load(): Promise<void>;
}

const COMMAND_ID = "toggle-obsidian";

export default class QuickAccessPlugin extends Plugin {
	private remote!: ElectronRemote;
	/** Accelerators this window registered, so it only releases its own. */
	private registered: string[] = [];
	/** The hotkeys last registered, to skip work when another command's hotkey changes. */
	private registeredFor: string | null = null;

	override onload() {
		// eslint-disable-next-line @typescript-eslint/no-require-imports -- Electron is only reachable through require
		this.remote = (require("electron") as { remote: ElectronRemote }).remote;

		// No default hotkey: the user picks one in Settings → Hotkeys, and the
		// plugin registers the same keys with the OS so they work from any app.
		this.addCommand({
			id: COMMAND_ID,
			name: "Show or hide Obsidian from any app",
			callback: () => this.toggle(),
		});

		// Re-register whenever the hotkey changes in settings, or hotkeys.json
		// is reloaded after a sync.
		const hotkeys = this.hotkeyManager();
		const refresh = () => window.setTimeout(() => this.registerGlobalShortcuts());
		this.register(
			around(hotkeys, {
				setHotkeys: (original) =>
					function (this: HotkeyManager, ...args) {
						original.apply(this, args);
						refresh();
					},
				removeHotkeys: (original) =>
					function (this: HotkeyManager, ...args) {
						original.apply(this, args);
						refresh();
					},
				load: (original) =>
					async function (this: HotkeyManager, ...args) {
						await original.apply(this, args);
						refresh();
					},
			}),
		);

		// Closing the window doesn't always unload plugins, and a shortcut left
		// registered would block it from being registered again.
		this.registerDomEvent(window, "beforeunload", () => this.unregisterGlobalShortcuts());
		this.app.workspace.onLayoutReady(() => this.registerGlobalShortcuts());
	}

	override onunload() {
		this.unregisterGlobalShortcuts();
	}

	private hotkeyManager(): HotkeyManager {
		return (this.app as unknown as { hotkeyManager: HotkeyManager }).hotkeyManager;
	}

	private commandHotkeys(): Hotkey[] {
		const id = `${this.manifest.id}:${COMMAND_ID}`;
		const hotkeys = this.hotkeyManager();
		return hotkeys.getHotkeys(id) ?? hotkeys.getDefaultHotkeys(id) ?? [];
	}

	private registerGlobalShortcuts() {
		const hotkeys = this.commandHotkeys();
		const key = JSON.stringify(hotkeys);
		if (key === this.registeredFor) return;
		this.unregisterGlobalShortcuts();
		this.registeredFor = key;
		const { globalShortcut } = this.remote;
		for (const hotkey of hotkeys) {
			const accelerator = toAccelerator(hotkey);
			if (!accelerator) {
				new Notice("This key can't be a global shortcut, so it only works inside Obsidian. Pick another key in the hotkey settings.");
				continue;
			}
			// Fails when another app, or this plugin in another open vault,
			// already holds the shortcut.
			if (globalShortcut.isRegistered(accelerator) || !globalShortcut.register(accelerator, () => this.toggle())) {
				new Notice(`Another app or vault already uses ${accelerator}, so the Quick Access shortcut only works inside Obsidian.`);
				continue;
			}
			this.registered.push(accelerator);
		}
	}

	private unregisterGlobalShortcuts() {
		for (const accelerator of this.registered) this.remote.globalShortcut.unregister(accelerator);
		this.registered = [];
		this.registeredFor = null;
	}

	private toggle() {
		const { app, BrowserWindow } = this.remote;
		if (BrowserWindow.getFocusedWindow()) {
			// On macOS, hiding the app hands focus back to the app used before it.
			// Elsewhere, minimizing does the same.
			if (Platform.isMacOS) app.hide();
			else BrowserWindow.getFocusedWindow()?.minimize();
			return;
		}
		const win = this.remote.getCurrentWindow();
		if (Platform.isMacOS) app.show();
		if (win.isMinimized()) win.restore();
		win.show();
		if (Platform.isMacOS) app.focus({ steal: true });
		win.focus();
	}
}
