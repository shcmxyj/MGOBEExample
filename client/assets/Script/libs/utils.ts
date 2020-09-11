// 从云函数列表随机选一个
export function randomCloudFuncName(cloudNames: string[]): string {
    return cloudNames[Math.round(Math.random() * (cloudNames.length - 1))];
}

export const shareImgs = {
    "shareNow": {
        assetUrl: "image/share/share-now",
        nativeUrl: "",
    },
    "shareVs1": {
        assetUrl: "image/share/share-vs1",
        nativeUrl: "",
    },
    "shareTestimonials": {
        assetUrl: "image/share/share-testimonials",
        nativeUrl: "",
    },
};

// // 获取分享图片的链接
// (function initShareImgs() {

//     if (shareImgs.shareVs1.nativeUrl) {
//         return;
//     }

//     const resArray = Object.keys(shareImgs).map((key) => shareImgs[key].assetUrl);

//     cc.loader.loadResArray(resArray, cc.Asset, (err, results: cc.Asset[]) => {

//         if (err) {
//             console.log(err);
//             setTimeout(() => initShareImgs(), 3000);
//             return;
//         }

//         resArray.forEach((res, i) => {
//             Object.keys(shareImgs).forEach((key) => {
//                 if (shareImgs[key].assetUrl === res) {
//                     shareImgs[key].nativeUrl = results[i].nativeUrl;
//                 }
//             });
//         });
//     });
// })();