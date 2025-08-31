import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="container py-20 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight">404</h1>
      <p className="text-lg text-muted-foreground mt-3">Oops! Page not found.</p>
      <a href="/" className="inline-flex mt-6 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Return to Home</a>
    </div>
  );
};

export default NotFound;
