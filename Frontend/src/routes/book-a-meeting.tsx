import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Send, CheckCircle2, Calendar, Mail, User, Phone, Sprout } from "lucide-react";

export const Route = createFileRoute("/book-a-meeting")({
  head: () => ({
    meta: [
      { title: "Book a Meeting — SFMS" },
      { name: "description", content: "Schedule a consultation for your smart farm transformation." },
    ],
  }),
  component: BookMeeting,
});

function BookMeeting() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold">Request Sent!</h1>
          <p className="mt-4 text-muted-foreground">
            Thank you for your interest. Our team will review your request and contact you shortly to schedule your consultation.
          </p>
          <div className="mt-8">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <Logo />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Ready to transform your <span className="text-primary">farm?</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Schedule a free consultation with our experts to discuss how SFMS can optimize your yields, 
              reduce water waste, and automate your operations.
            </p>

            <div className="mt-10 space-y-6">
              {[
                {
                  title: "Expert Guidance",
                  desc: "Learn about the best IoT sensors for your specific crops.",
                  icon: Sprout,
                },
                {
                  title: "Custom Solutions",
                  desc: "We tailor the system to your farm's unique topography and needs.",
                  icon: Calendar,
                },
                {
                  title: "Technical Support",
                  desc: "Our team handles the full setup and provides ongoing maintenance.",
                  icon: CheckCircle2,
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-glow">
            <h2 className="text-2xl font-bold">Book a Consultation</h2>
            <p className="mt-1 text-sm text-muted-foreground">Fill out the form below and we'll get back to you.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      required
                      type="text"
                      placeholder="John Doe"
                      className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      required
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    required
                    type="email"
                    placeholder="john@farm.com"
                    className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Farm Type</label>
                <select className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                  <option>Crop Farming</option>
                  <option>Poultry</option>
                  <option>Aquaculture (Ponds)</option>
                  <option>Livestock Farm</option>
                  <option>Mixed / Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Message</label>
                <textarea
                  placeholder="Tell us about your farm and goals..."
                  rows={4}
                  className="w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
              >
                Send Request <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
