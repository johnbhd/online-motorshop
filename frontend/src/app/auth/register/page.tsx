import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthCard title="Create your account" subtitle="Register for a faster experience while you browse motorcycle parts and submit order requests.">
      <RegisterForm />
    </AuthCard>
  );
}
