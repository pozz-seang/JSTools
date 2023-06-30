const { default: axios } = require("axios")
const { FbApiFull } = require("./FacebookApi")
const { createTransport } = require("nodemailer")

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


const sendEmail = (email) => {
    const systemEmail = "JSTOOLS168@gmail.com"
    createTransport({
        service: "gmail",
        auth: {
            user: systemEmail,
            pass: "ovhxhzppuflkjmqv"
        },
        tls: {
            rejectUnauthorized: false
        }
    }).sendMail({
        from: `JSTools <${systemEmail}>`,
        to: email,
        subject: "Reset Password Notification",
        name: "Updates",
        html: { path: "./thememail.html" },
        text: "Test sent email!!",
    }, function (err, success) {
        if (err) console.log(err)
        else console.log("Email sent successfully!")
    })
}

const getPEImage = ()=>{
    
}



module.exports = {
    getThumbnails,
    sendEmail
}