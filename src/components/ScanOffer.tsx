import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DemoAuditoria from "@/components/DemoAuditoria";
import { captureLead } from "@/lib/lead";
import { AUDITORIA_ACTIVA } from "@/lib/flags";
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
 *
 * Con AUDITORIA_ACTIVA en false el cierre no vende la auditoria: manda al curso.
 * La demo de ficheros se queda, porque es el mejor argumento para el curso.
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
      if (!j.pages_ok) throw new Error(j.detail || "No pude leer ninguna página de ese dominio.");
      setScan(j);
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      setError(m === "fallo" ? "El escaneo falló. Vuelve a intentarlo en un minuto." : m);
    } finally {
      setLoading(false);
    }
  }

  // Sin uso mientras AUDITORIA_ACTIVA sea false: se conserva para que reabrir
  // sea cambiar el flag y nada mas.
  async function comprarAuditoria() {
    setBuying(true);
    setError("");
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType: "curso-auditoria", guestEmail: email || undefined, dominio }),
      });
      const j = await r.json();
      if (j.url) {
        window.location.href = j.url;
        return;
      }
      throw new Error(j.error || "checkout");
    } catch {
      setBuying(false);
      setError("No he podido abrir el pago. Escríbeme a hola@esgeo.ai y lo resolvemos.");
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
            <div className="mt-1 text-xs text-muted-foreground">Páginas leídas</div>
          </div>
          <div>
            <div className="text-3xl font-bold leading-none text-foreground">
              {scan.spread.min} a {scan.spread.max}
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
          <h3 className="mb-3 text-sm font-semibold text-foreground">Página por página, de peor a mejor</h3>
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

        <DemoAuditoria dominio={dominio} paginas={scan.pages_ok} />

        <div className="mt-6 border-t border-border pt-5">
          {!AUDITORIA_ACTIVA ? (
            <>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                Los ficheros completos van en la auditoría, que ahora mismo está cerrada mientras la
                termino de afinar. Mientras tanto, el curso te enseña a escribirlos tú.
              </p>
              <Button asChild size="lg">
                <Link to="/curso">
                  Ver el curso: 47 € <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                Desbloquéalo todo: los tres ficheros completos, el informe de tus {scan.pages_ok} páginas y el plan
                priorizado. Llega a tu correo en menos de un minuto, y el curso F1-F5 va incluido.
              </p>
              <Button size="lg" onClick={comprarAuditoria} disabled={buying}>
                {buying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Abriendo el pago…
                  </>
                ) : (
                  <>
                    Quiero la auditoría de mi sitio: 197 € <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </>
          )}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-lg border border-border bg-muted/30 p-6 text-left">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Esto era una página</p>
      <h3 className="mt-2 text-xl font-semibold leading-snug text-foreground">
        Tu web tiene más. Y el fallo suele ser el mismo en todas.
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Cuando un problema se repite página tras página no es un problema de contenido: es de plantilla.
        Se arregla una vez y sube el sitio entero. Leo hasta 10 páginas de tu sitemap y te digo cuál es el tuyo.
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
            "Escanear mis 10 páginas"
          )}
        </Button>
      </form>
      <p className="mt-3 text-xs text-muted-foreground">
        Te enseño el resultado aquí mismo. Sin spam: esto es un informe, no una lista de correo.
      </p>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
