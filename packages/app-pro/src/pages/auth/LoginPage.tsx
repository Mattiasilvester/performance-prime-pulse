import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@pp/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import RegistrationForm from '@/components/auth/RegistrationForm'

export default function LoginPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [activeTab, setActiveTab] = useState('login')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // Traccia login riuscito
      toast({
        title: "Accesso effettuato con successo!",
        duration: 3000,
      })

      // ✅ Aspetta che sessione sia salvata
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate('/dashboard')
    } catch (error: unknown) {
      console.error('Login error:', error)
      const err = error as Error
      toast({
        title: "Errore durante l'accesso",
        description: err.message,
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsResetLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Email di reset inviata!",
        description: "Controlla la tua email per reimpostare la password.",
        duration: 5000,
      })

      setResetEmail('')
    } catch (error: unknown) {
      console.error('Password reset error:', error)
      const err = error as Error
      toast({
        title: "Errore durante l'invio",
        description: err.message,
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsResetLoading(false)
    }
  }

  // Social Login Handlers
  const handleGoogleLogin = async () => {
    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      if (error) {
        toast({
          title: "Errore durante il login con Google",
          description: error.message,
          variant: "destructive",
        })
        setIsLoading(false)
      }
    } catch (_error: unknown) {
      toast({
        title: "Errore durante il login con Google",
        description: "Si è verificato un errore imprevisto",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleAppleLogin = async () => {
    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      if (error) {
        toast({
          title: "Errore durante il login con Apple",
          description: error.message,
          variant: "destructive",
        })
        setIsLoading(false)
      }
    } catch (_error: unknown) {
      toast({
        title: "Errore durante il login con Apple",
        description: "Si è verificato un errore imprevisto",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-surface-primary border-2 border-brand-primary">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-brand-primary">
            Performance Prime
          </CardTitle>
          <CardDescription className="text-text-secondary">
            Accedi o registrati per iniziare il tuo percorso
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-surface-secondary h-12 relative">
              <TabsTrigger 
                value="login" 
                className="text-text-primary data-[state=active]:bg-brand-primary data-[state=active]:text-background h-full flex items-center justify-center transition-all duration-200 relative"
              >
                Accedi
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="text-text-primary data-[state=active]:bg-brand-primary data-[state=active]:text-background h-full flex items-center justify-center transition-all duration-200 relative"
              >
                Registrati
              </TabsTrigger>
            </TabsList>
            
            {/* Social Login */}
            <div className="mt-6">
              <div className="relative flex items-center my-6">
                <div className="flex-1 border-t border-border-primary"></div>
                <span className="px-4 text-sm text-text-secondary bg-surface-primary">oppure</span>
                <div className="flex-1 border-t border-border-primary"></div>
              </div>
              
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-background border-border-primary hover:bg-surface-secondary"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
              </div>
            </div>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-text-primary">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="la-tua-email@esempio.com"
                    className="bg-surface-secondary border-border-primary text-text-primary"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-text-primary">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Inserisci la tua password"
                    className="bg-surface-secondary border-border-primary text-text-primary"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-brand-primary text-background hover:bg-brand-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Accesso in corso...' : 'Accedi'}
                </Button>
              </form>
              
              <div className="mt-4 pt-4 border-t border-border-primary">
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-text-primary">Reset Password</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Email per il reset"
                      className="bg-surface-secondary border-border-primary text-text-primary"
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    variant="outline"
                    className="w-full border-border-primary text-text-primary hover:bg-surface-secondary"
                    disabled={isResetLoading}
                  >
                    {isResetLoading ? 'Invio in corso...' : 'Invia email di reset'}
                  </Button>
                </form>
              </div>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <RegistrationForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}