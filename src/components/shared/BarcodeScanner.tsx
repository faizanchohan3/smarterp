import { useRef, useEffect, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string) => void;
}

const BarcodeScanner = ({ open, onOpenChange, onScan }: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (!open) {
      if (controlsRef.current) {
        controlsRef.current.stop().catch(() => {});
        controlsRef.current = null;
      }
      return;
    }

    const initScanner = async () => {
      try {
        setLoading(true);
        setError("");
        const reader = new BrowserMultiFormatReader();

        // Get available video input devices
        const availableDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        setDevices(availableDevices);

        // Use environment camera (back) if available, otherwise use the first device
        const deviceId = availableDevices.find((d) => d.label.toLowerCase().includes("environment"))?.deviceId || availableDevices[0]?.deviceId;

        if (!deviceId) {
          setError("No camera device found");
          setLoading(false);
          return;
        }

        setSelectedDeviceId(deviceId);

        const controls = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, error) => {
            if (result) {
              onScan(result.getText());
              onOpenChange(false);
            }
          }
        );

        controlsRef.current = controls;
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start camera");
        setLoading(false);
      }
    };

    initScanner();

    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop().catch(() => {});
        controlsRef.current = null;
      }
    };
  }, [open]);

  const switchCamera = async () => {
    if (devices.length < 2) return;

    const currentIndex = devices.findIndex((d) => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDeviceId = devices[nextIndex].deviceId;

    if (controlsRef.current) {
      controlsRef.current.stop().catch(() => {});
      controlsRef.current = null;
    }

    setSelectedDeviceId(nextDeviceId);

    try {
      const reader = new BrowserMultiFormatReader();
      const controls = await reader.decodeFromVideoDevice(
        nextDeviceId,
        videoRef.current,
        (result) => {
          if (result) {
            onScan(result.getText());
            onOpenChange(false);
          }
        }
      );
      controlsRef.current = controls;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to switch camera");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Scan Barcode or QR Code</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!error && (
            <video
              ref={videoRef}
              className="w-full rounded-lg bg-black"
              style={{ maxHeight: "400px", objectFit: "cover", display: loading ? "none" : "block" }}
            />
          )}

          {devices.length > 1 && !error && !loading && (
            <Button variant="outline" onClick={switchCamera} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Switch Camera
            </Button>
          )}

          <p className="text-xs text-muted-foreground text-center">Point your camera at a barcode or QR code to scan</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
