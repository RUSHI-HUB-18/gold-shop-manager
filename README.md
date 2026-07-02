# Aura Gold - Jewelry Price Management

Aura Gold is a premium, full-stack Next.js web application designed to help jewelry store administrators manage daily gold rates, catalog items, and quickly calculate transparent pricing for customers.

## 🌟 Features
- **Real-Time Calculator**: Instantly calculate final jewelry prices including daily gold rate, making charges, and GST.
- **Dynamic Dashboard**: View daily calculation statistics, active catalog items, and today's gold rate at a glance.
- **24-Hour Rate Reset**: Enforces daily gold rate updates. If a new day begins, calculations are halted until the admin enters the fresh rate.
- **History Logs**: Every calculation is saved securely with powerful search and filtering (by purity, user, date).
- **Secure Authentication**: Custom authentication system with secure JWT tokens, bcrypt password hashing, password strength enforcement, and OTP password resets.
- **Admin Settings**: Easily configure global GST percentages and manage catalog items (add, edit, delete).

## 🛠️ Technology Stack
- **Frontend**: Next.js (App Router), React, Vanilla CSS (Premium Glassmorphism Design)
- **Backend**: Next.js API Routes (Node.js)
- **Database**: PostgreSQL (Neon Database)
- **ORM**: Prisma (v5)
- **Authentication**: JWT, bcryptjs

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/aura-gold.git
   cd aura-gold
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your PostgreSQL connection string and a random JWT secret:
   ```env
   DATABASE_URL="postgresql://username:password@host/database"
   JWT_SECRET="your-secure-random-jwt-secret-key"
   ```

4. Initialize the Database:
   ```bash
   npx prisma db push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Deployment (Netlify/Vercel)
This project is fully optimized for platforms like Netlify or Vercel. 
1. Import your GitHub repository into Netlify.
2. Set the `DATABASE_URL` and `JWT_SECRET` in the Environment Variables section.
3. Deploy!

## 🔐 Default Admin Access
By default, the initial setup can be seeded, or you can register a new account on the homepage.
