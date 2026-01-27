import { BrowserRouter as Router } from 'react-router-dom';
import HomeRoutes from "./routes/HomeRoutes.jsx";
import { AuthProvider } from './context/AuthContext';
import { IsanzureAuthProvider  } from './context/IsanzureAuthContext.jsx';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <IsanzureAuthProvider >
          <HomeRoutes />
        </IsanzureAuthProvider >
      </AuthProvider>
    </Router>
  );
}