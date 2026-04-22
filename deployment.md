# 🚀 Deployment Guide: AirFix Platform

This guide covers the step-by-step process to deploy your full-stack application to the web.

## 1. Push to GitHub
I have already initialized the Git repository for you. Now, you need to push it to your account.

**Run these commands in your terminal (at `C:\AirFix`):**
```bash
# Replace 'username' and 'repo' with your actual choice
git remote add origin https://github.com/R1T1KK/FairAircon.git
git branch -M main
git push -u origin main
```

---

## 2. Deploy Backend (Railway.app)
Railway is recommended for your backend because it supports Node.js and WebSockets (Socket.io) out of the box.

1. Go to [Railway.app](https://railway.app/) and login with GitHub.
2. Click **"New Project"** -> **"Deploy from GitHub repo"**.
3. Select your `AirFix` repository.
4. **Important**: Go to the **Variables** tab for your backend and add all variables from your `server/.env`:
   - `PORT`: 5000 (Railway will provide its own, but set this as a fallback)
   - `MONGODB_URI`: (Your MongoDB Atlas connection string)
   - `JWT_SECRET`: (Any strong secret key)
   - `EMAIL_USER`: `Fairaircon777@gmail.com`
   - `EMAIL_PASS`: (Your App Password)
   - `OWNER_EMAIL`: `Fairaircon777@gmail.com`
   - `RAZORPAY_KEY_ID`: `rzp_test_SfIJIFd8Tf1jQz`
   - `RAZORPAY_KEY_SECRET`: (Your Secret)
   - `FRONTEND_URL`: (You will get this from Vercel in step 3)
5. Under the **Settings** tab, ensure the **Root Directory** is set to `server`.

---

## 3. Deploy Frontend (Vercel)
Vercel is the best choice for React/Vite frontend.

1. Go to [Vercel.com](https://vercel.com/) and login with GitHub.
2. Click **"Add New"** -> **"Project"**.
3. Import your `AirFix` repository.
4. **Project Configuration**:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
5. **Environment Variables**: Add these:
   - `VITE_API_URL`: `https://your-backend-url.railway.app/api`
   - `VITE_SOCKET_URL`: `https://your-backend-url.railway.app`
   - `VITE_RAZORPAY_KEY_ID`: `rzp_test_SfIJIFd8Tf1jQz`
6. Click **Deploy**.

---

## 4. Final Connection
Once both are deployed:
1. Copy the **Vercel URL** (e.g., `https://airfix.vercel.app`).
2. Go back to your **Railway** dashboard and update the `FRONTEND_URL` variable with this new Vercel URL.
3. This will trigger a restart of your backend, and you are officially **LIVE!**

---

### 💡 Pro-Tips:
- **Mobile Friendly**: Your site is fully responsive, so test it on your phone!
- **Domain**: You can add a custom domain (like `airfixservice.com`) in the settings of both Vercel and Railway.
- **Support**: If the 3D model doesn't load on some mobile devices, it might be due to low memory; the site gracefully falls back to a standard layout.
