import { format, isPast, isToday, parseISO } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '—';
  return format(parseISO(date.split('T')[0]), 'MMM d, yyyy');
};

export const isOverdue = (deadline, status) => {
  if (!deadline || status === 'completed') return false;
  return isPast(parseISO(deadline.split('T')[0])) && !isToday(parseISO(deadline.split('T')[0]));
};

export const isDueToday = (deadline) => {
  if (!deadline) return false;
  return isToday(parseISO(deadline.split('T')[0]));
};

export const priorityOrder = { high: 0, medium: 1, low: 2 };

export const getPriorityColor = (priority) => {
  const map = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
  return map[priority] || 'badge-low';
};

export const getStatusColor = (status) => {
  const map = { completed: 'badge-completed', pending: 'badge-pending', in_progress: 'badge-in_progress' };
  return map[status] || 'badge-pending';
};
