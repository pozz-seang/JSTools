const { verify, sign } = require("jsonwebtoken")
const secretKey = "SKJSTOOLSBYJ.SEANG2023"
const bearApp = "JSTOOLS"


const JWTVerify = (req, res, next) => {
    const access_token = req.body.access_token.split(bearApp).slice(1)[0]
    verify(access_token, secretKey, (err, user) => {
        if (err) return res.json({ msg: "Somthing Wrong!" })
        req.user = user
        next()
    })
}

const JWTSign = (data) => {
    return bearApp + sign(data, secretKey)
}

module.exports = {
    JWTVerify,
    JWTSign
}