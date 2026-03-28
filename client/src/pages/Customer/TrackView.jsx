import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Clock, ChefHat, Check } from 'lucide-react';

export default function TrackView() {
  const { orderId } = useParams();
  const [status, setStatus] = useState('Pending');

  // Morphing statuses based on 2026 specs
  const statuses = [
    { id: 'Pending', label: 'Order Placed', icon: CheckCircle2, color: 'text-blue-400' },
    { id: 'Preparing', label: 'In the Kitchen', icon: ChefHat, color: 'text-orange-400' },
    { id: 'Ready', label: 'Ready to Serve', icon: Check, color: 'text-green-400' },
    { id: 'Completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-500' }
  ];

  useEffect(() => {
    // In a real app this would poll /api/orders/:id or use WebSockets
    if (!orderId) return;
    
    // Simulate status changes for demo
    const timer1 = setTimeout(() => setStatus('Preparing'), 4000);
    const timer2 = setTimeout(() => setStatus('Ready'), 10000);
    const timer3 = setTimeout(() => setStatus('Completed'), 15000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [orderId]);

  const currentIndex = statuses.findIndex(s => s.id === status);

  if (!orderId) {
     return (
        <div className="pt-24 px-4 flex flex-col items-center justify-center text-center opacity-70">
           <Clock size={48} className="mb-4 text-textMuted" />
           <p className="text-lg">No active order to track.</p>
           <p className="text-sm mt-2">Go to Menu and order something delicious.</p>
        </div>
     );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="pt-8 px-4 flex flex-col min-h-[80vh]"
    >
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Order Tracker</h1>
        <p className="font-mono text-sm text-textMuted max-w-[200px] mx-auto truncate">#{orderId}</p>
      </div>

      <div className="glass-panel p-6 rounded-[2rem] shadow-2xl relative overflow-hidden flex-grow flex flex-col items-center justify-center">
         {/* Morphing dynamic background based on status */}
         <motion.div 
           layout
           className="absolute inset-0 bg-gradient-to-tr from-surface to-transparent opacity-20 pointer-events-none"
           animate={{
             backgroundColor: 
               status === 'Pending' ? '#3b82f6' : 
               status === 'Preparing' ? '#fb923c' : 
               status === 'Ready' ? '#4ade80' : '#10b981'
           }}
           transition={{ duration: 1 }}
         />

         <div className="relative z-10 w-full max-w-xs mx-auto space-y-8">
            {statuses.map((step, index) => {
               const isActive = index <= currentIndex;
               const isCurrent = index === currentIndex;

               return (
                 <div key={step.id} className="flex items-center space-x-4">
                    <motion.div
                      layout
                      initial={{ scale: 0.8 }}
                      animate={{ 
                        scale: isCurrent ? 1.2 : 1,
                        opacity: isActive ? 1 : 0.3
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? typeof step.color === 'string' && step.color.replace('text', 'bg').replace('400', '500/20') || 'bg-white/10' : 'bg-surface'} border ${isActive ? 'border-transparent' : 'border-white/10'}`}
                    >
                       <step.icon size={24} className={isActive ? step.color : 'text-textMuted'} />
                    </motion.div>
                    
                    <div className="flex-1">
                       <h3 className={`text-lg font-semibold transition-colors ${isActive ? 'text-white' : 'text-textMuted'}`}>
                         {step.label}
                       </h3>
                       {isCurrent && index < statuses.length - 1 && (
                         <motion.p 
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: 'auto' }}
                           className="text-xs text-textMuted mt-1"
                         >
                            Estimated wait: ~{status === 'Pending' ? '15m' : '10m'}
                         </motion.p>
                       )}
                    </div>
                 </div>
               );
            })}
         </div>

         {/* Time estimate loader */}
         {status !== 'Completed' && (
            <motion.div 
              layout
              className="mt-12 w-full max-w-xs mx-auto h-2 bg-surface rounded-full overflow-hidden"
            >
               <motion.div
                 className="h-full bg-primary"
                 initial={{ width: "0%" }}
                 animate={{ width: `${(currentIndex / (statuses.length - 1)) * 100}%` }}
                 transition={{ duration: 1, ease: "easeInOut" }}
               />
            </motion.div>
         )}
      </div>
    </motion.div>
  );
}
