
import 'whatwg-fetch'
import config from './config.js'

let remote = config.remote

function getAccessToken () {
    return localStorage.getItem('t')
}

function saveAccessToken (token) {
    localStorage.setItem('t', token)
}

function paramSerialize (obj) {
    let str = []
    for (let i of Object.keys(obj)) {
        str.push(encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]))
    }
    return str.join('&')
}

function buildFormData (obj) {
    if (!obj) return
    let formData = new FormData()
    for (let [k, v] of Object.entries(obj)) {
        formData.append(k, v)
    }
    return formData
}

async function doRequest (url, method, params, data = null, role = null) {
    let reqParams = {
        method: method,
        mode: 'cors',
        credentials: 'include',
        headers: {
            'Accept': 'application/json'
            // 'Content-Type': 'application/json;'
        }
    }
    // 设置 access token
    let authMode = config.remote.authMode
    if ((authMode === 'access_token') || (authMode === 'access_token_in_params')) {
        let token = getAccessToken()
        if (authMode === 'access_token') {
            reqParams.headers['AccessToken'] = token
        } else {
            if (params === null) params = {AccessToken: token}
            else params['AccessToken'] = token
        }
    }
    if (role) {
        // 不然的话服务器回收到一个 'null' 的 str
        reqParams.headers['Role'] = role
    }
    if (params) url += `?${paramSerialize(params)}`
    // if (method === 'POST') reqParams.body = JSON.stringify(data)
    if (method === 'POST') reqParams.body = buildFormData(data)
    return fetch(url, reqParams)
}

async function nget (url, params, role = null) { return (await doRequest(url, 'GET', params, null, role)).json() }
async function npost (url, params, data, role = null) { return (await doRequest(url, 'POST', params, data, role)).json() }

function filterValues (filter, data) {
    let keys = null
    if (_.isArray(filter)) keys = new Set(filter)
    else if (_.isSet(filter)) keys = filter
    else if (_.isFunction(filter)) return filter(data)

    let ret = {}
    for (let i of Object.keys(data)) {
        if (keys.has(i)) {
            ret[i] = data[i]
        }
    }
    return ret
}

class SlimViewRequest {
    constructor (path) {
        this.path = path
        this.urlPrefix = `${remote.API_SERVER}/api/${path}`
    }

    async get (params, role = null) {
        if (params && params.loadfk) {
            params.loadfk = JSON.stringify(params.loadfk)
        }
        return await nget(`${this.urlPrefix}/get`, params, role)
    }

    async list (params, page = 1, size = null, role = null) {
        if (params && params.loadfk) {
            params.loadfk = JSON.stringify(params.loadfk)
        }
        let url = `${this.urlPrefix}/list/${page}`
        if (size) url += `/${size}`
        return await nget(url, params, role)
    }

    async set (params, data, role = null, filter = null) {
        if (filter) data = filterValues(filter, data)
        return await npost(`${this.urlPrefix}/update`, params, data, role)
    }

    async update (params, data, role = null, filter = null) {
        if (filter) data = filterValues(filter, data)
        return await npost(`${this.urlPrefix}/update`, params, data, role)
    }

    async new (data, role = null, filter = null) {
        if (filter) data = filterValues(filter, data)
        return await npost(`${this.urlPrefix}/new`, null, data, role)
    }

    async delete (params, role = null) {
        return await npost(`${this.urlPrefix}/delete`, params, null, role)
    }
}

class UserViewRequest extends SlimViewRequest {
    async signin (data) {
        let ret = await npost(`${this.urlPrefix}/signin`, null, data)
        if (ret.code === retcode.SUCCESS) {
            saveAccessToken(ret.data.access_token)
        }
        return ret
    }

    async activation (uid, code) {
        return await nget(`${this.urlPrefix}/activation`, {uid, code})
    }

    async getUserId () {
        return await nget(`${this.urlPrefix}/get_userid`, null)
    }

    async changePassword ({old_password, password}) {
        return await npost(`${this.urlPrefix}/change_password`, null, {old_password, password})
    }

    // 申请重置密码
    async RequestPasswordReset (nickname, email) {
        return await npost(`${this.urlPrefix}/request_password_reset`, null, {nickname, email})
    }

    // 验证重置密码
    async validatePasswordReset (uid, code, password) {
        return await npost(`${this.urlPrefix}/validate_password_reset`, null, {uid, code, password})
    }

    async signout () {
        return await npost(`${this.urlPrefix}/signout`)
    }
}

class NotifViewRequest extends SlimViewRequest {
    async count () {
        return await nget(`${this.urlPrefix}/count`, null)
    }

    async refresh () {
        return await npost(`${this.urlPrefix}/refresh`, null)
    }

    async setRead () {
        return await npost(`${this.urlPrefix}/set_read`, null)
    }
}

class UploadViewRequest extends SlimViewRequest {
    async token (role) {
        return await npost(`${this.urlPrefix}/token`, null, null, role)
    }
}

let retcode = {
    SUCCESS: 0
}

let retinfo = {
    [retcode.SUCCESS]: '操作已成功完成'
}

export default {
    retcode,
    retinfo,
    saveAccessToken,

    /** 获取综合信息 */
    misc: async function () {
        return await nget(`${remote.API_SERVER}/api/misc/info`)
    },

    user: new UserViewRequest('user'),
    board: new SlimViewRequest('board'),
    topic: new SlimViewRequest('topic'),
    comment: new SlimViewRequest('comment'),
    notif: new NotifViewRequest('notif'),
    upload: new UploadViewRequest('upload'),
    logManage: new NotifViewRequest('log/manage')
}
