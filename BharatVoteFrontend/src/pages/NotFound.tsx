import { Link } from "react-router-dom";
import { Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-hero-pattern py-16">
      <div className="container max-w-md text-center">
        <div className="govt-card-elevated p-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-primary" />
          </div>
          
          <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Page Not Found
          </h2>
          <p className="text-muted-foreground mb-8">
            पृष्ठ नहीं मिला • The page you're looking for doesn't exist.
          </p>

          <Button asChild className="gap-2 bg-primary hover:bg-primary/90">
            <Link to="/">
              <Home className="w-4 h-4" />
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
