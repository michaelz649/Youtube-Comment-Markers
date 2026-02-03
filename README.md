# YouTube Comment Timeline 🎥💬

A Firefox extension that visualizes YouTube comments directly on the video timeline. Find the most engaging parts of a video instantly based on community timestamps.

<img src="https://addons.mozilla.org/user-media/previews/thumbs/348/348369.jpg?modified=1768910827">

## ✨ Features

* **Timeline Markers:** Gold markers on the progress bar indicate where comments refer to specific moments.
* **Smart Clustering:** High-density comment sections are grouped into clusters to maintain performance and readability.
* **Rich Tooltips:**
    * Displays full comment text.
    * Shows user avatars.
    * **Social Stats:** See likes 👍 and reply counts 💬 at a glance.
* **Interactive Navigation:**
    * **Click Marker:** Seeks the video exactly to the timestamp of the comment.
    * **Click Tooltip:** Scrolls down to the original comment in the discussion section.
    * **Cluster Support:** Select specific comments from a list when multiple events happen close together.
* **Auto-Update:** Automatically detects and adds markers for new comments as you scroll down the page.
* **Native Design:** Seamlessly integrates with the YouTube player (supports Dark Mode & Fullscreen).

## 🚀 Installation (Developer Mode)

1.  Clone this repository or download the ZIP.
2.  Open Firefox and navigate to `about:debugging`.
3.  Click on **"This Firefox"** in the sidebar.
4.  Click **"Load Temporary Add-on..."**.
5.  Select the `manifest.json` file from this project folder.
6.  Open any YouTube video and enjoy the timeline!

## 📦 Installation (For Users)

[Download from Firefox Add-ons](https://addons.mozilla.org/de/firefox/addon/youtube-comment-timeline/)

## 🛠 Technologies

* JavaScript (ES6+)
* CSS3 (Native YouTube styling)
* Firefox WebExtension API (Manifest V3)

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
