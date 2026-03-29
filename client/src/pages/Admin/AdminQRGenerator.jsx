import { useMemo, useState } from 'react';
import { Printer, Download, Plus, Minus } from 'lucide-react';

export default function AdminQRGenerator() {
  const [tableCount, setTableCount] = useState(10);
  const baseUrl = window.location.origin;
  const tableCards = useMemo(
    () =>
      Array.from({ length: tableCount }, (_, i) => {
        const tableNum = i + 1;
        const url = `${baseUrl}/table/${tableNum}`;
        const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
        return { tableNum, url, qrSrc };
      }),
    [baseUrl, tableCount]
  );

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async (qrSrc, tableNum) => {
    const response = await fetch(qrSrc);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `table-${tableNum}-qr.png`;
    a.click();
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <div className="p-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/5">
        <div>
          <h2 className="text-2xl font-bold text-white">QR Generator</h2>
          <p className="text-textMuted text-sm">Generate scan-to-order codes for your tables</p>
        </div>
        <div className="flex items-center space-x-4">
            <div className="flex items-center bg-surface rounded-xl border border-white/10 p-1">
                <button 
                  onClick={() => setTableCount(Math.max(1, tableCount - 1))}
                  className="p-2 hover:bg-white/5 rounded-lg text-textMuted"
                >
                    <Minus size={16} />
                </button>
                <input 
                  type="number" 
                  value={tableCount}
                  onChange={(e) => setTableCount(parseInt(e.target.value) || 1)}
                  className="w-12 text-center bg-transparent font-bold text-white focus:outline-none"
                />
                <button 
                  onClick={() => setTableCount(tableCount + 1)}
                  className="p-2 hover:bg-white/5 rounded-lg text-primary"
                >
                    <Plus size={16} />
                </button>
            </div>
            <button 
              onClick={handlePrint}
              className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shadow-lg shadow-primary/25"
            >
                <Printer size={18} />
                <span className="font-semibold text-sm">Print All</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2">
        {tableCards.map(({ tableNum, url, qrSrc }) => {
          return (
            <div key={tableNum} className="glass-panel p-8 rounded-3xl flex flex-col items-center space-y-6 border border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => handleDownload(qrSrc, tableNum)} className="hover:text-primary">
                     <Download size={20} className="cursor-pointer" />
                   </button>
               </div>
               
               <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                   <span className="text-2xl font-black">T{tableNum}</span>
               </div>
               
               <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-inner">
                 <img src={qrSrc} alt={`Table ${tableNum} QR`} className="w-full h-full object-cover rounded-lg" />
               </div>

               <div className="text-center">
                   <p className="text-xs font-bold text-textMuted uppercase tracking-widest mb-1">Scan to order</p>
                   <p className="text-sm font-mono opacity-50 truncate w-40">{url}</p>
               </div>
            </div>
          );
        })}
      </div>
      
      {/* Print-only Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; background: white !important; color: black !important; }
          .print\\:grid-cols-2, .print\\:grid-cols-2 * { visibility: visible; }
          .glass-panel { border: 1px solid #eee !important; box-shadow: none !important; margin-bottom: 2rem; break-inside: avoid; }
          aside, header, button, input { display: none !important; }
        }
      `}} />
    </div>
  );
}
