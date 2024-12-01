import Navigation from './components/Navigation'
import { Toaster } from './components/ui/toaster'
import { Route, Switch } from 'wouter'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import TrendingPage from './pages/TrendingPage'
import UserProfile from './components/UserProfile'
import PromptDetail from './pages/PromptDetail'
import IssuesPage from './pages/IssuesPage'
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
          <Route path="/prompts/:id" component={PromptDetail} />
          <Route path="/prompts/:id/issues" component={IssuesPage} />
          <Route>404 Page Not Found</Route>
        </Switch>
      </main>
      <Toaster />
    </ThemeProvider>
  )
}
