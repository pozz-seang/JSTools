const express = require("express");
const cors = require("cors");
const firebase = require('firebase/app')
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require("firebase/storage");
var path = require('path');
const { default: axios } = require("axios");
const { adcreatives, effective_object_story_id, publishPost } = require("./Function/PostPE");
const { Random } = require("./Function/random");
const { getThumbnails } = require("./Function/Functions");
const { videosStorage, peImagesStorage } = require("./Function/Storage");
const { FbApiFull } = require("./Function/FacebookApi");
const { GetDate } = require("./Function/Date");
const { GetUser } = require("./Function/GetUser");
const QRCode = require('qrcode');
const { GeneratePaymentMethod, CheckUser } = require("./Function/PaymentMethod");
const { firebaseConfig } = require("./core/firebase");
const { DownloadVideos } = require("./Function/DownloadVideo");
const { getCTAOption, addCTAOption, removeCTAOption } = require("./Function/CTAOptions");
const { getAllUserAdmin, addMonthsForUserAdmin } = require("./Function/AdminDashboard");
const { ConfigAuthRouter } = require("./authentication/ConfigAuth");
const { checkLogout } = require("./authentication/AuthController");
const { JWTVerify } = require("./utils/JWT");
const { DB_User, DB, DB_PaymentMethod } = require("./core/Database");
require('dotenv').config();




const PEImagePath = "PEImage/"

const app = express();

app.listen(process.env.PORT || 80, () => console.log("Server is running...!"));
app.use(cors({
    origin: [
        "https://jstool.netlify.app",
        "https://jstools.co",
        "http://192.168.1.11:3000"
    ],
    credentials: true,
}));

app.use(express.json());
app.use(express.static(path.resolve('./public')));


app.use("/auth", ConfigAuthRouter)


app.get("/", (req, res) => {
    res.send("This is a Server...");
});

//trov tver leng vinh
app.post('/requestpayment', JWTVerify, async (req, res) => {
    const findMd5ByID = await DB.from(DB_PaymentMethod).select("*").eq("userid", req.user.id)
    if (findMd5ByID.data[0]) {
        console.log(findMd5ByID.data[0]);
        const { plan, months, userid, qr, md5 } = findMd5ByID.data[0]
        var price = 0
        if (plan == "starter") price = 2 * months
        else if (plan == "premium") price = 3 * months
        else if (plan == "business") price = 5 * months
        price -= 0.01

        const resForUser = {
            price,
            qr: "",
            md5
        }
        QRCode.toFile(`./public/qrpayment/${userid}.png`, qr, {
            errorCorrectionLevel: 'H',
            quality: 0.3,
            margin: 0,
        }, function (err) {
            if (err) throw err;
            resForUser.qr = `qrpayment/${userid}.png`
            return res.json(resForUser)
        });
    } else {
        GeneratePaymentMethod(req, res)
    }

})

//ot brer
app.post('/CheckAllUserPayment', JWTVerify, GetUser)

app.post('/CheckUser', JWTVerify, (req, res) => {
    try {
        CheckUser(req, res, req.body.md5)
        setTimeout(() => {
            GetUser(req, res)
        }, 200000);
    } catch (e) {
        GetUser(req, res)
    }
})


app.post("/getUser", JWTVerify, checkLogout, GetUser);

app.post('/checkfacebooktoken', (req, res) => {

    const data = {
        access_token: req.body.access_token,
        fields: "id,name",
    }
    axios.get(FbApiFull + "me", { params: data }).then((result) => {
        res.json(result.data)
    }).catch((e) => {
        res.json({ errorCode: 1 })
    })

})

app.post('/addaccountfacebook', JWTVerify, async (req, res) => {
    const { id } = req.user
    const facebook = await DB.from(DB_User).select(`facebook`).eq("id", id)
    if (facebook.error) return res.json({ error: "error add facebook" })
    var facebookAcc = facebook.data[0].facebook
    var newdatafacebook = [req.body.fb, ...facebookAcc]
    const update = await DB.from(DB_User).update({ facebook: newdatafacebook }).eq("id", id)
    if (update.error) return res.json({ error: "error remove facebook" })
    GetUser(req, res)
})

app.post('/removeaccountfacebook', JWTVerify, async (req, res) => {
    const { id } = req.user
    const { key } = req.body
    const facebook = await DB.from(DB_User).select(`facebook`).eq("id", id)
    if (facebook.error) return res.json({ error: "error remove facebook" })
    var facebookAcc = facebook.data[0].facebook
    var newdatafacebook = facebookAcc.filter((value, index, arr) => { return key != index; });
    const update = await DB.from(DB_User).update({ facebook: newdatafacebook }).eq("id", id)
    if (update.error) return res.json({ error: "error remove facebook" })
    GetUser(req, res)
})




//upload pe image to firease store
firebase.initializeApp(firebaseConfig)
const storage = getStorage()

app.post('/upload_pe_images', peImagesStorage.single('file'), JWTVerify, async (req, res) => {
    const { id } = req.user
    const oldPeImages = await DB.from(DB_User).select(`id, email, pe_image`).eq("id", id)
    if (oldPeImages.error) return console.log("error get old pe image");
    var peImages = oldPeImages.data[0].pe_image
    const fileExtension = "." + req.file.originalname.split('.').filter(Boolean).slice(1).join('.')
    const userID = oldPeImages.data[0].id
    const filename = `${PEImagePath}${userID}_${GetDate()}_${Random(20)}${fileExtension}`
    const storageRef = ref(storage, filename)
    uploadBytes(storageRef, req.file.buffer)
        .then((snapshot) => {
            getDownloadURL(storageRef)
                .then(async (url) => {
                    const dataPE = {
                        filename: snapshot.metadata.name,
                        uri: url
                    }
                    const upload = await DB.from(DB_User).update({ pe_image: [dataPE, ...peImages] }).eq("id", id)
                    if (upload.error) return console.log("error upload pe image");

                    const newPeImages = await DB.from(DB_User).select(`id, email, pe_image`).eq("id", id)
                    if (newPeImages.error) return console.log("error get old pe image");
                    GetUser(req, res)
                })
                .catch((e) => {
                    GetUser(req, res)
                })
        })
        .catch((e) => {
            GetUser(req, res)
        })
})
app.post('/delete_pe_images', JWTVerify, async (req, res) => {
    const { id } = req.user
    const { name } = req.body
    const pe_image = await DB.from(DB_User).select(`pe_image`).eq("id", id)
    if (pe_image.error) return res.json({ error: "error remove PE Image" })
    var pe_images = pe_image.data[0].pe_image
    var newdatape_image = pe_images.filter((value, index, arr) => { return name != value.filename; });
    const update = await DB.from(DB_User).update({ pe_image: newdatape_image }).eq("id", id)
    if (update.error) return res.json({ error: "error remove PE Image" })
    GetUser(req, res)
    const pathFile = `${PEImagePath}${name}`
    const storageRef = ref(storage, pathFile)
    deleteObject(storageRef).then(() => { }).catch((e) => { })
})

app.post('/upload', videosStorage.single('file'), (req, res) => {
    res.json({ message: 'Successfully', url: "uploads/" + req.file.filename, code: 200 });
});

//min ton brer
app.post('/SVTFacebook', (req, res) => {
    axios.post(FbApiFull + adAccount + "/advideos")
    // res.json({ message: 'Successfully', url: "uploads/" + req.file.filename, code: 200 });
});

//Get Thunbnails
app.get('/getThumbnails', getThumbnails)

//PostPE
app.post('/adcreatives', adcreatives)
app.get('/EOSID', effective_object_story_id)
app.post('/publishPost', publishPost)

//Download Videos for YouTube Facebook TikTok
app.get('/downloadVideo', DownloadVideos)

//CTA
app.post('/getCTAOption', JWTVerify, getCTAOption)
app.post('/addCTAOption', JWTVerify, addCTAOption)
app.post('/removeCTAOption', JWTVerify, removeCTAOption)

// Admin Page
app.post('/getAllUserAdmin', JWTVerify, getAllUserAdmin)
app.post('/addMonthsForUserAdmin', JWTVerify, addMonthsForUserAdmin)



// app.get('/getInfoDevice', (req, res) => {
//     res.json(DeviceLogin("f25a44a8-b3aa-4cef-b168-eae705047ab4", req.headers['user-agent']))
// })


// app.post('/checkdate', JWTVerify, async (req, res) => {
//     const { id } = req.user
//     try {
//         if (id) {
//             const { data, error } = await DB.from(DB_User).select(`id, email, expired`).eq('id', id)
//             if (error) return res.json({ error: "Check Error" })
//             data[0].expiredStatus = !checkExpired(data[0].expired)
//             res.json(data[0])
//         } else {
//             console.log("Check Error");
//             res.json({ error: "Check Error" })
//         }
//     } catch (e) {
//         console.log("Check Error", e);
//         res.json({ error: "Check Error" })
//     }
// })





// app.post('/getFacebookUser', JWTVerify, async (req, res) => {
//     const { email } = req.user
//     try {
//         if (email) {
//             const { data, error } = await DB.from(DB_User).select(`facebook`).eq('email', email)
//             if (error) return res.json({ error: "Getting Error" })
//             res.json(data[0])
//         } else {
//             console.log("Getting Error");
//             res.json({ error: "Getting Error" })
//         }
//     } catch (e) {
//         console.log("Getting Error", e);
//         res.json({ error: "Getting Error" })
//     }
// })





// app.post('/login', async (req, res) => {
//     const { email, password } = req.body
//     if (!email || !password) return res.json({ error: "Email and Password are required." })
//     DB.from(DB_User).select(`id, email, password`).eq("email", req.body.email)
//         .then((result) => {
//             const { data, error } = result
//             if (error) return res.json({ error: "Login Error" })
//             if (!data[0]) return res.json({ error: "Your email is invalid!" })
//             compare(password, data[0].password, (err, result) => {
//                 if (err) return res.json({ error: "Login Error" })
//                 if (!result) return res.json({ error: "Your password is invalid!" })
//                 const dataAccessToken = {
//                     id: data[0].id,
//                     email: data[0].email
//                 }
//                 const access_token = JWTSign(dataAccessToken)
//                 try {
//                     res.json({ access_token })
//                 } catch (e) {
//                     console.log(e);
//                     res.json({ error: "Login Error" })
//                 }
//             })
//         })
//         .catch((e) => {
//             res.json({ error: "Login Error" })
//         })

// })

// app.post('/register', async (req, res) => {
//     const { username, email, password, cpassword } = req.body
//     if (!username || !email || !password || !cpassword) return res.json({ msg: "required a value" })
//     try {
//         const DBUsername = await DB.from(DB_User).select(`username`).eq("username", username)
//         if (DBUsername.error) return res.json({ error: "Register Error" })
//         if (DBUsername.data[0]) return res.json({ error: "This username is already taken" })
//         const DBEmail = await DB.from(DB_User).select(`email`).eq("email", email)
//         if (DBEmail.error) return res.json({ error: "Register Error" })
//         if (DBEmail.data[0]) return res.json({ error: "This email is already taken" })

//         const data = {
//             username: username,
//             email: email,
//             password: '',
//             expired: addDate("d", 1),
//             facebook: [],
//             pe_image: [],
//             cta_option: []
//         }
//         data.password = await hash(password, 10)
//         const createUser = await DB.from(DB_User).insert([data])
//         if (createUser.error) return res.json({ error: "Register Error" })
//         DB.from(DB_User).select(`id, email, password`).eq("email", email)
//             .then((result) => {
//                 const { data, error } = result
//                 if (error) return res.json({ error: "Register Error" })
//                 console.log(data);
//                 const dataAccessToken = {
//                     id: data[0].id,
//                     email: data[0].email
//                 }
//                 const access_token = JWTSign(dataAccessToken)
//                 res.json({ access_token })

//             })
//             .catch((e) => {
//                 res.json({ error: "Register Error" })
//             })
//     } catch (e) {
//         console.log("Register Error", e);
//         res.json({ error: "Register Error" })
//     }
// })