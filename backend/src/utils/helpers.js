// Generate unique ticket number
exports.generateTicketNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  
  return `IT-${year}${month}${day}-${random}`;
};

// Format date for display
exports.formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

// Calculate SLA status
exports.getSLAStatus = (slaDue, status) => {
  if (['closed', 'resolved', 'cancelled'].includes(status)) {
    return 'met';
  }
  
  const now = new Date();
  const due = new Date(slaDue);
  
  if (now > due) {
    return 'breached';
  }
  
  const hoursLeft = (due - now) / (1000 * 60 * 60);
  if (hoursLeft < 4) {
    return 'at_risk';
  }
  
  return 'on_track';
};
