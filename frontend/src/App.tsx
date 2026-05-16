import { AuthenticatedApp } from "@/components/authenticated-app";
import { Login } from "@/components/login";
import { Signup } from "@/components/signup";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/providers/theme-provider";
import { useState } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/loading-screen";

function AppContent() {
  const { user, logout, isLoading } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen bg-background">
      {user ? (
        <AuthenticatedApp user={user} onLogout={logout} />
      ) : isLoginView ? (
        <Login onSwitchToSignup={() => setIsLoginView(false)} />
      ) : (
        <Signup onSwitchToLogin={() => setIsLoginView(true)} />
      )}
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

