import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedLayout } from "@/components/ProtectedRoute";
import { AdminLayout, SuperAdminLayout } from "@/components/AdminRoute";
import Index from "./pages/Index";
import { Loader2 } from "lucide-react";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Products = lazy(() => import("./pages/Products"));
const ProductForm = lazy(() => import("./pages/ProductForm"));
const GenerateLanding = lazy(() => import("./pages/GenerateLanding"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Landings = lazy(() => import("./pages/Landings"));
const LandingView = lazy(() => import("./pages/LandingView"));
const Pricing = lazy(() => import("./pages/Pricing"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const LandingPreview = lazy(() => import("./pages/LandingPreview"));
const LandingFullPreview = lazy(() => import("./pages/LandingFullPreview"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const SuperAdminConfig = lazy(() => import("./pages/SuperAdminConfig"));
const GenerateBanner = lazy(() => import("./pages/GenerateBanner"));
const Banners = lazy(() => import("./pages/Banners"));
const AdminPayments = lazy(() => import("./pages/AdminPayments"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PublicLanding = lazy(() => import("./pages/PublicLanding"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/landing/preview" element={<LandingPreview />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/p/:slug" element={<PublicLanding />} />
                <Route element={<ProtectedLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/new" element={<ProductForm />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/products/:id/edit" element={<ProductForm />} />
                  <Route path="/products/:id/generate" element={<GenerateLanding />} />
                  <Route path="/landings" element={<Landings />} />
                  <Route path="/landings/:id" element={<LandingView />} />
                  <Route path="/landings/:id/preview" element={<LandingFullPreview />} />
                  <Route path="/products/:id/banner" element={<GenerateBanner />} />
                  <Route path="/banners" element={<Banners />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                </Route>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/payments" element={<AdminPayments />} />
                </Route>
                <Route element={<SuperAdminLayout />}>
                  <Route path="/admin/config" element={<SuperAdminConfig />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
