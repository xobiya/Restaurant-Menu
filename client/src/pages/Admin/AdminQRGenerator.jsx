import { useState } from 'react';
import { QrCode, Printer, Download, Plus, Minus } from 'lucide-react';

export default function AdminQRGenerator() {
  const [tableCount, setTableCount] = useState(10);
  const baseUrl = window.location.origin;

  const handlePrint = () => {
    window.print();
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
        {[...Array(tableCount)].map((_, i) => {
          const tableNum = i + 1;
          const url = `${baseUrl}/table/${tableNum}`;
          
          return (
            <div key={tableNum} className="glass-panel p-8 rounded-3xl flex flex-col items-center space-y-6 border border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                   <Download size={20} className="cursor-pointer hover:text-primary" />
               </div>
               
               <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                   <span className="text-2xl font-black">T{tableNum}</span>
               </div>
               
               {/* Mock QR Code UI */}
               <div className="w-48 h-48 bg-white p-4 rounded-xl shadow-inner relative">
                    <div className="w-full h-full bg-[radial-gradient(#121212_1px,transparent_1px)] [background-size:8px_8px] opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <QrCode size={120} className="text-[#121212]" strokeWidth={1.5} />
                    </div>
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
