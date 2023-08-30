const { DB, DB_User } = require("../core/Database")
const { GetUser } = require("./GetUser")

 
const getCTAOption = async (req, res) => {
    const { id } = req.user
    try {
        if (email) {
            const { data, error } = await DB.from(DB_User).select(`cta_option`).eq("id", id)
            if (error) return res.json({ error: "Getting Error" })
            res.json(data[0])
        } else {
            console.log("Getting Error");
            res.json({ error: "Getting Error" })
        }
    } catch (e) {
        console.log("Getting Error", e);
        res.json({ error: "Getting Error" })
    }
}
const addCTAOption = async (req, res) => {
    const { id } = req.user
    const AllCTA = await DB.from(DB_User).select(`cta_option`).eq("id", id)
    if (AllCTA.error) return res.json({ error: "error add cta option" })
    var AllCTAOld = AllCTA.data[0].cta_option
    var NewDataCTA = [req.body.cta_option, ...AllCTAOld]
    const update = await DB.from(DB_User).update({ cta_option: NewDataCTA }).eq("id", id)
    if (update.error) return res.json({ error: "error add cta option" })
    GetUser(req, res)
}
const removeCTAOption = async (req, res) => {
    const { id } = req.user
    const { key } = req.body
    const AllCTA = await DB.from(DB_User).select(`cta_option`).eq("id", id)
    if (AllCTA.error) return res.json({ error: "error remove cta option" })
    var AllCTAOld = AllCTA.data[0].cta_option
    var NewDataCTA = AllCTAOld.filter((value, index, arr) => { return key != index; });
    const update = await DB.from(DB_User).update({ cta_option: NewDataCTA }).eq("id", id)
    if (update.error) return res.json({ error: "error remove cta option" })
    GetUser(req, res)
}


module.exports = {
    getCTAOption,
    addCTAOption,
    removeCTAOption
}