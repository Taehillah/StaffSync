import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import MainLayout from './components/layout/MainLayout';
import { AuthProvider } from './stores/authStore';
import DarkVeil from './components/misc/DarkVeil';

function App() {
  return (
    <div className="app-container">
      <DarkVeil 
        hueShift={180}
        noiseIntensity={0.02}
        scanlineIntensity={0.1}
        speed={0.3}
        resolutionScale={1.5}
      />
      <AuthProvider>
        <Router>
          <MainLayout>
            <AppRoutes />
          </MainLayout>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;