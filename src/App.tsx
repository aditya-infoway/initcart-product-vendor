import "./App.css";
import AppRouter from "./routes/AppRouter";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";

function App() {
  const loadSessionFromStorage = useAuthStore((s) => s.loadSessionFromStorage);

  useEffect(() => {
    loadSessionFromStorage();
    // Flag set karo — refresh pe yeh milega
    sessionStorage.setItem("pv_active", "true");
  }, []);

  return <AppRouter />;
}

export default App;