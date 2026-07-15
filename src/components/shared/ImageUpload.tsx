import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ImageUploadProps {
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  folder?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = { sm: "w-16 h-16", md: "w-24 h-24", lg: "w-32 h-32" };

const ImageUpload = ({ currentUrl, onUpload, folder = "images", size = "md" }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Map folder names to actual bucket names
  const getBucket = (folderName: string): string => {
    const map: Record<string, string> = {
      products: "product-images",
      "product-images": "product-images",
      logos: "shop-logos",
      "shop-logos": "shop-logos",
      customers: "customer-photos",
      "customer-photos": "customer-photos",
      suppliers: "supplier-photos",
      "supplier-photos": "supplier-photos",
      "job-cards": "job-card-photos",
      job_cards: "job-card-photos",
      "job-card-photos": "job-card-photos",
      "design-reference": "design-reference",
      custom_orders: "design-reference",
    };
    return map[folderName] || "product-images";
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const bucket = getBucket(folder);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    onUpload(data.publicUrl);
    setUploading(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative cursor-pointer group" onClick={() => inputRef.current?.click()}>
        <Avatar className={`${sizeMap[size]} border-2 border-border`}>
          <AvatarImage src={currentUrl || undefined} />
          <AvatarFallback className="bg-muted">
            <Camera className="w-6 h-6 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
    </div>
  );
};

export default ImageUpload;
