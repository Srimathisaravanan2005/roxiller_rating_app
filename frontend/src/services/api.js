const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		...options,
		credentials: 'include',
		headers: {
			...(options.body ? { 'Content-Type': 'application/json' } : {}),
			...options.headers,
		},
	})
	const payload = await response.json().catch(() => ({}))
	if (!response.ok) {
		const error = new Error(payload.error || 'The request could not be completed.')
		error.details = payload.details || {}
		error.status = response.status
		throw error
	}
	return payload
}

const sendJson = (method, body) => ({ method, body: JSON.stringify(body) })

const api = {
	auth: {
		login: (values) => request('/auth/login', sendJson('POST', values)),
		register: (values) => request('/auth/register', sendJson('POST', values)),
		me: () => request('/auth/me'),
		logout: () => request('/auth/logout', { method: 'POST' }),
		changePassword: (values) => request('/auth/password', sendJson('PATCH', values)),
	},
	stores: {
		list: (params = {}) => request(`/stores?${new URLSearchParams(params)}`),
	},
	ratings: {
		save: (storeId, rating) => request(`/ratings/${storeId}`, sendJson('PUT', { rating })),
		ownerSummary: () => request('/ratings/owner'),
	},
	admin: {
		stats: () => request('/admin/stats'),
		users: (params = {}) => request(`/admin/users?${new URLSearchParams(params)}`),
		user: (id) => request(`/admin/users/${id}`),
		createUser: (values) => request('/admin/users', sendJson('POST', values)),
		stores: (params = {}) => request(`/admin/stores?${new URLSearchParams(params)}`),
		createStore: (values) => request('/admin/stores', sendJson('POST', values)),
	},
}

export { API_BASE_URL, api }