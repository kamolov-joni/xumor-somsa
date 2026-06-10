import { useState, useEffect } from 'react';
import { getTimeRemaining, formatTimeRemaining } from '../utils/notifications';
import { getUrgencyClass } from '../utils/helpers';

const CountdownTimer = ({ deliveryDate, deliveryTime, status }) => {
  const [timeStr, setTimeStr] = useState('');
  const [urgency, setUrgency] = useState('normal');

  useEffect(() => {
    if (status === 'delivered' || status === 'cancelled') {
      setTimeStr(status === 'delivered' ? '✅ Yetkazildi' : '❌ Bekor qilindi');
      return;
    }

    const update = () => {
      const remaining = getTimeRemaining(deliveryDate, deliveryTime);
      setTimeStr(formatTimeRemaining(remaining));
      setUrgency(getUrgencyClass(deliveryDate, deliveryTime));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deliveryDate, deliveryTime, status]);

  if (status === 'delivered' || status === 'cancelled') {
    return <span className="countdown-done">{timeStr}</span>;
  }

  return (
    <div className={`countdown-timer countdown-${urgency}`}>
      <span className="countdown-digits">{timeStr}</span>
      <span className="countdown-label">
        {urgency === 'overdue' ? 'Kechikmoqda!' : 'Qolgan vaqt'}
      </span>
    </div>
  );
};

export default CountdownTimer;
