"use client";

import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { srLatn } from "date-fns/locale";
import {
  Calendar,
  CalendarDays,
  ChevronDown,
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
}

const dateToISO = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const isoToDate = (value: string) =>
  value ? new Date(`${value}T00:00:00`) : undefined;

function DatePickerField({
  id,
  label,
  value,
  onChange,
  min,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = isoToDate(value);
  const minimumDate = isoToDate(min || "");

  return (
    <div className="relative space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="flex h-11 w-full items-center justify-between rounded-lg border border-primary/25 bg-background px-3 text-left text-foreground outline-none transition hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
          <span className={value ? "font-medium" : "text-muted-foreground"}>
            {selectedDate
              ? selectedDate.toLocaleDateString("sr-RS", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "Izaberi datum"}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-2 w-full rounded-xl border border-primary/25 bg-background p-2 shadow-2xl sm:min-w-[19rem]">
          <DayPicker
            mode="single"
            captionLayout="dropdown"
            startMonth={new Date(2000, 0, 1)}
            endMonth={new Date(2100, 11, 1)}
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) return;
              onChange(dateToISO(date));
              setOpen(false);
            }}
            disabled={minimumDate ? { before: minimumDate } : undefined}
            defaultMonth={selectedDate || minimumDate || new Date()}
            weekStartsOn={1}
            locale={srLatn}
            showOutsideDays
            fixedWeeks
            className="mx-auto w-full"
            classNames={{
              months: "flex w-full flex-col",
              month: "w-full space-y-3",
              month_caption: "relative flex h-9 items-center justify-center",
              dropdowns: "flex items-center justify-center gap-2",
              dropdown:
                "rounded-md border border-primary/25 bg-background px-2 py-1 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary",
              caption_label: "text-sm font-semibold capitalize text-foreground",
              nav: "flex items-center gap-1",
              button_previous:
                "absolute left-0 inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              button_next:
                "absolute right-0 inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              month_grid: "w-full border-collapse",
              weekdays: "flex w-full",
              weekday:
                "w-full text-center text-[0.68rem] font-semibold uppercase text-muted-foreground",
              week: "mt-1 flex w-full",
              day: "relative w-full p-0 text-center",
              day_button:
                "mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-sm text-foreground transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              selected: "bg-primary text-primary-foreground hover:bg-primary",
              today: "font-bold ring-1 ring-primary/60 ring-inset",
              outside: "text-muted-foreground/40",
              disabled:
                "cursor-not-allowed text-muted-foreground/25 hover:bg-transparent",
              hidden: "invisible",
            }}
          />
        </div>
      )}
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
  const [newExpiryDate, setNewExpiryDate] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [extendingId, setExtendingId] = useState<number | null>(null);
  const [updatingIndividualId, setUpdatingIndividualId] = useState<
    number | null
  >(null);
  const [renewingMember, setRenewingMember] = useState<Member | null>(null);
  const [renewalDate, setRenewalDate] = useState("");
  const [isRenewing, setIsRenewing] = useState(false);
  const [individualMember, setIndividualMember] = useState<Member | null>(null);
  const [individualStartDate, setIndividualStartDate] = useState("");
  const [individualExpiryDate, setIndividualExpiryDate] = useState("");
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
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}.`;
  };

  const todayISO = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
    setNewExpiryDate(String(member.expiry_date).slice(0, 10));
  };

  const handleUpdateExpiryDate = async () => {
    if (!editingMember || !newExpiryDate) {
      console.log("[v0] Cannot update - missing data:", {
        hasEditingMember: !!editingMember,
        hasNewExpiryDate: !!newExpiryDate,
      });
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(newExpiryDate)) {
      toast({
        title: "Greška",
        description: "Izaberite važeći datum u kalendaru.",
        variant: "destructive",
      });
      return;
    }

    const expiryDateISO = newExpiryDate;

    setIsUpdating(true);

    const requestData = { expiry_date: expiryDateISO };
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
          description: `Datum isteka za ${editingMember.first_name} ${editingMember.last_name} je uspešno ažuriran na ${formatDate(expiryDateISO)}.`,
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
    const start = member.individual_start_date || todayISO();
    setIndividualMember(member);
    setIndividualStartDate(start);
    setIndividualExpiryDate(
      member.individual_expiry_date || addCalendarMonth(start),
    );
  };

  const handleSaveIndividualPeriod = async () => {
    if (!individualMember || !individualStartDate || !individualExpiryDate)
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
            start_date: individualStartDate,
            expiry_date: individualExpiryDate,
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
        `Produžiti članarinu za ${member.first_name} ${member.last_name} za još jedan mesec?`,
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
                      className={`flex items-center gap-1 text-sm ${getStatusColor(getDisplayStatus(member.expiry_date, member.membership_configured !== false))}`}
                    >
                      {getStatusIcon(getDisplayStatus(member.expiry_date, member.membership_configured !== false))}
                      {getStatusLabel(getDisplayStatus(member.expiry_date, member.membership_configured !== false))}
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
                      title={member.membership_configured === false ? "Podesi članarinu" : "Izmeni datum isteka"}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
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
                    {member.membership_configured !== false && <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-green-500/30 text-green-400 hover:bg-green-500/10"
                      onClick={() => handleOpenRenewal(member)}
                    >
                      Obnova
                    </Button>}
                  </div>

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
            <DialogTitle>Izmeni datum isteka</DialogTitle>
            <DialogDescription>
              Izaberite novi datum isteka članarine za{" "}
              {editingMember?.first_name} {editingMember?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <DatePickerField
              id="expiry-date"
              label="Novi datum isteka"
              value={newExpiryDate}
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
              disabled={isUpdating || !newExpiryDate}
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
              {renewingMember?.last_name} platio/la članarinu. Sistem automatski
              računa važenje do istog datuma sledećeg meseca.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <DatePickerField
              id="membership-renewal-date"
              label="Datum uplate / početka"
              value={renewalDate}
              onChange={setRenewalDate}
            />
            {renewalDate && (
              <p className="text-sm text-muted-foreground">
                Važi do: {formatDate(addCalendarMonth(renewalDate))}
              </p>
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
              value={individualStartDate}
              onChange={(value) => {
                setIndividualStartDate(value);
                if (value) setIndividualExpiryDate(addCalendarMonth(value));
              }}
            />
            <DatePickerField
              id="individual-expiry-date"
              label="Važi do"
              value={individualExpiryDate}
              min={individualStartDate}
              onChange={setIndividualExpiryDate}
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
                !individualStartDate ||
                !individualExpiryDate
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
