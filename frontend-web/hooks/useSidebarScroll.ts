import { RefObject, useEffect } from "react";
import { useRouter } from "next/router";

export default function useSidebarScroll(
  ref: RefObject<HTMLDivElement | null>,
  storageKey: string,
) {
  const router = useRouter();

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const restorePosition = () => {
      const savedPosition = sessionStorage.getItem(storageKey);

      if (savedPosition === null) {
        return;
      }

      const position = Number(savedPosition);

      if (!Number.isFinite(position)) {
        return;
      }

      requestAnimationFrame(() => {
        element.scrollTop = position;
      });
    };

    const savePosition = () => {
      sessionStorage.setItem(storageKey, String(element.scrollTop));
    };

    restorePosition();

    element.addEventListener("scroll", savePosition, { passive: true });

    const handleRouteChangeStart = () => {
      savePosition();
    };

    const handleRouteChangeComplete = () => {
      requestAnimationFrame(() => {
        restorePosition();
      });
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);

    router.events.on("routeChangeComplete", handleRouteChangeComplete);

    return () => {
      savePosition();

      element.removeEventListener("scroll", savePosition);

      router.events.off("routeChangeStart", handleRouteChangeStart);

      router.events.off("routeChangeComplete", handleRouteChangeComplete);
    };
  }, [ref, router.events, storageKey]);
}
