const useragent = require("useragent");
const GetDeviceInfo = (userAgent) => {
    const agent = useragent.parse(userAgent)
    return {
        browser: agent.family,
        os: agent.os.family,
        device: agent.device.family
    }
}
module.exports = { GetDeviceInfo }