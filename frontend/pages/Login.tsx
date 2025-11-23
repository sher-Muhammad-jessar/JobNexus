import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Lock, Mail, User, ArrowRight, CheckCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log(' Starting authentication process...');
      
      if (isLogin) {
        console.log(' Attempting login...');
        // Login returns { access_token, token_type }
        const loginResponse = await api.auth.login(email, password);
        console.log(' Login API successful:', loginResponse);
        
        // Store token
        localStorage.setItem('access_token', loginResponse.access_token);
        console.log(' Token stored in localStorage');
        
        // Get user profile
        console.log(' Fetching user profile...');
        const userProfile = await api.auth.getProfile();
        console.log(' User profile loaded:', userProfile);
        
        // Call login with correct structure
        login(loginResponse.access_token, userProfile);
        
      } else {
        console.log(' Attempting registration...');
        // Register returns User directly
        const registerResponse = await api.auth.register({ email, password, name });
        console.log(' Registration successful:', registerResponse);
        
        // For registration, you might need to login after registering
        const loginResponse = await api.auth.login(email, password);
        localStorage.setItem('access_token', loginResponse.access_token);
        
        const userProfile = await api.auth.getProfile();
        login(loginResponse.access_token, userProfile);
      }
      
      console.log(' Redirecting to dashboard...');
      navigate('/'); // This will go to the protected route which shows Dashboard
      
    } catch (err: any) {
      console.error(' Authentication failed:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">J</div>
              <span className="text-xl font-bold text-slate-900">JobNexus</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-500">
              {isLogin ? 'Enter your details to access your account' : 'Get started with your job search today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center">
                <span className="mr-2">●</span> {error}
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600 text-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                className="text-primary-600 font-semibold hover:text-primary-700 hover:underline"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>

        {/* Right Side - Visual */}
        <div className="hidden md:flex w-1/2 bg-slate-900 p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-3xl font-bold mb-4">Find your dream job with JobNexus</h3>
            <p className="text-slate-300 text-lg leading-relaxed">
              Join thousands of professionals who have accelerated their careers through our AI-powered matching platform.
            </p>
          </div>
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl backdrop-blur-sm border border-slate-700">
               <div className="bg-green-500/20 p-2 rounded-lg text-green-400">
                 <CheckCircle size={24} />
               </div>
               <div>
                 <p className="font-bold">Smart Matching</p>
                 <p className="text-sm text-slate-400">Get recommended jobs that fit your skills</p>
               </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl backdrop-blur-sm border border-slate-700">
               <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                 <CheckCircle size={24} />
               </div>
               <div>
                 <p className="font-bold">Track Applications</p>
                 <p className="text-sm text-slate-400">Real-time updates on your status</p>
               </div>
            </div>
          </div>

          {/* Decorative background circles */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
      </div>
    </div>
  );
};