


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






