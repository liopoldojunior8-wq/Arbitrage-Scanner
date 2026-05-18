import { useState, useEffect } from "react";
import { useGetPaymentInfo, useUpdatePaymentInfo } from "@workspace/api-client-react";
import type { PaymentInfo } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Check,
  CheckCircle2,
  ClipboardCopy,
  CreditCard,
  Edit3,
  Loader2,
  Smartphone,
  User,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      disabled={!value}
      title="Copy to clipboard"
      className={cn(
        "h-8 w-8 rounded-md flex items-center justify-center transition-colors shrink-0",
        copied
          ? "bg-emerald-500/20 text-emerald-400"
          : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const isEmpty = !value;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p
          className={cn(
            "text-sm font-medium truncate",
            isEmpty ? "text-muted-foreground/50 italic" : "text-foreground"
          )}
        >
          {isEmpty ? "Not set" : value}
        </p>
      </div>
      <CopyButton value={value} />
    </div>
  );
}

type Mode = "view" | "edit";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName?: string;
  planPrice?: number;
}

export function PaymentModal({ open, onOpenChange, planName, planPrice }: PaymentModalProps) {
  const [mode, setMode] = useState<Mode>("view");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<Partial<PaymentInfo>>({});

  const { data: info, isLoading, refetch } = useGetPaymentInfo({ query: { enabled: open } });

  const { mutate: save, isPending: isSaving } = useUpdatePaymentInfo({
    mutation: {
      onSuccess: () => {
        refetch();
        setMode("view");
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3500);
      },
    },
  });

  // Sync form when data loads
  useEffect(() => {
    if (info) setForm(info);
  }, [info]);

  const handleSave = () => {
    save({ data: form as PaymentInfo });
  };

  const field = (key: keyof PaymentInfo) => (
    (form[key] as string) ?? ""
  );

  const setField = (key: keyof PaymentInfo, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setMode("view");
      setSuccess(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border/60 p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 via-card to-card px-6 pt-6 pb-4 border-b border-border/40">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Information
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm mt-1">
              {planName
                ? `Complete your upgrade to ${planName}${planPrice ? ` — $${planPrice}/mo` : ""}. Send payment via any method below.`
                : "Our accepted payment methods. Use any of the details below to send your payment."}
            </DialogDescription>
          </DialogHeader>

          {planName && (
            <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Upgrading to</p>
                <p className="font-bold text-primary">{planName}</p>
              </div>
              {planPrice !== undefined && (
                <div className="text-right">
                  <p className="text-xl font-black text-foreground">${planPrice}</p>
                  <p className="text-xs text-muted-foreground">/month</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Success banner */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2.5 bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-3 text-emerald-400 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Payment information saved successfully!
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Body */}
        <div className="px-6 py-4 max-h-[65vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading payment info…
            </div>
          ) : (
            <Tabs defaultValue="paypal" className="w-full">
              <TabsList className="w-full bg-muted/60 border border-border/30 h-9 mb-4">
                <TabsTrigger value="paypal" className="flex-1 text-xs gap-1.5">
                  <Wallet className="h-3 w-3" /> PayPal
                </TabsTrigger>
                <TabsTrigger value="mpesa" className="flex-1 text-xs gap-1.5">
                  <Smartphone className="h-3 w-3" /> M-Pesa
                </TabsTrigger>
                <TabsTrigger value="bank" className="flex-1 text-xs gap-1.5">
                  <Building2 className="h-3 w-3" /> Bank
                </TabsTrigger>
              </TabsList>

              {/* ── PayPal ── */}
              <TabsContent value="paypal" className="mt-0 space-y-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-[#003087]/20 border border-[#003087]/30">
                    <Wallet className="h-4 w-4 text-[#009cde]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">PayPal</p>
                    <p className="text-xs text-muted-foreground">Send to the email address below</p>
                  </div>
                </div>

                {mode === "view" ? (
                  <>
                    <InfoRow label="Account Holder" value={field("accountHolderName")} />
                    <InfoRow label="PayPal Email" value={field("paypalEmail")} />
                  </>
                ) : (
                  <div className="space-y-3">
                    <Field label="Account Holder Name">
                      <Input
                        value={field("accountHolderName")}
                        onChange={(e) => setField("accountHolderName", e.target.value)}
                        placeholder="John Doe"
                        className="bg-background/60"
                      />
                    </Field>
                    <Field label="PayPal Email">
                      <Input
                        value={field("paypalEmail")}
                        onChange={(e) => setField("paypalEmail", e.target.value)}
                        placeholder="payments@example.com"
                        className="bg-background/60"
                      />
                    </Field>
                  </div>
                )}
              </TabsContent>

              {/* ── M-Pesa ── */}
              <TabsContent value="mpesa" className="mt-0 space-y-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-[#4caf50]/10 border border-[#4caf50]/30">
                    <Smartphone className="h-4 w-4 text-[#4caf50]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">M-Pesa</p>
                    <p className="text-xs text-muted-foreground">Send via M-Pesa paybill or till number</p>
                  </div>
                </div>

                {mode === "view" ? (
                  <>
                    <InfoRow label="Account Holder" value={field("accountHolderName")} />
                    <InfoRow label="M-Pesa Number" value={field("mpesaNumber")} />
                  </>
                ) : (
                  <div className="space-y-3">
                    <Field label="Account Holder Name">
                      <Input
                        value={field("accountHolderName")}
                        onChange={(e) => setField("accountHolderName", e.target.value)}
                        placeholder="John Doe"
                        className="bg-background/60"
                      />
                    </Field>
                    <Field label="M-Pesa Number / Paybill">
                      <Input
                        value={field("mpesaNumber")}
                        onChange={(e) => setField("mpesaNumber", e.target.value)}
                        placeholder="+254 7XX XXX XXX"
                        className="bg-background/60"
                      />
                    </Field>
                  </div>
                )}
              </TabsContent>

              {/* ── Bank ── */}
              <TabsContent value="bank" className="mt-0 space-y-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <Building2 className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Bank Transfer</p>
                    <p className="text-xs text-muted-foreground">Wire or ACH transfer to the account below</p>
                  </div>
                </div>

                {mode === "view" ? (
                  <>
                    <InfoRow label="Account Holder" value={field("accountHolderName")} />
                    <InfoRow label="Bank Name" value={field("bankName")} />
                    <InfoRow label="Account Number" value={field("bankAccountNumber")} />
                    <InfoRow label="Routing Number" value={field("bankRoutingNumber")} />
                    <InfoRow label="SWIFT / BIC" value={field("bankSwiftCode")} />
                  </>
                ) : (
                  <div className="space-y-3">
                    <Field label="Account Holder Name">
                      <Input
                        value={field("accountHolderName")}
                        onChange={(e) => setField("accountHolderName", e.target.value)}
                        placeholder="John Doe"
                        className="bg-background/60"
                      />
                    </Field>
                    <Field label="Bank Name">
                      <Input
                        value={field("bankName")}
                        onChange={(e) => setField("bankName", e.target.value)}
                        placeholder="First National Bank"
                        className="bg-background/60"
                      />
                    </Field>
                    <Field label="Account Number">
                      <Input
                        value={field("bankAccountNumber")}
                        onChange={(e) => setField("bankAccountNumber", e.target.value)}
                        placeholder="0000 0000 0000"
                        className="bg-background/60"
                      />
                    </Field>
                    <Field label="Routing Number">
                      <Input
                        value={field("bankRoutingNumber")}
                        onChange={(e) => setField("bankRoutingNumber", e.target.value)}
                        placeholder="021000021"
                        className="bg-background/60"
                      />
                    </Field>
                    <Field label="SWIFT / BIC Code">
                      <Input
                        value={field("bankSwiftCode")}
                        onChange={(e) => setField("bankSwiftCode", e.target.value)}
                        placeholder="BOFAUS3N"
                        className="bg-background/60"
                      />
                    </Field>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Payment instructions */}
          {!isLoading && (
            <>
              <Separator className="my-4 border-border/40" />
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Payment Instructions
                  </p>
                </div>
                {mode === "view" ? (
                  <p className={cn(
                    "text-sm leading-relaxed",
                    field("paymentInstructions") ? "text-foreground/90" : "text-muted-foreground/50 italic"
                  )}>
                    {field("paymentInstructions") || "No instructions provided."}
                  </p>
                ) : (
                  <Textarea
                    value={field("paymentInstructions")}
                    onChange={(e) => setField("paymentInstructions", e.target.value)}
                    placeholder="e.g. After sending payment, email us your transaction ID at support@example.com for account activation within 24 hours."
                    className="bg-background/60 min-h-[80px] text-sm resize-none"
                    rows={3}
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/40 bg-muted/20 flex items-center gap-2">
          {mode === "view" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-muted-foreground border-border/50"
                onClick={() => setMode("edit")}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit Details
              </Button>
              <div className="flex-1" />
              <Button size="sm" variant="ghost" onClick={handleClose}>
                Close
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => { setMode("view"); setForm(info ?? {}); }}
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <div className="flex-1" />
              <Button
                size="sm"
                className="gap-1.5 bg-primary hover:bg-primary/90"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                ) : (
                  <><Check className="h-3.5 w-3.5" /> Save Changes</>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
