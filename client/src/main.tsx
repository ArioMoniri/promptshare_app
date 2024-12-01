import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import TrendingPage from "./pages/TrendingPage";
import PromptDetail from "./pages/PromptDetail";
import IssuesPage from "./pages/IssuesPage";
import { Loader2 } from "lucide-react";
import { useUser } from "./hooks/use-user";
import UserProfile from "./components/UserProfile";
import Navigation from "./components/Navigation";

function Router() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      <main className="container mx-auto px-4 py-6">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/trending" component={TrendingPage} />
          <Route path="/profile/:id" component={UserProfile} />
          <Route path="/prompts/:id" component={PromptDetail} />
          <Route path="/prompts/:id/issues" component={IssuesPage} />
          <Route>404 Page Not Found</Route>
        </Switch>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);
