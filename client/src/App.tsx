import Navigation from './components/Navigation'
import { Toaster } from './components/ui/toaster'
import { Route, Switch } from 'wouter'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import TrendingPage from './pages/TrendingPage'
import UserProfile from './components/UserProfile'
import { ThemeProvider } from "@/components/ui/theme-provider"

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="prompt-theme">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/trending" component={TrendingPage} />
          <Route path="/profile/:id" component={UserProfile} />
        </Switch>
      </main>
      <Toaster />
    </ThemeProvider>
  )
}
