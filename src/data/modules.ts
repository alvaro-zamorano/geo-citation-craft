/**
 * Single source of truth for all module data.
 * Import this in every component that references modules.
 */

export interface ModuleInfo {
  id: string;
  name: string;
  shortName: string;
  /** Título canónico del módulo (sin el prefijo "Módulo Fx"). ÚNICA identidad F1-F5:
   *  home, /curso, /metodologia y artículos deben renderizar exactamente este título. */
  title: string;
  description: string;
  /** Bullets canónicos del temario del módulo. */
  topics: string[];
  /** Duración estimada en formato ISO 8601 (para schema.org y UI). */
  duration: string;
  /** Nivel en español: 'Inicial' | 'Intermedio'. */
  level: string;
  image: string;
  comingSoon?: boolean;
}

export interface CompleteCourseInfo {
  id: string;
  name: string;
  description: string;
  price: number;
  launchPrice?: boolean;
  features: string[];
}

export const MODULES: Record<string, ModuleInfo> = {
  f1: {
    id: 'f1',
    title: 'Que puedan leerte',
    topics: ['Qué es GEO', 'Diferencias con SEO', 'Principios fundamentales'],
    duration: 'PT2H',
    level: 'Inicial',
    name: 'Módulo F1. Que puedan leerte',
    shortName: 'F1. Que puedan leerte',
    description: 'Si tu HTML llega vacío al crawler, nada de lo demás cuenta. Cómo comprobarlo y cómo arreglarlo, con o sin tocar tu framework.',
    image: '/images/modulo-f1.png',
  },
  f2: {
    id: 'f2',
    title: 'Que entiendan qué eres',
    topics: ['Jerarquía de contenido', 'Datos estructurados', 'Fragmentación semántica'],
    duration: 'PT3H',
    level: 'Inicial',
    name: 'Módulo F2. Que entiendan qué eres',
    shortName: 'F2. Que entiendan qué eres',
    description: 'Encabezados, datos estructurados y el primer bloque de cada página: qué eres, para quién y con qué cifra.',
    image: '/images/modulo-f2.png',
  },
  f3: {
    id: 'f3',
    title: 'Que te elijan como fuente',
    topics: ['Snippets destacados', 'Formato pregunta-respuesta', 'Estilo enciclopédico'],
    duration: 'PT4H',
    level: 'Intermedio',
    name: 'Módulo F3. Que te elijan como fuente',
    shortName: 'F3. Que te elijan como fuente',
    description: 'Cómo se escribe algo citable: bloques extractivos, formato pregunta y respuesta, y las señales que miran ChatGPT y Perplexity al elegir a quién citan.',
    image: '/images/modulo-f3.png',
  },
  f4: {
    id: 'f4',
    title: 'Que la cita sea correcta',
    topics: ['Schema markup', 'Metadatos citables', 'Estructura HTML semántica'],
    duration: 'PT3H',
    level: 'Intermedio',
    name: 'Módulo F4. Que la cita sea correcta',
    shortName: 'F4. Que la cita sea correcta',
    description: 'Schema, metadatos y entidad de marca para que, cuando te citen, te citen bien.',
    image: '/images/modulo-f4.png',
  },
  f5: {
    id: 'f5',
    title: 'Que siga funcionando dentro de un año',
    topics: ['KPIs de citabilidad', 'Herramientas de monitoreo', 'Análisis de rendimiento'],
    duration: 'PT2H',
    level: 'Intermedio',
    name: 'Módulo F5. Que siga funcionando dentro de un año',
    shortName: 'F5. Que siga funcionando dentro de un año',
    description: 'Qué medir, cada cuánto, y qué hacer cuando cambie el modelo de turno.',
    image: '/images/modulo-f5.png',
  },
};

export const COMPLETE_COURSE = {
  id: 'complete',
  name: 'Curso GEO completo',
  description: 'Acceso completo a todos los módulos del curso GEO con metodología integral.',
  price: 47,
  // Sin `originalPrice`: el €97 tachado nunca se cobró. En la UE (Directiva Omnibus) el
  // precio anterior tiene que haberse aplicado de verdad. El anclaje ahora es comparativo
  // y honesto: lo que cuesta una auditoría GEO frente a lo que cuesta el curso.
  launchPrice: false,
  // Los stripeIds vivían aquí duplicados y apuntaban a OTRA cuenta de Stripe
  // (prefijo LVUGCJuFgU, no LYFGrlrWdk). Código muerto y peligroso: la fuente de
  // verdad es api/checkout.ts, que es donde se crea la sesión de pago.
  features: [
    'Los 5 módulos en PDF, tuyos para siempre',
    'El método aplicado paso a paso, con checklists',
    'El caso real de esgeo.ai: de 35 a 92 (auditado el 12 de julio de 2026)',
    'Actualizaciones incluidas',
  ],
};

/** Available module IDs (excluding coming soon) */
export const AVAILABLE_MODULE_IDS = Object.keys(MODULES).filter(
  (id) => !MODULES[id].comingSoon
);

/** All module IDs including coming soon */
export const ALL_MODULE_IDS = Object.keys(MODULES);

/** Get module name by ID, with fallback */
export const getModuleName = (id: string): string =>
  MODULES[id]?.name ?? `Módulo ${id.toUpperCase()}`;

/** Support email - single source of truth */
export const SUPPORT_EMAIL = 'hola@esgeo.ai';
