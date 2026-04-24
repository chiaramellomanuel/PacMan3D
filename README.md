# 🕹️ PacMan3D - WebGPU & Reactive State Experiment

[![Live Demo](https://img.shields.io/badge/demo-online-green?style=for-the-badge&logo=vercel)](https://chiaramellomanuel.github.io/PacMan3D/)

A high-performance 3D reimagining of the classic Pac-Man, built with **Three.js** and **Vue 3**. This project focuses on bridging a high-frequency 3D engine with a reactive state management system.

![Status](https://img.shields.io/badge/Status-Core%20Logic%20Complete-green?style=for-the-badge)
![Tech](https://img.shields.io/badge/Architecture-Three.js%20%2B%20Pinia-blueviolet?style=for-the-badge)

---

## 🚀 The Vision
After mastering low-level raycasting in C ([Cub3D](https://github.com/chiaramellomanuel/cub3d)), I developed this project to explore modern web graphics and complex state synchronization. The core challenge is managing a fast-paced game logic while utilizing the experimental **WebGPURenderer**.

---

## 🧠 Technical Architecture: The Pinia Bridge
One of the key features of this project is the **Synchronization Layer** between Three.js and Vue 3:
* **Pinia as a Central Store:** All game states (score, lives, pellet counts) are managed in Pinia.
* **Reactive Feedback:** Three.js acts as the "View" layer, while Pinia handles the "Model". This allows for a clean separation of concerns and prepares the app for a complex HUD and menu system.

---

## ✨ Implemented Game Logic
Despite being a work in progress, the engine features a complete implementation of the original Pac-Man mechanics:

* **Procedural World:** The entire maze is generated dynamically from a **JSON schema**, including specialized nodes for teleportation pairs (Point A ↔ Point B).
* **Ghost AI State Machine:**
    * **Blinky (Red):** Active pursuit logic targeting Pac-Man's current position.
    * **Others:** Randomized pathfinding patterns.
    * **Frightened Mode:** Triggered by Power Pellets; ghosts change appearance, switch to "flee" logic, and become edible.
    * **Eaten State:** Ghosts transform into "eyes" and return to the spawn box with a specific respawn delay (2s).
* **Win/Loss Conditions:** Fully functional game loop with score tracking, life management (3 lives), and automatic game reset/reload.

---

### 🛠 Tech Stack
![Three.js](https://img.shields.io/badge/Three.js-%23000000.svg?style=for-the-badge&logo=three.dot-js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vue.js](https://img.shields.io/badge/vuejs-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![Pinia](https://img.shields.io/badge/Pinia-%23ffe14d.svg?style=for-the-badge&logo=pinia&logoColor=black)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

---

## 👨‍💻 Author
**Manuel Chiaramello** *Mastering the transition from low-level C logic to modern, reactive 3D web architectures.*
