# 🎨 Canvas Builder API

A full-stack application that allows users to create custom drawings via a REST API and export them as high-quality, compressed PDF files. The application features a React-based interactive frontend and a Node.js backend handling server-side rendering.

## 🔗 Live Demo & Resources

* **🚀 Deployed App:** [Visit Rocketium Canvas API](https://canvas-api-builder.onrender.com)
* **🎥 Demo Video:** [Watch the demo](https://drive.google.com/file/d/1_Roj8hgOyP3NGtBuUknpNkQ_ZcQZ_6sA/view?usp=sharing)

## ✨ Features

* **Canvas Initialization:** Create a custom-sized drawing session on the server.
* **Rich Drawing Tools:**
    * **🟥 Rectangles:** Customizable position, dimensions, and colors.
    * **🔵 Circles:** Customizable radius and colors.
    * **📝 Text:** Add text with custom font sizes and colors.
    * **🖼️ Images:** Upload local images to overlay on the canvas.
* **Real-Time Preview:** The frontend mirrors API actions using HTML5 Canvas for instant feedback.
* **📄 PDF Export:** Generates a vector-based PDF file with built-in compression (using PDFKit).
* **Stateful Backend:** Maintains drawing history in memory for high-fidelity export.

## 🛠️ Tech Stack

### Frontend
* **React (Vite):** For a fast, reactive user interface.
* **Axios:** For handling API requests.
* **CSS:** Custom Neon-themed styling.

### Backend
* **Node.js & Express:** For the RESTful API architecture.
* **@napi-rs/canvas:** High-performance server-side canvas implementation (compatible with serverless/container environments).
* **PDFKit:** For programmatic PDF generation.
* **Multer:** For handling image file uploads.

## 🚀 Getting Started Locally

This project uses a Monorepo structure. The root directory manages both the `api` (Backend) and `client` (Frontend).

### Prerequisites
* Node.js (v18 or higher)
* npm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Yasin-shaik/Canvas-API-builder.git
    cd Canvas-API-builder
    ```

2.  **Install dependencies (Root):**
    This command installs dependencies for both the Backend and Frontend using the configured scripts.
    ```bash
    npm run render-build
    ```
    *(Note: This runs `npm install` in both folders and builds the React app)*

3.  **Start the Server:**
    ```bash
    npm start
    ```

4.  **Access the App:**
    Open your browser and visit: `http://localhost:3000`

## 📡 API Endpoints

### 1. Initialize Canvas
Creates a new session.

* **Endpoint:** `POST /api/initialize`
* **Body:**
    ```json
    { "width": 800, "height": 600 }
    ```
* **Response:** `{ "id": "uuid-string", "message": "..." }`

### 2. Draw Elements
All drawing requests require the `id` from the initialization step.

**Draw Rectangle**
* **Endpoint:** `POST /api/draw/rectangle`
* **Body:**
    ```json
    { "id": "...", "x": 50, "y": 50, "width": 100, "height": 100, "color": "#FF0000" }
    ```

**Draw Circle**
* **Endpoint:** `POST /api/draw/circle`
* **Body:**
    ```json
    { "id": "...", "x": 200, "y": 200, "radius": 50, "color": "#0000FF" }
    ```

**Draw Text**
* **Endpoint:** `POST /api/draw/text`
* **Body:**
    ```json
    { "id": "...", "text": "Hello", "x": 50, "y": 50, "fontSize": 24, "color": "#000" }
    ```

**Draw Image**
* **Endpoint:** `POST /api/draw/image`
* **Body (Multipart Form):**
    * `id`: "..."
    * `x`: 0, `y`: 0
    * `imageFile`: (Binary File)

### 3. Export
Generates and downloads the PDF.

* **Endpoint:** `GET /api/export/:id`
* **Response:** Binary PDF stream (Attachment).

## 📂 Project Structure

```text
/
├── api/                  # Backend Logic
│   ├── index.js          # Main Server & API Routes
│   └── package.json      # Backend Dependencies
├── Frontend/             # React Client
│   ├── src/              # React Source Code
│   ├── dist/             # Production Build (Created on deploy)
│   └── package.json      # Frontend Dependencies
└── package.json          # Root Orchestrator Scripts
```

## ⚙️ Deployment Notes

This project is deployed on **Render** as a Web Service.

* The **Backend** serves the API endpoints.
* The **Frontend** is built into static files (`dist`) and served by the Backend on the catch-all route (`*`).

**Why Render?** The application uses in-memory storage (`canvasStore`) to keep track of drawing history. Render provides a persistent server environment, unlike Vercel serverless functions which would wipe data between requests.

## Author

**Yasin Shaik**