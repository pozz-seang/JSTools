const { DB, DB_User } = require("./Database")

const getAllUserAdmin = async (req, res) => {
    const { email } = req.user
    try {
        if (email) {
            const { data, error } = await DB.from(DB_User).select(`role`).eq('email', email)
            if (error) return res.json({ error: "Getting Error" })
            if (data[0].role != "admin") return res.json({ msg: "Your Role is not Admin" })
            const getDataUser = await DB.from(DB_User).select(`id, username, email, expired, plan, role, created_at`).order('id')
            if (getDataUser.error) return res.json({ error: "Getting Error" })
            res.json(getDataUser.data)
        } else {
            console.log("Getting Error");
            res.json({ error: "Getting Error" })
        }
    } catch (e) {
        console.log("Getting Error", e);
        res.json({ error: "Getting Error" })
    }
}
const addMonthsForUserAdmin = async (req, res) => {
    const { email } = req.user
    const { user } = req.body
    try {
        if (email) {
            const { data, error } = await DB.from(DB_User).select(`role`).eq('email', email)
            if (error) return res.json({ error: "Getting Error" })
            if (data[0].role != "admin") return res.json({ msg: "Your Role is not Admin" })
            const upload = await DB.from(DB_User).update({ plan: user.plan, expired: user.expires }).eq('id', user.id)
            if (upload.error) return res.json({ error: "Update Error" })
            const getDataUser = await DB.from(DB_User).select(`id, username, email, expired, plan, role, created_at`).order('id')
            if (getDataUser.error) return res.json({ error: "Getting Error" })
            res.json(getDataUser.data)
        } else {
            res.json({ error: "Getting Error" })
        }
    } catch (e) {
        console.log("Getting Error", e);
        res.json({ error: "Getting Error" })
    }
}

module.exports = {
    getAllUserAdmin,
    addMonthsForUserAdmin
}