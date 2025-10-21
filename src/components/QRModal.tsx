import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicId: string;
}

const QRModal = ({ isOpen, onClose, publicId }: QRModalProps) => {
  const [qrType, setQrType] = useState<"dynamic" | "static">("dynamic");
  const [preset, setPreset] = useState("public");
  
  const baseUrl = window.location.origin;
  const profileUrl = `${baseUrl}/profile/${publicId}?preset=${preset}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    toast.success("Link copied to clipboard!");
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById("qr-code") as HTMLCanvasElement;
    if (!canvas) return;

    const svg = canvas.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `tagcard-qr-${preset}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("QR code downloaded!");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My TagCard Profile",
          text: "Check out my profile!",
          url: profileUrl,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Profile</DialogTitle>
        </DialogHeader>

        <Tabs value={qrType} onValueChange={(v) => setQrType(v as "dynamic" | "static")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dynamic">Dynamic QR</TabsTrigger>
            <TabsTrigger value="static">Static QR</TabsTrigger>
          </TabsList>

          <TabsContent value="dynamic" className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Visibility Preset</label>
              <Select value={preset} onValueChange={setPreset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal (Date)</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div id="qr-code" className="flex justify-center p-6 bg-white rounded-xl">
              <QRCodeSVG
                value={profileUrl}
                size={200}
                level="H"
                includeMargin
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Dynamic QR codes link to your live profile. Updates automatically when you edit your profile.
            </p>
          </TabsContent>

          <TabsContent value="static" className="space-y-4">
            <div id="qr-code" className="flex justify-center p-6 bg-white rounded-xl">
              <QRCodeSVG
                value={profileUrl}
                size={200}
                level="H"
                includeMargin
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Static QR codes embed your current profile data. Won't update when you edit your profile.
            </p>
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Button onClick={handleCopyLink} className="btn-secondary">
            <Copy className="mr-2" size={16} />
            Copy Link
          </Button>
          <Button onClick={handleDownloadQR} className="btn-secondary">
            <Download className="mr-2" size={16} />
            Save QR Image
          </Button>
          <Button onClick={handleShare} className="btn-primary">
            <Share2 className="mr-2" size={16} />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRModal;
