import axios from "axios";
import SummaryApi, { baseURL } from "../common/SummaryApi";

const Axios = axios.create({
    baseURL: baseURL,
    withCredentials: true,
})

// ── Shared refresh-token deduplication ──────────────────────────────────────
// If multiple 401s arrive simultaneously, only ONE refresh call is made.
// All pending requests wait for that single refresh and then retry.
let isRefreshing = false
let failedRequestQueue = []

function processQueue(error) {
    failedRequestQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error)
        } else {
            resolve()
        }
    })
    failedRequestQueue = []
}

// ── Request interceptor ──────────────────────────────────────────────────────
Axios.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
)

// ── Response interceptor — handle 401 with single shared refresh ─────────────
Axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originRequest = error.config

        // Don't retry the refresh-token endpoint itself
        if (
            error.response?.status === 401 &&
            !originRequest._retry &&
            !originRequest.url?.includes('refresh-token')
        ) {
            if (isRefreshing) {
                // Another refresh is already in progress — queue this request
                return new Promise((resolve, reject) => {
                    failedRequestQueue.push({ resolve, reject })
                }).then(() => Axios(originRequest))
                  .catch(() => Promise.reject(error))
            }

            originRequest._retry = true
            isRefreshing = true

            try {
                await Axios({ ...SummaryApi.refreshToken })
                processQueue(null)
                return Axios(originRequest)
            } catch (refreshError) {
                processQueue(refreshError)
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

export default Axios
