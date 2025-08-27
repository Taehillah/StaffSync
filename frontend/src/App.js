// src/App.js
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./stores/authStore";
import "./assets/css/main.css";
import ErrorBoundary from "./components/misc/ErrorBoundary";

function App() {
  return (
    <div className="app-container">
      <AuthProvider>
        <Router>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
