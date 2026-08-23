import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useSearchParams } from "react-router-dom";
import { Home, ChevronRight, Search, Lock, Loader2, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Fichero, type Trozo } from "@/components/DemoAuditoria";
import { useGeoMetadata } from "@/hooks/useGeoMetadata";

/**
 * /auditoria/demo: la demo de la auditoria de 197 EUR, con URL propia.
 *
 * Hasta ahora esta demo solo existia dentro del flujo del escaneo de /geo-score:
 * se veia una vez y no habia forma de volver a ella, compartirla ni enlazarla
 * desde un correo. Con ?url=dominio.com se puede hacer las tres cosas.
 *
 * Los datos vienen de /api/demo?completa=1, que ademas del principio de los tres
 * ficheros devuelve el escaneo ya recortado (esta pagina llega sin contexto
 * ninguno, asi que necesita el titular y la nota). El corte se hace en el
 * servidor: lo que no se ha pagado no viaja por el cable.
 *
 * Va con noindex a proposito: es una pagina con parametro y no queremos mil
 * variantes indexadas. useGeoMetadata emite "index, follow" fijo, asi que el
 * noindex va en el Helmet propio, que se monta despues y gana.
 */

interface FalloRepetido {
  win: string;
  pages: number;
  share?: number;
}

interface PeorPagina {
  url: string;
  total: number;
  grade: string;
}

interface DemoCompleta {
  dominio: string;
  raiz: string;
  headline: string;
  site_score: number;
  site_grade: string;
  spread: { min: number; max: number };
  pages_ok: number;
  pages_failing_gate?: number;
  primer_fallo: FalloRepetido | null;
  fallos_ocultos: number;
  peores: PeorPagina[];
  paginas_ocultas: number;
  ficheros: {
    llms: Trozo | null;
    robots: Trozo;
    jsonld: (Trozo & { faltan: number }) | null;
  };
  error?: string;
  detail?: string;
}

const TITULO = "Mira tu auditoría antes de comprarla | esGEO";
const DESCRIPCION =
  "Escribe tu dominio y te enseño el principio de la auditoría: tu nota, el fallo que se repite en tu plantilla y las primeras líneas de tus ficheros ya generados.";

const DemoAuditoriaPage = () => {
  const { helmet: socialHelmet } = useGeoMetadata({
    title: TITULO,
    description: DESCRIPCION,
    canonicalUrl: "https://www.esgeo.ai/auditoria/demo",
    ogType: "website",
  });

  const [params, setParams] = useSearchParams();
  const url = (params.get("url") || "").trim();

  const [escrito, setEscrito] = useState("");
  const [datos, setDatos] = useState<DemoCompleta | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [comprando, setComprando] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!url) {
      setDatos(null);
      setError("");
      setCargando(false);
      return;
    }
    let vivo = true;
    setCargando(true);
    setError("");
    setDatos(null);
    fetch(`/api/demo?url=${encodeURIComponent(url)}&completa=1`)
      .then((r) => r.json())
      .then((j: DemoCompleta) => {
        if (!vivo) return;
        if (j.error) setError(j.detail || j.error);
        else setDatos(j);
      })
      .catch(() => {
        if (vivo) setError("No he podido leer esa web. Comprueba el dominio y prueba otra vez.");
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [url]);

  function pedirDemo(e: React.FormEvent) {
    e.preventDefault();
    const limpio = escrito
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "")
      .split("/")[0];
    if (!limpio || !limpio.includes(".")) return;
    setParams({ url: limpio });
  }

  async function comprarAuditoria() {
    setComprando(true);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType: "curso-auditoria", dominio: datos?.dominio || url }),
      });
      const j = await r.json();
      if (j.url) {
        window.location.href = j.url;
        return;
      }
      throw new Error(j.error || "checkout");
    } catch {
      setComprando(false);
      setError("No he podido abrir el pago. Escríbeme a hola@esgeo.ai y lo resolvemos.");
    }
  }

  const formulario = (
    <form onSubmit={pedirDemo} className="mt-6 flex flex-col gap-2 sm:flex-row">
      <Input
        type="text"
        required
        value={escrito}
        onChange={(e) => setEscrito(e.target.value)}
        placeholder="tuempresa.com"
        aria-label="Tu dominio"
        className="h-12 flex-1"
      />
      <Button type="submit" size="lg" className="h-12">
        Enseñámela
      </Button>
    </form>
  );

  return (
    <div className="min-h-screen bg-background">
      {socialHelmet}
      <Helmet>
        <title>{TITULO}</title>
        <meta name="description" content={DESCRIPCION} />
        <link rel="canonical" href="https://www.esgeo.ai/auditoria/demo" />
        <meta name="robots" content="noindex,follow" />
        <meta name="googlebot" content="noindex,follow" />
      </Helmet>

      <Header />

      <main role="main">
        {/* Migas de pan */}
        <nav aria-label="Migas de pan" className="border-b border-border bg-muted/20">
          <div className="container mx-auto px-4 max-w-4xl py-3">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground">
                  <Home className="h-3.5 w-3.5" />
                  Inicio
                </Link>
              </li>
              <ChevronRight className="h-3.5 w-3.5" />
              <li>
                <Link to="/auditoria" className="hover:text-foreground">
                  Auditoría
                </Link>
              </li>
              <ChevronRight className="h-3.5 w-3.5" />
              <li className="text-foreground font-medium" aria-current="page">
                Demo
              </li>
            </ol>
          </div>
        </nav>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            {!datos ? (
              <>
                <div className="inline-flex items-center gap-2 bg-accent/10 text-accent border border-accent/20 px-4 py-2 rounded-full text-sm font-medium mb-5">
                  <Search className="h-4 w-4" />
                  Demo de la auditoría
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Mira tu auditoría antes de comprarla
                </h1>
                <p
                  className="snippet-block mt-4 text-lg leading-relaxed text-muted-foreground"
                  data-speakable="true"
                >
                  Escribe tu dominio y te enseño por dónde empieza: tu nota, el fallo que se repite
                  en tu plantilla y las primeras líneas de los ficheros que te llevas. Sin registro.
                </p>

                {cargando ? (
                  <div className="mt-8 flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    Leyendo tu web y escribiendo tus ficheros…
                  </div>
                ) : (
                  <>
                    {error && (
                      <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                        {error}
                      </p>
                    )}
                    {formulario}
                    <p className="mt-3 text-sm text-muted-foreground">
                      Tarda unos segundos: leo tu sitemap y analizo tus páginas de verdad.
                    </p>
                  </>
                )}
              </>
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Tu auditoría de {datos.dominio}, a medias
                </h1>

                <div className="mt-6 rounded-xl border border-border bg-muted/30 p-6">
                  <p className="text-xl font-semibold leading-snug text-foreground">
                    {datos.headline}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-8 border-b border-border pb-6">
                  <div>
                    <div className="text-3xl font-bold leading-none text-foreground">
                      {datos.site_score}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Media del sitio</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold leading-none text-foreground">
                      {datos.site_grade}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Nivel</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold leading-none text-foreground">
                      {datos.spread.min} a {datos.spread.max}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">De la peor a la mejor</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold leading-none text-foreground">
                      {datos.pages_ok}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Páginas leídas</div>
                  </div>
                </div>

                {datos.primer_fallo && (
                  <div className="mt-6">
                    <h2 className="text-base font-semibold text-foreground">
                      El fallo que más se repite
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {datos.primer_fallo.win}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Aparece en {datos.primer_fallo.pages} de tus {datos.pages_ok} páginas. Al ser
                      de plantilla, se arregla una vez y suben todas.
                    </p>
                    {datos.fallos_ocultos > 0 && (
                      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Lock className="h-3.5 w-3.5 shrink-0" />
                        Hay {datos.fallos_ocultos} fallos más, con su orden de prioridad, en la
                        auditoría completa.
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-6">
                  <h2 className="text-base font-semibold text-foreground">Tus páginas peores</h2>
                  <ul className="mt-2 divide-y divide-border">
                    {datos.peores.map((p) => (
                      <li
                        key={p.url}
                        className="flex items-center justify-between gap-4 py-2 text-sm"
                      >
                        <span className="truncate font-mono text-xs text-muted-foreground">
                          {p.url.replace(/^https?:\/\//, "")}
                        </span>
                        <span className="shrink-0 font-semibold text-foreground">{p.total}</span>
                      </li>
                    ))}
                  </ul>
                  {datos.paginas_ocultas > 0 && (
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Lock className="h-3.5 w-3.5 shrink-0" />Y {datos.paginas_ocultas} páginas
                      más, cada una con sus cinco dimensiones desglosadas.
                    </p>
                  )}
                </div>

                <div className="mt-8 border-t border-border pt-6">
                  <h2 className="text-base font-semibold text-foreground">
                    Tus ficheros ya están escritos
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Esto no es un ejemplo de otra web. Lo acabo de generar con el sitemap y el HTML
                    de <span className="font-medium text-foreground">{datos.dominio}</span>, hace
                    unos segundos.
                  </p>

                  <Fichero
                    nombre="llms.txt"
                    pie="El índice que leen los agentes para saber qué hay en tu sitio, con los títulos y descripciones reales de tus páginas."
                    trozo={datos.ficheros.llms}
                  />
                  <Fichero
                    nombre="robots.txt"
                    pie="Las directivas para cada rastreador de IA, con la decisión de entrenamiento marcada aparte."
                    trozo={datos.ficheros.robots}
                  />
                  <Fichero
                    nombre="Identidad en JSON-LD"
                    pie="Quién eres, en el formato que entienden los modelos, construido con lo que ya hay en tu home."
                    trozo={datos.ficheros.jsonld}
                  />
                </div>

                <div className="mt-8 border-t border-border pt-6">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Lo que ves aquí es el principio. La auditoría lleva los tres ficheros enteros, el
                    informe con las cinco dimensiones de cada página y el plan ordenado por impacto.
                    Llega a tu correo en menos de un minuto, con el curso F1-F5 incluido.
                  </p>
                  <Button
                    size="lg"
                    className="mt-4"
                    onClick={comprarAuditoria}
                    disabled={comprando}
                  >
                    {comprando ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Abriendo el pago…
                      </>
                    ) : (
                      <>
                        Quiero mi auditoría: 197 € <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
                  <p className="mt-6">
                    <Link
                      to="/geo-score"
                      className="text-sm text-primary underline underline-offset-4 hover:text-accent transition-colors"
                    >
                      ¿Prefieres el análisis gratuito completo? Audítala aquí
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default DemoAuditoriaPage;
