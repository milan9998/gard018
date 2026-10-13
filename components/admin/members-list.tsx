"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  CalendarDays,
  Mail,
  User,
  AlertCircle,
  CheckCircle,
  Trash2,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isProtectedAdmin } from "@/lib/admin-constants";
import { dateOnlyFromValue } from "@/lib/individual-training-access";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Member {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  start_date: string;
  expiry_date: string;
  pending_override_date?: string | null;
  status: string;
  membership_configured?: boolean;
  membership_type?: string;
  individual_training_paid?: boolean;
  individual_start_date?: string | null;
  individual_expiry_date?: string | null;
  is_admin?: boolean;
  created_at: string;
}

interface DatePickerFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  todayValue?: string;
}

const isoToDate = (value: string) => {
  const dateOnly = dateOnlyFromValue(value);
  return dateOnly ? new Date(`${dateOnly}T00:00:00`) : undefined;
};

function DatePickerField({
  id,
  label,
  value,
  onChange,
  min,
  todayValue,
}: DatePickerFieldProps) {
  const dateValue = dateOnlyFromValue(value);
  const minimumValue = dateOnlyFromValue(min);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <input
            id={id}
            type="date"
            value={dateValue}
            min={minimumValue || undefined}
            onChange={(event) => onChange(event.target.value)}
            className="h-11 w-full rounded-lg border border-primary/25 bg-background pl-10 pr-3 font-medium text-foreground outline-none transition [color-scheme:dark] hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
        {todayValue && (
          <button
            type="button"
            onClick={() => onChange(todayValue)}
            className="h-11 shrink-0 rounded-lg border border-primary/35 bg-primary/10 px-3 text-sm font-semibold text-primary transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Danas
          </button>
        )}
      </div>
    </div>
  );
}

export function MembersList({
  members,
  onMembersChanged,
  canDeleteAdminAccounts = false,
}: {
  members: Member[];
  onMembersChanged?: () => Promise<void>;
  canDeleteAdminAccounts?: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [newStartDate, setNewStartDate] = useState<string>("");
  const [newExpiryDate, setNewExpiryDate] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [settlingDebtId, setSettlingDebtId] = useState<number | null>(null);
  const [extendingId, setExtendingId] = useState<number | null>(null);
  const [updatingIndividualId, setUpdatingIndividualId] = useState<
    number | null
  >(null);
  const [renewingMember, setRenewingMember] = useState<Member | null>(null);
  const [renewalDate, setRenewalDate] = useState("");
  const [isRenewing, setIsRenewing] = useState(false);
  const [individualMember, setIndividualMember] = useState<Member | null>(null);
  const [individualPeriod, setIndividualPeriod] = useState({
    startDate: "",
    expiryDate: "",
  });
  const [isSavingIndividual, setIsSavingIndividual] = useState(false);
  const { toast } = useToast();

  const refreshMembers = async () => {
    if (onMembersChanged) {
      await onMembersChanged();
      return;
    }
    if ((window as any).refreshMembers) {
      await (window as any).refreshMembers();
    }
  };

  const normalizeSearch = (value: string) =>
    value
      .toLocaleLowerCase("sr-Latn")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const filteredMembers = useMemo(() => {
    const query = normalizeSearch(searchTerm.trim());
    if (!query) return members;

    return members.filter((member) => {
      const searchableText = normalizeSearch(
        `${member.first_name} ${member.last_name} ${member.email}`,
      );
      return searchableText.includes(query);
    });
  }, [members, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-500";
      case "expired":
        return "text-red-500";
      case "notified":
        return "text-yellow-500";
      case "not-configured":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-5 h-5" />;
      case "expired":
        return <AlertCircle className="w-5 h-5" />;
      case "not-configured":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === "active") return "active";
    if (status === "expired") return "expired";
    if (status === "not-configured") return "članarina nije podešena";
    return status;
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  };

  const formatDate = (dateString: string) => {
    const date = isoToDate(dateString);
    if (!date) return "—";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}.`;
  };

  const todayISO = () => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Belgrade",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const value = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );
    return `${value.year}-${value.month}-${value.day}`;
  };

  const addCalendarMonth = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return "";
    const targetYear = year + (month === 12 ? 1 : 0);
    const targetMonth = month === 12 ? 1 : month + 1;
    const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
    return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
  };

  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member);
    setNewStartDate(String(member.start_date).slice(0, 10));
    setNewExpiryDate(String(member.expiry_date).slice(0, 10));
  };

  const handleSettleDebt = async (member: Member) => {
    if (!confirm(`Potvrdi da je ${member.first_name} ${member.last_name} izmirio/la dugovanje?`)) return;
    setSettlingDebtId(member.id);
    try {
      const response = await fetch(`/api/members/${member.id}/settle-debt`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Greška pri izmirivanju dugovanja");
      toast({ title: "Dugovanje izmireno", description: data.message });
      await refreshMembers();
    } catch (error) {
      toast({ title: "Greška", description: error instanceof Error ? error.message : "Greška pri izmirivanju dugovanja", variant: "destructive" });
    } finally { setSettlingDebtId(null); }
  };

  const handleUpdateExpiryDate = async () => {
    if (!editingMember || !newStartDate || !newExpiryDate) {
      console.log("[v0] Cannot update - missing data:", {
        hasEditingMember: !!editingMember,
        hasNewExpiryDate: !!newExpiryDate,
      });
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(newStartDate) || !/^\d{4}-\d{2}-\d{2}$/.test(newExpiryDate) || newStartDate > newExpiryDate) {
      toast({
        title: "Greška",
        description: "Izaberite ispravan period članarine.",
        variant: "destructive",
      });
      return;
    }

    const expiryDateISO = newExpiryDate;

    setIsUpdating(true);

    const requestData = { start_date: newStartDate, expiry_date: expiryDateISO };
    const url = `/api/members/${editingMember.id}`;

    console.log("[v0] ===== STARTING UPDATE REQUEST =====");
    console.log("[v0] Request details:", {
      memberId: editingMember.id,
      memberName: `${editingMember.first_name} ${editingMember.last_name}`,
      currentExpiryDate: editingMember.expiry_date,
      newExpiryDateDisplay: formatDate(newExpiryDate),
      newExpiryDateISO: expiryDateISO,
      requestData,
      url,
      method: "PATCH",
    });

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log("[v0] Response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url,
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("[v0] Non-JSON response received:", {
          contentType,
          text: text.substring(0, 500),
        });
        throw new Error("Server nije vratio JSON odgovor");
      }

      const data = await response.json();
      console.log("[v0] Response data parsed:", data);

      if (response.ok) {
        console.log("[v0] ===== UPDATE SUCCESSFUL =====");
        toast({
          title: "Uspešno ažurirano",
          description: `Članarina za ${editingMember.first_name} ${editingMember.last_name} važi od ${formatDate(newStartDate)} do ${formatDate(expiryDateISO)}.`,
        });
        setEditingMember(null);

        await refreshMembers();
      } else {
        console.error("[v0] ===== UPDATE FAILED =====", data);
        toast({
          title: "Greška",
          description:
            data.error ||
            data.details ||
            "Došlo je do greške pri ažuriranju datuma.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[v0] ===== UPDATE ERROR =====", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      toast({
        title: "Greška",
        description:
          error instanceof Error
            ? error.message
            : "Došlo je do greške pri ažuriranju datuma.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      console.log("[v0] ===== UPDATE REQUEST COMPLETE =====");
    }
  };

  const handleDeleteMember = async (memberId: number, memberName: string) => {
    if (
      !confirm(`Da li ste sigurni da želite da obrišete člana ${memberName}?`)
    ) {
      return;
    }

    setDeletingId(memberId);
    try {
      const response = await fetch("/api/members/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });

      if (response.ok) {
        toast({
          title: "Uspešno obrisano",
          description: `Član ${memberName} je uspešno obrisan iz sistema.`,
        });
        await refreshMembers();
      } else {
        const data = await response.json();
        toast({
          title: "Greška",
          description: data.error || "Došlo je do greške pri brisanju člana.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[v0] Error deleting member:", error);
      toast({
        title: "Greška",
        description: "Došlo je do greške pri brisanju člana.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleIndividualPaymentToggle = async (
    member: Member,
    paid: boolean,
  ) => {
    setUpdatingIndividualId(member.id);
    try {
      const response = await fetch(
        `/api/members/${member.id}/individual-payment`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paid }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Greška pri ažuriranju uplate");
      }

      toast({
        title: paid
          ? "Individualni trening označen kao plaćen"
          : "Individualna uplata poništena",
        description: `${member.first_name} ${member.last_name}`,
      });

      await refreshMembers();
    } catch (error) {
      toast({
        title: "Greška",
        description:
          error instanceof Error
            ? error.message
            : "Greška pri ažuriranju uplate",
        variant: "destructive",
      });
    } finally {
      setUpdatingIndividualId(null);
    }
  };

  const handleOpenRenewal = (member: Member) => {
    setRenewingMember(member);
    setRenewalDate(todayISO());
  };

  const handleRenewMembership = async () => {
    if (!renewingMember || !renewalDate) return;
    setIsRenewing(true);
    try {
      const response = await fetch(
        `/api/members/${renewingMember.id}/renew-membership`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paid_date: renewalDate }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || "Greška pri obnovi članarine");
      toast({ title: "Članarina obnovljena", description: data.message });
      setRenewingMember(null);
      await refreshMembers();
    } catch (error) {
      toast({
        title: "Greška",
        description:
          error instanceof Error
            ? error.message
            : "Greška pri obnovi članarine",
        variant: "destructive",
      });
    } finally {
      setIsRenewing(false);
    }
  };

  const handleOpenIndividualPeriod = (member: Member) => {
    const start =
      dateOnlyFromValue(member.individual_start_date) || todayISO();
    const expiry = dateOnlyFromValue(member.individual_expiry_date);
    setIndividualMember(member);
    setIndividualPeriod({
      startDate: start,
      expiryDate: expiry || addCalendarMonth(start),
    });
  };

  const handleSaveIndividualPeriod = async () => {
    if (
      !individualMember ||
      !individualPeriod.startDate ||
      !individualPeriod.expiryDate
    )
      return;
    setIsSavingIndividual(true);
    try {
      const response = await fetch(
        `/api/members/${individualMember.id}/individual-payment`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paid: true,
            start_date: individualPeriod.startDate,
            expiry_date: individualPeriod.expiryDate,
          }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          data.error || "Greška pri čuvanju individualnog perioda",
        );
      toast({
        title: "Individualni period sačuvan",
        description: `${individualMember.first_name} ${individualMember.last_name}`,
      });
      setIndividualMember(null);
      await refreshMembers();
    } catch (error) {
      toast({
        title: "Greška",
        description:
          error instanceof Error
            ? error.message
            : "Greška pri čuvanju individualnog perioda",
        variant: "destructive",
      });
    } finally {
      setIsSavingIndividual(false);
    }
  };

  const handleExtendMembership = async (member: Member) => {
    if (
      !confirm(
        member.pending_override_date
          ? `Prvi dozvoljeni trening posle isteka je ${formatDate(member.pending_override_date)}. Produženje će važiti od tog datuma jedan mesec. Nastaviti?`
          : `Produžiti članarinu za ${member.first_name} ${member.last_name} za još jedan mesec?`,
      )
    )
      return;

    setExtendingId(member.id);
    try {
      const response = await fetch(
        `/api/members/${member.id}/extend-membership`,
        { method: "POST" },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || "Greška pri produženju članarine");

      toast({
        title: "Članarina produžena",
        description: `${member.first_name} ${member.last_name}: ${data.message || "produženje je sačuvano."}`,
      });
      await refreshMembers();
    } catch (error) {
      toast({
        title: "Greška",
        description:
          error instanceof Error
            ? error.message
            : "Greška pri produženju članarine",
        variant: "destructive",
      });
    } finally {
      setExtendingId(null);
    }
  };

  const getDisplayStatus = (expiryDate: string, configured = true): string => {
    if (!configured) return "not-configured";
    const expiry = new Date(expiryDate);
    const today = new Date();
    expiry.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // The expiry date is the last valid day; it becomes expired the next day.
    if (expiry.getTime() < today.getTime()) {
      return "expired";
    }

    return "active";
  };

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Članovi</h2>
        <span className="text-muted-foreground">
          {filteredMembers.length} od {members.length}
        </span>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Pretraži po imenu, prezimenu ili emailu..."
          aria-label="Pretraži članove po imenu ili emailu"
          className="h-11 w-full rounded-lg border border-primary/20 bg-background/50 pl-10 pr-4 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="min-w-0 space-y-3">
        {filteredMembers.map((member) => {
          return (
            <div
              key={member.id}
              className="min-w-0 overflow-hidden rounded-lg border border-primary/20 bg-card/20 p-4 backdrop-blur-md transition-colors hover:border-primary/40 sm:p-6"
            >
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="min-w-0 break-words text-xl font-semibold text-foreground">
                      {member.first_name} {member.last_name}
                    </h3>
                    <span
                      className={`flex items-center gap-1 text-sm ${member.pending_override_date ? "text-yellow-400" : getStatusColor(getDisplayStatus(member.expiry_date, member.membership_configured !== false))}`}
                    >
                      {member.pending_override_date ? <AlertCircle className="h-5 w-5" /> : getStatusIcon(getDisplayStatus(member.expiry_date, member.membership_configured !== false))}
                      {member.pending_override_date ? "Dugovanje" : getStatusLabel(getDisplayStatus(member.expiry_date, member.membership_configured !== false))}
                    </span>
                  </div>

                  <div className="flex min-w-0 items-start gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="min-w-0 break-all">{member.email}</span>
                  </div>

                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <label className="inline-flex max-w-full items-center gap-3 rounded-md border border-primary/20 bg-background/30 px-3 py-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={Boolean(member.individual_training_paid)}
                        disabled={updatingIndividualId === member.id}
                        onChange={(event) =>
                          event.target.checked
                            ? handleOpenIndividualPeriod(member)
                            : handleIndividualPaymentToggle(member, false)
                        }
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="break-words">Individualni trening plaćen</span>
                      {updatingIndividualId === member.id && (
                        <span className="text-xs text-muted-foreground">
                          Čuvanje...
                        </span>
                      )}
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => handleOpenIndividualPeriod(member)}
                    >
                      {member.individual_training_paid
                        ? "Period individualnog"
                        : "Podesi individualni"}
                    </Button>
                  </div>
                  {member.individual_training_paid && (
                    <p className="text-sm text-muted-foreground">
                      Individualno važi:{" "}
                      {member.individual_start_date
                        ? formatDate(member.individual_start_date)
                        : "datum nije podešen"}{" "}
                      –{" "}
                      {member.individual_expiry_date
                        ? formatDate(member.individual_expiry_date)
                        : "datum nije podešen"}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {member.membership_configured === false ? (
                          <span className="text-muted-foreground">Članarina nije podešena</span>
                        ) : (
                          <>
                            Ističe:{" "}
                            <span
                              className={
                                isExpiringSoon(member.expiry_date)
                                  ? "text-yellow-500 font-semibold"
                                  : "text-foreground"
                              }
                            >
                              {formatDate(member.expiry_date)}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleOpenEditModal(member)}
                      title={member.membership_configured === false ? "Podesi članarinu" : "Izmeni period članarine"}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {member.pending_override_date && (
                      <Button variant="outline" size="sm" className="h-8 border-yellow-500/40 text-yellow-300"
                        disabled={settlingDebtId === member.id} onClick={() => void handleSettleDebt(member)}>
                        {settlingDebtId === member.id ? "Čuvanje..." : "Izmiri dugovanje klijenta"}
                      </Button>
                    )}
                    {member.membership_configured !== false && <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => handleExtendMembership(member)}
                      disabled={extendingId === member.id}
                      title="Produži članarinu za jedan mesec"
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      {extendingId === member.id ? "Produžujem..." : "Produži"}
                    </Button>}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-green-500/30 text-green-400 hover:bg-green-500/10"
                      onClick={() => handleOpenRenewal(member)}
                    >
                      Obnova
                    </Button>
                  </div>

                  {member.pending_override_date && (
                    <p className="text-sm font-medium text-red-300">
                      Prvi dozvoljeni trening po isteku: {formatDate(member.pending_override_date)}
                    </p>
                  )}

                  {isExpiringSoon(member.expiry_date) &&
                    getDisplayStatus(member.expiry_date) === "active" && (
                      <div className="flex items-center gap-2 text-yellow-500 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Članarina uskoro ističe!</span>
                      </div>
                    )}
                </div>

                {isProtectedAdmin(member.email) ? (
                  <span className="shrink-0 self-end rounded-md border border-primary/20 px-2 py-1 text-xs text-muted-foreground sm:self-start">
                    Zaštićen trener
                  </span>
                ) : member.is_admin && !canDeleteAdminAccounts ? (
                  <span className="shrink-0 self-end rounded-md border border-primary/20 px-2 py-1 text-xs text-muted-foreground sm:self-start">
                    Admin nalog
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      handleDeleteMember(
                        member.id,
                        `${member.first_name} ${member.last_name}`,
                      )
                    }
                    disabled={deletingId === member.id}
                    className="shrink-0 self-end text-destructive hover:bg-destructive/10 hover:text-destructive sm:self-start"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {members.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nema registrovanih članova</p>
          </div>
        )}

        {members.length > 0 && filteredMembers.length === 0 && (
          <div className="rounded-lg border border-primary/20 py-12 text-center text-muted-foreground">
            <Search className="mx-auto mb-4 h-10 w-10 opacity-50" />
            <p>Nema članova koji odgovaraju pretrazi.</p>
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="mt-3 text-sm text-primary underline-offset-4 hover:underline"
            >
              Obriši pretragu
            </button>
          </div>
        )}
      </div>

      <Dialog
        open={!!editingMember}
        onOpenChange={(open) => !open && setEditingMember(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Izmeni period članarine</DialogTitle>
            <DialogDescription>
              Izaberite od kada do kada važi članarina za{" "}
              {editingMember?.first_name} {editingMember?.last_name}
              {editingMember?.pending_override_date && " Ručna izmena datuma ne uklanja dugovanje. Uplatu potvrdite opcijom Izmiri dugovanje klijenta."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <DatePickerField
              id="start-date"
              label="Važi od"
              value={newStartDate}
              onChange={setNewStartDate}
            />
            <DatePickerField
              id="expiry-date"
              label="Važi do"
              value={newExpiryDate}
              min={newStartDate}
              onChange={setNewExpiryDate}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingMember(null)}
              disabled={isUpdating}
            >
              Otkaži
            </Button>
            <Button
              onClick={handleUpdateExpiryDate}
              disabled={isUpdating || !newStartDate || !newExpiryDate || newStartDate > newExpiryDate}
            >
              {isUpdating ? "Čuvanje..." : "Sačuvaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!renewingMember}
        onOpenChange={(open) => !open && setRenewingMember(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Obnova članarine</DialogTitle>
            <DialogDescription>
              Izaberite datum kada je {renewingMember?.first_name}{" "}
              {renewingMember?.last_name} platio/la članarinu. Ako postoje dozvoljeni treninzi po isteku,
              novi period počinje od prvog takvog treninga.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <DatePickerField
              id="membership-renewal-date"
              label="Datum uplate"
              value={renewalDate}
              onChange={setRenewalDate}
            />
            {renewalDate && (
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                {renewingMember?.pending_override_date && (
                  <p>Prvi dozvoljeni trening po isteku: {formatDate(renewingMember.pending_override_date)}</p>
                )}
                <p>Važi od: {formatDate(renewingMember?.pending_override_date || renewalDate)}</p>
                <p>Važi do: {formatDate(addCalendarMonth(renewingMember?.pending_override_date || renewalDate))}</p>
                {renewingMember?.pending_override_date && addCalendarMonth(renewingMember.pending_override_date) < todayISO() && (
                  <p className="font-semibold text-red-300">Ovaj period je već istekao. Po potrebi ručno podesite datume članarine.</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenewingMember(null)}
              disabled={isRenewing}
            >
              Otkaži
            </Button>
            <Button
              onClick={handleRenewMembership}
              disabled={isRenewing || !renewalDate}
            >
              {isRenewing ? "Čuvanje..." : "Obnovi članarinu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!individualMember}
        onOpenChange={(open) => !open && setIndividualMember(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Individualni trening — period uplate</DialogTitle>
            <DialogDescription>
              Podesite od kada do kada član može da rezerviše individualne
              treninge. Ovaj period je odvojen od obične članarine.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <DatePickerField
              id="individual-start-date"
              label="Važi od"
              value={individualPeriod.startDate}
              todayValue={todayISO()}
              onChange={(value) => {
                setIndividualPeriod({
                  startDate: value,
                  expiryDate: value ? addCalendarMonth(value) : "",
                });
              }}
            />
            <DatePickerField
              id="individual-expiry-date"
              label="Važi do"
              value={individualPeriod.expiryDate}
              min={individualPeriod.startDate}
              onChange={(value) =>
                setIndividualPeriod((period) => ({
                  ...period,
                  expiryDate: value,
                }))
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Podrazumevano se bira period od jednog kalendarskog meseca.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIndividualMember(null)}
              disabled={isSavingIndividual}
            >
              Otkaži
            </Button>
            <Button
              onClick={handleSaveIndividualPeriod}
              disabled={
                isSavingIndividual ||
                !individualPeriod.startDate ||
                !individualPeriod.expiryDate
              }
            >
              {isSavingIndividual
                ? "Čuvanje..."
                : "Sačuvaj individualni period"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
