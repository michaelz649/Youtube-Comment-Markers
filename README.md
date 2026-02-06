# 🎬 YouTube Comment Timeline Overlay

### Visualize comments directly on the video timeline. Spot highlights, discussions, and reactions instantly with timestamp markers.

[![GitHub Stars](https://img.shields.io/github/stars/CheswickDEV/Youtube-Comment-Timeline-Overlay?color=00d4ff&labelColor=16161f)](https://github.com/CheswickDEV/Youtube-Comment-Timeline-Overlay)
[![Last Commit](https://img.shields.io/github/last-commit/CheswickDEV/Youtube-Comment-Timeline-Overlay?color=a855f7&labelColor=16161f)](https://github.com/CheswickDEV/Youtube-Comment-Timeline-Overlay/commits/main)
![Version](https://img.shields.io/badge/version-1.1-00d4ff?labelColor=16161f)
![Status](https://img.shields.io/badge/status-Active-00d4ff?labelColor=16161f)
![License](https://img.shields.io/badge/license-MIT-a855f7?labelColor=16161f)
![Firefox](https://img.shields.io/badge/Firefox-Manifest_v3-a855f7?logo=firefox&logoColor=white&labelColor=16161f)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-00d4ff?logo=javascript&logoColor=white&labelColor=16161f)

---

## 💡 What It Does

Ever wished you could see *where* the interesting moments in a YouTube video are — based on what people are actually talking about? This Firefox extension scans the comment section for timestamp references and places visual markers directly onto the video progress bar.

Comments cluster together at moments that matter — highlights, controversies, plot twists, funny scenes — and you can see them at a glance without scrolling through hundreds of comments.

<img src="https://addons.mozilla.org/user-media/previews/thumbs/348/348369.jpg?modified=1768910827">

---

## ⚡ Features

- **📍 Timeline Markers** — Yellow markers appear on the YouTube progress bar at every timestamp mentioned in the comments. Clustered comments get wider, brighter markers so hotspots stand out immediately.

- **💬 Rich Tooltips** — Hover over any marker to see the comment author, avatar, text, like count, and reply count in a clean tooltip card. Clusters expand into a scrollable list of all comments at that position.

- **⏩ Click-to-Seek** — Click any marker or tooltip to jump directly to that moment in the video and start playback. Click a specific comment in a cluster to also scroll down to it.

- **🔄 Auto-Loading** — The extension automatically scrolls through the comment section in the background, collecting up to 600+ comments to build the most complete timeline possible.

- **🔒 Secure DOM Handling** — All DOM manipulation uses safe methods (`textContent`, `DOMParser` for SVGs) — no `innerHTML` injections anywhere.

---

## 🚀 Quick Start

### Prerequisites

- Firefox 142+

###  Installation

1. Open [Link](https://addons.mozilla.org/de/firefox/addon/kleinanzeigen-filter/) in Firefox
2. Click "Install"

###  Installation without Firefox Store

1. Rename the `.zip` file to `.xpi`
2. In Firefox → Menu → Add-ons and Themes
3. Gear icon → "Install Add-on From File..."
4. Select the `.xpi` file


3. **Open any YouTube video** — markers appear automatically after comments load (~3 seconds)

---

## 🔄 How It Works

```
┌──────────────────┐     ┌───────────────────────┐     ┌──────────────────┐
│  YouTube Video   │     │   Content Script       │     │  Timeline Overlay│
│  Page Loads      │────▶│                        │────▶│  Markers Appear  │
│                  │     │  1. Auto-scroll to     │     │  on Progress Bar │
│                  │     │     load comments       │     │                  │
│                  │     │  2. Extract timestamps  │     │  Hover → Tooltip │
│                  │     │  3. Cluster nearby ones │     │  Click → Seek    │
│                  │     │  4. Build markers       │     │                  │
└──────────────────┘     └───────────────────────┘     └──────────────────┘
```

**Comment Clustering:** Comments within 0.5% of the video duration from each other are grouped into a single cluster marker. This prevents visual clutter on videos with many timestamp comments at similar positions.

**Continuous Updates:** The extension monitors for new comments being loaded (e.g., when the user scrolls) and rebuilds the overlay every 2 seconds if the comment count changes.

---

## 🛠️ Tech Stack

![JavaScript](https://img.shields.io/badge/JavaScript-16161f?logo=javascript&logoColor=00d4ff)
![CSS](https://img.shields.io/badge/CSS3-16161f?logo=css3&logoColor=00d4ff)
![Firefox](https://img.shields.io/badge/WebExtensions_API-16161f?logo=firefox&logoColor=a855f7)

```
Youtube-Comment-Timeline-Overlay/
├── manifest.json       # Extension manifest (v3)
├── content.js          # Core logic: comment extraction, clustering, UI
├── styles.css          # Marker and tooltip styling
└── icons/
    ├── icon-48.png
    └── icon-96.png
```

---

## 📝 Changelog

### v1.1 (current)
- ✨ Improved comment clustering algorithm
- ✨ Rich tooltips with author avatars and engagement metrics
- ✨ Click-to-seek and scroll-to-comment functionality

<details>
<summary>Older versions</summary>

### v1.0
- 🚀 Initial release
- ✨ Timestamp extraction from YouTube comments
- ✨ Timeline marker overlay on progress bar
- ✨ Auto-loading of comments via background scrolling
- ✨ Basic tooltip on hover

</details>

---

## 📄 License

[MIT](LICENSE) — do what you want, just give credit.

---

<p align="center">
  <a href="https://cheswick.dev">
    <img src="https://img.shields.io/badge/CHESWICK.DEV-00d4ff?logo=firefox&logoColor=0a0a0f&labelColor=a855f7" alt="cheswick.dev" />
  </a>
</p>

<p align="center">
  Made with 🖤 by <a href="https://cheswick.dev">cheswick.dev</a>
</p>
