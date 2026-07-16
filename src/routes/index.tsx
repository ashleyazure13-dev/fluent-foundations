import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, Sparkles, Repeat } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
            P
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Piazza
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              Get started
            </Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 md:pt-20">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Italian — first language pack
          </span>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Learn a language by <em className="text-primary not-italic">communicating</em>,
            not memorizing.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Piazza teaches you Italian through meaningful phrases, real
            dialogue, and daily speaking — grounded in second-language
            acquisition research. No streaks. No flashcards as the main event.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup" }}>
                Start learning
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">I have an account</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 md:grid-cols-3">
          <Pillar
            icon={<MessageCircle className="h-5 w-5" />}
            title="Message over word"
            body="The unit of learning is a communicative phrase — something you can actually say in a real moment."
          />
          <Pillar
            icon={<Sparkles className="h-5 w-5" />}
            title="Speak from day one"
            body="Voice is a first-class input. Shadow, roleplay, and produce — with immediate, human feedback."
          />
          <Pillar
            icon={<Repeat className="h-5 w-5" />}
            title="Spaced retrieval"
            body="Nothing is 'completed'. Every phrase is scheduled to return at the right moment for durable memory."
          />
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Piazza. Made with cura.</span>
          <span className="font-display italic">A tavola non si invecchia.</span>
        </div>
      </footer>
    </div>
  );
}

function Pillar({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
