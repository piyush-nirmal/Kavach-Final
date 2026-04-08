# 🛡️ Kavach — Child Immunization & Healthcare Platform

<div align="center">

![Kavach Banner](https://img.shields.io/badge/Kavach-Child%20Healthcare%20Platform-blue?style=for-the-badge&logo=react)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Backend-FFCA28?style=for-the-badge&logo=firebase)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa)

**A comprehensive, mobile-first web application bridging the gap between parents and healthcare providers in managing child immunization and early childhood healthcare.**

</div>

---

## 📖 About The Project

**Kavach** (meaning *Shield* in Hindi) is built with a singular mission: **ensure no child misses a vaccine**. The platform provides a unified digital health tracking system for parents and a streamlined clinical workflow for healthcare providers — all in one secure, real-time application.

### The Problem
- Parents often lose physical vaccination cards or forget upcoming due dates.
- Healthcare providers lack a lightweight, accessible tool to log visits and track patient immunization history.
- There's no centralized platform linking parents and providers for real-time record updates.

### The Solution
Kavach creates a seamless digital bridge — parents manage their children's health records, and doctors update them in real-time after every visit, all backed by Firebase's secure cloud infrastructure.

---

## ✨ Key Features

### 👪 For Parents & Guardians
| Feature | Description |
|---|---|
| 📋 **Child Registration** | Register multiple children with DOB, gender, and digital birth certificates |
| 💉 **Vaccination Tracker** | Full National Immunization Schedule with status: Completed, Pending, Due Soon, Overdue |
| 📅 **Upcoming Appointments** | Dashboard view of all scheduled checkups and vaccine visits |
| 🗂️ **Doctor Visit History** | View clinical notes, diagnoses, and digital prescriptions |
| 🗺️ **Vaccination Centers** | Locate nearby authorized vaccination centers |
| 🔔 **Smart Notifications** | Push notifications for upcoming vaccine due dates and scheduled appointments |
| 👤 **Profile Management** | Manage contact info, communication preferences, and privacy settings |

### 👩‍⚕️ For Healthcare Providers
| Feature | Description |
|---|---|
| 🔍 **Patient Lookup** | Search parent records by email or phone number |
| 👨‍👩‍👧 **Family View** | View all children linked to a parent's profile |
| ✅ **Administer Vaccines** | Mark vaccines as administered with batch/lot number, date, and location |
| 📝 **Clinical Notes** | Log visit details (weight, height, diagnosis) and upload prescription images |
| 🗓️ **Schedule Follow-ups** | Book next appointments that auto-sync to parent's dashboard |
| 📊 **Analytics Dashboard** | Visual stats on daily appointments and weekly vaccines administered |
| 📢 **Broadcast Alerts** | Send bulk push notifications to all linked patients |

### 🔐 For Super Admins
- Full system oversight dashboard
- User and provider management
- Platform-wide metrics and reporting

---

## 🚀 Tech Stack

| Category | Technology |
|---|---|
| **Frontend** | React 18 + Vite |
| **Language** | TypeScript 5 |
| **Routing** | React Router v6 |
| **Styling** | Tailwind CSS v3 |
| **UI Components** | Shadcn UI (Radix UI + Tailwind) |
| **State Management** | React Context API |
| **Icons** | Lucide React |
| **Authentication** | Firebase Auth (Email/Password + RBAC) |
| **Database** | Cloud Firestore (NoSQL) |
| **Storage** | Firebase Storage (birth certs, prescriptions) |
| **Mobile** | Capacitor (Android native wrapper) |
| **PWA** | vite-plugin-pwa (installable on home screen) |
| **Forms** | React Hook Form + Zod validation |

---

## 🔒 Security & Privacy

- **Role-Based Access Control (RBAC)** — Parents cannot access the Provider Portal, and vice versa. Routes are protected at the router level.
- **Firestore Security Rules** — All database reads/writes require an authenticated user session.
- **Immutable Core Data** — Critical fields like email are locked post-registration to prevent account hijacking.
- **Sensitive Data Excluded** — `.env` files with Firebase credentials are never committed to the repository.

---

## 🗂️ Project Structure

```
main/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── layout/         # AppHeader, MobileNav, Layout Wrappers
│   │   └── ui/             # Shadcn base components
│   ├── contexts/           # React Contexts (AuthContext, etc.)
│   ├── data/               # Static data (vaccination schedules)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Firebase config & utility functions
│   ├── pages/              # Application views
│   │   └── auth/           # Login, Signup, Role Selection
│   └── types/              # TypeScript interfaces
├── android/                # Capacitor Android project
├── functions/              # Firebase Cloud Functions
├── public/                 # Static assets & PWA icons
├── .env                    # 🚫 Not committed — see setup below
└── package.json
```

---

## 💻 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- A [Firebase](https://firebase.google.com/) project with Firestore, Auth, and Storage enabled

### 1. Clone the Repository
```bash
git clone https://github.com/piyush-nirmal/Kavach-Final.git
cd Kavach-Final/main
```

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Configure Firebase Environment Variables
Create a `.env` file inside the `main/` directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production
```bash
npm run build
```

---

## 📱 PWA & Mobile

Kavach is a **Progressive Web App** — users can install it on their phone's home screen for a native-like experience.

For Android development via Capacitor:
```bash
npm run build && npx cap sync android
```
Then open the `android/` folder in Android Studio.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss any major changes.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

Made with ❤️ to protect every child's health

**Kavach** — Because every vaccine matters.

</div>
