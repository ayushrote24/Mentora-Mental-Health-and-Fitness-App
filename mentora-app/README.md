# 🌿 Mentora — React Native App

## How to Run

### Step 1: Install Node.js
Download from https://nodejs.org and install the LTS version.

### Step 2: Install Expo CLI
Open terminal (or VS Code terminal) and run:
```
npm install -g expo-cli
```

### Step 3: Install app dependencies
Navigate to this folder in terminal:
```
cd mentora-app
npm install
```

### Step 4: Start the app
```
npx expo start
```

### Step 5: Run on your phone (EASIEST)
1. Install **Expo Go** app on your Android phone from Play Store
2. Scan the QR code shown in terminal
3. App opens instantly on your phone!

### Step 6: Run on Android emulator (optional)
1. Install Android Studio from https://developer.android.com/studio
2. Create a virtual device (AVD)
3. Press `a` in the terminal after `npx expo start`

---

## Project Structure
```
mentora-app/
├── App.js                    ← Entry point
├── src/
│   ├── context/
│   │   └── AppContext.js     ← Global state (user, profile)
│   ├── screens/
│   │   ├── LoginScreen.js    ← Sign in / Register
│   │   ├── OnboardScreen.js  ← Height, weight, sex, cycle setup
│   │   └── DashboardScreen.js← Home dashboard
│   └── navigation/
│       └── AppNavigator.js   ← Screen routing
└── package.json
```

## Features Implemented
- ✅ Login / Register screen
- ✅ 3-step onboarding (Height+Weight → Sex+Steps Goal → Cycle/Finish)
- ✅ BMI calculator (live)
- ✅ Menstrual cycle setup (only shown for Female)
- ✅ Dashboard with weekly steps chart
- ✅ Water intake tracker
- ✅ Period cycle strip (only shown for Female)
- ✅ Feature grid (Female Health card only for females)
- ✅ Bottom tab navigation
