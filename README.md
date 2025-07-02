# EMobile: India's #1 Digital Pharmacy & Medical Marketplace 🌟

**Empowering Health, One Click at a Time**

Welcome to **EMobile**, a state-of-the-art mobile app built with [Expo](https://expo.dev) and React Native, paired with a robust backend to deliver a seamless digital pharmacy experience in India. Shop medicines, access health tips, and enjoy express delivery—all in one app! 🚀

---

## 🌟 Why EMobile?

- **Shop Smart**: Explore medicines, supplements, devices, and more across intuitive categories.
- **Exclusive Deals**: Get 20% off your first order with code `MEDI20` and other exciting offers.
- **Health Hub**: Stay informed with expert-curated blogs and wellness tips.
- **Seamless Cart**: Add products with real-time updates, powered by a robust backend API.
- **Fast & Secure**: Express delivery in metro cities (as quick as 2 hours!) and secure prescription handling.
- **Cross-Platform**: Runs flawlessly on iOS, Android, and web.
- **Engaging UI**: Smooth animations with [Moti](https://moti.fyi) for a delightful experience.
- **Stay Connected**: Subscribe to newsletters and follow us on social media for updates.

---

## 🛠 Tech Stack

- **Frontend**:
  - [React Native](https://reactnative.dev/) with [Expo SDK 53](https://expo.dev/)
  - [Expo Router](https://docs.expo.dev/router/introduction/) for file-based routing
  - [Nativewind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
  - [Moti](https://moti.fyi/) for fluid UI animations
  - [Axios](https://axios-http.com/) for API requests
  - [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) for local data
  - [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/) for video playback
  - [Expo Vector Icons](https://icons.expo.fyi/) for sleek UI elements
  - [react-native-dotenv](https://github.com/goatandsheep/react-native-dotenv) for environment config

- **Backend**:
  - [Node.js](https://nodejs.org/) (assumed, based on typical setup for port 5000)
  - [Nodemailer](https://nodemailer.com/) for email notifications
  - [PDFKit](https://pdfkit.org/) for generating PDF documents
  - Custom API endpoints for cart, user, and product management

---

## 🚀 Get Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- [Expo Go](https://expo.dev/go) app for mobile testing (optional)
- Backend server running on `http://your_ip:5000` (replace `your_ip` with your server’s IP)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/emobile.git
   cd emobile
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Set up the backend:
   - Navigate to the `backend` folder:
     ```bash
     cd backend
     npm install
     ```
   - Start the backend server:
     ```bash
     npm start
     ```
     Ensure the server runs on `http://your_ip:5000` (update `your_ip` with your actual IP or `localhost` for local development).
4. Configure environment variables:
   - Create a `.env` file in the root directory:
     ```env
     EXPO_PUBLIC_API_URL=http://your_ip:5000
     ```
     Replace `your_ip` with your backend server’s IP (e.g., `localhost` or a remote server IP).
5. Start the frontend app:
   ```bash
   npx expo start
   ```

### Running the App
- **Development**: Open in [Expo Go](https://expo.dev/go), an Android emulator, iOS simulator, or web browser.
  ```bash
  npx expo start
  ```
- **Production Build**:
  - Android: `npx expo run:android`
  - iOS: `npx expo run:ios`
  - Web: `npx expo start --web`

### Reset Project
To start fresh with a blank `app` directory:
```bash
npm run reset-project
```

---

## 📂 Project Structure

```plaintext

EMobile/
├── app/                    # File-based routing with Expo Router
│   ├── checkout.tsx        # Checkout screen
│   ├── _layout.tsx         # Root layout
│   ├── editprofile.tsx     # Edit profile screen
│   ├── forgotpassword.tsx  # Password reset screen
│   ├── orderhistory.tsx    # Order history screen
│   └── (tabs)/             # Tab-based navigation
│       ├── cart.tsx        # Cart screen
│       ├── _layout.tsx     # Tabs layout
│       ├── index.tsx       # Home screen
│       ├── profile.tsx     # Profile screen
│       ├── shop.tsx        # Shop screen
│       └── (auth)/         # Authentication routes
│           ├── _layout.tsx # Auth layout
│           ├── login.tsx   # Login screen
│           ├── signup.tsx  # Signup screen
├── assets/                 # Fonts, images, and static assets
├── backend/                # Backend server code
│   ├── invoices/           # Invoice-related files
│   ├── middleware/         # Custom middleware
│   ├── models/             # Data models
│   ├── routes/             # API routes
│   │   ├── auth.js         # Authentication endpoints
│   │   ├── cart.js         # Cart endpoints
│   │   ├── orders.js       # Order endpoints
│   ├── utils/              # Utility functions
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
├── components/             # Reusable React Native components
├── styles/                 # Stylesheets (optional, if not using Nativewind)
├── .env                    # Environment variables (e.g., EXPO_PUBLIC_API_URL)
├── metro.config.js         # Metro bundler configuration
├── package.json            # Frontend dependencies and scripts
└── README.md               # You're here!
```
---

## 🛠 Development

### Key Features
- **Home Screen**: Dynamic hero with video background, product categories, blogs, FAQs, and testimonials.
- **Cart System**: Real-time cart updates using AsyncStorage and backend API (`http://your_ip:5000/api/cart`).
- **Animations**: Fluid transitions with Moti for a premium UX.
- **Social Integration**: Links to Facebook, Instagram, and Twitter.
- **Newsletter**: Email signup with Nodemailer for exclusive offers.
- **Backend**: Handles cart, user authentication, and PDF generation for prescriptions.

### Customization
- **Fonts**: Uses `Inter` font (loaded via `expo-font`). Add custom fonts to `assets/fonts/`.
- **API**: Update `EXPO_PUBLIC_API_URL` in `.env` to point to your backend (e.g., `http://your_ip:5000`).
- **Styling**: Use Nativewind classes or modify `styles.js` for custom styles.
- **Backend**: Extend API routes in `backend/routes/` for additional features.

### Debugging
- Clear Metro cache: `npx expo start --clear`
- Check backend: Ensure server is running at `http://your_ip:5000`.
- Verify dependencies: `npm ls react-native expo-status-bar`
- Lint code: `npm run lint`

---

## 🤝 Contributing

We love contributions to make EMobile even better! Here’s how to get involved:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit changes: `git commit -m "Add your feature"`.
4. Push to your branch: `git push origin feature/your-feature`.
5. Open a pull request with a clear description.

---

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/): Learn Expo SDK and guides.
- [React Native Documentation](https://reactnative.dev/docs/getting-started): Core concepts.
- [Expo Router Guide](https://docs.expo.dev/router/introduction/): File-based routing.
- [Nativewind Docs](https://www.nativewind.dev/): Styling with Tailwind CSS.
- [Moti Docs](https://moti.fyi/): Animations for React Native.
- [Nodemailer Docs](https://nodemailer.com/): Email integration.
- [PDFKit Docs](https://pdfkit.org/): PDF generation.

