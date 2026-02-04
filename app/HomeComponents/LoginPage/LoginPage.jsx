"use client"
import axiosInstance from '@/app/SharedComponents/AxiosInstance/AxiosInstance';
import loginAnimation from '@/public/login-success.json';
import Lottie from 'lottie-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';

const LoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved credentials on component mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem('savedCredentials');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (savedRememberMe && savedCredentials) {
      try {
        const credentials = JSON.parse(savedCredentials);
        setFormData({
          email: credentials.email || '',
          password: credentials.password || ''
        });
        setRememberMe(true);
      } catch (error) {
        console.error('Error loading saved credentials:', error);
      }
    }
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle remember me checkbox
  const handleRememberMeChange = (e) => {
    const isChecked = e.target.checked;
    setRememberMe(isChecked);
    
    // If unchecking, remove saved credentials
    if (!isChecked) {
      localStorage.removeItem('savedCredentials');
      localStorage.setItem('rememberMe', 'false');
    }
  };

  // Handle forget password
  const handleForgetPassword = () => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex flex-col ring-1 ring-black ring-opacity-5`}>
        <div className="p-6">
          <div className="flex items-start">
            <div className="ml-3 flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900">
                Please contact with admin
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Okay
            </button>
            <button
              onClick={() => {
                window.open('https://wa.me/01609836406', '_blank');
                toast.dismiss(t.id);
              }}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
            >
              Contact
            </button>
          </div>
        </div>
      </div>
    ));
  };

  // Save credentials to localStorage if remember me is checked
  const saveCredentials = (email, password) => {
    if (rememberMe) {
      localStorage.setItem('savedCredentials', JSON.stringify({ email, password }));
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('savedCredentials');
      localStorage.setItem('rememberMe', 'false');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axiosInstance.post("/login", formData);
      
      if (response.data.success) {
        // Save credentials if remember me is checked
        saveCredentials(formData.email, formData.password);
        
        toast.success('Login successful!');
        // Store token if available
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        // Store user data
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        // Redirect after delay
        setTimeout(() => {
          router.push('/inventory-home');
        }, 1000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Side - Lottie Animation */}
        <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center items-center bg-linear-to-br from-blue-500 to-indigo-600">
          <div className="w-full max-w-md">
            <Lottie 
              animationData={loginAnimation} 
              loop={true}
              className="w-full h-auto"
            />
          </div>
          <div className="mt-8 text-center text-white">
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
              Inventory Management System
            </h2>
            <p className="text-blue-100">
              Streamline your inventory with our powerful management system
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 mb-8">
              Sign in to your account to continue
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full text-black px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Enter your email"
                />
              </div>

              {/* Password Input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgetPassword}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full text-black px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Enter your password"
                />
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                  Remember Me
                </label>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 text-sm">
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => router.push('/register')}
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Register here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;