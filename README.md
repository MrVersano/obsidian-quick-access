# Quick Access

An Obsidian plugin that brings Obsidian to the front from any app with a global shortcut. Press the shortcut again and Obsidian hides, so you're back in the app you were using.

## Installation

In Obsidian, open **Settings → Community plugins → Browse**, search for **Quick Access**, then install and enable it.

To install by hand, download `main.js` and `manifest.json` from the [latest release](https://github.com/MrVersano/obsidian-quick-access/releases/latest) into `<vault>/.obsidian/plugins/quick-access/`, then enable the plugin under **Settings → Community plugins**.

## Setup

1. Install and enable the plugin.
2. Open **Settings → Hotkeys**, search for **Quick Access: Show or hide Obsidian from any app**, and assign a shortcut.

That's the whole setup. The plugin registers the same shortcut with the operating system, so it works while any app is in front. Change or remove the hotkey in the same place, and the global shortcut follows right away.

## Notes

- Desktop only. Obsidian has to be running.
- Pick a shortcut that other apps don't use. If another app or another open vault already holds it, a notice says so and the shortcut only works inside Obsidian.
- If several vaults are open, install the plugin in one of them, or give each vault its own shortcut. The shortcut brings up the vault that owns it.
- On macOS, hiding Obsidian returns focus to the app you were using. On Windows and Linux, Obsidian is minimized instead, and the window manager decides which window gets focus.

## Development

```sh
npm install
npm run dev     # rebuild on change
npm run build   # type-check and build main.js
npm run lint
npm test
```

Each build is copied into `../better-backlinks/test-vault/.obsidian/plugins/quick-access` when that vault exists.
