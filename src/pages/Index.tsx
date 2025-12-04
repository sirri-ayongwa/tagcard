import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import tagcardLogo from "@/assets/tagcard-logo.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background p-4">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="text-center space-y-8 max-w-md">
          <div className="flex flex-col items-center">
            <img 
              src={tagcardLogo} 
              alt="TagCard" 
              className="w-24 h-auto mb-6 mt-8"
            />
            <p className="text-xl text-muted-foreground">
              Create your digital profile card. Share via QR code or download as a business card.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={() => navigate("/auth")} className="btn-primary">
              Get Started
            </Button>
            <p className="text-sm text-muted-foreground">
              Minimal. Privacy-first. Straight-forward.
            </p>
          </div>
        </div>
      </div>

      <footer className="text-center text-sm text-muted-foreground pb-4">
        Built with ❤ by{" "}
        <a
          href="https://ko-fi.com/sirri"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline hover:no-underline transition-all"
        >
          Sirri
        </a>
      </footer>
    </div>
  );
};

export default Index;
