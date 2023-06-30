const GetDate = () => {
    var d = new Date(),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear()
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [day, month, year].join('-');
}
const addDate = (type, value) => {
    var time = ''
    if (type == "d") {
        time = new Date().setDate(new Date().getDate() + value)
    } else if (type == "m") {
        time = new Date().setMonth(new Date().getMonth() + value)
    } else if (type == "y") {
        time = new Date().setFullYear(new Date().getFullYear() + value)
    }

    if (!time) return "error"

    var d = new Date(time),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear()
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [day, month, year].join('-');
}

const checkExpired = (expired) => {
    var dateExpired = expired.split('-')
    var dateNow = GetDate().split('-')

    if (dateExpired[2] > dateNow[2]) return true
    else if (dateExpired[2] >= dateNow[2]) {
        if (dateExpired[1] > dateNow[1]) return true
        else if (dateExpired[1] >= dateNow[1]) if (dateExpired[0] > dateNow[0]) return true
    }
    return false

    // if (dateExpired[0] > dateNow[0] && dateExpired[1] >= dateNow[1] && dateExpired[2] >= dateNow[2]) return true
    // else return false
}

module.exports = {
    GetDate,
    addDate,
    checkExpired
}