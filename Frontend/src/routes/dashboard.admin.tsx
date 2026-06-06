import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Users, 
  LandPlot, 
  Clock, 
  Plus, 
  Search, 
  Mail, 
  Check, 
  X, 
  ExternalLink,
  MoreVertical,
  Filter,
  Phone,
  MapPin,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
  KeyRound,
  UserMinus,
  XCircle
} from "lucide-react";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/dashboard/admin")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => {
    return {
      tab: typeof search.tab === "string" ? search.tab : undefined,
    };
  },
  head: () => ({ meta: [{ title: "Admin Portal — SFMS" }] }),
  component: AdminDashboard,
});

type Tab = "requests" | "farms" | "owners";

function AdminDashboard() {
  const { tab } = useSearch({ from: "/dashboard/admin" });
  const [activeTab, setActiveTab] = useState<Tab>((tab as Tab) || "requests");
  const [isCreatingOwner, setIsCreatingOwner] = useState(false);

  useEffect(() => {
    if (tab && (tab === "requests" || tab === "farms" || tab === "owners")) {
      setActiveTab(tab as Tab);
    }
  }, [tab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            {activeTab === "requests" ? "Pending Form Requests" : activeTab === "farms" ? "Farm Management" : "Owner Management"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeTab === "requests" 
              ? "Review and manage incoming consultation requests." 
              : activeTab === "farms" 
                ? "Oversee all registered farms and their real-time status." 
                : "Manage farm owner accounts and platform access."}
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "owners" && (
            <button 
              onClick={() => setIsCreatingOwner(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" /> Create Farm Owner
            </button>
          )}
        </div>
      </div>

      {/* Hidden tabs for routing but kept for state if needed */}
      <div className="hidden flex gap-1 border-b border-border">
        {(["requests", "farms", "owners"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors relative",
              activeTab === t 
                ? "text-primary border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "requests" ? "Pending Form Requests" : t === "farms" ? "Farm Management" : "Owner Management"}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "requests" && <RequestsTab />}
        {activeTab === "farms" && <FarmsTab />}
        {activeTab === "owners" && <OwnersTab />}
      </div>

      {isCreatingOwner && (
        <CreateOwnerModal onClose={() => setIsCreatingOwner(false)} />
      )}
    </div>
  );
}

function RequestsTab() {
  const requests = [
    { 
      id: 1, 
      name: "Alice Green", 
      email: "alice@example.com", 
      phone: "+1 (555) 123-4567",
      location: "California, USA",
      type: "Crop", 
      message: "Interested in automating irrigation for my 50-acre vineyard.",
      date: "2024-05-23", 
      status: "pending" 
    },
    { 
      id: 2, 
      name: "Bob Miller", 
      email: "bob@millerfarms.com", 
      phone: "+1 (555) 987-6543",
      location: "Texas, USA",
      type: "Poultry", 
      message: "Looking for ammonia and temperature monitoring systems.",
      date: "2024-05-22", 
      status: "reviewed" 
    },
    { 
      id: 3, 
      name: "Charlie Fish", 
      email: "charlie@aqua.com", 
      phone: "+1 (555) 456-7890",
      location: "Florida, USA",
      type: "Aquaculture", 
      message: "Need real-time oxygen levels and pH monitoring for catfish ponds.",
      date: "2024-05-20", 
      status: "pending" 
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search requests..." 
            className="h-10 w-full rounded-lg border border-input bg-card pl-10 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted">
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Lead Information</th>
                <th className="px-6 py-4">Farm Details</th>
                <th className="px-6 py-4">Message Preview</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-foreground">{req.name}</div>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <Mail className="h-3 w-3" /> {req.email}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> {req.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-primary">{req.type}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" /> {req.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-[200px]">
                    <div className="text-xs text-muted-foreground line-clamp-2 italic">
                      "{req.message}"
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{req.date}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      req.status === "pending" ? "bg-warning/20 text-warning-foreground" : "bg-success/20 text-success"
                    )}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button title="Approve & Send Invitation" className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card text-success hover:bg-success hover:text-white transition-all shadow-sm">
                        <Check className="h-4 w-4" />
                      </button>
                      <button title="Reject Request" className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FarmsTab() {
  const farms = [
    { 
      id: 1, 
      name: "Green Valley Vineyard", 
      owner: "Alice Green", 
      location: "Napa Valley, CA",
      type: "Crop",
      zones: { active: 4, warning: 1, critical: 0 },
      lastUpdate: "2 mins ago",
      status: "active" 
    },
    { 
      id: 2, 
      name: "Sky High Poultry", 
      owner: "Bob Miller", 
      location: "Austin, TX",
      type: "Poultry",
      zones: { active: 2, warning: 0, critical: 1 },
      lastUpdate: "5 mins ago",
      status: "active" 
    },
    { 
      id: 3, 
      name: "Oceanic Ponds", 
      owner: "Charlie Fish", 
      location: "Miami, FL",
      type: "Aquaculture",
      zones: { active: 6, warning: 2, critical: 0 },
      lastUpdate: "10 mins ago",
      status: "maintenance" 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Network Status</h2>
        <div className="flex gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Active</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" /> Warning</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" /> Critical</span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {farms.map((farm) => (
          <div key={farm.id} className="group relative rounded-2xl border border-border bg-gradient-card p-6 hover:shadow-glow transition-all duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <LandPlot className="h-6 w-6" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm",
                  farm.status === "active" ? "bg-success/15 text-success border border-success/20" : "bg-warning/20 text-warning-foreground border border-warning/30"
                )}>
                  {farm.status}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {farm.lastUpdate}
                </span>
              </div>
            </div>

            <div className="space-y-1 mb-6">
              <h3 className="font-bold text-xl tracking-tight">{farm.name}</h3>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {farm.location}
              </div>
              <div className="text-xs font-medium text-primary mt-2">Owner: {farm.owner}</div>
            </div>

            <div className="grid grid-cols-3 gap-2 py-4 border-y border-border/60">
              <div className="text-center">
                <div className="text-lg font-bold text-success">{farm.zones.active}</div>
                <div className="text-[9px] uppercase font-bold text-muted-foreground">Healthy</div>
              </div>
              <div className="text-center border-x border-border/60">
                <div className="text-lg font-bold text-warning">{farm.zones.warning}</div>
                <div className="text-[9px] uppercase font-bold text-muted-foreground">Warning</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-destructive">{farm.zones.critical}</div>
                <div className="text-[9px] uppercase font-bold text-muted-foreground">Critical</div>
              </div>
            </div>

            <button className="w-full mt-6 flex items-center justify-center gap-2 rounded-xl bg-card border border-border py-2.5 text-xs font-bold hover:bg-muted transition-colors group-hover:border-primary/30">
              Open Full Diagnostics <ExternalLink className="h-3.5 w-3.5 text-primary" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function OwnersTab() {
  const owners = [
    { id: 1, name: "Alice Green", email: "alice@example.com", phone: "+1 (555) 123-4567", farms: 1, status: "active", joined: "May 12, 2024" },
    { id: 2, name: "Bob Miller", email: "bob@millerfarms.com", phone: "+1 (555) 987-6543", farms: 1, status: "active", joined: "May 15, 2024" },
    { id: 3, name: "Charlie Fish", email: "charlie@aqua.com", phone: "+1 (555) 456-7890", farms: 1, status: "suspended", joined: "May 18, 2024" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search farm owners..." 
            className="h-10 w-full rounded-lg border border-input bg-card pl-10 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Farm Owner</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4 text-center">Managed Farms</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4 text-right">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {owners.map((owner) => (
                <tr key={owner.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4 font-semibold text-foreground">{owner.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                        <Mail className="h-3.5 w-3.5" />
                        {owner.email}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {owner.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      {owner.farms}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{owner.joined}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      owner.status === "active" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                    )}>
                      {owner.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button title="Reset Password" className="p-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shadow-sm">
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button title="Suspend Account" className="p-2 rounded-lg border border-border bg-card hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive shadow-sm">
                        <ShieldAlert className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-muted-foreground shadow-sm">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CreateOwnerModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-glow overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Create Farm Owner</h2>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground">
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {step === 1 ? (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Owner Full Name</label>
                <input required type="text" placeholder="e.g. Jean Dupont" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Professional Email</label>
                <input required type="email" placeholder="owner@farm.com" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Farm Designation</label>
                <input required type="text" placeholder="e.g. Southern Valley Estate" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary transition-colors" />
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 mt-6">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-bold text-primary uppercase mr-1">Note:</span> 
                  Credentials will be automatically generated and sent to the owner's email address upon submission.
                </p>
              </div>
              <button type="submit" className="w-full h-12 mt-6 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5">
                Generate Account & Send Email
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
                <Check className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold">Success!</h3>
              <p className="mt-4 text-sm text-muted-foreground">
                The account has been created and the invitation email with temporary credentials has been sent.
              </p>
              <button 
                onClick={onClose}
                className="w-full h-11 mt-8 rounded-xl border border-border bg-card font-bold text-sm hover:bg-muted transition-colors"
              >
                Close Portal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
