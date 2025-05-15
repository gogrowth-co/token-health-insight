
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const Terms = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">Terms of Service</h1>
        <div className="max-w-3xl mx-auto prose">
          <p className="text-xl text-center mb-8">
            Terms of service would go here.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
