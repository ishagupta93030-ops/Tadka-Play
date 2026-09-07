// Format coins with commas (e.g. 1,000,000 🪙)
export function formatCoins(amount) {
  if (amount === undefined || amount === null) return '0';
  return Number(amount).toLocaleString('en-IN');
}

// Format countdown remaining time
export function getCountdown(targetDate) {
  const diff = new Date(targetDate) - new Date();
  if (diff <= 0) return { expired: true, text: 'LIVE NOW' };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return { expired: false, text: `${days}d ${hours % 24}h remaining` };
  }

  const pad = (n) => String(n).padStart(2, '0');
  return { expired: false, text: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` };
}

// Format Date string
export function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}
