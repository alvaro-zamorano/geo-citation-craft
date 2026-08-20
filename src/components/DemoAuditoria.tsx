import { useEffect, useState } from "react";
import { Lock, Loader2 } from "lucide-react";

/**
 * La demo del entregable de 197 EUR.
 *
 * Ensena las primeras lineas de los tres ficheros generados con los datos
 * reales del cliente, y corta. El corte viene hecho del servidor: aqui no hay
 * contenido escondido con CSS, porque eso se lee con el inspector.
 *
 * Ver doce lineas de tu propio llms.txt bien escrito convence mas que
 * cualquier parrafo prometiendolo.
 */

interface Trozo {
  muestra: string;
  total: number;
  ocultas: number;
}

interface DemoFicheros {
  dominio: string;
  llms: Trozo | null;
  robots: Trozo;
  jsonld: (Trozo & { faltan: number }) | null;
  error?: string;
}

interface DemoAuditoriaProps {
  dominio: string;
  paginas: number;
}

function Fichero({ nombre, pie, trozo }: { nombre: string; pie: string; trozo: Trozo | null }) {
  if (!trozo) return null;
  return (
    <div className="mt-5">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{nombre}</p>
      <p className="mt-1 text-sm text-muted-foreground">{pie}</p>
      <div className="relative mt-2">
        <pre className="max-h-64 overflow-hidden rounded-lg border border-border bg-background p-4 text-xs leading-relaxed">
          {trozo.muestra}
        </pre>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 rounded-b-lg bg-gradient-to-t from-muted/95 to-transparent" />
      </div>
      {trozo.ocultas > 0 && (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          Quedan {trozo.ocultas} líneas de las {trozo.total}. Van completas en la auditoría.
        </p>
      )}
    </div>
  );
}

export default function DemoAuditoria({ dominio, paginas }: DemoAuditoriaProps) {
  const [datos, setDatos] = useState<DemoFicheros | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    fetch(`/api/demo?url=${encodeURIComponent(dominio)}`)
      .then((r) => r.json())
      .then((j) => { if (vivo) setDatos(j.error ? null : j); })
      .catch(() => { if (vivo) setDatos(null); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [dominio]);

  if (cargando) {
    return (
      <div className="mt-6 flex items-center gap-3 border-t border-border pt-5 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Escribiendo tus ficheros…
      </div>
    );
  }
  if (!datos) return null;

  return (
    <div className="mt-6 border-t border-border pt-5">
      <h3 className="text-base font-semibold text-foreground">
        Tus ficheros ya están escritos
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        Esto no es un ejemplo de otra web. Lo acabo de generar con el sitemap y el HTML de{" "}
        <span className="font-medium text-foreground">{datos.dominio}</span>, hace unos segundos.
      </p>

      <Fichero
        nombre="llms.txt"
        pie="El índice que leen los agentes para saber qué hay en tu sitio, con los títulos y descripciones reales de tus páginas."
        trozo={datos.llms}
      />
      <Fichero
        nombre="robots.txt"
        pie="Las directivas para cada rastreador de IA, con la decisión de entrenamiento marcada aparte."
        trozo={datos.robots}
      />
      <Fichero
        nombre="Identidad en JSON-LD"
        pie="Quién eres, en el formato que entienden los modelos, construido con lo que ya hay en tu home."
        trozo={datos.jsonld}
      />

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        En la auditoría van los tres enteros, más el informe con las cinco dimensiones de cada una
        de tus {paginas} páginas y el plan ordenado por impacto.
      </p>
    </div>
  );
}
