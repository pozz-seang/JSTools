const { default: axios } = require("axios");
const request = require("request");

const DownloadVideos = (req, res) => {
    const url = req.query.url
    if (!url) {
        const data = { msg: "No one", status: false }
        return res.json(data);
    }

    if (url.match(/youtu.be/) || url.match(/youtube.com/)) {
        DYT(res, url)
    } else if (url.match(/facebook.com/) || url.match(/fb.watch/)) {
        DFB(res, url)
    } else if (url.match(/tiktok.com/)) {
        DTT(res, url)
    } else {
        response(res, null, null, false, "Invalid link")
    }
}

const DFB = (res, url) => {
    let option = {
        method: "POST",
        url: "https://www.getfvid.com/downloader",
        formData: {
            url
        }
    }
    request(option, (error, result) => {
        if (error) throw new Error(error);
        let data = { caption: null, video: null }

        let private = result.body.match(/Uh-Oh! This video might be private and not publi/g)
        if (private) return response(res, data.video, data.caption, false, "This Video Is Private")

        let arrNama = [...result.body.matchAll(/<h5 class="card-title"><a href="(.+?)">(.*?)<\/a><\/h5>/g)]
        if (arrNama[0] != undefined) { data.caption = arrNama[0][2] }

        let arr = [...result.body.matchAll(/<a href="(.+?)" target="_blank" class="btn btn-download"(.+?)>(.+?)<\/a>/g)]

        if (arr[0]) {
            data.video = arr[0][1]
        } else if (arr[1]) {
            data.video = arr[0][1]
        } else {
            data.video = null
            response(res, data.video, data.caption, false, "Facebook video download failed")
            return
        }
        response(res, data.video, data.caption, true, "Successfully")

    })
}
const DTT = (res, url) => {
    axios.get('https://news.thecamtool.com/TikGet-main/exemple.php?url=' + url)
        .then((result) => {
            response(res, result.data.video.download_url, result.data.video.title, true, "Successfully")
        }).catch((error) => {
            response(res, null, null, false, "TikTok video download failed")
        });
}
const DYT = (res, url) => {
    axios.get('https://news.thecamtool.com/TikGet-main/yt.php?id=' + url)
        .then((result) => {
            response(res, result.data.data.format, result.data.data.title, true, "Successfully")
        }).catch((error) => {
            response(res, null, null, false, "YouTube video download failed")
        });
}

const response = (res, video, caption, status, message) => {
    const data = {
        video,
        caption,
        status,
        message
    }
    res.json(data)
}

module.exports = {
    DownloadVideos
}