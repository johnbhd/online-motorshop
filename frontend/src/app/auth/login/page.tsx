import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthCard title="Welcome to ALD Motorshop" subtitle="Sign in for a faster experience or continue as a guest to browse products and place an order.">
      <LoginForm />
    </AuthCard>
  );
}
