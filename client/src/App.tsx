import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AmbientBackdrop } from '@/components/layout/AmbientBackdrop';
import { Preloader } from '@/components/layout/Preloader';
import { DocumentTitle } from '@/components/seo/DocumentTitle';
import { queryClient } from '@/config/queryClient';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ThemeProvider } from '@/features/theme/ThemeProvider';
import { AppRoutes } from '@/routes/AppRoutes';

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AmbientBackdrop />
          <Preloader />
          <AuthProvider>
            <DocumentTitle />
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
