import { ThemeProvider } from './components/theme-provider'
import Navigation from './components/Navigation'
import { Toaster } from './components/ui/toaster'
import { Route, Switch } from 'wouter'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="prompt-theme">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/profile/:id" component={ProfilePage} />
        </Switch>
      </main>
      <Toaster />
    </ThemeProvider>
  )
}
