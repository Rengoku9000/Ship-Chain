# ChainGuard AI+

A premium, maritime-themed logistics intelligence platform. This application transforms the traditional authentication experience into a seamless, cinematic journey, acting as a gateway into a high-tier logistics dashboard.

## 🌟 Features

- **Cinematic Video Scrubbing:** Smooth, scroll-driven frame-by-frame background video transition using advanced `requestAnimationFrame` techniques to emulate an Apple-style interactive timeline.
- **Maritime Aesthetic:** Muted steel-blue tones that evoke the deep sea, combined with subtle, professional styling.
- **Glassmorphic Auth UI:** A floating "Access Gateway" panel for Google-provided authentication flows, utilizing modern glassmorphism design principles.
- **Seamless State Transitions:** Elegant transitions from the introductory cinematic scroll into authentication, and finally to the live operational logistics map dashboard, while maintaining the background context.
- **Highly Responsive:** Adapts fluidly across all modern viewport sizes.

## 🛠️ Tech Stack

- **Core:** [React 19](https://react.dev/) and [Vite 6](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or equivalent package manager

### Installation

1. Install module dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173`).

## 📁 Project Structure

```text
├── Public/                 # Static assets (including the background video)
├── src/
│   ├── components/         # Reusable React components (CinematicScrub, FloatingAuthTab, etc.)
│   ├── App.jsx             # Main application orchestrator
│   ├── index.css           # Global stylesheet and Tailwind directives
│   └── main.jsx            # React entry point
├── package.json            # Project configuration and scripts
└── vite.config.js          # Vite toolchain configuration
```

## 🎨 Design Philosophy

ChainGuard AI+ pivots away from loud neon or cyberpunk interfaces to deliver a more **calculated, high-tier intelligence feel**. It uses muted background processing, robust styling, and fluid interactions to convey precision and reliability—essential attributes for modern maritime logistics.
