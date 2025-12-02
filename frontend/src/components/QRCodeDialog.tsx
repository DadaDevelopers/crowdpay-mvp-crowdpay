import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeDialogProps {
  url: string;
  title: string;
}

export const QRCodeDialog = ({ url, title }: QRCodeDialogProps) => {
  const { toast } = useToast();
  const fullUrl = `${window.location.origin}${url}`;

  const downloadQRCode = () => {
    const svg = document.getElementById("campaign-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = 1000;
    canvas.height = 1000;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = `${title.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            
            toast({
              title: "QR Code Downloaded",
              description: "Your campaign QR code has been saved",
            });
          }
        });
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="rounded-full shadow-lg bg-primary hover:bg-primary/90"
        >
          <QrCode className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Campaign QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="bg-white p-6 rounded-lg">
            <QRCodeSVG
              id="campaign-qr-code"
              value={fullUrl}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>
          <p className="text-sm text-muted-foreground text-center break-all px-4">
            {fullUrl}
          </p>
          <Button onClick={downloadQRCode} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
