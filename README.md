# HealthCare Platform - Frontend

Welcome to the frontend repository for the **HealthCare** platform. This repository contains the modern, interactive patient and administrative interfaces built with Vite, React, and Tailwind CSS. 

*If you are looking for the backend API and database infrastructure, please visit the [HealthCare Backend Repository](https://github.com/YOUR-USERNAME/healthcare-backend).*

## Tech Stack
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS & Framer Motion (for dynamic 3D scroll animations)
- **Routing:** React Router v6
- **Authentication:** Supabase GoTrue Auth
- **Icons & UI:** Lucide React, Radix UI primitives (shadcn/ui style)

## Key Features
- **Dynamic 3D Landing Page:** A fully responsive, beautifully animated landing page with a curved timeline that snakes around content blocks.
- **Role-Based Dashboards:** Secure, partition-gated routing that dynamically serves Patient, Doctor, and Admin dashboards based on the user's database role.
- **Real-Time Booking UI:** Smooth, interactive appointment booking flow that communicates with the Python backend.
- **Secure Authentication:** Integrated with Supabase Auth for email/password and Google OAuth logins.
- **Dark/Light Mode:** First-class support for system-aware and toggleable dark and light themes.

## Quick Start (Local Development)

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Set up your `.env` file using `.env.example` as a template.
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

*Designed with ❤️ for a thoughtful healthcare experience.*
