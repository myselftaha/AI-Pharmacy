# AI Pharmacy POS - Full Stack Management System

AI Pharmacy is a modern, professional Point of Sale (POS) and inventory management system designed specifically for pharmacies. It features a React-based frontend and a Node.js/Express backend, optimized for performance and serverless deployment.

## 🚀 Key Features

- **Inventory Management**: Track medicines, stock levels, and low stock alerts.
- **Sales & POS**: Fast, interactive checkout with voucher support and receipt generation.
- **Dynamic Dashboard**: Real-time business insights, charts, and key performance indicators (KPIs).
- **Supplier & Customer Portals**: Manage ledgers, payments, and returns for both suppliers and customers.
- **Smart Notifications**: Low stock and expiry alerts via email and in-app notifications.
- **WhatsApp Integration**: Send reports and alerts directly via WhatsApp.
- **Role-Based Access**: Secure authentication with Staff and Admin roles.
- **Data Backups**: Secure automated and manual backup/restore functionality.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide React, Recharts.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose).
- **Utilities**: Nodemailer (Email), Baileys (WhatsApp), jsPDF (Receipts), ExcelJS (Bulk Import).

## 💻 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or a local MongoDB instance.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/myselftaha/AI-Pharmacy.git
   cd AI-Pharmacy
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add the following:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret
   PORT=5000
   
   # Email Settings
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_gmail_app_password
   OWNER_EMAIL=your_email@gmail.com
   
   # Optional
   STORE_NAME=AI Pharmacy
   ```

### Running the Application

- **Run Backend & Frontend concurrently (Recommended)**:
  ```bash
  npm run dev
  ```
  *This will start the Vite dev server and the Node.js backend.*

## 🚀 Deployment

The project is optimized for **Vercel**. 

1. Push your code to GitHub.
2. Connect your repository to Vercel.
3. Use the **Vite** framework preset.
4. Add your `.env` variables to Vercel's Environment Variables settings.
5. Deploy!

## 📄 License

This project is private and intended for specified use. Please consult the owner before redistribution.

---
Built with ❤️ by [myselftaha](https://github.com/myselftaha)
