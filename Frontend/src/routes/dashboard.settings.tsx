import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  MapPin, 
  Mail, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Team Management — SFMS" }] }),
  component: TeamManagement,
});

type Section = "Crops" | "Poultry" | "Aquaculture";

interface SubUser {
  id: number;
  name: string;
  email: string;
  sections: Section[];
  status: "active" | "invited";
}

function TeamManagement() {
  const [users, setUsers] = useState<SubUser[]>([
    { id: 1, name: "Jean Dupont", email: "jean@farm.com", sections: ["Crops"], status: "active" },
    { id: 2, name: "Marie Curie", email: "marie@farm.com", sections: ["Poultry", "Aquaculture"], status: "active" },
    { id: 3, name: "Pierre Gasly", email: "pierre@farm.com", sections: [], status: "invited" },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SubUser | null>(null);

  const handleEdit = (user: SubUser) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const selectedSections = Array.from(formData.getAll("sections")) as Section[];

    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, name, email, sections: selectedSections } : u));
    } else {
      const newUser: SubUser = {
        id: Date.now(),
        name,
        email,
        sections: selectedSections,
        status: "invited"
      };
      setUsers([...users, newUser]);
    }
    setIsModalOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Team Management</h1>
          <p className="text-sm text-muted-foreground">Manage your farm staff and allocate their responsibilities.</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
        >
          <UserPlus className="h-4 w-4" /> Add Sub-user
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="font-bold">Staff Members</h2>
            </div>
            <div className="divide-y divide-border">
              {users.map((user) => (
                <div key={user.id} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {user.name}
                        {user.status === "invited" && (
                          <span className="text-[10px] bg-warning/20 text-warning-foreground px-1.5 py-0.5 rounded uppercase">Pending</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {user.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="hidden sm:flex flex-wrap gap-1 max-w-[200px] justify-end">
                      {user.sections.length > 0 ? (
                        user.sections.map(s => (
                          <span key={s} className="text-[10px] bg-secondary px-2 py-0.5 rounded-full font-medium">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">No sections assigned</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-soft">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Allocation Logic
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sub-users will only be able to view and manage the sections you allocate to them. 
              They cannot add new users or change farm-level settings.
            </p>
            <div className="mt-6 space-y-4">
              {[
                { label: "Crops", icon: MapPin, count: 4 },
                { label: "Poultry", icon: MapPin, count: 2 },
                { label: "Aquaculture", icon: MapPin, count: 1 },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card/50">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.count} Active Units</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-glow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingUser ? "Edit Sub-user" : "Add New Sub-user"}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingUser(null); }} className="p-1 hover:bg-muted rounded-full">
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleSave}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Full Name</label>
                <input 
                  required 
                  name="name"
                  type="text" 
                  defaultValue={editingUser?.name ?? ""}
                  placeholder="e.g. Jean Dupont" 
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email Address</label>
                <input 
                  required 
                  name="email"
                  type="email" 
                  defaultValue={editingUser?.email ?? ""}
                  placeholder="staff@farm.com" 
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Assign Sections</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["Crops", "Poultry", "Aquaculture"].map(s => (
                    <label key={s} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30 cursor-pointer hover:bg-muted transition-colors">
                      <input 
                        type="checkbox" 
                        name="sections"
                        value={s}
                        defaultChecked={editingUser?.sections.includes(s as Section)}
                        className="accent-primary" 
                      />
                      <span className="text-xs font-medium">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full h-11 mt-4 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5">
                {editingUser ? "Save Changes" : "Send Invitation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
