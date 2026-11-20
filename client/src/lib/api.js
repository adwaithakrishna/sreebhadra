// Thin fetch wrapper. All server calls go through here so the UI never builds URLs ad hoc.
export class ApiError extends Error {
  constructor(status, message, data = {}) {
    super(message);
    this.status = status;
    this.data = data;
    this.fieldErrors = data.errors || {};
  }
}

async function request(path, { method = 'GET', body, form } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: form || (body ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
  }
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) throw new ApiError(res.status, data.message || 'Something went wrong. Please try again.', data);
  return data;
}

const qs = (o) => new URLSearchParams(o).toString();

export const api = {
  vehicles: () => request('/vehicles').then((d) => d.vehicles),
  busy: (id) => request(`/vehicles/${id}/busy`).then((d) => d.busy),
  availability: (id, startDate, endDate) => request(`/vehicles/${id}/availability?${qs({ startDate, endDate })}`),
  createBooking: (body) => request('/bookings', { method: 'POST', body }),
  track: (reference, email) => request(`/bookings/track?${qs({ reference, email })}`).then((d) => d.booking),
  bookingHistory: (phone) => request(`/bookings/history?${qs({ phone })}`).then((d) => d.bookings),
  submitFeedback: (body) => request('/feedback', { method: 'POST', body }),
  contact: (body) => request('/contact', { method: 'POST', body }),
  tripPhotos: () => request('/trip-photos').then((d) => d.trips),
  reviews: () => request('/reviews').then((d) => d.reviews),
  packages: () => request('/packages').then((d) => d.packages),
  package: (id) => request(`/packages/${id}`).then((d) => d.package),

  admin: {
    login: (email, password) => request('/admin/login', { method: 'POST', body: { email, password } }),
    logout: () => request('/admin/logout', { method: 'POST' }),
    me: () => request('/admin/me').then((d) => d.admin),
    stats: () => request('/admin/stats'),
    bookings: () => request('/admin/bookings').then((d) => d.bookings),
    setStatus: (id, status) => request(`/admin/bookings/${id}/status`, { method: 'PATCH', body: { status } }).then((d) => d.booking),
    vehicles: () => request('/admin/vehicles').then((d) => d.vehicles),
    createVehicle: (body) => request('/admin/vehicles', { method: 'POST', body }).then((d) => d.vehicle),
    updateVehicle: (id, body) => request(`/admin/vehicles/${id}`, { method: 'PUT', body }).then((d) => d.vehicle),
    deleteVehicle: (id) => request(`/admin/vehicles/${id}`, { method: 'DELETE' }),
    uploadImages: (id, files, altTexts) => {
      const form = new FormData();
      files.forEach((f) => form.append('images', f));
      altTexts.forEach((a) => form.append('altTexts', a));
      return request(`/admin/vehicles/${id}/images`, { method: 'POST', form }).then((d) => d.images);
    },
    updateImage: (id, imageId, body) => request(`/admin/vehicles/${id}/images/${imageId}`, { method: 'PATCH', body }).then((d) => d.image),
    deleteImage: (id, imageId) => request(`/admin/vehicles/${id}/images/${imageId}`, { method: 'DELETE' }),
    trips: () => request('/admin/trips').then((d) => d.trips),
    createTrip: ({ vehicle, destination, description, image }) => {
      const form = new FormData();
      form.append('vehicle', vehicle);
      form.append('destination', destination);
      form.append('description', description);
      form.append('image', image);
      return request('/admin/trips', { method: 'POST', form }).then((d) => d.trip);
    },
    deleteTrip: (id) => request(`/admin/trips/${id}`, { method: 'DELETE' }),
    feedback: () => request('/admin/feedback').then((d) => d.feedback),
    packages: () => request('/admin/packages').then((d) => d.packages),
    createPackage: (body) => request('/admin/packages', { method: 'POST', body }).then((d) => d.package),
    deletePackage: (id) => request(`/admin/packages/${id}`, { method: 'DELETE' }),
  },
};
