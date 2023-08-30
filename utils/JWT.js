const { verify, sign } = require("jsonwebtoken")
require('dotenv').config();
const secretKey = process.env.secretKey
const bearApp = process.env.bearApp


const JWTVerify = (req, res, next) => {
    if (!req.body.access_token) return res.status(404).json({ success: false, msg: "Invalid Token!" })
    const access_token = req.body.access_token.split(bearApp).slice(1)[0]
    verify(access_token, secretKey, (err, user) => {
        if (err) return res.status(400).json({ success: false, msg: "Token is expired!", })
        req.user = user
        if (req.path == "/getresetpassword" || req.path == "/resetpassword") {
            if (!user.reset_password) return res.status(400).json({ success: false, msg: "Access Token is error!", })
            next()
            return
        }
        next()
    })
}


const CreateTokenLogin = (data) => {
    return bearApp + sign(data, secretKey)
}

const CreateTokenForgotPassword = (data) => {
    return bearApp + sign(data, secretKey, { expiresIn: "1h" })
}


module.exports = {
    JWTVerify,
    CreateTokenLogin,
    CreateTokenForgotPassword
}