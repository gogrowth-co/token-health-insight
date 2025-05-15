
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const HowItWorks = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">How Token Health Scan Works</h1>
        <div className="max-w-3xl mx-auto prose">
          <p className="text-xl text-center mb-8">
            Detailed explanation on how the token health scanning process works would go here.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorks;
