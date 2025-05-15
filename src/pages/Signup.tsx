
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
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
          <p className="mb-4 text-center text-gray-600">
            {token ? `You're scanning: ${token}` : "Sign up to start scanning"}
          </p>
          {/* Signup form would go here in a future implementation */}
          <div className="p-8 border border-gray-200 rounded-lg">
            <p className="text-center text-gray-500">Signup functionality coming soon</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;
