// src/components/Header.jsx
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { getUserRole, getToken, removeToken } from '../utils/auth'  // make sure getToken is exported
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Menu, X, LogOut, GraduationCap, UserCircle } from 'lucide-react'
import { toast } from 'react-toastify'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken())
  const [role, setRole] = useState(getUserRole())
  const [user, setUser] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // Re-check auth state whenever token changes
  useEffect(() => {
    const checkAuth = () => {
      const token = getToken()
      const currentRole = getUserRole()

      setIsLoggedIn(!!token)
      setRole(currentRole)
    }

    checkAuth()

    // Listen for storage changes (e.g. login from another tab)
    window.addEventListener('storage', checkAuth)

    // Also poll every 2 seconds in case token changes without storage event
    const interval = setInterval(checkAuth, 2000)

    return () => {
      window.removeEventListener('storage', checkAuth)
      clearInterval(interval)
    }
  }, [])

  // Fetch user data (avatar, etc.) when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchUserData()
    } else {
      setUser(null)
      setLoadingUser(false)
    }
  }, [isLoggedIn])

  const fetchUserData = async () => {
    try {
      const res = await api.get('/api-v1/user/me')
      setUser(res.data.user)
    } catch (err) {
      console.error('Failed to fetch user for header:', err)
      // If token invalid → logout
      if (err.response?.status === 401) {
        removeToken()
        setIsLoggedIn(false)
        setRole(null)
        toast.info('Session expired. Please login again.')
        navigate('/login')
      }
    } finally {
      setLoadingUser(false)
    }
  }

  const userInitial = role ? role.charAt(0).toUpperCase() : '?'

  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = () => {
    removeToken()
    setIsLoggedIn(false)
    setRole(null)
    setUser(null)
    toast.success('Logged out successfully')
    navigate('/login')
    setIsMenuOpen(false)
  }

  const isActive = (path) => location.pathname === path

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <GraduationCap className="h-8 w-8 md:h-10 md:w-10 text-primary transition-transform group-hover:scale-110" />
          <div className="flex flex-col leading-tight">
            <span className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
              LMS
            </span>
            <span className="text-xs md:text-sm text-muted-foreground font-medium">
              Learning Platform
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-1">
          <Button 
            variant={isActive('/') ? "default" : "ghost"} 
            asChild
            className="text-sm font-medium"
          >
            <Link to="/">Home</Link>
          </Button>

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={user?.Avatar || '/placeholder-avatar.jpg'} 
                      alt="User avatar" 
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link to="/student-dashboard">My Courses</Link>
                </DropdownMenuItem>

                {role === 'teacher' && (
                  <DropdownMenuItem asChild>
                    <Link to="/teacher-dashboard">Teacher Dashboard</Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button 
                variant={isActive('/login') ? "default" : "ghost"} 
                asChild
                className="text-sm font-medium"
              >
                <Link to="/login">Login</Link>
              </Button>

              <Button 
                variant={isActive('/register') ? "default" : "ghost"} 
                asChild
                className="text-sm font-medium"
              >
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
        </nav>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <nav className="md:hidden border-t bg-background py-4">
          <div className="container flex flex-col space-y-4 px-4">
            <Button 
              variant={isActive('/') ? "default" : "ghost"} 
              asChild
              onClick={() => setIsMenuOpen(false)}
              className="justify-start"
            >
              <Link to="/">Home</Link>
            </Button>

            {isLoggedIn ? (
              <>
                <Button 
                  variant={isActive('/profile') ? "default" : "ghost"} 
                  asChild
                  onClick={() => setIsMenuOpen(false)}
                  className="justify-start"
                >
                  <Link to="/profile">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </Button>

                <Button 
                  variant={isActive('/student-dashboard') ? "default" : "ghost"} 
                  asChild
                  onClick={() => setIsMenuOpen(false)}
                  className="justify-start"
                >
                  <Link to="/student-dashboard">My Courses</Link>
                </Button>

                {role === 'teacher' && (
                  <Button 
                    variant={isActive('/teacher-dashboard') ? "default" : "ghost"} 
                    asChild
                    onClick={() => setIsMenuOpen(false)}
                    className="justify-start"
                  >
                    <Link to="/teacher-dashboard">Teacher Dashboard</Link>
                  </Button>
                )}

                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="justify-start text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant={isActive('/login') ? "default" : "ghost"} 
                  asChild
                  onClick={() => setIsMenuOpen(false)}
                  className="justify-start"
                >
                  <Link to="/login">Login</Link>
                </Button>

                <Button 
                  variant={isActive('/register') ? "default" : "ghost"} 
                  asChild
                  onClick={() => setIsMenuOpen(false)}
                  className="justify-start"
                >
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}

export default Header