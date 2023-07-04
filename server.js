const express = require("express");
const cors = require("cors");
const firebase = require('firebase/app')
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require("firebase/storage");
var path = require('path');
const { default: axios } = require("axios");
const { adcreatives, effective_object_story_id, publishPost } = require("./Function/PostPE");
const { Random } = require("./Function/random");
const { getThumbnails, sendEmail } = require("./Function/Functions");
const { videosStorage, peImagesStorage } = require("./Function/Storage");
const { FbApiFull } = require("./Function/FacebookApi");
const { DB_User, DB, DB_PaymentMethod } = require("./Function/Database");
const { hash, compare } = require("bcrypt");
const { JWTVerify, JWTSign } = require("./Function/JWT");
const { addDate, checkExpired, GetDate } = require("./Function/Date");
const { GetUser } = require("./Function/GetUser");
const QRCode = require('qrcode');

const { GeneratePaymentMethod, CheckAllUserPayment, CheckUser } = require("./Function/PaymentMethod");
const { firebaseConfig } = require("./core/firebase");
const { DownloadVideos } = require("./Function/DownloadVideo");



const PEImagePath = "PEImage/"

const app = express();

app.listen(process.env.PORT || 80, () => console.log("Server is running...!"));
app.use(cors({
    origin: [
        "https://jstool.netlify.app",
        "http://192.168.1.11:3000"
    ],
    credentials: true,
}));

app.use(express.json());
app.use(express.static(path.resolve('./public')));



app.get("/", (req, res) => {
    res.send("This is a Server...");
});


app.post('/requestpayment', JWTVerify, async (req, res) => {
    const findMd5ByID = await DB.from(DB_PaymentMethod).select("*").eq("userid", req.user.id)
    if (findMd5ByID.data[0]) {
        console.log(findMd5ByID.data[0]);
        const { plan, months, userid, qr, md5 } = findMd5ByID.data[0]
        var price = 0
        if (plan == "monthly_starter") price = 2 * months
        else if (plan == "monthly_premium") price = 3 * months
        else if (plan == "monthly_business") price = 5 * months
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
app.post('/CheckAllUserPayment', JWTVerify, (req, res) => {
    // CheckAllUserPayment()
    GetUser(req, res)
})

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


app.post('/login', async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) return res.json({ error: "Email and Password are required." })
    DB.from(DB_User).select(`id, email, password`).eq("email", req.body.email)
        .then((result) => {
            const { data, error } = result
            if (error) return res.json({ error: "Login Error" })
            if (!data[0]) return res.json({ error: "Your email is invalid!" })
            compare(password, data[0].password, (err, result) => {
                if (err) return res.json({ error: "Login Error" })
                if (!result) return res.json({ error: "Your password is invalid!" })
                const dataAccessToken = {
                    id: data[0].id,
                    email: data[0].email
                }
                const access_token = JWTSign(dataAccessToken)
                try {
                    res.json({ access_token })
                } catch (e) {
                    console.log(e);
                    res.json({ error: "Login Error" })
                }
            })
        })
        .catch((e) => {
            res.json({ error: "Login Error" })
        })

})

app.post('/register', async (req, res) => {
    const { username, email, password, cpassword } = req.body
    if (!username || !email || !password || !cpassword) return res.json({ msg: "required a value" })
    try {
        const DBUsername = await DB.from(DB_User).select(`username`).eq("username", username)
        if (DBUsername.error) return res.json({ error: "Register Error" })
        if (DBUsername.data[0]) return res.json({ error: "This username is already taken" })
        const DBEmail = await DB.from(DB_User).select(`email`).eq("email", email)
        if (DBEmail.error) return res.json({ error: "Register Error" })
        if (DBEmail.data[0]) return res.json({ error: "This email is already taken" })

        const data = {
            username: username,
            email: email,
            password: '',
            expired: addDate("d", 1),
            facebook: [],
            pe_image: [],
            cta_option: []
        }
        data.password = await hash(password, 10)
        const createUser = await DB.from(DB_User).insert([data])
        if (createUser.error) return res.json({ error: "Register Error" })
        DB.from(DB_User).select(`id, email, password`).eq("email", email)
            .then((result) => {
                const { data, error } = result
                if (error) return res.json({ error: "Register Error" })
                console.log(data);
                const dataAccessToken = {
                    id: data[0].id,
                    email: data[0].email
                }
                const access_token = JWTSign(dataAccessToken)
                res.json({ access_token })

            })
            .catch((e) => {
                res.json({ error: "Register Error" })
            })
    } catch (e) {
        console.log("Register Error", e);
        res.json({ error: "Register Error" })
    }
})

app.post('/checkdate', JWTVerify, async (req, res) => {
    const { email } = req.user
    try {
        if (email) {
            const { data, error } = await DB.from(DB_User).select(`id, email, expired`).eq('email', email)
            if (error) return res.json({ error: "Check Error" })
            data[0].expiredStatus = !checkExpired(data[0].expired)
            res.json(data[0])
        } else {
            console.log("Check Error");
            res.json({ error: "Check Error" })
        }
    } catch (e) {
        console.log("Check Error", e);
        res.json({ error: "Check Error" })
    }
})

//ot ton brer
app.post('/forgot_password', async (req, res) => {
    try {
        const { email } = req.body
        const DBEmail = await DB.from(DB_User).select(`email`).eq("email", email)
        if (DBEmail.error) return res.json({ error: "Rest Password Error" })
        if (DBEmail.data[0]) {
            sendEmail(req.body.email)
            res.json({})
        } else {
            return res.json({ error: "This Email doesn't have a user!" })
        }
    } catch (e) {
        return res.json({ error: "Rest Password Error" })
    }

})


app.post("/getUser", JWTVerify, async (req, res) => {
    GetUser(req, res)
});

app.post('/getFacebookUser', JWTVerify, async (req, res) => {
    const { email } = req.user
    try {
        if (email) {
            const { data, error } = await DB.from(DB_User).select(`facebook`).eq('email', email)
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
})


app.post('/checkfacebooktoken', (req, res) => {
    console.log(req.body);
    const data = {
        access_token: req.body.access_token,
        fields: "id,name",
    }
    axios.get(FbApiFull + "me", { params: data }).then((result) => {
        res.json(result.data)
    }).catch((e) => {
        res.json({ errorCode: 1 })
        console.log(e);
    })

})


app.post('/addaccountfacebook', JWTVerify, async (req, res) => {
    const { email } = req.user
    const facebook = await DB.from(DB_User).select(`facebook`).eq("email", email)
    if (facebook.error) return res.json({ error: "error add facebook" })
    var facebookAcc = facebook.data[0].facebook
    var newdatafacebook = [req.body.fb, ...facebookAcc]
    const update = await DB.from(DB_User).update({ facebook: newdatafacebook }).eq("email", email)
    if (update.error) return res.json({ error: "error remove facebook" })
    GetUser(req, res)
})

app.post('/removeaccountfacebook', JWTVerify, async (req, res) => {
    const { email } = req.user
    const { key } = req.body
    const facebook = await DB.from(DB_User).select(`facebook`).eq("email", email)
    if (facebook.error) return res.json({ error: "error remove facebook" })
    var facebookAcc = facebook.data[0].facebook
    var newdatafacebook = facebookAcc.filter((value, index, arr) => { return key != index; });
    const update = await DB.from(DB_User).update({ facebook: newdatafacebook }).eq("email", email)
    if (update.error) return res.json({ error: "error remove facebook" })
    GetUser(req, res)
})



//upload pe image to firease store
firebase.initializeApp(firebaseConfig)
const storage = getStorage()

app.post('/upload_pe_images', peImagesStorage.single('file'), JWTVerify, async (req, res) => {
    const { email } = req.user
    const oldPeImages = await DB.from(DB_User).select(`id, email, pe_image`).eq("email", email)
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
                    const upload = await DB.from(DB_User).update({ pe_image: [dataPE, ...peImages] }).eq("email", email)
                    if (upload.error) return console.log("error upload pe image");

                    const newPeImages = await DB.from(DB_User).select(`id, email, pe_image`).eq("email", email)
                    if (newPeImages.error) return console.log("error get old pe image");
                    res.json(newPeImages.data[0].pe_image)
                })
                .catch((e) => {
                    res.json(e)
                })
        })
        .catch((e) => {
            console.log(e);
            res.json(e)
        })
})
app.post('/delete_pe_images', JWTVerify, async (req, res) => {
    const { email } = req.user
    const { name } = req.body
    const pe_image = await DB.from(DB_User).select(`pe_image`).eq("email", email)
    if (pe_image.error) return res.json({ error: "error remove PE Image" })
    var pe_images = pe_image.data[0].pe_image
    var newdatape_image = pe_images.filter((value, index, arr) => { return name != value.filename; });
    const update = await DB.from(DB_User).update({ pe_image: newdatape_image }).eq("email", email)
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


app.get('/getThumbnails', (req, res) => {
    getThumbnails(req, res)
})

//About PostPE
app.post('/adcreatives', (req, res) => {
    adcreatives(req, res)
})
app.get('/EOSID', (req, res) => {
    effective_object_story_id(req, res)
})
app.post('/publishPost', (req, res) => {
    publishPost(req, res)
})


//get download videos

app.get('/downloadVideo', (req, res) => {
    DownloadVideos(res, req.query.url)
})





// app.get('/payment', (req, res) => {
//     const optionalData = {
//         currency: khqrData.currency.usd,
//         amount: 2,
//         billNumber: "monthly_starter",
//         // mobileNumber: "855962799923",
//         // storeLabel: "JSTools",
//         // terminalLabel: "starter",
//     };

//     const individualInfo = new IndividualInfo(
//         "long_jingseang@wing",
//         "JSTools",
//         "Phnom Penh",
//         optionalData
//     )

//     const khqr = new BakongKHQR()
//     const response = khqr.generateIndividual(individualInfo)
//     res.json(response)
// })


// const paymentMethod = async (req, res) => {
//     const { plan, months } = req.body
//     var price = 0
//     if (plan == "monthly_starter") {
//         price = 2 * months
//     } else if (plan == "monthly_premium") {
//         price = 3 * months
//     } else if (plan == "monthly_business") {
//         price = 5 * months
//     }

//     const optionalData = {
//         currency: khqrData.currency.usd,
//         amount: price,
//         billNumber: plan,
//         mobileNumber: "855962799923",
//         storeLabel: "JSTools",
//         terminalLabel: "starter",
//     };

//     const individualInfo = new IndividualInfo(
//         "long_jingseang@wing",
//         "JSTools",
//         "Phnom Penh",
//         optionalData
//     )

//     const khqr = new BakongKHQR()
//     const response = khqr.generateIndividual(individualInfo)

//     const data = {
//         userid: req.user.id,
//         months,
//         plan,
//         qr: response.data.qr,
//         md5: response.data.md5,
//     }

//     // DB.from(DB_PaymentMethod).insert(data)
//     const insert = await DB.from(DB_PaymentMethod).insert([data])
//     if (insert.error) return
//     console.log("Add Database", data);
//     const resForUser = {
//         price,
//         qr: "",
//     }

//     QRCode.toFile(`./public/qrpayment/${data.userid}.png`, data.qr, {
//         errorCorrectionLevel: 'H',
//         quality: 0.3,
//         margin: 0,

//     }, function (err) {
//         if (err) throw err;
//         resForUser.qr = `http://192.168.1.11/qrpayment/${data.userid}.png`
//         return res.json(resForUser)
//     });

// }

// const checkPatment = async () => {
//     const insert = await DB.from(DB_PaymentMethod).select("*")
//     const headers = {
//         headers: {
//             'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2OTUwNDQxNTIsImlhdCI6MTY4NzAwODk1MiwiZGF0YSI6eyJpZCI6IjM2M2ZmNjg0ODA3YTRlMyJ9fQ.HUWBWuqTnqktrWJBCM_aW-Tovkd7l3T6RG_QnBZzCUQ',
//             'Content-Type': 'application/json'
//         }
//     }
//     if (insert.error) return
//     var MD5List = []
//     for (let i = 0; i < insert.data.length; i++) {
//         MD5List = [...MD5List, insert.data[i].md5]
//     }
//     const data = MD5List
//     axios.post("https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5_list", data, headers).then((result) => {
//         checkMD5(result.data.data)
//     }).catch((e) => {
//         console.log("Error: ", e);
//     })
// }


// const checkMD5 = async (ListCheckMD5) => {
//     for (let i = 0; i < ListCheckMD5.length; i++) {
//         if (ListCheckMD5[i].status == "SUCCESS") return
//         const findByMd5 = await DB.from(DB_PaymentMethod).select("*").eq("md5", ListCheckMD5[i].md5)
//         if (findByMd5.error) return
//         console.log(findByMd5.data[0].plan);
//         const userId = findByMd5.data[0].userid
//         const plan = findByMd5.data[0].plan
//         const expired = addDate("m", findByMd5.data[0].months)
//         const upload = await DB.from(DB_User).update({ plan, expired }).eq('id', userId)
//         if (upload.error) return
//         const del = await DB.from('PaymentMethod').delete().eq('id', findByMd5.data[0].id)
//     }
// }


// app.get('/verifyPayment', (req, res) => {
//     const KHQRString = "00020101021229230019long_jingseang@wing520459995303840540135802KH5907JSTools6010Phnom Penh62490107Starter02128559627999230307JSTools0707starter99170013168701271032063049BFC";
//     const isKHQR = BakongKHQR.verify(KHQRString).isValid;
//     const decodeValue = BakongKHQR.decode(KHQRString)
//     console.log({ isKHQR, decodeValue })
//     res.json({
//         isKHQR,
//         decodeValue
//     })
// })


// app.get('/data', async (req, res) => {
//     console.log("d");
//     // your code to fetch data from database or any other source
//     // emit the data to the connected clients
//     // CheckAllUserPayment()
//     // const { data, error } = await DB.from(DB_User).select(`id, username, email, expired, pe_image, facebook, cta_option, plan`).eq("email", req.user.email)
//     // if (error) return res.json({ error: "Error" });
//     // data[0].expiredStatus = !checkExpired(data[0].expired)

//     // io.emit('data', data[0]);
//     io.emit('data', data);
//     res.send('Data sent successfully');
// })






