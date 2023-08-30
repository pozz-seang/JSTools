const { DB, DB_User } = require("../../core/Database")

const CheckUsername = async (username) => {
    const res = await DB.from(DB_User).select(`username`).eq("username", username)
    if (res.error) return { success: false, msg: "Check username is error!" }
    if (res.data[0]) return { success: false, msg: "This username is already taken" }
    return true
}

const CheckEmail = async (email) => {
    const res = await DB.from(DB_User).select(`email`).eq("email", email)
    if (res.error) return { success: false, msg: "Check email is error!" }
    if (res.data[0]) return { success: false, msg: "This email is already taken" }
    return true
}



module.exports = {
    CheckUsername,
    CheckEmail
}