import { shareImgs } from "./utils";

interface ShareParams {
    type?: string;
    title?: string;
    imageUrl?: string;
    query?: any;
};

const defaultParams: ShareParams = {
    type: 'normal',
    title: '一起来战疫分享',
    imageUrl: shareImgs.shareNow.nativeUrl,
    query: ''
};

const defaultParamsinvitation: ShareParams = {
    type: 'normal',
    title: '一起来战疫答题',
    imageUrl: shareImgs.shareVs1.nativeUrl,
    query: ''
};

const defaultParamsPersonal: ShareParams = {
    type: 'normal',
    title: '一起来战疫奖状',
    imageUrl: shareImgs.shareTestimonials.nativeUrl,
    query: ''
};

export function invitation(params: ShareParams, timeout: number = 3000) {

    for (let key in defaultParamsinvitation) {
        if (!params.hasOwnProperty(key)) {
            params[key] = defaultParamsinvitation[key];
        }
    }

    return shareAppMessage(params, timeout);
};

export function share(params: ShareParams, timeout: number = 3000) {

    for (let key in defaultParams) {
        if (!params.hasOwnProperty(key)) {
            params[key] = defaultParams[key];
        }
    }

    return shareAppMessage(params, timeout);
};

export function personalShare(params: ShareParams, timeout: number = 3000) {

    for (let key in defaultParamsPersonal) {
        if (!params.hasOwnProperty(key)) {
            params[key] = defaultParamsPersonal[key];
        }
    }

    return shareAppMessage(params, timeout);
};

function encodeQuery(query: any) {
    let s = [];

    for (let key in query) {
        s.push(`${key}=${query[key]}`);
    }

    return s.join('&');
}

function shareAppMessage(params: ShareParams, timeout: number) {

    if (typeof params.query === 'object') {
        params.query = encodeQuery(params.query);
    }

    wx.shareAppMessage(params);

    let shareCompleted: boolean = false;
    const handle = setTimeout(() => shareCompleted = true, timeout);

    return new Promise((resolve, reject) => {
        cc.director.once('show', () => {
            clearTimeout(handle);
            if (shareCompleted) {
                resolve();
            }
            else {
                reject();
            }
        });
    });
}