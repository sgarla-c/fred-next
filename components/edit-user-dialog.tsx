"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUser, getDistricts, getSectionsByDistrict } from "@/app/actions/users";
import { Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface User {
  usrId: string;
  firstNm: string;
  lastNm: string;
  usrEmail?: string | null;
  usrRole: string;
  usrPhnNbr?: string | null;
  distNbr?: number | null;
  sectId?: number | null;
}

interface EditUserDialogProps {
  user: User;
}

const ROLES = ["ES", "RC", "FIN", "Manager", "ADMIN"];

export function EditUserDialog({ user }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [districts, setDistricts] = useState<Array<{ distNbr: number; distNm: string }>>([]);
  const [sections, setSections] = useState<Array<{ sectId: number; sectNm: string | null }>>([]);
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstNm: user.firstNm,
    lastNm: user.lastNm,
    usrEmail: user.usrEmail || "",
    usrRole: user.usrRole,
    usrPhnNbr: user.usrPhnNbr || "",
    distNbr: user.distNbr?.toString() || "",
    sectId: user.sectId?.toString() || "",
  });

  useEffect(() => {
    if (open) {
      loadDistricts();
      if (user.distNbr) {
        loadSections(user.distNbr);
      }
    }
  }, [open, user.distNbr]);

  const loadDistricts = async () => {
    const result = await getDistricts();
    if (result.success && result.data) {
      setDistricts(result.data);
    }
  };

  const loadSections = async (distNbr: number) => {
    const result = await getSectionsByDistrict(distNbr);
    if (result.success && result.data) {
      setSections(result.data);
    }
  };

  const handleDistrictChange = (distNbr: string) => {
    setFormData({ ...formData, distNbr, sectId: "" });
    if (distNbr) {
      loadSections(parseInt(distNbr));
    } else {
      setSections([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateUser({
        usrId: user.usrId,
        firstNm: formData.firstNm,
        lastNm: formData.lastNm,
        usrEmail: formData.usrEmail || undefined,
        usrRole: formData.usrRole,
        usrPhnNbr: formData.usrPhnNbr || undefined,
        distNbr: formData.distNbr ? parseInt(formData.distNbr) : undefined,
        sectId: formData.sectId ? parseInt(formData.sectId) : undefined,
      });

      if (result.success) {
        toast.success("User Updated", {
          description: `Successfully updated ${user.usrId}`,
        });
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Error", {
          description: result.error || "Failed to update user",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information for {user.usrId}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstNm">First Name *</Label>
                <Input
                  id="firstNm"
                  value={formData.firstNm}
                  onChange={(e) => setFormData({ ...formData, firstNm: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastNm">Last Name *</Label>
                <Input
                  id="lastNm"
                  value={formData.lastNm}
                  onChange={(e) => setFormData({ ...formData, lastNm: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usrEmail">Email</Label>
              <Input
                id="usrEmail"
                type="email"
                value={formData.usrEmail}
                onChange={(e) => setFormData({ ...formData, usrEmail: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usrPhnNbr">Phone Number</Label>
              <Input
                id="usrPhnNbr"
                type="tel"
                value={formData.usrPhnNbr}
                onChange={(e) => setFormData({ ...formData, usrPhnNbr: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usrRole">Role *</Label>
              <Select value={formData.usrRole} onValueChange={(value) => setFormData({ ...formData, usrRole: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="distNbr">District</Label>
                <Select value={formData.distNbr || undefined} onValueChange={handleDistrictChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select district (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district.distNbr} value={district.distNbr.toString()}>
                        {district.distNm}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sectId">Section</Label>
                <Select 
                  value={formData.sectId || undefined} 
                  onValueChange={(value) => setFormData({ ...formData, sectId: value })}
                  disabled={!formData.distNbr}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section.sectId} value={section.sectId.toString()}>
                        {section.sectNm || `Section ${section.sectId}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
