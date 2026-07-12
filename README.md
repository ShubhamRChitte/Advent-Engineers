# Advent Engineers Testing Panel

A comprehensive, full-stack admin dashboard and operations management system designed specifically for Advent Engineers. This application digitizes and streamlines the entire workflow from core testing and inventory management to generating professional, print-ready customer test reports.

## 🌟 Key Features

* **Testing Workflows:** Dedicated dashboards for Core Testing, PT Testing, and Final Transformer Testing.
* **Automated Customer Reports:** Generate A4 print-ready PDF reports with precise layout specifications and automated calculations.
* **Inventory & Stock Management:** Real-time tracking of Ready Stock, Protection Cores, Metering Cores, and Vendor Management.
* **Admin Review Panels:** Dedicated approval pipelines with role-based access for Technical Managers and Admins.
* **Delay & Metrics Tracking:** Dashboards for identifying bottlenecks and tracking strict approval timelines.

## 🛠️ Technology Stack

* **Frontend:** React.js, Vite, TailwindCSS, Lucide-React
* **Backend:** Node.js, Express.js
* **Database:** MongoDB
* **Print Engine:** `react-to-print` for high-fidelity A4 layout generation

## 📁 Project Structure

```text
Advent-Engineers/
│
├── frontend/                    # React Frontend (Vite)
│   ├── src/
│   │   ├── components/          # React Components (admin, inventory, tester, testing)
│   │   ├── styles/              # Global CSS & Print specific stylesheets
│   │   └── utils/               # Axios interceptors and utilities
│
└── Backend/                     # Node.js / Express Backend
    ├── controllers/
    ├── models/                  # Mongoose Schemas
    ├── routes/
    └── index.js                 # Express server entry point
```

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher recommended)
* MongoDB (Local instance or MongoDB Atlas URI)

### 1. Backend Setup

Navigate to the backend directory and install dependencies:
```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend` directory with the following variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

Start the backend development server:
```bash
npm run dev
```

### 2. Frontend Setup

Navigate to the frontend directory and install dependencies:
```bash
cd "frontend"
npm install
```

Create a `.env` file in the frontend directory with your API configuration:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
```

## 📦 Production Build

To build the frontend for production, run:
```bash
cd "frontend"
npm run build
```
This will generate optimized static assets in the `dist` folder, which can be served by the Node.js backend or deployed to any standard static hosting service.
