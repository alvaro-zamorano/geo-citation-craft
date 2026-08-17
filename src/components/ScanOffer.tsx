import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { captureLead } from "@/lib/lead";
import type { HablaResult } from "@/lib/habla";

/**
 * El escaneo de sitio: el segundo paso del auditor.
 *
 * El analisis suelto puntua UNA pagina. Esto lee hasta 10 del sitemap y agrega.
 * El dato que justifica pedir el email no es la media — es el FALLO REPETIDO:
 * saber que "tu primer bloque no dice para quien es" sale en 8 de 10 paginas
 * convierte una lista de tareas sueltas en una sola decision editorial.
 *
 * El email se pide DESPUES de haber dado la nota gratis, no antes, y con el
 * dominio ya escrito: un solo campo en el pico de interes.
 */

interface RepeatedIssue {
  win: string;
  pages: number;
  share: number;
}

interface ScanResult {
  url: string;
  site_score: number;
  site_grade: string;
  pages_ok: number;
  spread: { min: number; max: number };
  headline: string;
  repeated_issues: RepeatedIssue[];
  site_issues?: RepeatedIssue[];
  pages: { url: string; total: number; grade: string }[];
  detail?: string;
  error?: string;
}

interface ScanOfferProps {
  result: HablaResult;
}

export default function ScanOffer({ result }: ScanOfferProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");
  const [scan, setScan] = useState<ScanResult | null>(null);

  const dominio = String(result.url || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  async function lanzar(e: React.FormEvent) {
    e.preventDefault();
    if (!dominio) return;
    setLoading(true);
    setError("");

    // El lead entra primero y sin esperar: si el escaneo peta, el contacto no se pierde.
    captureLead({ email, source: `scan-${result.grade}` }).catch(() => {});

    try {
      const r = await fetch(
        `/api/scan?url=${encodeURIComponent(dominio)}&email=${encodeURIComponent(email)}&limit=10&from=geo-score`
      );
      const j: ScanResult = await r.json();
      if (!r.ok || j.error) throw new Error(j.detail || j.error || "fallo");
      if (!j.pages_ok) throw new Error(j.detail || "No pude leer ninguna pagina de ese dominio.");
      setScan(j);
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      setError(m === "fallo" ? "El escaneo fallo. Vuelve a intentarlo en un minuto." : m);
    } finally {
      setLoading(false);
    }
  }

  async function comprarAuditoria() {
    setBuying(true);
    setError("");
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType: "curso-auditoria", guestEmail: email || undefined }),
      });
      const j = await r.json();
      if (j.url) {
        window.location.href = j.url;
        return;
      }
      throw new Error(j.error || "checkout");
    } catch {
      setBuying(false);
      setError("No he podido abrir el pago. Escribeme a hola@esgeo.ai y lo resolvemos.");
    }
  }

  if (scan) {
    return (
      <div className="mt-8 rounded-lg border border-border bg-muted/30 p-6 text-left">
        <p className="text-xl font-semibold leading-snug text-foreground">{scan.headline}</p>

        <div className="mt-5 flex flex-wrap gap-8 border-b border-border pb-5">
          <div>
            <div className="text-3xl font-bold leading-none text-foreground">{scan.site_score}</div>
            <div className="mt-1 text-xs text-muted-foreground">Media del sitio</div>
          </div>
          <div>
            <div className="text-3xl font-bold leading-none text-foreground">{scan.pages_ok}</div>
            <div className="mt-1 text-xs text-muted-foreground">Paginas leidas</div>
          </div>
          <div>
            <div className="text-3xl font-bold leading-none text-foreground">
              {scan.spread.min}–{scan.spread.max}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">De la peor a la mejor</div>
          </div>
        </div>

        {scan.repeated_issues.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Lo que se repite, y por eso es de plantilla
            </h3>
            <ul className="space-y-2">
              {scan.repeated_issues.map((p, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed">
                  <span className="shrink-0 font-mono text-xs font-semibold text-destructive">
                    {p.pages}/{scan.pages_ok}
                  </span>
                  <span className="text-muted-foreground">{p.win}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {scan.site_issues && scan.site_issues.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              De sitio: un fichero, un arreglo
            </h3>
            <ul className="space-y-2">
              {scan.site_issues.map((p, i) => (
                <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {p.win}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Pagina por pagina, de peor a mejor</h3>
          <ul className="divide-y divide-border">
            {scan.pages.map((p, i) => (
              <li key={i} className="flex items-center justify-between gap-4 py-2 text-sm">
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {p.url.replace(/^https?:\/\//, "")}
                </span>
                <span className="shrink-0 font-semibold text-foreground">{p.total}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            Arreglar esto tu mismo es el curso. Que lo arregle yo sobre estas {scan.pages_ok} paginas,
            con el plan priorizado y la evidencia antes/despues, es la auditoria.
          </p>
          <Button size="lg" onClick={comprarAuditoria} disabled={buying}>
            {buying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Abriendo el pago…
              </>
            ) : (
              <>
                Quiero la auditoria de mi sitio — 197 € <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-lg border border-border bg-muted/30 p-6 text-left">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Esto era una pagina</p>
      <h3 className="mt-2 text-xl font-semibold leading-snug text-foreground">
        Tu web tiene mas. Y el fallo suele ser el mismo en todas.
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Cuando un problema se repite pagina tras pagina no es un problema de contenido: es de plantilla.
        Se arregla una vez y sube el sitio entero. Leo hasta 10 paginas de tu sitemap y te digo cual es el tuyo.
      </p>
      <form onSubmit={lanzar} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@empresa.com"
          aria-label="Tu email"
          className="h-12 flex-1"
        />
        <Button type="submit" size="lg" disabled={loading} className="h-12">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Escaneando…
            </>
          ) : (
            "Escanear mis 10 paginas"
          )}
        </Button>
      </form>
      <p className="mt-3 text-xs text-muted-foreground">
        Te enseño el resultado aqui mismo. Sin spam: esto es un informe, no una lista de correo.
      </p>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
