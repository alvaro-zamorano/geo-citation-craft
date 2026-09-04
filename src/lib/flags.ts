/**
 * Interruptores de producto.
 *
 * AUDITORIA_ACTIVA gobierna todo lo que vende la auditoria de 197 EUR: el plan
 * de la tabla de precios, los CTA del auditor, los enlaces del menu y los
 * botones de la pagina del producto.
 *
 * Se pauso el 04/09/2026: la entrega automatica funciona en las pruebas pero
 * nunca ha pasado por una compra real, y no se cobra algo que no sabemos
 * entregar. Para reabrir: pon true aqui Y en AUDITORIA_ACTIVA de api/checkout.ts.
 * Son dos porque el servidor no puede importar de src/, y el freno de verdad
 * es el del servidor: sin el, un enlace viejo seguiria cobrando.
 */
export const AUDITORIA_ACTIVA = false;
