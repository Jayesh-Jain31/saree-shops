import { OAuth2Client } from 'google-auth-library'
import UserModel from '../models/user.model.js'
import generatedAccessToken from '../utils/generatedAccessToken.js'
import genertedRefreshToken from '../utils/generatedRefreshToken.js'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export async function googleLoginController(request, response) {
    try {
        const { credential } = request.body

        if (!credential) {
            return response.status(400).json({
                message: "Google credential is required",
                error: true,
                success: false
            })
        }

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        })

        const payload = ticket.getPayload()
        const { sub: googleId, email, name, picture } = payload

        if (!email) {
            return response.status(400).json({
                message: "Could not get email from Google",
                error: true,
                success: false
            })
        }

        let user = await UserModel.findOne({ email })

        if (user) {
            if (user.status === 'Suspended') {
                return response.status(403).json({
                    message: "Your account has been suspended",
                    error: true,
                    success: false
                })
            }
            // Link Google ID if not already linked
            if (!user.googleId) {
                user.googleId = googleId
                if (!user.avatar && picture) user.avatar = picture
                await user.save()
            }
        } else {
            // Create new user via Google
            user = new UserModel({
                name,
                email,
                googleId,
                avatar: picture || "",
                verify_email: true,
                password: null
            })
            await user.save()
        }

        await UserModel.findByIdAndUpdate(user._id, { last_login_date: new Date() })

        const accesstoken = await generatedAccessToken(user._id)
        const refreshToken = await genertedRefreshToken(user._id)

        const cookiesOption = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }
        response.cookie('accessToken', accesstoken, cookiesOption)
        response.cookie('refreshToken', refreshToken, cookiesOption)

        return response.json({
            message: "Login successfully",
            error: false,
            success: true,
            data: {
                accesstoken,
                refreshToken
            }
        })

    } catch (error) {
        console.log("Google login error:", error.message)
        return response.status(500).json({
            message: "Google login failed. Please try again.",
            error: true,
            success: false
        })
    }
}
