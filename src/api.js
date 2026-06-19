const API_BASE_URL = '/api';

async function request(url, options = {}) {
  const headers = { ...options.headers };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  } else if (!options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let details = {};
    try {
      details = await response.json();
    } catch (e) {}
    throw {
      status: response.status,
      message: `API request failed on ${url}`,
      details,
    };
  }

  // DELETE requests might return no body (e.g. 204 No Content), check if there is content
  if (response.status === 204) return null;
  
  return await response.json();
}

export async function uploadImage(base64File) {
  return await request(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: JSON.stringify({ file: base64File })
  });
}

// --- DOCTORS ---
export async function fetchDoctors() {
  const data = await request(`${API_BASE_URL}/doctors/`);
  return data.results || [];
}

export async function createDoctor(doctorData) {
  return await request(`${API_BASE_URL}/doctors/`, {
    method: 'POST',
    body: JSON.stringify(doctorData),
  });
}

export async function updateDoctor(id, doctorData) {
  return await request(`${API_BASE_URL}/doctors/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(doctorData),
  });
}

export async function deleteDoctor(id) {
  return await request(`${API_BASE_URL}/doctors/${id}/`, {
    method: 'DELETE',
  });
}

// --- SPECIALTIES ---
export async function fetchSpecialties() {
  const data = await request(`${API_BASE_URL}/specialties/`);
  return data.results || [];
}

export async function createSpecialty(specialtyData) {
  return await request(`${API_BASE_URL}/specialties/`, {
    method: 'POST',
    body: JSON.stringify(specialtyData),
  });
}

export async function updateSpecialty(id, specialtyData) {
  return await request(`${API_BASE_URL}/specialties/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(specialtyData),
  });
}

export async function deleteSpecialty(id) {
  return await request(`${API_BASE_URL}/specialties/${id}/`, {
    method: 'DELETE',
  });
}

// --- CONDITIONS ---
export async function createCondition(conditionData) {
  return await request(`${API_BASE_URL}/conditions/`, {
    method: 'POST',
    body: JSON.stringify(conditionData),
  });
}

export async function deleteCondition(id) {
  return await request(`${API_BASE_URL}/conditions/${id}/`, {
    method: 'DELETE',
  });
}

// --- SERVICES ---
export async function fetchServices() {
  const data = await request(`${API_BASE_URL}/services/`);
  return data.results || [];
}

export async function fetchServiceDetail(slug) {
  return await request(`${API_BASE_URL}/services/${slug}/`);
}

export async function createService(serviceData) {
  return await request(`${API_BASE_URL}/services/`, {
    method: 'POST',
    body: JSON.stringify(serviceData),
  });
}

export async function updateService(slug, serviceData) {
  return await request(`${API_BASE_URL}/services/${slug}/`, {
    method: 'PATCH',
    body: JSON.stringify(serviceData),
  });
}

export async function deleteService(slug) {
  return await request(`${API_BASE_URL}/services/${slug}/`, {
    method: 'DELETE',
  });
}

// --- APPOINTMENTS ---
export async function fetchAppointments() {
  const data = await request(`${API_BASE_URL}/admin/appointments/`);
  return data.results || [];
}

export async function createAppointment(appointmentData) {
  return await request(`${API_BASE_URL}/appointments/`, {
    method: 'POST',
    body: JSON.stringify(appointmentData),
  });
}

export async function updateAppointmentStatus(id, status) {
  return await request(`${API_BASE_URL}/admin/appointments/${id}/status/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteAppointment(id) {
  try {
    return await request(`${API_BASE_URL}/admin/appointments/${id}/`, {
      method: 'DELETE',
    });
  } catch (err) {
    if (err.status === 405) {
      console.warn("DELETE not supported on appointments, falling back to PATCH status cancelled");
      return await updateAppointmentStatus(id, 'cancelled');
    }
    throw err;
  }
}

