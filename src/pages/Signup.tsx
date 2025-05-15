
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SignUpForm } from "@/components/SignUpForm";
import { useLocation } from "react-router-dom";

const Signup = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token") || "";

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Create Your Account</h1>
          <SignUpForm />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;
