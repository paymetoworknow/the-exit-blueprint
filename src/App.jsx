import React from 'react'; // Required for React.Fragment with key prop
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Analytics } from '@vercel/analytics/react';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// Helper function to convert camelCase to hyphenated format
const toHyphenated = (str) => {
  return str
    // Insert hyphen before uppercase letters (but not at the start)
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    // Handle consecutive uppercase letters (acronyms)
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    // Insert hyphen before numbers when following a letter
    .replace(/([a-zA-Z])(\d)/g, '$1-$2')
    // Insert hyphen after numbers when followed by a letter
    .replace(/(\d)([a-zA-Z])/g, '$1-$2')
    .toLowerCase();
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => {
        const hyphenatedPath = toHyphenated(path);
        const isCamelCase = path !== hyphenatedPath;
        
        return (
          <React.Fragment key={path}>
            {/* Primary route with original camelCase path */}
            <Route
              path={`/${path}`}
              element={
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              }
            />
            {/* Alias route with hyphenated path (only if different from camelCase) */}
            {isCamelCase && (
              <Route
                path={`/${hyphenatedPath}`}
                element={
                  <LayoutWrapper currentPageName={path}>
                    <Page />
                  </LayoutWrapper>
                }
              />
            )}
          </React.Fragment>
        );
      })}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
      <Analytics />
    </AuthProvider>
  )
}

export default App
