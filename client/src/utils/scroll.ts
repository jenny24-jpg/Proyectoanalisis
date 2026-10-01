/**
 * Utilidad de desplazamiento automático (Auto-Scroll to Top)
 * Garantiza el scroll al inicio tanto en el objeto window como en los contenedores con scroll interno del ERP (<main>).
 */
export const scrollToTop = (smooth: boolean = true) => {
  if (typeof window === 'undefined') return;

  const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto';

  // 1. Scroll en ventana global (window)
  try {
    window.scrollTo({ top: 0, left: 0, behavior });
  } catch {
    window.scrollTo(0, 0);
  }

  // 2. Scroll en elementos raíz del documento
  if (document.documentElement) {
    document.documentElement.scrollTop = 0;
  }
  if (document.body) {
    document.body.scrollTop = 0;
  }

  // 3. Scroll en el contenedor principal de la aplicación (<main> o contenedor con id)
  const mainContainers = document.querySelectorAll('main, #main-scroll-container, .overflow-y-auto');
  mainContainers.forEach((container) => {
    try {
      container.scrollTo({ top: 0, left: 0, behavior });
    } catch {
      container.scrollTop = 0;
    }
  });
};
