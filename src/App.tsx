import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedLayout } from "@/components/ProtectedRoute";
import { AdminLayout, SuperAdminLayout } from "@/components/AdminRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductForm from "./pages/ProductForm";
import GenerateLanding from "./pages/GenerateLanding";
import Landings from "./pages/Landings";
import LandingView from "./pages/LandingView";
import Pricing from "./pages/Pricing";
import SettingsPage from "./pages/SettingsPage";
import LandingPreview from "./pages/LandingPreview";
import LandingFullPreview from "./pages/LandingFullPreview";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import SuperAdminConfig from "./pages/SuperAdminConfig";
import GenerateBanner from "./pages/GenerateBanner";
import Banners from "./pages/Banners";
import NotFound from "./pages/NotFound";
import PublicLanding from "./pages/PublicLanding";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/landing/preview" element={<LandingPreview />} />
            <Route path="/p/:slug" element={<PublicLanding />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/new" element={<ProductForm />} />
              <Route path="/products/:id/edit" element={<ProductForm />} />
              <Route path="/products/:id/generate" element={<GenerateLanding />} />
              <Route path="/landings" element={<Landings />} />
              <Route path="/landings/:id" element={<LandingView />} />
              <Route path="/landings/:id/preview" element={<LandingFullPreview />} />
              <Route path="/products/:id/banner" element={<GenerateBanner />} />
              <Route path="/banners" element={<Banners />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>
            <Route element={<SuperAdminLayout />}>
              <Route path="/admin/config" element={<SuperAdminConfig />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
