const { default: axios } = require("axios")
const { FbApiFull } = require("./FacebookApi")

const getThumbnails = (req, res) => {
    const { access_token, video_id } = req.query
    var data = {
        fields: "thumbnails,picture,length",
        access_token,
    }
    axios.get(FbApiFull + video_id, { params: data })
        .then((t) => {
            const { thumbnails } = t.data
            if (thumbnails) {
                if (thumbnails.data.length == 1) {
                    setTimeout(() => {
                        getThumbnails(req, res)
                    }, 2000);
                } else {
                    res.json(thumbnails.data)
                }
            } else if (t.error) {
                res.json({
                    error: "Error get thumbnails",
                    e: t.error,
                })
            } else {
                setTimeout(() => {
                    getThumbnails(req, res)
                }, 2000);
            }
        })
        .catch((e) => {
            res.json({
                error: "Error get thumbnails",
                e,
            })
        })
}






module.exports = {
    getThumbnails
}