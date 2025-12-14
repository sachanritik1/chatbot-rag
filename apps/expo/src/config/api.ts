import { Platform } from "react-native";

// API Configuration
// Update this URL to point to your deployed backend
// For local development on physical device, use your computer's IP address
// For local development on simulator/emulator, use localhost

export const API_BASE_URL = __DEV__
  ? Platform.OS === "ios"
    ? "http://localhost:4000" // iOS Simulator - Your Next.js port
    : "https://k20mh897-4000.inc1.devtunnels.ms" // Android Emulator
  : "https://chatbot-rag-kappa.vercel.app"; // Production URL
