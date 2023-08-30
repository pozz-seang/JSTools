const { DB, DB_User } = require("../core/Database");
const { checkExpired } = require("./Date");

const GetUser = async (req, res) => {
    const { data, error } = await DB.from(DB_User).select(`id, username, email, expired, pe_image, facebook, cta_option, device_login, plan, role`).eq("id", req.user.id)
    if (error) return res.json({ error: "Error" });
    if (data[0].expired == "Never") {
        data[0].expiredStatus = false
    } else {
        data[0].expiredStatus = !checkExpired(data[0].expired)
    }
    res.status(201).json({ success: true, data: data[0] })
}

module.exports = {
    GetUser
}