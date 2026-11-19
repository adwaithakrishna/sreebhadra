import { useEffect } from 'react';
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · SreeBhadra` : 'SreeBhadra - Private vehicle hire for every journey';
  }, [title]);
}
