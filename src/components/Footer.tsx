
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container px-4 py-8 mx-auto sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-4 sm:mb-0">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Token Health Scan
            </p>
          </div>
          <div className="flex space-x-6">
            <Link to="#faq" className="text-gray-600 hover:text-gray-900 text-sm">
              FAQ
            </Link>
            <Link to="/docs" className="text-gray-600 hover:text-gray-900 text-sm">
              Docs
            </Link>
            <Link to="/terms" className="text-gray-600 hover:text-gray-900 text-sm">
              Terms
            </Link>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Twitter
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
