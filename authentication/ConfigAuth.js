const express = require("express")
const { registerController, loginController, logoutController, forgotPasswordController, getResetPasswordController, resetPasswordController } = require("./AuthController")
const { JWTVerify, JWTVerifyResetPassword } = require("../utils/JWT")
const { GetUser } = require("../Function/GetUser")
const router = express.Router()

router.get('/', (req, res) => { res.send("none") })

router.post('/register', registerController)
router.post('/login', loginController)
router.post('/logout', JWTVerify, logoutController, GetUser)
router.post('/forgotpassword', forgotPasswordController)
router.post('/getresetpassword', JWTVerify, getResetPasswordController)
router.post('/resetpassword', JWTVerify, resetPasswordController)

module.exports = {
    ConfigAuthRouter: router
}