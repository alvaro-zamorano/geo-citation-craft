import { useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import {
  Home,
  ChevronRight,
  FileText,
  Repeat,
  FileCode2,
  GraduationCap,
  ShieldCheck,
  Search,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BuyButton from "@/components/BuyButton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useGeoMetadata } from "@/hooks/useGeoMetadata";

/**
 * /auditoria: la página propia del producto de 197 € (curso + auditoría personalizada).
 *
 * Hasta ahora este producto solo existía como tercer plan de la tabla de precios de la
 * home, sin sitio donde explicarlo. La entrega está automatizada: el comprador escribe
 * su dominio en la pantalla de pago de Stripe y el pack se genera y se envía por correo.
 *
 * Checkout: BuyButton con productType "curso-auditoria" (ver src/lib/checkout.ts).
 * La garantía va escrita a mano porque GuaranteeNote sirve el texto canónico de los 47 €.
 *
 * Quien no se fía de una descripción tiene /auditoria/demo: la misma auditoría,
 * generada con su dominio y cortada por la mitad.
 */
const AuditoriaPage = () => {
  const { helmet: socialHelmet } = useGeoMetadata({
    title: "Auditoría GEO de tu web: informe y ficheros listos | esGEO",
    description:
      "Analizo hasta 12 páginas de tu sitio, encuentro el fallo que se repite en tu plantilla y te entrego el llms.txt, el robots.txt y el JSON-LD ya escritos con tus datos. En minutos. 197 €, curso incluido.",
    canonicalUrl: "https://www.esgeo.ai/auditoria",
    ogType: "website",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const entregables = [
    {
      icon: FileText,
      title: "El informe, página por página",
      body: "Cada página de tu sitio con su nota y las cinco dimensiones desglosadas, ordenadas de la peor a la mejor. Sabes por dónde empezar sin tener que decidirlo tú.",
    },
    {
      icon: Repeat,
      title: "El fallo que se repite",
      body: "Cuando un problema aparece en ocho de tus diez páginas no es un problema de contenido, es de plantilla. Se arregla una vez y sube el sitio entero. Ese es el dato que convierte una lista de tareas sueltas en una sola decisión.",
    },
    {
      icon: FileCode2,
      title: "Tus tres ficheros, ya escritos",
      body: "El llms.txt con los títulos y descripciones reales de tus páginas. El robots.txt con las directivas para los rastreadores de IA. Tu identidad en JSON-LD, lista para pegar en el head. Generados con los datos de tu web: no son plantillas de ejemplo.",
    },
    {
      icon: GraduationCap,
      title: "El curso completo, incluido",
      body: "Los cinco módulos F1-F5 en PDF, para que la próxima vez no me necesites.",
    },
  ];

  const pasos = [
    {
      title: "Pagas y escribes tu dominio en la misma pantalla",
      body: "No hay formulario después, ni correos de ida y vuelta preguntándote cuál es tu web.",
    },
    {
      title: "En minutos tienes el pack en tu correo",
      body: "Leo tu sitemap, analizo tus páginas y genero los ficheros. No esperas a que yo esté delante del ordenador.",
    },
    {
      title: "Aplicas y lo compruebas tú",
      body: "Vuelves a pasar el auditor gratuito y ves el antes y el después con la misma vara de medir. Nadie te pide que te fíes.",
    },
  ];

  const noEs = [
    {
      lead: "No es una llamada de una hora.",
      rest: " Es un entregable que puedes leer cuando quieras y volver a abrir dentro de un año.",
    },
    {
      lead: "No es un PDF genérico.",
      rest: " Cada línea sale del HTML y del sitemap de tu dominio.",
    },
    {
      lead: "No te garantiza que ChatGPT te cite.",
      rest: " Eso no lo puede garantizar nadie. Lo que hace es quitar el motivo técnico por el que hoy no puede citarte.",
    },
  ];

  const garantia =
    "Garantía medible: aplica el plan que te doy y vuelve a auditar tu web en los 30 días siguientes. Si tu nota no sube al menos 20 puntos, escríbeme con el antes y el después y te devuelvo los 197 €. La nota la pone la misma herramienta gratuita que puedes usar ahora, así que no depende de mi criterio.";

  const faqs = [
    {
      question: "¿Cuánto tarda?",
      answer: "Minutos. El pack se genera solo en cuanto Stripe confirma el pago.",
    },
    {
      question: "¿Cuántas páginas mira?",
      answer:
        "Hasta doce, las que encuentre en tu sitemap. Si tu sitio es mayor, siguen siendo suficientes para detectar lo que se repite, que es de lo que va esto.",
    },
    {
      question: "¿Sirve si mi web está hecha con React o Vue?",
      answer:
        "Es justo donde más sirve. Si no tienes renderizado en servidor, el HTML que sale de tu servidor está vacío y ninguna IA lee nada. El informe te lo dice, y el curso incluido te enseña a arreglarlo.",
    },
    {
      question: "¿Y si no tengo sitemap?",
      answer:
        "Tiro de los enlaces de tu página de inicio. Y si tampoco los hay, el informe te dirá que ese es tu primer problema.",
    },
  ];

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Auditoría GEO personalizada + curso completo F1-F5",
    description:
      "Informe página por página de hasta 12 páginas de tu web con el framework HABLA, el fallo que se repite en tu plantilla y los ficheros llms.txt, robots.txt y JSON-LD generados con los datos reales de tu dominio. Incluye el curso completo F1-F5 en PDF.",
    url: "https://www.esgeo.ai/auditoria",
    brand: {
      "@type": "Organization",
      "@id": "https://www.esgeo.ai#organization",
      name: "esGEO",
      url: "https://www.esgeo.ai",
    },
    offers: {
      "@type": "Offer",
      price: "197",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: "https://www.esgeo.ai/auditoria",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://www.esgeo.ai/" },
      { "@type": "ListItem", position: 2, name: "Auditoría", item: "https://www.esgeo.ai/auditoria" },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      {socialHelmet}
      <Helmet>
        <title>Auditoría GEO de tu web: informe y ficheros listos | esGEO</title>
        <meta
          name="description"
          content="Analizo hasta 12 páginas de tu sitio, encuentro el fallo que se repite en tu plantilla y te entrego el llms.txt, el robots.txt y el JSON-LD ya escritos con tus datos. En minutos. 197 €, curso incluido."
        />
        <link rel="canonical" href="https://www.esgeo.ai/auditoria" />
        <meta property="og:title" content="Auditoría GEO de tu web: informe y ficheros listos" />
        <meta
          property="og:description"
          content="Te digo qué falla en tu web, página por página. Informe, el fallo que se repite y tus tres ficheros ya escritos. 197 €, curso F1-F5 incluido."
        />
        <script type="application/ld+json">{JSON.stringify(productJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Helmet>

      <Header />

      <main role="main">
        {/* Migas de pan */}
        <nav aria-label="Migas de pan" className="border-b border-border bg-muted/20">
          <div className="container mx-auto px-4 max-w-5xl py-3">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground">
                  <Home className="h-3.5 w-3.5" />
                  Inicio
                </Link>
              </li>
              <ChevronRight className="h-3.5 w-3.5" />
              <li className="text-foreground font-medium" aria-current="page">
                Auditoría
              </li>
            </ol>
          </div>
        </nav>

        {/* Hero */}
        <section className="py-14 md:py-20">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent border border-accent/20 px-4 py-2 rounded-full text-sm font-medium mb-5">
              <Search className="h-4 w-4" />
              Auditoría HABLA
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Te digo qué falla en tu web, página por página
            </h1>
            <p
              className="snippet-block text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
              data-speakable="true"
            >
              El auditor gratuito puntúa una página. Esto lee hasta doce, encuentra el fallo que se
              repite en tu plantilla y te devuelve los ficheros ya escritos con los datos de tu
              sitio. Llega a tu correo en minutos, no en días.
            </p>
            <BuyButton
              source="auditoria-page-hero"
              productType="curso-auditoria"
              className="btn-glow bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-10 py-5 text-lg rounded-xl"
            >
              Quiero mi auditoría: 197 €
            </BuyButton>
            <p className="text-sm text-muted-foreground mt-3">
              Pago único. El curso completo F1-F5 va incluido.
            </p>
            <p className="mt-5">
              <Link
                to="/auditoria/demo"
                className="text-sm text-primary underline underline-offset-4 hover:text-accent transition-colors"
              >
                ¿Prefieres verla con tu web antes de pagar? Mira la demo
              </Link>
            </p>
            <p className="mt-3">
              <Link
                to="/geo-score"
                className="text-sm text-primary underline underline-offset-4 hover:text-accent transition-colors"
              >
                ¿Prefieres verlo antes? Audita una página gratis
              </Link>
            </p>
          </div>
        </section>

        {/* Qué recibes */}
        <section className="py-14 bg-muted/30 border-y border-border">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-10 text-center">
              Qué recibes
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              {entregables.map((item) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-border bg-card p-6"
                  data-speakable="true"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent mb-4">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="py-14">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-10 text-center">
              Cómo funciona
            </h2>
            <ol className="grid md:grid-cols-3 gap-5">
              {pasos.map((paso, i) => (
                <li key={paso.title} className="rounded-xl border border-border bg-card p-6">
                  <span className="text-sm font-bold text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-semibold text-foreground mt-2 mb-2">{paso.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{paso.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Qué no es */}
        <section className="py-14 bg-muted/30 border-y border-border">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
              Qué no es
            </h2>
            <ul className="space-y-5">
              {noEs.map((item) => (
                <li key={item.lead} className="border-b border-border pb-5 last:border-b-0">
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">{item.lead}</strong>
                    {item.rest}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Garantía */}
        <section className="py-14">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 md:p-8 flex items-start gap-3">
              <ShieldCheck className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-bold text-foreground mb-2">Garantía medible</h2>
                <p className="text-muted-foreground leading-relaxed" data-speakable="true">
                  {garantia}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 bg-muted/30 border-y border-border">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
              Preguntas frecuentes
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={faq.question} value={`faq-${i}`} className="border-b border-border">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-semibold text-foreground text-base">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Cierre */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-7">
              Tu web ya la están leyendo máquinas. La pregunta es qué entienden.
            </h2>
            <BuyButton
              source="auditoria-page-cierre"
              productType="curso-auditoria"
              className="btn-glow bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-10 py-5 text-lg rounded-xl"
            >
              Quiero mi auditoría: 197 €
            </BuyButton>
            <p className="text-sm text-primary-foreground/75 mt-3">
              Pago único, factura con NIF/CIF, y el curso F1-F5 incluido.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AuditoriaPage;
