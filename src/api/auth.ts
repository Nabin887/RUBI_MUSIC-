
const API_URL = 'http://localhost:4000/api';

export async function post(path: string, body: any) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    credentials: 'include', // Important for cookies
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function get(path: string, token: string) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_URL}${path}`, { 
      credentials: 'include', 
      headers: headers as HeadersInit 
  });
  return res.json();
}
