import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface SubscriberGoalProps {
  target?: number; // e.g., 50000
}

export default function SubscriberGoal({ target = 50000 }: SubscriberGoalProps) {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const ref = doc(db, 'stats', 'subscribers');
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() as { count?: unknown } | undefined;
      setCount(typeof data?.count === 'number' ? data.count : 0);
    }, (err) => {
      console.warn('SubscriberGoal snapshot error', err);
    });
    return () => unsub();
  }, []);

  const pct = Math.min(100, Math.round((count / target) * 100));

  return (
    <div className="w-full max-w-3xl mx-auto p-4 bg-paper rounded-md shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold">Subscriber goal</h3>
          <p className="text-sm text-inkMuted">We're aiming for {target.toLocaleString()} subscribers. Help us reach the goal!</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-heading font-bold">{count.toLocaleString()}</div>
          <div className="text-sm text-inkMuted">of {target.toLocaleString()}</div>
        </div>
      </div>

      <div className="w-full bg-stone rounded h-3 overflow-hidden">
        <div
          className="h-3 bg-accent"
          style={{ width: `${pct}%`, transition: 'width 600ms ease' }}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <div className="mt-2 text-xs text-inkMuted">{pct}% of goal</div>
    </div>
  );
}
