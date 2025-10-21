import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
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
  );
};

export default Index;
