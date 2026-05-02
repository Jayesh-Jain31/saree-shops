import UserModel from "../models/user.model.js"
import jwt from 'jsonwebtoken'

const genertedRefreshToken = async(userId)=>{
    const secret = process.env.REFRESH_TOKEN_SECRET_KEY
        || process.env.SECRET_KEY_REFRESH_TOKEN
        || process.env.ACCESS_TOKEN_SECRET_KEY

    const token = await jwt.sign({ id : userId},
        secret,
        { expiresIn : '7d'}
    )

    const updateRefreshTokenUser = await UserModel.updateOne(
        { _id : userId},
        {
            refresh_token : token
        }
    )

    return token
}

export default genertedRefreshToken
