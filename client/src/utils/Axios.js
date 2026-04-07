import axios from "axios";
import SummaryApi, { baseURL } from "../common/SummaryApi";

const Axios = axios.create({
    baseURL: baseURL,
    withCredentials: true,
})

// Attach access token from cookie automatically (withCredentials handles it)
// No localStorage needed — tokens live in httpOnly cookies
Axios.interceptors.request.use(
    async (config) => {
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// On 401, silently attempt a token refresh via cookie
Axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        let originRequest = error.config

        if (error.response?.status === 401 && !originRequest._retry) {
            originRequest._retry = true
            try {
                await Axios({ ...SummaryApi.refreshToken })
                return Axios(originRequest)
            } catch {
                return Promise.reject(error)
            }
        }

        return Promise.reject(error)
    }
)

export default Axios
