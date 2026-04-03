import { Loader2, QrCode } from 'lucide-react';
import { useMemo, useState } from 'react';

const buildQrSrc = (value) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(value)}`;

export default function QrGenerator() {
  const [tableCount, setTableCount] = useState(10);
  const [downloading, setDownloading] = useState('');
  const [error, setError] = useState('');

  const tables = useMemo(() => {
    const origin = window.location.origin;

    return Array.from({ length: tableCount }, (_, index) => {
      const tableNumber = index + 1;
      const url = `${origin}/table/${tableNumber}`;

      return {
        tableNumber,
        url,
        qrSrc: buildQrSrc(url),
      };
    });
  }, [tableCount]);

  const handleDownload = async (qrSrc, tableNumber) => {
    setDownloading(String(tableNumber));
    setError('');

    try {
      const response = await fetch(qrSrc);
      const blob = await response.blob();
      const fileUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `table-${tableNumber}-qr.png`;
      link.click();
      URL.revokeObjectURL(fileUrl);
    } catch {
      setError('Unable to download this QR image right now.');
    } finally {
      setDownloading('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2>QR generator</h2>
          <p className="mt-1 text-sm text-textMuted">
            Print scan-to-order codes for each table in the dining room.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            value={tableCount}
            onChange={(event) =>
              setTableCount(Math.max(1, Number.parseInt(event.target.value || '1', 10) || 1))
            }
            className="premium-input w-24"
          />
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-black transition hover:bg-primaryDark"
          >
            Print all
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tables.map((table) => (
          <article
            key={table.tableNumber}
            className="rounded-[2rem] border border-white/5 bg-surface p-6 text-center shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <QrCode size={26} />
            </div>

            <h3 className="mt-4 text-xl font-bold">Table {table.tableNumber}</h3>
            <p className="mt-2 truncate text-xs text-textMuted">{table.url}</p>

            <div className="mt-5 rounded-3xl bg-white p-4">
              <img
                src={table.qrSrc}
                alt={`QR code for table ${table.tableNumber}`}
                className="mx-auto h-56 w-56 rounded-2xl object-cover"
              />
            </div>

            <button
              type="button"
              onClick={() => handleDownload(table.qrSrc, table.tableNumber)}
              disabled={downloading === String(table.tableNumber)}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-textMain transition hover:bg-white/5 disabled:opacity-60"
            >
              {downloading === String(table.tableNumber) ? (
                <Loader2 size={16} className="animate-spin" />
              ) : null}
              <span>Download PNG</span>
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
