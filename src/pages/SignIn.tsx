
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const SignIn = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Sign In</h1>
          <div className="p-8 border border-gray-200 rounded-lg">
            <p className="text-center text-gray-500">Sign in functionality coming soon</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SignIn;
