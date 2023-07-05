const { default: axios } = require("axios");

const DownloadVideos = (res, url) => {
    if (url.match(/youtu.be/) || url.match(/youtube.com/)) {
        axios.get('https://news.thecamtool.com/TikGet-main/yt.php?id=' + url)
            .then((response) => {
                const data = {
                    video: response.data.data.format,
                    caption: response.data.data.title,
                    status: true
                }
                res.json(data);
            })
            .catch((error) => {
                res.json(error);
            });
    } else if (url.match(/facebook.com/) || url.match(/fb.watch/)) {
        axios.post('https://camfb.thecamtool.com/core/ajax.php', { url, host: "facebook" }, { headers: { "Content-Type": "multipart/form-data" } })
            .then((response) => {
                const data = {
                    video: response.data.data.source[0],
                    caption: "",//response.data.data.text[0]
                    status: true
                }
                res.json(data);
            })
            .catch((error) => {
                res.json(error);
            });
    } else if (url.match(/tiktok.com/)) {
        // axios.post('https://dtiktok.heismauri.com/dtiktok.api', { url, version: "4.3.0" }, { headers: { "Content-Type": "multipart/form-data" } })
        //     .then((response) => {
        //         const data = {
        //             video: response.data.media[0].link,
        //             caption: "",
        //             status: true
        //         }
        //         res.json(data);
        //     })
        //     .catch((error) => {
        //         res.json(error);
        //     });
        axios.get('https://news.thecamtool.com/TikGet-main/exemple.php?url=' + url)
            .then((response) => {
                const data = {
                    video: response.data.video.download_url,
                    caption: response.data.video.title,
                    status: true
                }
                res.json(data);
            })
            .catch((error) => {
                res.json(error);
            });
    } else {
        const data = {
            msg: "No one",
            status: false
        }
        res.json(data);
    }
}

module.exports = {
    DownloadVideos
}