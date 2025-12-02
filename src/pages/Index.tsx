import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background p-4">
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-8 max-w-md">
          <div>
            <h1 className="text-5xl font-bold mb-4">TagCard</h1>
            <p className="text-xl text-muted-foreground">
              Create your digital profile card. Share via QR code or download as a business card.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={() => navigate("/auth")} className="btn-primary">
              Get Started
            </Button>
            <p className="text-sm text-muted-foreground">
              Minimal. Privacy-first. No app required for recipients.
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
