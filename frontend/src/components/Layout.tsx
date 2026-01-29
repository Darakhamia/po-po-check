import { Outlet, Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Globe, Settings, FolderOpen, LogIn } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Globe className="w-8 h-8 text-primary-500" />
              <span className="text-xl font-semibold text-gray-900">POlyglot</span>
            </Link>

            <nav className="flex items-center gap-4">
              <SignedIn>
                <Link
                  to="/"
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/'
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  Projects
                </Link>
                <Link
                  to="/settings"
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/settings'
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-md text-sm font-medium hover:bg-primary-600 transition-colors">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <SignedIn>
          <Outlet />
        </SignedIn>
        <SignedOut>
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <Globe className="w-16 h-16 text-primary-500 mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to POlyglot</h1>
            <p className="text-gray-600 text-center max-w-md mb-8">
              A web-based translation editor for .po files with AI-powered translations.
              Sign in to get started.
            </p>
            <SignInButton mode="modal">
              <button className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg text-lg font-medium hover:bg-primary-600 transition-colors">
                <LogIn className="w-5 h-5" />
                Sign In to Continue
              </button>
            </SignInButton>
          </div>
        </SignedOut>
      </main>
    </div>
  );
}
