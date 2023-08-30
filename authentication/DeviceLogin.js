const { GetDeviceInfo } = require("../utils/GetDevice")

const DeviceLogin = (deviceId, deviceInfo) => {
    deviceInfo = GetDeviceInfo(deviceInfo)
    return {
        status: true,
        deviceId,
        deviceInfo
    }

}

module.exports = { DeviceLogin }