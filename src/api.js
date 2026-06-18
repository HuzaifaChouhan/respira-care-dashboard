const API_BASE_URL = 'https://api.husnoorinfotech.in/api';

export async function fetchDoctors() {
  const response = await fetch(`${API_BASE_URL}/doctors/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch doctors: ${response.statusText}`);
  }
  const data = await response.json();
  return data.results || [];
}

export async function fetchSpecialties() {
  const response = await fetch(`${API_BASE_URL}/specialties/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch specialties: ${response.statusText}`);
  }
  const data = await response.json();
  return data.results || [];
}

export async function fetchServices() {
  const response = await fetch(`${API_BASE_URL}/services/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch services: ${response.statusText}`);
  }
  const data = await response.json();
  return data.results || [];
}

export async function createAppointment(appointmentData) {
  const response = await fetch(`${API_BASE_URL}/appointments/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(appointmentData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      status: response.status,
      message: `Failed to create appointment: ${response.statusText}`,
      details: errorData,
    };
  }
  return await response.json();
}
