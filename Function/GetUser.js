const { DB, DB_User } = require("./Database");
const { checkExpired } = require("./Date");

const GetUser = async (req, res) => {
    const { data, error } = await DB.from(DB_User).select(`id, username, email, expired, pe_image, facebook, cta_option, plan, role`).eq("email", req.user.email)
    if (error) return res.json({ error: "Error" });
    data[0].expiredStatus = !checkExpired(data[0].expired)
    res.json(data[0])
}

module.exports = {
    GetUser
}
