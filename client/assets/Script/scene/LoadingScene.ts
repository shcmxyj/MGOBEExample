const { ccclass, property } = cc._decorator;
import Global from "../Global";
import { audio, initAudio } from '../components/AudioPlayer';
import { shareImgs } from "../libs/utils";

@ccclass
export default class LoadingScence extends cc.Component {
    @property(cc.Label)
    label: cc.Label = null;

    @property(cc.Node)
    bg: cc.Node = null;

    @property(cc.Node)
    bar: cc.Node = null;

    @property(cc.Node)
    barBorder: cc.Node = null;

    @property(cc.Node)
    icon: cc.Node = null;

    @property(cc.Node)
    startBtn: cc.Node = null;

    progress: number = 0;
    ti: any = null;
    state: boolean = true;
    static isloadingscence = true;

    constructor() {
        super();
        if (LoadingScence.isloadingscence) {
            LoadingScence.isloadingscence = false;
            wx.cloud.init({ env: Global.cloudEnvId });
            initAudio();

            console.log('-=-=-=-=-=new loading init');
        }
    }

    onLoad() {
        cc.debug.setDisplayStats(false);
        this.barBorder.active = true;
        this.startBtn.active = false;
        this.bar.width = 0;
        this.bg.height = cc.winSize.height;
        wx.showShareMenu({ withShareTicket: true });
    }

    start() {
        setTimeout(() => {
            console.log('start loading');
            this.load();
        }, 0);

        wx.onShow(ev => { console.log("wx.onShow", ev); })
        wx.onShareAppMessage(() => {
            return {
                title: '大家都在玩的防疫知识游戏，你也快来玩吧！',
                imageUrl: shareImgs.shareNow.nativeUrl,
            }
        });
    }

    load() {
        cc.director.preloadScene(
            'Gamescene',

            (completed, total) => {
                this.progress = Math.max(
                    this.progress, completed / total * 0.8 + 0.1
                );
                var str = Number(this.progress * 100).toFixed();
                str += "%";
                this.label.string = str;
                this.bar.width = 515 * this.progress;
                this.icon.setPosition(-257.5 + 515 * this.progress, -47);
            },

            error => {
                if (error) {
                    console.log('Failed to load GameScene:', error);
                    setTimeout(() => this.load(), 500);
                } else {
                    this.onLoadFinish();
                }
            }
        );
    }

    onLoadFinish() {
        console.log('GameScene loaded');
        let width = wx.getSystemInfoSync().screenWidth;
        let height = wx.getSystemInfoSync().screenHeight;

        const button = wx.createUserInfoButton({
            type: 'image',
            image: '',
            style: {
                left: 0,
                top: 0,
                width: width,
                height: height,
                lineHeight: 32,
                backgroundColor: '',
                color: '#ffffff',
                textAlign: 'center',
                fontSize: 24,
            },
            lang: 'zh_CN',
        });

        button.onTap(data => {
            if (!data.userInfo) {
                console.log("拒绝授权");
                let userInfo = {
                    nickName: "游客",
                    gender: 0,
                    language: '',
                    city: '',
                    province: '',
                    country: '',
                    avatarUrl: 'q123',
                }
                Global.userInfo = userInfo;
            } else {
                Global.userInfo = data.userInfo;
            }
            button.destroy();
            const ev = new cc.Event.EventCustom('setUserInfo', false);
            cc.director.dispatchEvent(ev);

            console.log('Switching to Gamescene');
            cc.director.loadScene('Gamescene');
        });

        this.icon.setPosition(253, -47);
        this.bar.width = 515;
        this.barBorder.active = true;
        this.label.string = '100%';
        this.startBtn.active = true;
    }

    startBtnClick() {
        audio('button', null);
    }

    program() {
        cc.director.preloadScene('Gamescene', null, function (error, asset) {
            console.log("error", error);
            if (error) {
                this.program();
            } else {
                cc.director.loadScene('Gamescene');
            }
        });
    }
}
