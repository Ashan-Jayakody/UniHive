# 🐝 UniHive | Student Collaboration & Help Exchange Platform

UniHive is a centralized, student-centric digital ecosystem designed to streamline academic collaboration and peer-to-peer assistance within a university environment. Built on the **MERN stack**, it acts as a "collaborative hub" where students can synchronize their academic lives and support one another through a structured help-exchange system.

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue.svg)](https://mongodb.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/Frontend-React-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933.svg)](https://nodejs.org/)

---


## 🛠️ Tech Stack

### Frontend
- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS (Glassmorphic UI)
- **Icons:** Lucide React
- **Networking:** Axios & React Router DOM

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JSON Web Tokens (JWT) & BcryptJS
- **File Handling:** Multer & PDF-Parse

---

## 📂 Project Structure

```text
unihive/
├── server/             # Backend (Express & Node)
│   ├── config/         # Database and app configurations
│   ├── controllers/    # Business logic for routes
│   ├── models/         # MongoDB schemas (Mongoose)
│   ├── routes/         # API endpoints
│   ├── middleware/     # Auth (JWT) and error handling
│   └── server.js       # Entry point
├── client/             # Frontend (React & Vite)
│   ├── src/
│   │   ├── components/ # Reusable UI elements
│   │   ├── pages/      # View components (Dashboard, Profile, etc.)
│   │   ├── assets/     # Images and global styles
│   │   └── App.jsx     # Main application logic
│   └── tailwind.config.js
└── README.md
