import { useEffect, useState } from 'react';
import { getItem, setItem } from '../lib/storage';

const KEY = '@kumbu_report_order';

export const DEFAULT_ORDER = [
  'insights', 'evolution', 'categories',
  'top5', 'ytd', 'balance-history', 'dow', 'by-account', 'vs-initial',
];

export function useReportOrder() {
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);

  useEffect(() => {
    getItem<string[]>(KEY).then((stored) => {
      if (stored && stored.length > 0) {
        // merge: keep new sections not yet saved
        const merged = [
          ...stored.filter((id) => DEFAULT_ORDER.includes(id)),
          ...DEFAULT_ORDER.filter((id) => !stored.includes(id)),
        ];
        setOrder(merged);
      }
    });
  }, []);

  const saveOrder = async (next: string[]) => {
    setOrder(next);
    await setItem(KEY, next);
  };

  return { order, saveOrder };
}
