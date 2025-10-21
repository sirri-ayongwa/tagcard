import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

interface QRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileUrl: string;
}

const QRModal = ({ open, onOpenChange, profileUrl }: QRModalProps) => {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    toast.success("Link copied to clipboard!");
  };

  const handleDownloadQR = () => {
    const qrElement = document.getElementById("qr-code");
    if (!qrElement) return;

    const svg = qrElement.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = "tagcard-qr.png";
      link.click();
      toast.success("QR code downloaded!");
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My TagCard Profile",
          text: "Check out my profile on TagCard!",
          url: profileUrl,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your QR Code</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div id="qr-code" className="flex justify-center p-6 bg-white rounded-xl">
            <QRCodeSVG value={profileUrl} size={200} level="H" includeMargin />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Scan this QR code to view your profile
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleCopyLink} variant="outline">
              <Copy size={16} className="mr-2" />
              Copy Link
            </Button>
            <Button onClick={handleDownloadQR} variant="outline">
              <Download size={16} className="mr-2" />
              Save QR
            </Button>
          </div>

          <Button onClick={handleShare} className="w-full btn-primary">
            <Share2 size={16} className="mr-2" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRModal;
