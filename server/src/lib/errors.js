class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

/** Thrown when a vehicle already has a confirmed booking in the requested time range. */
class AvailabilityError extends HttpError {
  constructor(conflicts = []) {
    super(409, 'This vehicle is already confirmed for part of the time you selected.', {
      availability: 'unavailable',
      conflicts,
    });
  }
}

module.exports = { HttpError, AvailabilityError };
