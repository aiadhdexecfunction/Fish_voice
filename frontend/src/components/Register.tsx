import React, { useState } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from './ui/sonner';

interface RegisterProps {
  onClose: () => void;
}

export default function Register({ onClose }: RegisterProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    password: '',
  });
  
  const { login, register: registerUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        await registerUser(formData.name, formData.password);
        toast.success('Account created successfully! 🎉');
        onClose();
      } else {
        await login(formData.name, formData.password);
        toast.success('Welcome back! 👋');
        onClose();
      }
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred. Please try again.';
      toast.error(errorMessage);
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    toast.info('Google sign-in coming soon!');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6" style={{ 
      background: 'linear-gradient(135deg, #FFD4A3 0%, #CFE8ED 50%, #B8D4C8 100%)'
    }}>
      <div className="w-full max-w-[480px] p-10 warm-card animate-fade-in" style={{ 
        background: '#FFFFFF', 
        borderRadius: '32px'
      }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce-gentle inline-block">🍕</div>
          <h1 className="mb-2" style={{ 
            fontFamily: 'Poppins, sans-serif',
            fontSize: '2rem',
            fontWeight: 700,
            color: '#F7A64B'
          }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p style={{ 
            fontFamily: 'Lexend Deca, sans-serif',
            color: '#8B5E3C',
            fontSize: '1rem'
          }}>
            Focus doesn't have to be lonely ❤️
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" style={{ 
              fontFamily: 'Inter, sans-serif',
              color: '#2D2D2D',
              fontWeight: 500
            }}>
              {isSignUp ? 'Name' : 'Username'}
            </Label>
            <Input
              id="name"
              type="text"
              placeholder={isSignUp ? "Enter your name" : "Enter your username"}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="h-12"
              style={{ 
                background: '#FFF9F4',
                border: '1px solid #E8DDD0',
                borderRadius: '12px',
                fontFamily: 'Lexend Deca, sans-serif'
              }}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" style={{ 
              fontFamily: 'Inter, sans-serif',
              color: '#2D2D2D',
              fontWeight: 500
            }}>
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="h-12 pr-12"
                style={{ 
                  background: '#FFF9F4',
                  border: '1px solid #E8DDD0',
                  borderRadius: '12px',
                  fontFamily: 'Lexend Deca, sans-serif'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: '#8B5E3C' }}
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
            <p className="text-sm" style={{ 
              fontFamily: 'Lexend Deca, sans-serif',
              color: '#8B5E3C',
              opacity: 0.8
            }}>
              Must be at least 8 characters
            </p>
          </div>

          {/* Sign Up Button */}
          <Button
            type="submit"
            className="w-full h-12 friendly-button mt-6"
            disabled={isLoading}
            style={{ 
              background: 'linear-gradient(135deg, #F7A64B 0%, #FFB86F 100%)', 
              color: '#FFFFFF',
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '1rem',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            <Sparkles className="size-5 mr-2" />
            {isLoading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Sign Up' : 'Sign In')}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full" style={{ borderTop: '1px solid #E8DDD0' }}></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-4" style={{ 
              background: '#FFFFFF', 
              fontFamily: 'Lexend Deca, sans-serif',
              color: '#8B5E3C',
              fontSize: '0.875rem'
            }}>
              or continue with
            </span>
          </div>
        </div>

        {/* Google Sign In Button */}
        <Button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full h-12 friendly-button"
          style={{ 
            background: '#FFF9F4', 
            color: '#2D2D2D',
            border: '1px solid #E8DDD0',
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500
          }}
        >
          <svg className="size-5 mr-3" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        {/* Sign In Link */}
        <div className="text-center mt-8">
          <p style={{ 
            fontFamily: 'Lexend Deca, sans-serif',
            color: '#2D2D2D',
            fontSize: '0.875rem'
          }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              type="button"
              style={{ 
                color: '#F7A64B',
                fontWeight: 600,
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
              className="hover:no-underline"
            >
              {isSignUp ? 'Sign in →' : 'Sign up →'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}