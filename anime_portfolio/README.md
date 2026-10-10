<h1 align="center">✨ Chronicles - Anime Cinematic Portfolio 🌸</h1>

<p align="center">
  An anime-inspired cinematic portfolio and landing page featuring 2D parallax scrolling, Three.js 3D WebGL scenes, and smooth scene transitions.
</p>

<div align="center">
  <img src="https://img.shields.io/badge/HTML5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5"/>
  <img src="https://img.shields.io/badge/CSS3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3"/>
  <img src="https://img.shields.io/badge/JavaScript-%23F7DF1E.svg?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/>
  <img src="https://img.shields.io/badge/Three.js-%23000000.svg?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js"/>
</div>

---

## 📖 Table of Contents
- [The Story Behind This Project](#-the-story-behind-this-project)
- [Screenshots](#-screenshots)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Installation and Usage](#-installation-and-usage)
- [File Structure](#-file-structure)
- [Contribution](#-contribution)
- [License](#-license)
- [Author](#-author)

---

## 📜 The Story Behind This Project

This project aims to combine traditional anime-inspired visual aesthetics (think Studio Ghibli or Makoto Shinkai style backgrounds) with modern frontend web engineering. I could have just thrown together a simple template and called it a day, but I genuinely wanted to create something that looked like a real, premium platform.

I recently went back to it and completely polished it up. I restructured the layouts, added custom vector illustrations, fixed a bunch of responsive mobile issues, and implemented a sleek, consistent ambient WebGL background. It's really cool seeing how a simple assignment can transform into a professional-looking frontend with just some careful styling and attention to detail.

If you like how it turned out, feel free to drop a **star ⭐** or **fork it 🍴**!

I really like what I made and wanted to share it with you all. I am also very open to suggestions, so if you have any feedback or ideas, please let me know!

---

## 🖥️ Screenshots

<div align="center">
  <a href="pic/screenshot-1.png"><img src="pic/screenshot-1.png" alt="Homepage Hero Section" width="48%" style="max-width: 100%; height: auto; margin-bottom: 10px;"></a>
  <a href="pic/screenshot-2.png"><img src="pic/screenshot-2.png" alt="About Section" width="48%" style="max-width: 100%; height: auto; margin-bottom: 10px;"></a>
  <br/>
  <a href="pic/screenshot-3.png"><img src="pic/screenshot-3.png" alt="Contact Section" width="48%" style="max-width: 100%; height: auto; margin-bottom: 10px;"></a>
  <a href="pic/screenshot-4.png"><img src="pic/screenshot-4.png" alt="Login Section" width="48%" style="max-width: 100%; height: auto; margin-bottom: 10px;"></a>
  <br/>
  <a href="pic/screenshot-5.png"><img src="pic/screenshot-5.png" alt="Register Section" width="97%" style="max-width: 100%; height: auto; margin-bottom: 10px;"></a>
</div>

---

## 📌 Key Features

- **Single Page Application (SPA):** Seamless navigation between sections without triggering a browser window reload.
- **2D Parallax Engine:** A dual-engine parallax implementation (GSAP ScrollTrigger + Vanilla JS RAF Fallback) providing distinct movement depth to sky, clouds, and ribbons.
- **Cinematic Scene Transitions:** A custom 4-phase shutter transition utilizing CSS keyframes, featuring anime speedline rays and kanji crests before revealing the destination page.
- **Three.js WebGL Centerpiece:** A fully integrated 3D Canvas rendering a massive, real-time glowing Torus Knot / Atom with pink and cyan emissive materials in the background.
- **Ghibli Theme Palette:** A soft, pastel color scheme combined with custom CSS variables that drive consistent aesthetics across all sections.

---

## 🛠️ Tech Stack

- **Markup & Styling:** HTML5, CSS3, CSS Variables, Keyframe Animations
- **Logic & Routing:** Vanilla JavaScript (ES5/ES6)
- **3D Rendering:** Three.js (r128)
- **Animation Libraries:** GSAP (ScrollTrigger)
- **Icons:** FontAwesome

---

## 🚀 Installation and Usage

1. Clone or download the repository.
2. Navigate to the `anime_portfolio` folder.
3. Open `index.html` directly in any modern web browser (Google Chrome, Firefox, Safari, Edge).
4. For the best experience, host the files using a local server (e.g. VS Code Live Server) to bypass any strict local CORS policies that might affect asset loading.

---

## 📂 File Structure

```text
anime_portfolio/
├── css/
│   ├── main.css           # Base styles, global variables, and layout
│   ├── parallax.css       # 2D depth layers and z-index sandwich stacking
│   ├── sections.css       # Specific styles for About, Contact, Auth pages
│   └── transitions.css    # Cinematic shutter and animation keyframes
├── js/
│   ├── app.js             # Core SPA Router, history management, DOM delegation
│   ├── parallax.js        # ScrollTrigger and Vanilla RAF fallback engine
│   └── three-scene.js     # Three.js 3D Atom rendering loop and initialization
├── libs/
│   ├── gsap.min.js        # Vendored GSAP core
│   ├── ScrollTrigger.min.js
│   └── three.min.js       # Vendored Three.js library
├── pic/                   # Assets (vector landscapes, clouds, icons, patterns)
└── index.html             # The main entry point
```

---

## 🤝 Contribution

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

---

## 📜 License

This project is open-source and available under the MIT License.

---

## 💡 Author

<p align="center">
<em>Crafted with pixels & passion by</em>
<br>
<strong>Dibyaranjan Maharana</strong>
<br>
<a href="https://github.com/Dibyaranjan27">GitHub</a> | <a href="https://www.linkedin.com/in/dibyaranjan-maharana-1228012b2/">LinkedIn</a>
</p>

