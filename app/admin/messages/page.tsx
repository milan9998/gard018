"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AdminGuard } from "@/components/admin/admin-guard"
import { AdminNavigation } from "@/components/admin/admin-navigation"
import { MessageSquare, Mail, Phone, Clock, Check, Trash2 } from "lucide-react"

type Message = {
  id: number
  name: string
  email: string
  phone: string | null
  message: string
  status: string
  created_at: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await fetch("/api/messages")
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "read" }),
      })
      fetchMessages()
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  const deleteMessage = async (id: number) => {
    if (!window.confirm("Da li sigurno želiš da obrišeš ovu poruku?")) return
    setDeletingId(id)
    try {
      const response = await fetch("/api/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Brisanje poruke nije uspelo")
      await fetchMessages()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Brisanje poruke nije uspelo")
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-background pb-12 pt-20 sm:py-12">
          <div className="container mx-auto px-4">
            <AdminNavigation />
            <p className="text-center text-muted-foreground">Učitavanje poruka...</p>
          </div>
        </div>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background pb-12 pt-20 sm:py-12">
        <div className="container mx-auto px-4">
          <AdminNavigation />
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 sm:text-4xl">Poruke korisnika</h1>
            <p className="text-sm text-muted-foreground sm:text-base">Prikaz svih poruka primljenih preko kontakt forme</p>
          </div>

          {messages.length === 0 ? (
            <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-sm p-12 text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Trenutno nema novih poruka</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`bg-card/50 backdrop-blur-sm border rounded-xl p-4 sm:p-6 ${
                    msg.status === "unread" ? "border-primary/30" : "border-primary/10"
                  }`}
                >
                  <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2 sm:gap-3">
                        <h3 className="text-lg font-bold text-foreground sm:text-xl">{msg.name}</h3>
                        {msg.status === "unread" && (
                          <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded uppercase tracking-wider">
                            Nepročitano
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {msg.email}
                        </div>
                        {msg.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {msg.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(msg.created_at).toLocaleString("sr-RS")}
                        </div>
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      {msg.status === "unread" && (
                        <Button
                          onClick={() => markAsRead(msg.id)}
                          variant="outline"
                          size="sm"
                          className="w-full border-primary/20 hover:bg-primary/10 sm:w-auto"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Označi kao pročitano
                        </Button>
                      )}
                      <Button
                        onClick={() => deleteMessage(msg.id)}
                        variant="outline"
                        size="sm"
                        disabled={deletingId === msg.id}
                        className="w-full border-red-500/40 text-red-300 hover:bg-red-500/10 sm:w-auto"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {deletingId === msg.id ? "Brisanje..." : "Obriši poruku"}
                      </Button>
                    </div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3 border border-primary/10 sm:p-4">
                    <p className="text-foreground whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  )
}
