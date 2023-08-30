const { default: axios } = require("axios")
const { GetDate } = require("./Date")
const { FbApiFull } = require("./FacebookApi")


const adcreatives = (req, res) => {
    const { accessToken, adAccounts, page, videoId, thunmbnail, PEImgage, caption, actionButton, CTALink, CTAHeader } = req.body

    var pageId = page.id
    var pageName = page.name
    var cta_link
    var cta_link_title
    var cta_value = {}
    var cta_type = actionButton

    if (CTALink == "") cta_link = "https://web.facebook.com/" + pageId
    else cta_link = CTALink

    if (CTAHeader == "") cta_link_title = "https://web.facebook.com/" + pageName
    else cta_link_title = CTAHeader

    if (cta_type == "LIKE_PAGE") cta_value["page"] = pageId
    else cta_value["link"] = cta_link

    var cta = { type: cta_type, value: cta_value, }

    var d = {
        name: GetDate,
        object_story_spec: {
            page_id: pageId,
            link_data: {
                message: caption,
                caption: cta_link,
                link: cta_link,
                multi_share_optimized: true,
                multi_share_end_card: false,
                child_attachments: [{
                    name: cta_link_title,
                    link: cta_link,
                    video_id: videoId,
                    picture: thunmbnail,
                    call_to_action: cta
                },
                {
                    name: pageName,
                    link: cta_link,
                    picture: PEImgage,
                    call_to_action: cta
                }
                ]
            }
        },
        degrees_of_freedom_spec: {
            creative_features_spec: {
                standard_enhancements: {
                    enroll_status: "OPT_IN"
                }
            },
        },
        access_token: accessToken
    }
    axios.post(FbApiFull + adAccounts + "/adcreatives", d)
        .then((creative) => {
            console.log("creative: " + creative.data.id);
            if (creative.data.id) {
                res.json(creative.data.id)
            } else {
                res.json({
                    msg: "សូម Refresh Chrome និង បិទបើកយន្តហោះ រឺ wifiហើយផុសម្តងទៀត",
                    e: creative.data.error,
                })
            }
        })
        .catch((e) => {
            res.json({
                msg: "Error Creative",
                e: e,
            })
            console.log("creative E: " + e);
        })



}

const effective_object_story_id = (req, res) => {
    const { access_token, creativeID } = req.query
    var data = {
        access_token,
        fields: "effective_object_story_id"
    }
    axios.get(FbApiFull + creativeID, { params: data })
        .then((c) => {
            const { effective_object_story_id } = c.data
            console.log("ca: " + effective_object_story_id);
            if (effective_object_story_id) {
                res.json(effective_object_story_id)
            } else {
                setTimeout(() => {
                    try_effective_object_story_id(req, res)
                }, 5000);
            }
        })
        .catch((e) => {
            res.json({
                msg: "Error effective_object_story_id",
                e: e,
            })
            console.log("effective_object_story_id E: " + e);
        })
}
const try_effective_object_story_id = (req, res) => {
    effective_object_story_id(req, res)
}

const publishPost = (req, res) => {
    const { page, effective_object_story_id } = req.body
    var publish_type = "publish"
    var d = {
        access_token: page.access_token
    }
    if (publish_type == "publish") {
        d["is_published"] = true;
        axios.post(FbApiFull + effective_object_story_id, d)
            .then((e) => {
                res.json({ msg: "published" })
            })
            .catch((e) => {
                res.json({
                    msg: "Error publish",
                    e: e,
                })
                console.log("publish E: " + e);
            })
    }
}

module.exports = {
    adcreatives,
    effective_object_story_id,
    publishPost
}





// const data = req.body
// var access_token = data.accessToken
// var adAccount = data.adAccounts
// var pageId = data.page.id
// var pageName = data.page.name
// var pageToken = data.page.access_token
// var video_id = data.videoId
// var video_thumbnail = data.thunmbnail
// var pe_image = data.PEImgage
// var caption = data.caption
// var cta_link
// var cta_link_title
// var cta_value = {}
// var cta_type = data.actionButton

// if (data.CTALink == "") cta_link = "https://web.facebook.com/" + pageId
// else cta_link = data.CTALink

// if (data.CTAHeader == "") cta_link_title = "https://web.facebook.com/" + pageName
// else cta_link_title = data.CTAHeader

// if (cta_type == "LIKE_PAGE") cta_value["page"] = pageId
// else cta_value["link"] = cta_link

// var cta = {
//     type: cta_type,
//     value: cta_value,
// }


// var d = {
//     name: date,
//     object_story_spec: {
//         page_id: pageId,
//         link_data: {
//             message: caption,
//             caption: cta_link,
//             link: cta_link,
//             multi_share_optimized: true,
//             multi_share_end_card: false,
//             child_attachments: [{
//                 name: cta_link_title,
//                 link: cta_link,
//                 video_id: video_id,
//                 picture: video_thumbnail,
//                 call_to_action: cta
//             },
//             {
//                 name: pageName,
//                 link: cta_link,
//                 picture: pe_image,
//                 call_to_action: cta
//             }
//             ]
//         }
//     },
//     degrees_of_freedom_spec: {
//         creative_features_spec: {
//             standard_enhancements: {
//                 enroll_status: "OPT_IN"
//             }
//         },
//     },
//     access_token: access_token
// }
// axios.post(apiFb + v_api + adAccount + "/adcreatives", d)
//     .then((creative) => {
//         console.log("creative: " + creative.data.id);
//         if (creative.data.id) {
//             res.json(creative.data.id)
//         } else {
//             res.json({
//                 msg: "សូម Refresh Chrome និង បិទបើកយន្តហោះ រឺ wifiហើយផុសម្តងទៀត",
//                 e: creative.data.error,
//             })
//         }
//     })
//     .catch((e) => {
//         res.json({
//             msg: "Error Creative",
//             e: e,
//         })
//         console.log("creative E: " + e);
//     })