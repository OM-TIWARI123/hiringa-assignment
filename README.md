# CalQuity Internship Task: Social Media Post Generation Agent

## Overview
You are provided with a sample social media post generation full-stack application with a dummy post generation implementation. Complete this implementation, and enhance the platform by implementing **3 out of 5 specified features** listed below.

## Initial Setup
  
This is a project built using [Convex](https://convex.dev) as its backend. Obtain the required keys from [Convex](https://convex.dev).

**Sample .env file**
```
CONVEX_DEPLOY_KEY=<>

CONVEX_DEPLOYMENT=<>

VITE_CONVEX_URL=<>
```
  
## Project structure
  
The frontend code is in the `app` directory and is built with [Vite](https://vitejs.dev/).
  
The backend code is in the `convex` directory.
  
`npm run dev` will start the frontend and backend servers.

## App authentication

This project uses [Convex Auth](https://auth.convex.dev/) with Anonymous auth for easy sign in. You may wish to change this before deploying your app.

## Developing and deploying your app

Check out the [Convex docs](https://docs.convex.dev/) for more information on how to develop with Convex.

## HTTP API

User-defined http routes are defined in the `convex/router.ts` file. We split these routes into a separate file from `convex/http.ts` to allow us to prevent the LLM from modifying the authentication routes.

## Instructions
- **Code Reuse**: Maximize the utilization of existing codebase and architecture
- **Product Enhancement**: If you identify opportunities to improve the user experience or product flow, feel free to restructure or refactor the existing implementation
- **Technical Implementation**: Use Google's Gemini API for image generation capabilities
- **Quality Focus**: Prioritize feature completeness and user experience over quantity

## Feature Requirements

### 1. Layout Presets & Template System
Implement a comprehensive layout management system that includes:
- A layout selector interface with predefined template options
- Template upload functionality allowing users to upload custom hand-drawn/other layouts
- Inform the image generation process to follow the uploaded template

### 2. Advanced Image Editing Features
Develop image editing capabilities including:
- In-painting functionality for selective image modifications
- Prompt-based editing system for AI-assisted image adjustments
- Traditional image editing features

### 3. Automatic Context Retrieval
Build an intelligent context extraction system featuring:
- Website or Instagram Page scraping functionality to gather brand assets and context
- Typography and color palette extraction from scraped content
- Automatic application of extracted context to post generation 

### 4. Parallel Image Generation
Create a multi-variant generation system with:
- Simultaneous generation of 5 different post variants
- Comparative view interface for variant selection
- Ability to export one or more generated posts once the user is satisfied

### 5. Mobile-Responsive Design
- Responsive design across all device sizes
- Mobile-specific user experience improvements

## Technical Specifications
- **Image Generation**: Use Google's Gemini API for all AI image generation tasks
- **Frontend**: Maintain compatibility with existing technology stack
- **Backend**: Ensure scalable architecture for new feature integration

Ideal preference would be implementing 2 of the first 3 features mentioned above, and 1 of the remaining 2. We will focus on quality over quantity. If you have any interesting idea other than the 5 features mentioned above that will be useful for a marketing agent, feel free to implement that as 1 of the 5 features, and mention it in the README file.

## Submission Requirements

Your submission must include the following three components:

### 1. Live Demo
- **Hosted Website**: Deploy your website to a publicly accessible URL
- **Functionality**: Ensure all implemented features are fully operational, with appropriate error handling.

### 2. Source Code Repository
- **GitHub Repository**: Create a private repository containing all source code, and add pratham31012002 and samarth6341 to the repo.
- **Documentation**: Include a comprehensive README with setup instructions, architectural decisions, design choices, alternatives, etc.
- **Code Quality**: Maintain clean, well-commented, and organized code structure

### 3. Feature Demonstration Video
- **Screen Recording**: Record a comprehensive walkthrough of the implemented features
- **Duration**: 3-5 minutes demonstrating key functionalities
- **Quality**: Ensure clear audio narration and high-quality video recording
- **Content**: Cover feature usage, user interface, and technical implementation highlights and/or design choices.

## Evaluation Criteria
- **Feature Implementation Quality**: Completeness and robustness of implemented features
- **User Experience**: Intuitive interface design and smooth user interactions
- **Technical Excellence**: Code quality, architecture decisions, and performance optimization
- **Innovation**: Creative enhancements and additional value-added features

---

**Note**: This assignment tests your ability to understand codebases and unknown tech stacks, enhance existing projects, implement complex features, and deliver production-ready solutions. Focus on creating a polished, user-friendly experience that demonstrates your technical capabilities and product thinking.
