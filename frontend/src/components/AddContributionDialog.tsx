import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

interface AddContributionDialogProps {
  campaignId: string;
}

export const AddContributionDialog = ({ campaignId }: AddContributionDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contributor_name: "",
    amount: "",
    payment_method: "mpesa" as "mpesa" | "bitcoin",
    is_anonymous: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("contributions").insert({
        campaign_id: campaignId,
        contributor_name: formData.is_anonymous ? "Anonymous" : formData.contributor_name,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
      });

      if (error) throw error;

      toast({
        title: "Contribution added!",
        description: "Thank you for your support!",
      });

      setOpen(false);
      setFormData({
        contributor_name: "",
        amount: "",
        payment_method: "mpesa",
        is_anonymous: false,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add contribution",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Test Contribution
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Test Contribution</DialogTitle>
          <DialogDescription>
            Add a test contribution to see live updates on the campaign page
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contributor_name">Contributor Name *</Label>
            <Input
              id="contributor_name"
              placeholder="e.g., John Doe"
              value={formData.contributor_name}
              onChange={(e) => setFormData({ ...formData, contributor_name: e.target.value })}
              required={!formData.is_anonymous}
              disabled={formData.is_anonymous}
              className={formData.is_anonymous ? "opacity-50" : ""}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_anonymous"
              checked={formData.is_anonymous}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, is_anonymous: checked as boolean })
              }
            />
            <Label 
              htmlFor="is_anonymous" 
              className="text-sm font-normal cursor-pointer"
            >
              Donate anonymously
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (KES) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="1"
              placeholder="e.g., 500"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method *</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value: "mpesa" | "bitcoin") =>
                setFormData({ ...formData, payment_method: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="bitcoin">Bitcoin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Adding..." : "Add Contribution"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};