import { useState } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

const Categories = () => {
  const { data, create, update, remove } = useBusinessData("categories");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = editing ? await update(editing.id, { name }) : await create({ name });
    if (ok) { setOpen(false); setEditing(null); setName(""); }
  };

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Categories</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); setName(""); setOpen(true); }} className="gap-2"><Plus className="w-4 h-4" /> Add Category</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Category</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input placeholder="Category Name" value={name} onChange={e => setName(e.target.value)} required />
                <Button type="submit" className="w-full">{editing ? "Update" : "Create"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <DataTable
          columns={[{ key: "name", label: "Category Name" }]}
          data={data}
          onEdit={(row) => { setEditing(row); setName(row.name); setOpen(true); }}
          onDelete={(row) => remove(row.id)}
        />
      </div>
    </AppLayout>
  );
};

export default Categories;
