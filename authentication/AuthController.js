const { hash, compare } = require("bcrypt")
const { addDate } = require("../Function/Date")
const { CreateTokenLogin, CreateTokenForgotPassword } = require("../utils/JWT")
const { DeviceLogin } = require("./DeviceLogin")
const { CheckUsername, CheckEmail } = require("../utils/DB/CheckData")
const { DB, DB_User } = require("../core/Database")
const { sendEmail } = require("../utils/email")


const registerController = async (req, res) => {
    const { username, email, password, device_id } = req.body

    if (!username || !email || !password || !device_id) return res.status(400).json({ success: false, msg: "Please fill in all fields!" })
    if (!/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/.test(email)) return res.status(400).json({ success: false, msg: "Please enter valid email!" })
    if (password.length < 8) return res.status(400).json({ success: false, msg: "Password should be alteast of length 8!" })

    try {
        const dataCheck = { username: "", email: "", }
        if ((dataCheck.username = await CheckUsername(username)) != true) return res.status(400).json(dataCheck.username)
        if ((dataCheck.email = await CheckEmail(email)) != true) return res.status(400).json(dataCheck.email)


        const data = { username: username, email: email, password: '', expired: addDate("d", 1), device_login: [DeviceLogin(device_id, req.headers['user-agent'])], facebook: [], pe_image: [], cta_option: [] }
        data.password = await hash(password, 10)

        const createUser = await DB.from(DB_User).insert([data])
        if (createUser.error) return res.status(400).json({ success: false, msg: "Register Error!" })
        DB.from(DB_User).select(`id, email, password`).eq("email", email)
            .then((result) => {
                const { data, error } = result
                if (error) return res.status(400).json({ success: false, msg: "Register Error!!" })

                const access_token = CreateTokenLogin({ id: data[0].id })

                res.status(200).json({ success: true, msg: "Register successfuly!", access_token })

            }).catch((e) => {
                res.status(400).json({ success: false, msg: "Register Error!!!" })
            })
    } catch (e) {
        res.status(400).json({ success: false, msg: "Register Error!!!!" })
    }
}

const loginController = (req, res) => {
    const { email, password, device_id } = req.body
    if (!email || !password) return res.status(400).json({ success: false, msg: "Email and Password are required." })
    if (!/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/.test(email)) return res.status(400).json({ success: false, msg: "Please enter valid email!" })
    DB.from(DB_User).select(`id, email, password, device_login`).eq("email", req.body.email)
        .then(async (result) => {
            const { data, error } = result
            if (error) return res.status(400).json({ success: false, msg: "Login Error!" })
            if (!data[0]) return res.status(400).json({ success: false, msg: " Your email is invalid!" })

            const veryifyPassword = await compare(password, data[0].password);
            if (!veryifyPassword) return res.status(400).json({ success: false, msg: "Your password is invalid!" })

            //log user login to account
            var DataLogin = data[0].device_login.filter((value, index, arr) => { return req.body.device_id != value.deviceId });
            await DB.from(DB_User).update({ device_login: [DeviceLogin(device_id, req.headers['user-agent']), ...DataLogin] }).eq("email", email)

            res.status(200).json({ success: true, msg: 'You are loggedin successfully!', access_token: CreateTokenLogin({ id: data[0].id }) })


            // compare(password, data[0].password, async (err, result) => {
            //     if (err) return res.status(400).json({ success: false, msg: "Login Error!!" })
            //     if (!result) return res.status(400).json({ success: false, msg: "Your password is invalid!" })

            //     var DataLogin = data[0].device_login.filter((value, index, arr) => { return req.body.device_id != value.deviceId });
            //     var NewDataLogin = [DeviceLogin(device_id, req.headers['user-agent']), ...DataLogin]
            //     await DB.from(DB_User).update({ device_login: NewDataLogin }).eq("email", email)

            //     const access_token = CreateTokenLogin({ id: data[0].id })
            //     try {
            //         res.status(201).json({ success: true, access_token })
            //     } catch (e) {
            //         res.status(400).json({ success: false, msg: "Login Error!!!" })
            //     }
            // })
        }).catch((e) => {
            res.status(400).json({ success: false, msg: "Login Error!!!!" })
        })
}

const logoutController = async (req, res, next) => {
    const { device_id } = req.body
    const { id } = req.user

    DB.from(DB_User).select(`device_login`).eq("id", id)
        .then(async (result) => {
            const { data, error } = result
            if (error) return res.status(400).json({ success: false, msg: "Logout Error!" })
            var DataLogin = data[0].device_login.filter((value, index, arr) => {
                if (device_id == value.deviceId) value.status = false
                return true
            });

            await DB.from(DB_User).update({ device_login: DataLogin }).eq("id", id)

            next()

        }).catch((e) => {
            res.status(400).json({ success: false, msg: "Logout Error!!!!" })
        })
}

const checkLogout = async (req, res, next) => {
    if (!req.user.id) return res.status(201).json({ success: false, msg: "Your Device is expired session" })
    const { data, error } = await DB.from(DB_User).select(`device_login`).eq("id", req.user.id)
    if (error) return res.status(400).json({ success: false, msg: "check is login error!" })

    if (!data[0]) return res.status(201).json({ success: false, msg: "Your Device is expired session" })

    const { device_login } = data[0]
    var DataLogin = device_login.filter((value, index, arr) => { return req.body.device_id == value.deviceId });

    if (!DataLogin[0] || DataLogin[0].status == false) return res.status(201).json({ success: false, msg: "Your Device is expired session" })
    next()
}

const forgotPasswordController = async (req, res) => {
    const { email } = req.body
    if (!email) return res.status(400).json({ success: false, msg: "Please enter valid email" })
    if (!/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/.test(email)) return res.status(400).json({ success: false, msg: "Please enter valid email!" })

    try {
        const DBEmail = await DB.from(DB_User).select(`id, email, username`).eq("email", email)
        if (DBEmail.error) return res.status(400).json({ success: false, msg: "Forgot password error please try again" })
        if (!DBEmail.data[0]) return res.status(404).json({ success: false, msg: "This Email doesn't have a user!" })

        const token = CreateTokenForgotPassword({ id: DBEmail.data[0].id, reset_password: true })
        //192.168.1.11:3000 to JSTools.co
        const link = "http://192.168.1.11:3000/reset_password/" + token

        //send email to user and check success or false
        if (await sendEmail(DBEmail.data[0].email, DBEmail.data[0].username, link)) {
            res.status(404).json({ success: false, msg: "Error in sending email!" })
        } else {
            await DB.from(DB_User).update({ reset_password: token }).eq("email", email)
            res.status(201).json({ success: true, msg: "Email Sent!" })
        }
    } catch (e) {
        return res.status(400).json({ success: false, msg: "Forgot password error please try again!" })
    }


    // DB.from(DB_User).select(`id, email, password, device_login`).eq("email", email)
    //     .then(async (result) => {
    //         const { data, error } = result
    //         if (error) return res.status(400).json({ success: false, msg: "Forgot Password Controller Error!" })
    //         if (!data[0]) return res.status(400).json({ success: false, msg: " Your email is invalid!" })

    //         // const veryifyPassword = await compare(password, data[0].password);
    //         // if (!veryifyPassword) return res.status(400).json({ success: false, msg: "Your password is invalid!" })

    //         // //log user login to account
    //         // var DataLogin = data[0].device_login.filter((value, index, arr) => { return req.body.device_id != value.deviceId });
    //         // await DB.from(DB_User).update({ device_login: [DeviceLogin(device_id, req.headers['user-agent']), ...DataLogin] }).eq("email", email)

    //         // res.status(200).json({ success: true, msg: 'You are loggedin successfully!', access_token: CreateTokenLogin({ id: data[0].id }) })


    //     }).catch((e) => {
    //         res.status(400).json({ success: false, msg: "Forgot Password Controller Error!!!!" })
    //     })

}

const getResetPasswordController = async (req, res) => {
    const dataUser = await DB.from(DB_User).select(`id, email, reset_password`).eq("id", req.user.id)
    if (dataUser.error) return res.status(400).json({ success: false, msg: "Get reset password error please try again" })
    if (!dataUser.data[0]) return res.status(404).json({ success: false, msg: "User doesn't have!" })
    if (!dataUser.data[0].reset_password) return res.status(404).json({ success: false, msg: "Invalid Token!" })
    res.status(200).json({ success: true, data: dataUser.data[0], msg: "Get reset password is successfully!" })
}

const resetPasswordController = async (req, res) => {
    const { access_token, password } = req.body

    if (!password) return res.status(400).json({ success: false, msg: "Please fill in all fields!" })
    if (password.length < 8) return res.status(400).json({ success: false, msg: "Password should be alteast of length 8!" })

    try {
        let passwordhash = await hash(password, 10)
        const dataUser = await DB.from(DB_User).select(`id, email, reset_password`).eq("id", req.user.id)
        if (dataUser.error) return res.status(400).json({ success: false, msg: "Reset password error please try again" })
        if (!dataUser.data[0]) return res.status(404).json({ success: false, msg: "User doesn't have!" })
        if (!dataUser.data[0].reset_password) return res.status(404).json({ success: false, msg: "Invalid Token!" })
        await DB.from(DB_User).update({ reset_password: "", password: passwordhash }).eq("reset_password", access_token)
        res.status(200).json({ success: true, msg: "Reset password is successfully!" })
    } catch (error) {
        res.status(400).json({ success: false, msg: "Reset password is error!" })
    }

}


module.exports = {
    registerController,
    loginController,
    logoutController,
    checkLogout,
    forgotPasswordController,
    getResetPasswordController,
    resetPasswordController
}
