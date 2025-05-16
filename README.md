# 🎨 Artist Search Web Application

This is a full-stack web application for artist discovery using the Artsy API. It supports user authentication, favorites, and detailed artist/artwork views.

📍 **Live App:**
🔗 [https://usc-csci571-hw3-pri.wl.r.appspot.com](https://usc-csci571-hw3-pri.wl.r.appspot.com)

---

## 📁 Project Structure

```
├── db.js                   # MongoDB connection
├── frontend/               # Angular source code
├── index.js                # Express backend entry point
├── node_modules/
├── package.json
├── package-lock.json
```

---

## 🛠️ Tech Stack

* **Frontend:** Angular 17, Bootstrap 5
* **Backend:** Node.js (Express)
* **Database:** MongoDB Atlas
* **Deployment:** Google App Engine (Standard)

---

## 🚀 Features

* 🔍 Search for artists via Artsy API
* 📖 View artist details (bio, life span, nationality)
* 🖼️ Browse artist artworks by category
* ⭐ Add/remove favorites (requires login)
* 👤 Register, Login, Logout, Delete Account
* ⏱️ Real-time relative time display (e.g. "5 minutes ago")
* 🔔 Toast notifications for feedback

---

## 🔧 Local Setup

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd your-project-folder
```

### 2. Install server dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root:

```
MONGODB_URI=your-mongodb-uri
ARTSY_CLIENT_ID=your-artsy-client-id
ARTSY_CLIENT_SECRET=your-artsy-client-secret
JWT_SECRET=your-jwt-secret
```

### 4. Build frontend

```bash
cd frontend
npm install
ng build --output-path=../dist --configuration=production
cd ..
```

### 5. Start the server

```bash
node index.js
```
