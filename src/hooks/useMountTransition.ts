import { useEffect, useState } from "react";

/** Mantiene el componente montado `duration` ms después de que `active` pasa
 * a false, para poder reproducir una animación de salida antes de desmontar. */
export function useMountTransition(active: boolean, duration = 200) {
  const [shouldRender, setShouldRender] = useState(active);

  useEffect(() => {
    if (active) {
      setShouldRender(true);
      return;
    }
    const timer = setTimeout(() => setShouldRender(false), duration);
    return () => clearTimeout(timer);
  }, [active, duration]);

  return shouldRender;
}
