import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import ImageUpload from "@/components/shared/ImageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Phone, MapPin, UserCheck, Save } from "lucide-react";

const CustomerForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, create, update } = useBusinessData("customers");
  const isEditing = !!id;

  const [form, setForm] = useState({
    name: "", phone: "", alt_phone: "", reference: "", reference_phone: "", address: "", photo_url: ""
  });

  useEffect(() => {
    if (isEditing && data.length > 0) {
      const customer = data.find((c: any) => c.id === id);
      if (customer) {
        setForm({
          name: customer.name || "",
          phone: customer.phone || "",
          alt_phone: customer.alt_phone || "",
          reference: customer.reference || "",
          reference_phone: customer.reference_phone || "",
          address: customer.address || "",
          photo_url: customer.photo_url || "",
        });
      }
    }
  }, [id, data, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = isEditing ? await update(id!, form) : await create(form);
    if (ok) navigate("/customers");
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/customers")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isEditing ? "Edit" : "New"} Customer</h1>
            <p className="text-sm text-muted-foreground">{isEditing ? "Update customer details" : "Add a new customer to your business"}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Photo */}
              <div className="flex justify-center pb-4">
                <ImageUpload
                  currentUrl={form.photo_url}
                  onUpload={(url) => setForm({ ...form, photo_url: url })}
                  folder="customers"
                  size="lg"
                />
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Full Name *
                </Label>
                <Input placeholder="Enter customer full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="h-11" />
              </div>

              {/* Phone numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Phone
                  </Label>
                  <Input placeholder="Primary phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Alt Phone
                  </Label>
                  <Input placeholder="Alternative phone" value={form.alt_phone} onChange={e => setForm({ ...form, alt_phone: e.target.value })} className="h-11" />
                </div>
              </div>

              {/* Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" /> Reference Name
                  </Label>
                  <Input placeholder="Referred by" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Reference Phone
                  </Label>
                  <Input placeholder="Reference phone" value={form.reference_phone} onChange={e => setForm({ ...form, reference_phone: e.target.value })} className="h-11" />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Address
                </Label>
                <Textarea placeholder="Enter full address..." value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={4} className="resize-none" />
              </div>

              <Button type="submit" className="w-full h-11 text-sm font-semibold gap-2">
                <Save className="w-4 h-4" />
                {isEditing ? "Update Customer" : "Create Customer"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
};

export default CustomerForm;
