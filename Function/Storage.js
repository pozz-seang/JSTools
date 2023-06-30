const multer = require("multer");
const { GetDate } = require("./Date");
const { Random } = require("./random");

const videosStorage = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, "public/uploads/")
        },
        filename: (req, file, cb) => {
            const fileExtension = "." + file.originalname.split('.').filter(Boolean).slice(1).join('.')
            const filename = GetDate() + "-" + Random(5) + fileExtension
            cb(null, filename)
        }
    })
})

const peImagesStorage = multer({ storage: multer.memoryStorage() })

module.exports = {
    videosStorage,
    peImagesStorage
}