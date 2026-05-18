import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetAdminStats,
  useListAdminUsers,
  useCreateAdminUser,
  useUpdateAdminUser,
  useDeleteAdminUser,
  useListAdminTransactions,
  useCreateAdminTransaction,
  useUpdateAdminTransaction,
  useGetPaymentInfo,
  useUpdatePaymentInfo,
  useAdminLogin,
} from "@workspace/api-client-react";
import type {
  AdminUser,
  AdminTransaction,
  AdminUserInput,
  AdminTransactionInput,
  PaymentInfo,
} from "@workspace/api-client-react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useListPlans } from "@workspace/api-client-react";
import {
  Activity,
  AlertTriangle,
  Ban,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  CreditCard,
  DollarSign,
  Edit2,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Settings2,
  Shield,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, digits = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  suspended: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  rejected: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

const METHOD_LABEL: Record<string, string> = {
  paypal: "PayPal",
  mpesa: "M-Pesa",
  bank: "Bank",
};

// ── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const { mutate: login, isPending } = useAdminLogin({
    mutation: {
      onSuccess: (data) => onSuccess(data.token),
      onError: () => setError("Invalid password. Please try again."),
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    login({ data: { password } });
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Card className="bg-card/90 border-border/60 shadow-2xl">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-xl">Admin Access</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Enter your admin password to continue</p>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Password</Label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="bg-background/60 pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-rose-400 text-xs flex items-center gap-1.5"
                  >
                    <XCircle className="h-3.5 w-3.5 shrink-0" /> {error}
                  </motion.p>
                )}
              </AnimatePresence>
              <Button
                type="submit"
                className="w-full gap-2"
                disabled={isPending || !password}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                {isPending ? "Authenticating…" : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-primary",
  bg = "bg-primary/10",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  bg?: string;
}) {
  return (
    <Card className="bg-card/80 border-border/50">
      <CardContent className="p-4 flex items-start gap-3">
        <div className={cn("rounded-xl p-2.5 mt-0.5 shrink-0", bg)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────

function DashboardTab({ authHeader }: { authHeader: Record<string, string> }) {
  const { data: stats, isLoading, refetch } = useGetAdminStats({
    request: authHeader,
    query: { enabled: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Overview
        </h2>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Users} label="Total Users" value={stats?.totalUsers ?? 0} sub="Registered" />
            <StatCard icon={UserCheck} label="Active Users" value={stats?.activeUsers ?? 0}
              sub="Premium access" color="text-emerald-400" bg="bg-emerald-500/10" />
            <StatCard icon={Ban} label="Suspended" value={stats?.suspendedUsers ?? 0}
              sub="Access blocked" color="text-rose-400" bg="bg-rose-500/10" />
            <StatCard icon={Activity} label="Pending Payments" value={stats?.pendingTransactions ?? 0}
              sub="Awaiting confirm" color="text-amber-400" bg="bg-amber-500/10" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={DollarSign} label="Total Revenue" value={`$${fmt(stats?.totalRevenue ?? 0)}`}
              sub="Confirmed only" color="text-emerald-400" bg="bg-emerald-500/10" />
            <StatCard icon={TrendingUp} label="Pending Revenue" value={`$${fmt(stats?.pendingRevenue ?? 0)}`}
              sub="Not yet confirmed" color="text-amber-400" bg="bg-amber-500/10" />
            <StatCard icon={CreditCard} label="Transactions" value={stats?.totalTransactions ?? 0}
              sub="All time" />
            <StatCard icon={CheckCircle2} label="Confirmed" value={stats?.confirmedTransactions ?? 0}
              sub="Successful payments" color="text-primary" bg="bg-primary/10" />
          </div>

          {(stats?.usersByPlan?.length ?? 0) > 0 && (
            <Card className="bg-card/80 border-border/50">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Users by Plan</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex flex-wrap gap-3">
                  {stats?.usersByPlan.map((p) => (
                    <div key={p.planName} className="flex items-center gap-2 rounded-lg bg-muted/40 border border-border/30 px-3 py-2">
                      <span className="text-sm font-medium">{p.planName}</span>
                      <Badge variant="outline" className="text-xs">{p.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ── User Form Dialog ──────────────────────────────────────────────────────────

function UserFormDialog({
  open,
  onClose,
  initial,
  plans,
  onSave,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  initial?: AdminUser | null;
  plans: { id: number; name: string }[];
  onSave: (data: AdminUserInput & { planId?: number | null; premiumUntil?: string | null; notes?: string }) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    email: initial?.email ?? "",
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    status: initial?.status ?? "active",
    planId: initial?.planId ?? null as number | null,
    premiumUntil: initial?.premiumUntil
      ? new Date(initial.premiumUntil).toISOString().slice(0, 10)
      : "",
    notes: initial?.notes ?? "",
  });

  const set = (k: keyof typeof form, v: string | number | null) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    onSave({
      email: form.email,
      name: form.name,
      phone: form.phone,
      status: form.status as "active" | "suspended" | "pending",
      planId: form.planId,
      premiumUntil: form.premiumUntil ? new Date(form.premiumUntil).toISOString() : null,
      notes: form.notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border/60">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            {initial ? "Edit User" : "Add User"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <F label="Full Name">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="John Doe" className="bg-background/60" />
          </F>
          <F label="Email">
            <Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="user@example.com" className="bg-background/60" />
          </F>
          <F label="Phone">
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 555 000 0000" className="bg-background/60" />
          </F>
          <div className="grid grid-cols-2 gap-3">
            <F label="Status">
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger className="bg-background/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </F>
            <F label="Plan">
              <Select
                value={form.planId?.toString() ?? "none"}
                onValueChange={(v) => set("planId", v === "none" ? null : parseInt(v))}
              >
                <SelectTrigger className="bg-background/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Plan</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </F>
          </div>
          <F label="Premium Until">
            <Input type="date" value={form.premiumUntil} onChange={(e) => set("premiumUntil", e.target.value)} className="bg-background/60" />
          </F>
          <F label="Notes">
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Internal notes…" rows={2} className="bg-background/60 resize-none text-sm" />
          </F>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={isPending || !form.email}>
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {initial ? "Save Changes" : "Create User"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab({ authHeader }: { authHeader: Record<string, string> }) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userDialog, setUserDialog] = useState<AdminUser | null | "new">(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: plans } = useListPlans();
  const planList = plans ?? [];

  const qStatus = statusFilter === "all" ? undefined : statusFilter;
  const { data, isLoading, refetch } = useListAdminUsers(
    { page, limit: 15, status: qStatus },
    { request: authHeader, query: { enabled: true } }
  );

  const { mutate: createUser, isPending: isCreating } = useCreateAdminUser({
    mutation: { onSuccess: () => { refetch(); setUserDialog(null); } },
  });
  const { mutate: updateUser, isPending: isUpdating } = useUpdateAdminUser({
    mutation: { onSuccess: () => { refetch(); setUserDialog(null); } },
  });
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteAdminUser({
    mutation: { onSuccess: () => { refetch(); setDeleteId(null); } },
  });

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 15);

  const handleSave = (formData: AdminUserInput & { planId?: number | null; premiumUntil?: string | null; notes?: string }) => {
    if (userDialog === "new") {
      createUser({ data: formData, request: authHeader });
    } else if (userDialog) {
      updateUser({ id: userDialog.id, data: formData, request: authHeader });
    }
  };

  const handleToggleStatus = (user: AdminUser) => {
    const newStatus = user.status === "active" ? "suspended" : "active";
    updateUser({ id: user.id, data: { status: newStatus }, request: authHeader });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5">
          {["all", "active", "pending", "suspended"].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs capitalize"
              onClick={() => { setStatusFilter(s); setPage(1); }}
            >
              {s}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground h-7" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={() => setUserDialog("new")}>
            <Plus className="h-3.5 w-3.5" /> Add User
          </Button>
        </div>
      </div>

      <Card className="bg-card/80 border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading users…
          </div>
        ) : (data?.items.length ?? 0) === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Premium Until</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data?.items.map((user, i) => (
                  <tr key={user.id} className={cn("border-b border-border/30 hover:bg-muted/20 transition-colors", i % 2 === 0 ? "" : "bg-muted/5")}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium truncate max-w-[160px]">{user.name || "—"}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground">{user.planName ?? "Free"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn("text-xs border capitalize", STATUS_BADGE[user.status])}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                      {user.premiumUntil ? fmtDate(user.premiumUntil) : "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                      {fmtDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title={user.status === "active" ? "Suspend" : "Activate"}
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.status === "active"
                            ? <Ban className="h-3.5 w-3.5" />
                            : <UserCheck className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setUserDialog(user)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-rose-400"
                          onClick={() => setDeleteId(user.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{total} users total</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="flex items-center px-2">{page} / {totalPages}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* User Form Dialog */}
      {userDialog !== null && (
        <UserFormDialog
          open
          onClose={() => setUserDialog(null)}
          initial={userDialog === "new" ? null : userDialog}
          plans={planList.map((p) => ({ id: p.id, name: p.name }))}
          onSave={handleSave}
          isPending={isCreating || isUpdating}
        />
      )}

      {/* Delete Confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="h-4 w-4" /> Delete User
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            This will permanently remove the user and cannot be undone.
          </p>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              disabled={isDeleting}
              onClick={() => deleteId && deleteUser({ id: deleteId, request: authHeader })}
            >
              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Transaction Form Dialog ───────────────────────────────────────────────────

function TxFormDialog({
  open,
  onClose,
  plans,
  onSave,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  plans: { id: number; name: string; price: number }[];
  onSave: (data: AdminTransactionInput) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    userEmail: "",
    userName: "",
    amount: "",
    currency: "USD",
    method: "paypal" as "paypal" | "mpesa" | "bank",
    planId: null as number | null,
    planName: "",
    reference: "",
    notes: "",
  });

  const set = (k: keyof typeof form, v: string | number | null) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handlePlanChange = (v: string) => {
    const plan = plans.find((p) => p.id.toString() === v);
    set("planId", plan ? plan.id : null);
    set("planName", plan ? plan.name : "");
    if (plan) set("amount", plan.price.toString());
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border/60">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" /> Log Transaction
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <F label="Customer Name">
              <Input value={form.userName} onChange={(e) => set("userName", e.target.value)} placeholder="Jane Doe" className="bg-background/60" />
            </F>
            <F label="Customer Email">
              <Input value={form.userEmail} onChange={(e) => set("userEmail", e.target.value)} placeholder="jane@example.com" className="bg-background/60" />
            </F>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Plan">
              <Select value={form.planId?.toString() ?? "none"} onValueChange={handlePlanChange}>
                <SelectTrigger className="bg-background/60">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Custom</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name} — ${p.price}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </F>
            <F label="Amount">
              <Input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="49.00" className="bg-background/60" />
            </F>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Payment Method">
              <Select value={form.method} onValueChange={(v) => set("method", v)}>
                <SelectTrigger className="bg-background/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </F>
            <F label="Currency">
              <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                <SelectTrigger className="bg-background/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="KES">KES</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </F>
          </div>
          <F label="Reference / Transaction ID">
            <Input value={form.reference} onChange={(e) => set("reference", e.target.value)} placeholder="TXN123456" className="bg-background/60" />
          </F>
          <F label="Notes">
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Internal notes…" rows={2} className="bg-background/60 resize-none text-sm" />
          </F>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={isPending || !form.amount || !form.userEmail}
            onClick={() => onSave({ ...form, amount: parseFloat(form.amount) || 0 })}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Log Transaction
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Transactions Tab ──────────────────────────────────────────────────────────

function TransactionsTab({ authHeader }: { authHeader: Record<string, string> }) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [txDialog, setTxDialog] = useState(false);
  const { data: plans } = useListPlans();

  const qStatus = statusFilter === "all" ? undefined : statusFilter;
  const { data, isLoading, refetch } = useListAdminTransactions(
    { page, limit: 15, status: qStatus },
    { request: authHeader, query: { enabled: true } }
  );

  const { mutate: createTx, isPending: isCreating } = useCreateAdminTransaction({
    mutation: { onSuccess: () => { refetch(); setTxDialog(false); } },
  });
  const { mutate: updateTx } = useUpdateAdminTransaction({
    mutation: { onSuccess: () => refetch() },
  });

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 15);

  const handleStatusChange = (tx: AdminTransaction, status: "confirmed" | "rejected") => {
    updateTx({ id: tx.id, data: { status }, request: authHeader });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5">
          {["all", "pending", "confirmed", "rejected"].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs capitalize"
              onClick={() => { setStatusFilter(s); setPage(1); }}
            >
              {s}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground h-7" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={() => setTxDialog(true)}>
            <Plus className="h-3.5 w-3.5" /> Log Payment
          </Button>
        </div>
      </div>

      <Card className="bg-card/80 border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading transactions…
          </div>
        ) : (data?.items.length ?? 0) === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No transactions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Method</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data?.items.map((tx, i) => (
                  <tr key={tx.id} className={cn("border-b border-border/30 hover:bg-muted/20 transition-colors", i % 2 === 0 ? "" : "bg-muted/5")}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium truncate max-w-[140px]">{tx.userName || "—"}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[140px]">{tx.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{tx.planName || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-emerald-400">${fmt(tx.amount)}</span>
                      <span className="text-xs text-muted-foreground ml-1">{tx.currency}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground">{METHOD_LABEL[tx.method] ?? tx.method}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn("text-xs border capitalize", STATUS_BADGE[tx.status])}>
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                      {fmtDate(tx.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {tx.status === "pending" && (
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                            title="Confirm payment"
                            onClick={() => handleStatusChange(tx, "confirmed")}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                            title="Reject payment"
                            onClick={() => handleStatusChange(tx, "rejected")}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{total} transactions total</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="flex items-center px-2">{page} / {totalPages}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <TxFormDialog
        open={txDialog}
        onClose={() => setTxDialog(false)}
        plans={(plans ?? []).filter((p) => p.price > 0).map((p) => ({ id: p.id, name: p.name, price: p.price }))}
        onSave={(data) => createTx({ data, request: authHeader })}
        isPending={isCreating}
      />
    </div>
  );
}

// ── Payment Methods Tab ───────────────────────────────────────────────────────

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { if (value) { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } }}
      disabled={!value}
      className={cn("h-7 w-7 rounded flex items-center justify-center transition-colors shrink-0",
        copied ? "bg-emerald-500/20 text-emerald-400" : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30")}
    >
      {copied ? <Check className="h-3 w-3" /> : <ClipboardCopy className="h-3 w-3" />}
    </button>
  );
}

function PaymentMethodsTab({ authHeader }: { authHeader: Record<string, string> }) {
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<Partial<PaymentInfo>>({});

  const { data: info, isLoading, refetch } = useGetPaymentInfo({ request: authHeader, query: { enabled: true } });
  const { mutate: save, isPending } = useUpdatePaymentInfo({
    mutation: {
      onSuccess: () => { refetch(); setEditing(false); setSuccess(true); setTimeout(() => setSuccess(false), 3000); },
    },
  });

  const syncForm = () => { if (info) setForm(info); };
  const field = (k: keyof PaymentInfo) => (form[k] as string) ?? (info?.[k] as string) ?? "";
  const setField = (k: keyof PaymentInfo, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Wallet className="h-4 w-4" /> Accepted Payment Methods
        </h2>
        {!editing && (
          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => { syncForm(); setEditing(true); }}>
            <Edit2 className="h-3 w-3" /> Edit
          </Button>
        )}
      </div>

      <AnimatePresence>
        {success && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-emerald-400 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Payment information saved successfully!
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground text-sm"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {/* PayPal */}
          <Card className="bg-card/80 border-border/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#003087]/20 border border-[#003087]/30"><Wallet className="h-3.5 w-3.5 text-[#009cde]" /></div>
                PayPal
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <PayField label="Account Holder" value={info?.accountHolderName ?? ""} editing={editing}
                editValue={field("accountHolderName")} onEdit={(v) => setField("accountHolderName", v)} placeholder="Your Name" />
              <PayField label="PayPal Email" value={info?.paypalEmail ?? ""} editing={editing}
                editValue={field("paypalEmail")} onEdit={(v) => setField("paypalEmail", v)} placeholder="pay@example.com" />
            </CardContent>
          </Card>

          {/* M-Pesa */}
          <Card className="bg-card/80 border-border/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#4caf50]/10 border border-[#4caf50]/30"><Wallet className="h-3.5 w-3.5 text-[#4caf50]" /></div>
                M-Pesa
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <PayField label="Account Holder" value={info?.accountHolderName ?? ""} editing={editing}
                editValue={field("accountHolderName")} onEdit={(v) => setField("accountHolderName", v)} placeholder="Your Name" />
              <PayField label="M-Pesa Number" value={info?.mpesaNumber ?? ""} editing={editing}
                editValue={field("mpesaNumber")} onEdit={(v) => setField("mpesaNumber", v)} placeholder="+254 7XX XXX XXX" />
            </CardContent>
          </Card>

          {/* Bank */}
          <Card className="bg-card/80 border-border/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30"><CreditCard className="h-3.5 w-3.5 text-amber-400" /></div>
                Bank Transfer
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <PayField label="Bank Name" value={info?.bankName ?? ""} editing={editing}
                editValue={field("bankName")} onEdit={(v) => setField("bankName", v)} placeholder="First National Bank" />
              <PayField label="Account Number" value={info?.bankAccountNumber ?? ""} editing={editing}
                editValue={field("bankAccountNumber")} onEdit={(v) => setField("bankAccountNumber", v)} placeholder="0000000000" />
              <PayField label="Routing Number" value={info?.bankRoutingNumber ?? ""} editing={editing}
                editValue={field("bankRoutingNumber")} onEdit={(v) => setField("bankRoutingNumber", v)} placeholder="021000021" />
              <PayField label="SWIFT / BIC" value={info?.bankSwiftCode ?? ""} editing={editing}
                editValue={field("bankSwiftCode")} onEdit={(v) => setField("bankSwiftCode", v)} placeholder="BOFAUS3N" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instructions */}
      <Card className="bg-card/80 border-border/50">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm text-muted-foreground">Payment Instructions</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {editing ? (
            <Textarea value={field("paymentInstructions")} onChange={(e) => setField("paymentInstructions", e.target.value)}
              placeholder="e.g. After sending payment, email your transaction ID to support@example.com for account activation within 24 hours."
              rows={3} className="bg-background/60 resize-none text-sm" />
          ) : (
            <p className={cn("text-sm leading-relaxed",
              info?.paymentInstructions ? "text-foreground/90" : "text-muted-foreground/50 italic")}>
              {info?.paymentInstructions || "No instructions set."}
            </p>
          )}
        </CardContent>
      </Card>

      {editing && (
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            <X className="h-3.5 w-3.5 mr-1.5" /> Cancel
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => save({ data: form as PaymentInfo, request: authHeader })} disabled={isPending}>
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}

function PayField({ label, value, editing, editValue, onEdit, placeholder }: {
  label: string; value: string; editing: boolean;
  editValue: string; onEdit: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {editing ? (
        <Input value={editValue} onChange={(e) => onEdit(e.target.value)} placeholder={placeholder} className="bg-background/60 h-8 text-sm" />
      ) : (
        <div className="flex items-center gap-2">
          <p className={cn("text-sm flex-1 truncate", value ? "text-foreground" : "text-muted-foreground/40 italic")}>
            {value || "Not set"}
          </p>
          <CopyBtn value={value} />
        </div>
      )}
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const { isAuthenticated, saveToken, logout, authHeader } = useAdminAuth();

  if (!isAuthenticated) {
    return <LoginScreen onSuccess={saveToken} />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage users, payments, and platform settings
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-muted-foreground border-border/50"
          onClick={logout}
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dashboard">
        <TabsList className="bg-muted/60 border border-border/30 h-9">
          <TabsTrigger value="dashboard" className="text-xs gap-1.5">
            <Activity className="h-3.5 w-3.5" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs gap-1.5">
            <Users className="h-3.5 w-3.5" /> Users
          </TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs gap-1.5">
            <CreditCard className="h-3.5 w-3.5" /> Transactions
          </TabsTrigger>
          <TabsTrigger value="payment-methods" className="text-xs gap-1.5">
            <Wallet className="h-3.5 w-3.5" /> Payment Methods
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <DashboardTab authHeader={authHeader!} />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <UsersTab authHeader={authHeader!} />
        </TabsContent>
        <TabsContent value="transactions" className="mt-6">
          <TransactionsTab authHeader={authHeader!} />
        </TabsContent>
        <TabsContent value="payment-methods" className="mt-6">
          <PaymentMethodsTab authHeader={authHeader!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
