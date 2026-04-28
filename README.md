# ChainGuard AI+

A premium, maritime-themed logistics intelligence platform. This application transforms the traditional authentication experience into a seamless, cinematic journey, acting as a gateway into a high-tier logistics dashboard. Built with a focus on real-time data visualization, predictive risk modeling, and cinematic user interfaces.

🔗 **Live Demo:** [https://ship-chain.vercel.app](https://ship-chain.vercel.app/)

![ChainGuard AI+ Dashboard](https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&q=80&w=2000)

## 🌟 Key Features

### 🎬 Cinematic UI & Animations
- **Video Scrubbing Intro:** Smooth, scroll-driven frame-by-frame background video transition using advanced `requestAnimationFrame` techniques to emulate an Apple-style interactive timeline.
- **Glassmorphic Auth UI:** A floating "Access Gateway" panel for Google-provided authentication flows, utilizing modern glassmorphism design principles.
- **Seamless State Transitions:** Elegant transitions from the introductory cinematic scroll into authentication, and finally to the live operational logistics map dashboard.

### 🗺️ Advanced Map Visualizations
- **Dual-Map System:** Switch between a highly-performant, custom SVG Global Map and a detailed Interactive Google Map.
- **SVG Map:** Features complete panning and zooming capabilities (via `react-zoom-pan-pinch`), custom animated shipment paths, and pinging alerts.
- **Google Map View:** Customized with a maritime dark theme, featuring a dynamic heat map overlay to track warehouse density and activity.

### 🧠 Predictive Logistics & Simulation Engine
- **Live Feed & Offline Mode:** Connects to a Python FastAPI backend via WebSockets for live data. If deployed serverless (e.g., on Vercel), it seamlessly falls back to an **advanced in-browser simulation engine**.
- **Risk Prediction:** Calculates delay probabilities and risk scores based on simulated traffic, weather, and distance using Dijkstra's algorithm for route optimization.
- **Warehouse Density:** Tracks throughput and capacity across global shipping nodes.

### 🤖 AI Assistant (Gemini-Powered)
- **Context-Aware Floating Copilot:** A floating AI assistant that can be invoked at any time.
- **Gemini API Integration:** Sends active shipment contexts directly to Gemini, allowing users to ask for financial impact analysis, route optimization, and operational insights in natural language.
- **Offline Fallback:** Features a smart fallback response system when the Gemini API is unreachable.

### 📊 Comprehensive Dashboard Panels
- **Tabbed Right-Side Interface:** Clean organization of metrics including Performance KPIs, System Events, and Cost Flow Analysis.
- **Event Timeline:** Tracks the operational history of shipments, simulating immutable blockchain event logging with SHA-256 hashes.

## 🛠️ Tech Stack

- **Core:** [React 19](https://react.dev/) and [Vite 6](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Maps:** [@vis.gl/react-google-maps](https://visgl.github.io/react-google-maps/) & `react-zoom-pan-pinch`
- **Icons:** [Lucide React](https://lucide.dev/)
- **Auth & Database:** [Firebase Authentication](https://firebase.google.com/)
- **AI:** Google Gemini API

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or equivalent package manager
- Firebase Account (for authentication)
- Google Maps API Key
- Gemini API Key

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
GEMINI_API_KEY=your_gemini_key
```

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
├── public/                 # Static assets (including the background video)
├── api/                    # Serverless API routes (e.g., chat.js for Gemini)
├── src/
│   ├── components/         # Reusable React components
│   │   ├── dashboard/      # Core dashboard modules (Maps, Panels, Floating Assistant)
│   ├── lib/                # Utility scripts, Simulation Engine, Firebase config, API helpers
│   ├── App.jsx             # Main application orchestrator
│   ├── index.css           # Global stylesheet and Tailwind directives
│   └── main.jsx            # React entry point
├── package.json            # Project configuration and scripts
└── vite.config.js          # Vite toolchain configuration
```

## 🎨 Design Philosophy

ChainGuard AI+ pivots away from loud neon or cyberpunk interfaces to deliver a more **calculated, high-tier intelligence feel**. It uses muted background processing, robust styling, and fluid interactions to convey precision and reliability—essential attributes for modern maritime logistics.
