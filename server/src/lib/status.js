// Booking status rules shared by routes and services.

const STATUSES = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'];

// from -> allowed next states
const TRANSITIONS = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['cancelled', 'completed'],
  rejected: [],
  cancelled: [],
  completed: [],
};

const canTransition = (from, to) => (TRANSITIONS[from] || []).includes(to);

module.exports = { STATUSES, TRANSITIONS, canTransition };
