import Global from "../Global";
import { randomCloudFuncName } from "../libs/utils";

const audioFile = {};

const data = {
    bgm: 'Audio/bgm1',
    personalBgm: 'Audio/bgm2',
    competeBgm: 'Audio/bgm3',
    button: 'Audio/button',
    right: 'Audio/right',
    wrong: 'Audio/wrong',
};

export function initAudio(){
    console.log("音乐管件初始化");
    Global.bgm = wx.createInnerAudioContext();
}

export function audio(id, type) {

    if (type) {
        if (Global.options.music === 'off') return;
        if (Global.bgm) {
            Global.bgm.destroy();
            Global.bgm = wx.createInnerAudioContext();
        }

        let bgmId = null;
        
        switch (type) {
            case "bgm":
                bgmId = "58E772961AA8DD0D5569BB40AF7AEF08"
                break;
            case "bgm2":
                bgmId = "9449E8749DA56A525569BB40AF7AEF08"
                break;
            case "bgm3":
                bgmId = "B98A88F7F1BA76155569BB40AF7AEF08"
                break;
            default:
                break;
        }


        playMuisc(bgmId, type);
        console.log("背景音乐播放");

    } else {
        if (Global.options.sound === 'off') return;

        if (audioFile[id]) {
            console.log("音效直接播放");
            cc.audioEngine.playEffect(audioFile[id], false);
        } else {
            this.load(id);
        }
    }

    // 使用微信云函数获取音乐链接
    function playMuisc(i, type) {

        wx.cloud.callFunction({
            name: randomCloudFuncName(Global.cloudFunc.getBgm),
            data: {
                bgmId: i
            },
            success: res => {
                let Bgmurl = res.result.url;
                console.log("音乐url", Bgmurl);

                if (Global.options.music === 'on') {
                    Global.bgm.loop = true;

                    // 检查缓存
                    if (audioFile[type]) {
                        Global.bgm.src = audioFile[type];
                        Global.bgm.play();
                    } else {
                        // 没有缓存就直接下载
                        wx.downloadFile({
                            url: Bgmurl,
                            success(res) {
                                // 下载成功后播放
                                console.log("downloadFile", res);
                                audioFile[type] = res.tempFilePath;
                                Global.bgm.src = res.tempFilePath;
                                Global.bgm.play();
                            },
                            fail(res) {
                                console.error("下载音乐资源有误", res)
                            }
                        });
                    }
                    Global.bgm.onError((res) => {
                        console.log("音乐播放报错");
                        console.log(res.errMsg)
                        console.log(res.errCode)
                    })
                }
            },
            fail: err => {
                console.error(err);
            },
        });
    }
}

export function bgmSwitch() {
    if (!Global.bgm) {
        return;
    }

    if (Global.options.music === 'off') {
        Global.bgm.pause();
        return;
    }
    
    Global.bgm.play();
    return;
}

export function load(id) {
    let musicId = null;

    cc.loader.loadRes(data[id], (err, file) => {
        if (file instanceof cc.AudioClip) {
            audioFile[id] = file;
            musicId = id;
            cc.audioEngine.playEffect(audioFile[id], false);
        }
    });
}