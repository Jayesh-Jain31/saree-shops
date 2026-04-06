import axios from 'axios'

const SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external'
let cachedToken = null
let tokenExpiry = null

export async function getShiprocketToken() {
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
        return cachedToken
    }
    const email = process.env.SHIPROCKET_EMAIL
    const password = process.env.SHIPROCKET_PASSWORD
    if (!email || !password) {
        throw new Error('Shiprocket credentials not configured. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.')
    }
    const res = await axios.post(`${SHIPROCKET_BASE}/auth/login`, { email, password })
    cachedToken = res.data.token
    tokenExpiry = Date.now() + 9 * 60 * 60 * 1000
    return cachedToken
}

export async function shiprocketPost(path, data) {
    const token = await getShiprocketToken()
    const res = await axios.post(`${SHIPROCKET_BASE}${path}`, data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
    return res.data
}

export async function shiprocketGet(path) {
    const token = await getShiprocketToken()
    const res = await axios.get(`${SHIPROCKET_BASE}${path}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return res.data
}
