import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Send, Loader2, User } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Answer {
  text: string;
  table?: { columns: string[]; rows: (string | number)[][] };
}
interface Msg { role: "user" | "assistant"; text: string; table?: Answer["table"] }

export function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Hi! I answer questions grounded in your live ERP data. Try a suggestion below or ask your own." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: suggestions } = useQuery({
    queryKey: ["assistant", "suggestions"],
    queryFn: async () => (await api.get("/assistant/suggestions")).data.data.suggestions as string[],
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (question: string) => {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const a = (await api.post("/assistant/query", { question })).data.data as Answer;
      setMessages((m) => [...m, { role: "assistant", text: a.text, table: a.table }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Sorry, I couldn't answer that just now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="AI Assistant"
        description="Key-free, grounded answers computed directly from your live data — no hallucinated numbers."
      />

      <Card className="flex h-[calc(100vh-16rem)] flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
              <div className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                m.role === "assistant" ? "bg-gradient-to-br from-primary to-sidebar-accent text-primary-foreground" : "bg-muted text-muted-foreground",
              )}>
                {m.role === "assistant" ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <div className={cn("max-w-[80%] space-y-2", m.role === "user" && "text-right")}>
                <div className={cn(
                  "inline-block rounded-2xl px-4 py-2.5 text-sm",
                  m.role === "assistant" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground",
                )}>
                  {m.text}
                </div>
                {m.table && (
                  <div className="overflow-x-auto rounded-lg border bg-card text-left">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                          {m.table.columns.map((c) => <th key={c} className="px-3 py-2 text-left font-semibold">{c}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {m.table.rows.map((row, ri) => (
                          <tr key={ri} className="border-b last:border-0">
                            {row.map((cell, ci) => <td key={ci} className="px-3 py-2">{cell}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary to-sidebar-accent text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="inline-flex items-center rounded-2xl bg-muted px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {suggestions && (
          <div className="flex flex-wrap gap-2 border-t p-3">
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)}
                className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:text-primary">
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t p-3">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about orders, stock, revenue, machines…" />
          <Button type="submit" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
