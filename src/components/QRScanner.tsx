import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QRScanner = ({ open, onOpenChange }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && !isScanning) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [open]);

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanFailure
      );

      setIsScanning(true);
    } catch (error) {
      console.error("Failed to start scanner:", error);
      toast.error("Failed to access camera. Please check permissions.");
      onOpenChange(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (error) {
        console.error("Failed to stop scanner:", error);
      }
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    // Check if the scanned QR code is a TagCard profile URL
    const isTagCardUrl = decodedText.includes(window.location.origin + "/p/");
    
    if (isTagCardUrl) {
      // Extract the public_id from the URL
      const urlParts = decodedText.split("/p/");
      if (urlParts.length === 2) {
        const publicId = urlParts[1];
        await stopScanner();
        onOpenChange(false);
        navigate(`/p/${publicId}`);
        toast.success("Profile loaded successfully!");
      } else {
        toast.error("Invalid TagCard QR code format.");
      }
    } else {
      toast.error("This QR code is not a TagCard profile. Please scan a valid TagCard QR code.");
    }
  };

  const onScanFailure = (error: string) => {
    // Silently handle scan failures - they happen frequently during scanning
    console.debug("Scan error:", error);
  };

  const handleClose = async () => {
    await stopScanner();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Scan TagCard QR Code
            <button
              onClick={handleClose}
              className="rounded-full p-1 hover:bg-accent transition-colors"
            >
              <X size={20} />
            </button>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Point your camera at a TagCard QR code to view their profile
          </p>
          <div
            id="qr-reader"
            className="w-full rounded-lg overflow-hidden border"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRScanner;
