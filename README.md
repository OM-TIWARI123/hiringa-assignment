# CalQuity Social Media Post Generation Agent

## Overview

This is a full-stack application for AI-powered social media post generation and editing, built with React, Convex, and Google Gemini API. The platform enables users to generate, edit, and manage marketing posts and images with advanced AI features and a focus on user experience.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Design Choices](#design-choices)
- [Setup Instructions](#setup-instructions)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Development & Deployment](#development--deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Alternatives Considered](#alternatives-considered)
- [Contribution Guidelines](#contribution-guidelines)
- [License](#license)
- [Contact](#contact)

---

## Features

- **AI Image Generation:** Uses Google Gemini API for generating marketing images.
- **Advanced Image Editing:** In-painting, prompt-based, and traditional editing via Pintura.
- **Layout Presets & Templates:** Select or upload custom layouts to guide image generation.
- **Automatic Context Retrieval:** Scrape brand assets and context from websites or Instagram.
- **Parallel Image Generation:** Generate and compare multiple variants simultaneously.
- **Mobile-Responsive Design:** Optimized for all device sizes.
- **Authentication:** Anonymous auth via Convex (can be replaced for production).
- **Export & Download:** Export selected posts and images.

---

## Architecture

- **Frontend:**  
  - Built with React 19, Vite, and Tailwind CSS for fast, modern UI.
  - Modular component structure for maintainability.
  - State management via React hooks and Convex React client.

- **Backend:**  
  - Powered by Convex for real-time data, authentication, and serverless functions.
  - Google Gemini API integration for AI image generation.
  - Scalable schema for companies, campaigns, posts, and assets.

- **Image Editing:**  
  - Uses Pintura and FilePond for advanced, user-friendly image editing.

- **Deployment:**  
  - Designed for deployment on Netlify (frontend) and Convex Cloud (backend).

---

## Design Choices

- **Convex as Backend:**  
  Chosen for its real-time capabilities, easy auth, and serverless function model.

- **Google Gemini API:**  
  Selected for state-of-the-art AI image generation and prompt-based editing.

- **Component-Driven UI:**  
  All UI is built from reusable, composable React components.

- **Tailwind CSS:**  
  Enables rapid, consistent styling and responsive design.

- **FilePond & Pintura:**  
  For robust, modern image upload and editing experiences.

- **Anonymous Auth:**  
  Used for demo and ease of onboarding; can be swapped for OAuth or email/password.

---

## Setup Instructions

### 1. Clone the Repository

```sh
git clone <your-repo-url>
cd <project-directory>
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root with the following:

```
CONVEX_DEPLOY_KEY=your_convex_deploy_key
CONVEX_DEPLOYMENT=your_convex_deployment_url
VITE_CONVEX_URL=your_convex_url
GEMINI_API_KEY=your_google_gemini_api_key
```

### 4. Start Development Server

```sh
npm run dev
```
- Frontend: [http://localhost:5173](http://localhost:5173)
- Convex backend: auto-starts

### 5. Build for Production

```sh
npm run build
```

### 6. Deploy

- **Frontend:** Deploy `/dist` to Netlify, Vercel, or your preferred static host.
- **Backend:** Deploy Convex functions with:
  ```sh
  npx convex deploy
  ```

---

## Project Structure

```
/
├── convex/              # Convex backend functions & schema
├── src/                 # React frontend source code
│   ├── components/      # UI and feature components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── App2.tsx         # Main app entry
│   └── ...              # Other feature files
├── public/              # Static assets
├── package.json         # Project metadata and scripts
├── tsconfig*.json       # TypeScript configs
├── tailwind.config.js   # Tailwind CSS config
└── README.md            # Project documentation
```

---

## Environment Variables

- `CONVEX_DEPLOY_KEY` – Convex deployment key
- `CONVEX_DEPLOYMENT` – Convex deployment URL
- `VITE_CONVEX_URL` – Convex client URL for frontend
- `GEMINI_API_KEY` – Google Gemini API key

---

## Development & Deployment

- **Local Dev:**  
  Use `npm run dev` for hot-reloading frontend and backend.
- **Linting:**  
  `npm run lint` to check code quality.
- **Build:**  
  `npm run build` for production build.
- **Deploy:**  
  Deploy frontend to Netlify/Vercel, backend to Convex Cloud.

---

## Testing

- **Manual Testing:**  
  - Test all flows: campaign creation, image generation, editing, export.
  - Test on mobile and desktop.
- **Automated Testing:**  
  - (Add unit/integration tests as needed; see `/tests` if present.)

---

## Troubleshooting

- **Build Fails with "object is not extensible":**  
  - Ensure no array mutations on frozen arrays.
  - Make sure all dependencies are locked with `package-lock.json`.
  - Try downgrading Vite if using v5+.
- **Convex Auth Issues:**  
  - Check environment variables and Convex deployment status.
- **Google Gemini API Errors:**  
  - Verify API key and quota.

---

## Alternatives Considered

- **Backend:**  
  - Considered Firebase, Supabase, and custom Express server. Chose Convex for real-time and serverless simplicity.
- **AI API:**  
  - Considered OpenAI DALL·E, Stable Diffusion. Chose Gemini for prompt-based editing and Google integration.
- **Styling:**  
  - Considered CSS Modules, Styled Components. Chose Tailwind for speed and consistency.

---

## Contribution Guidelines

1. Fork the repo and create a feature branch.
2. Write clear, well-commented code.
3. Add/Update documentation for new features.
4. Submit a pull request with a clear description.

---

## License

[MIT](./LICENSE) (or specify your license)

---

## Contact

For questions or support, contact the maintainers or open an issue in the repository.

---

**Feel free to further expand or tailor this README to your specific implementation and team preferences!**
