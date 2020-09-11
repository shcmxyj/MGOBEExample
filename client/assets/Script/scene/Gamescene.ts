import Global from "../Global";
import LeaderboardManager from '../libs/LeaderboardManager';
import { audio, bgmSwitch } from '../components/AudioPlayer';
import { randomCloudFuncName, shareImgs } from "../libs/utils";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {
    @property(cc.Node)
    attribute: cc.Node = null;

    @property(cc.Node)
    bg: cc.Node = null;

    @property(cc.Node)
    bottomNode: cc.Node = null;

    @property(cc.Sprite)
    head: cc.Sprite = null;

    @property(cc.Label)
    score: cc.Label = null;

    @property(cc.Label)
    accuracy: cc.Label = null;

    @property(cc.Node)
    anims: cc.Node = null;

    @property(cc.Node)
    loadingNode: cc.Node = null;

    @property(cc.Node)
    loadingBg: cc.Node = null;

    @property(cc.Node)
    settingBg: cc.Node = null;

    @property(cc.Label)
    userIdLabel: cc.Label = null;

    @property(cc.Node)
    loadingIcon: cc.Node = null;

    @property(cc.Node)
    webView: cc.Node = null;

    @property(cc.SpriteFrame)
    headSpriteFrame: cc.SpriteFrame = null;

    @property(cc.Button)
    personalButton: cc.Button = null;

    @property(cc.Node)
    settingNode: cc.Node = null;

    @property(cc.Sprite)
    effectBtn: cc.Sprite = null;

    @property(cc.Sprite)
    bgmBtn: cc.Sprite = null;

    @property(cc.Node)
    viewNode: cc.Node = null;

    @property([cc.SpriteFrame])
    btnSpriteFrame: Array<cc.SpriteFrame> = [];

    @property([cc.SpriteFrame])
    soundSpriteFrame: Array<cc.SpriteFrame> = [];

    @property(cc.Sprite)
    soundBtn: cc.Sprite = null;

    @property(cc.Node)
    prompt: cc.Node = null;


    // LIFE-CYCLE CALLBACKS:
    private _shouldLoadLeaderBoard = true;
    private _leaderboard: cc.Node = null;

    testScore = 100;
    btnState: boolean = false;

    onLoad() {
        console.log('Gamescene.onLoad');

        // 初始化 SDK
        this.initSDK();

        const options = wx.getLaunchOptionsSync();

        // 检查微信分享链接
        const check = (options) => {
            if (options.query.hostId !== Global.playerId) {
                // 好友发过来的链接
                // 进入对战
                this.joinFriendPvp(options.query.roomId, options);
            } else {
                Global.room.dismissRoom({}, event => {
                    if (event.code === 0) {
                        console.log("解散成功");
                    }
                });
            }
        };

        if (options.query.roomId) {
            console.log('未登录邀请:', options.query.roomId);

            Global.newFriendPlayer = options;
            if (Global._initialized) {
                check(options);
            } else {
                cc.director.on('MGOBE-Init', () => { check(options); });
            }
        }

        // 预加载
        this.perloadView();

        cc.director.on('MGOBE-fail', () => this.initSDK());
        cc.director.on('back-mainView', this.backMainView, this);
        cc.director.on('play-start', this.playViewShow, this);

        cc.director.on('updateUserInfo', () => {
            this.score.string = "积分：" + Global.score;
            this.accuracy.string = "答题比拼正确率：" + Global.accuracy + "%";
        });

        cc.director.on('SettlementView-show', (ev) => {
            let data = ev.detail.data;
            this.settlementViewShow(data);
        });

        cc.director.on('jump-personal', (ev) => {
            setTimeout(() => {
                this.personalBtnClick();
            }, 500);
        });

        cc.director.on('timeout-line', this.offLine, this);
        cc.director.on('matching-show', this.matchingBtnClick, this);

        const offL = () => {
            this.offLine();
        };

        wx.getNetworkType({
            success(res) {
                const networkType = res.networkType
                if (networkType === 'none') {
                    console.log("网络断开，请检查网络状态");
                    offL();
                }
            }
        });

        wx.onNetworkStatusChange(res => {
            console.log("是否有网络连接", res.isConnected)
            console.log("网络连接类行为", res.networkType)
            if (!res.isConnected) {
                this.offLine();
                this.backMainView();
            }
            if (res.isConnected) {
                this.prompt.active = false;
            }
        });

        wx.onShow(ev => {
            console.log('SHOW:', ev);
            console.log('JOIN FRIEND PVP:', ev.query);
            if (ev.query.roomId) {
                console.log('JOIN FRIEND PVP:', ev.query);
                if (ev.query.hostId !== Global.playerId) {
                    console.log("不是房主", Global.playerId);
                    if (Global.playerView) { Global.playerView.destroy(); }
                    this.joinFriendPvp(ev.query.roomId, ev);
                } else {
                    console.log("是房主", Global.playerId);
                    if (Global.matchView) { Global.matchView.destroy(); }

                    Global.room.dismissRoom({}, event => {
                        if (event.code === 0) {
                            console.log("解散成功");
                        }
                    });
                }
            }
            if (Global.options.music === 'on' && Global.bgm) {
                console.log("音乐开启");
                setTimeout(() => {
                    Global.bgm.play();
                    console.log("音乐延时播放");

                }, 500);
            }
        });

        wx.onHide(ev => {
            if (Global.bgm) {
                console.log("音乐隐藏");
                Global.bgm.pause();
            }
        });

        wx.showShareMenu({
            withShareTicket: true
        });
    }

    start() {
        console.log('Gamescene.start');

        this.bg.height = cc.winSize.height;
        this.loadingBg.height = cc.winSize.height;
        this.settingBg.height = cc.winSize.height;
        this.viewNode.height = cc.winSize.height;

        this.bottomNode.y = -(cc.winSize.height / 2 - 120);

        // 动效
        this.animLoad();
        this.setUserInfo();
        wx.onShareAppMessage(() => {
            return {
                title: '大家都在玩的防疫知识游戏，你也快来玩吧！',
                imageUrl: shareImgs.shareNow.nativeUrl,
            }
        });
    }

    animLoad() {
        cc.loader.loadRes("/Effect/Prefab/virus_effect", (err, prefab) => {
            if (err) {
                this.animLoad();
            } else {
                let anim = cc.instantiate(prefab);
                anim.getComponent(cc.Animation).play('virus_effect');
                this.anims.addChild(anim, 102);
            }
        });
    }

    setUserInfo() {
        if (Global.userInfo && Global.userInfo.avatarUrl !== '' && Global.userInfo.avatarUrl !== 'q123') {
            cc.loader.load({ url: Global.userInfo.avatarUrl, type: 'png' }, (err, texture) => {
                console.log(texture);
                var sprite = new cc.SpriteFrame(texture);
                this.head.getComponent(cc.Sprite).spriteFrame = sprite;
            });
        } else {
            this.head.getComponent(cc.Sprite).spriteFrame = this.headSpriteFrame;
        }
    }

    initSDK() {
        wx.cloud.callFunction({
            name: "getConfig",
            success: res => {
                Global.gameId = res.result.gameInfo.gameId;
                Global.secretKey = res.result.gameInfo.secretKey;
                Global.server = res.result.gameInfo.url;
                Global.cloudFunc = res.result.func;
                Global.matchCode = res.result.gameInfo.match1v1;
                audio('bgm', 'bgm');

                wx.cloud.callFunction({
                    name: randomCloudFuncName(Global.cloudFunc.getUserInfo),
                    success: res => {
                        console.log("getUserInfo res", res);

                        Global.openId = res.result.openId;
                        Global.score = res.result.score;
                        Global.accuracy = res.result.accuracy;

                        // 对战数据
                        this.score.string = "积分：" + res.result.score;
                        this.accuracy.string = "答题比拼正确率：" + res.result.accuracy + "%";

                        // 测评数据
                        if (res.result.testRes) {
                            Global.assesment = JSON.parse(res.result.testRes);
                        }

                        Global.init();
                        this.loadingNode.active = false;
                    },
                    fail: err => {
                        console.error(err);
                    },
                });

            },
            fail: err => {
                console.error(err);
            },
        });
    }

    perloadView() {
        this.loadingProgram();

        let load = (id) => {
            switch (id) {
                case 0:
                    cc.loader.loadRes("Prefab/ExplanationUI", (err, prefab) => {
                        if (err) {
                            load(0);
                        } else {
                            load(1);
                        }
                    });
                    break;
                case 1:
                    cc.loader.loadRes("Prefab/PlayView", (err, prefab) => {
                        if (err) {
                            load(1)
                        } else {
                            load(2);
                        }
                    });
                    break;
                case 2:
                    cc.loader.loadRes("Prefab/PersonalView", (err, prefab) => {
                        if (err) {
                            load(2)
                        } else {
                            load(3)
                        }
                    });
                    break;
                case 3:
                    cc.loader.loadRes("Prefab/ResultsView", (err, prefab) => {
                        if (err) {
                            load(3)
                        } else {
                            load(4)
                        }
                    });
                    break;
                case 4:
                    cc.loader.loadRes("Prefab/SettlementView", (err, prefab) => {
                        if (err) {
                            load(4)
                        } else {
                            load(5)
                        }
                    });
                    break;
                case 5:
                    cc.loader.loadRes("Prefab/Leaderboard", (err, prefab) => {
                        if (err) {
                            load(5)
                        } else {
                            console.log("预加载完成")
                        }
                    });
                    break;
            }
        }

        load(0);
    }

    playViewShow() {
        cc.loader.loadRes("Prefab/PlayView", (err, prefab) => {
            if (err) {
                this.playViewShow();
            } else {
                let playView = cc.instantiate(prefab);
                playView.getComponent('PlayView').init();
                this.viewNode.addChild(playView, 102);
            }
        });
    }

    matchingBtnClick() {
        if (!this.btnState) {
            this.btnState = true;
            setTimeout(() => this.btnState = false, 500);
            audio('button', null);

            cc.loader.loadRes("Prefab/MatchView", (err, prefab) => {
                if (err) {
                    this.matchingBtnClick();
                } else {
                    let matchView = cc.instantiate(prefab);
                    if (Global._initialized) {
                        matchView.getComponent('MatchView').init();
                    } else {
                        cc.director.on('MGOBE-Init', () => { matchView.getComponent('MatchView').init(); });
                    }
                    this.viewNode.addChild(matchView, 102);
                    cc.loader.loadRes("Prefab/PlayView", (err, prefab) => null);
                }
            });
        }
    }

    personalBtnClick() {
        if (!this.btnState) {
            console.log("个人评测");

            this.btnState = true;
            setTimeout(() => this.btnState = false, 500);

            audio('button', null);
            audio('personalBgm', 'bgm2');

            if (Global.assesment.score >= 0) {
                this.showResultsView();
            } else {
                this.showPersonalView();
            }
        }
    }

    showPersonalView() {
        this.personalButton.interactable = false;
        cc.loader.loadRes("Prefab/PersonalView", (err, prefab) => {
            this.personalButton.interactable = true;
            if (err) {
                this.personalBtnClick();
            } else {
                let personalView = cc.instantiate(prefab);
                personalView.active = true;
                this.viewNode.addChild(personalView, 102);
            }
        });
    }

    showResultsView() {
        cc.loader.loadRes("Prefab/ResultsView", (err, prefab) => {
            if (err) {
                this.personalBtnClick();
            } else {
                let instance = cc.instantiate(prefab);
                instance.active = true;
                this.viewNode.addChild(instance, 102);
            }
        });
    }

    joinFriendPvp(roomId, ev) {
        if (Global._initialized) {
            this._joinFriendPvp(roomId, ev);
        } else {
            cc.director.on('MGOBE-Init', () => { this._joinFriendPvp(roomId, ev) });
        }
    }

    _joinFriendPvp(roomId, ev) {
        cc.loader.loadRes("Prefab/MatchView", (err, prefab) => {
            if (err) {
                this._joinFriendPvp(roomId, ev);
            } else {
                let matchView = cc.instantiate(prefab);
                this.viewNode.addChild(matchView, 102);
                matchView.getComponent('MatchView').init();
                matchView.getComponent('MatchView').joinRoom(roomId, ev);
            }
        });
    }

    settlementViewShow(data) {
        cc.loader.loadRes("Prefab/SettlementView", (err, prefab) => {
            if (err) {
                this.settlementViewShow(data);
            } else {
                let settlementView = cc.instantiate(prefab);
                settlementView.getComponent('SettlementView').init(data);
                this.viewNode.addChild(settlementView, 102);
            }
        });
    }

    loadingProgram() {
        cc.tween(this.loadingIcon).to(30, { rotation: 10800 }).start();
    }

    onLeaderboardButtonClick() {
        if (!this.btnState) {
            console.log('Leaderboard button clicked');

            this.btnState = true;
            setTimeout(() => this.btnState = false, 500);
            audio('button', null);

            if (this._shouldLoadLeaderBoard) {
                this._shouldLoadLeaderBoard = false;
                const button = this.node.getChildByName('LeaderboardButton');
                button.getComponent(cc.Button).interactable = false;
                cc.loader.loadRes("Prefab/Leaderboard", (err, prefab) => {
                    button.getComponent(cc.Button).interactable = true;
                    if (err) {
                        console.error(err)
                    } else {
                        this._leaderboard = cc.instantiate(prefab);
                        this.viewNode.addChild(this._leaderboard);
                    }
                });
            } else {
                if (this._leaderboard) { this._leaderboard.active = true; }
            }
        }
    }

    backMainView() {
        audio('bgm', 'bgm');

        if (Global.personalView) { Global.personalView.destroy(); }
        if (Global.matchView) { Global.matchView.destroy(); }
        if (Global.resultView) { Global.resultView.destroy(); }
        if (Global.settlementView) { Global.settlementView.destroy(); }
        if (Global.playerView) { Global.playerView.destroy(); }
    }

    offLine() {
        this.prompt.active = true;
        this.prompt.opacity = 255;
        this.prompt.getChildByName("New Label").getComponent(cc.Label).string = "网络断开，请检查网络状态";

    }

    settingBtnClick() {
        if (!this.btnState) {
            this.btnState = true;
            setTimeout(() => {
                this.btnState = false;
            }, 500);
            this.userIdLabel.string = Global.playerId;
            this.settingNode.active = true;
        }
    }

    settingUnshow() {
        this.settingNode.active = false;
    }

    switchEffect() {
        if (Global.options.sound === 'on') {
            Global.options.sound = 'off';
            this.effectBtn.spriteFrame = this.btnSpriteFrame[1];
        } else {
            Global.options.sound = 'on';
            this.effectBtn.spriteFrame = this.btnSpriteFrame[0];
        }
    }

    switchBgm() {
        if (Global.options.music === 'on') {
            Global.options.music = 'off';
            this.bgmBtn.spriteFrame = this.btnSpriteFrame[1];
        } else {
            Global.options.music = 'on';
            this.bgmBtn.spriteFrame = this.btnSpriteFrame[0];
        }
        bgmSwitch();
    }

    switchSound() {
        if (Global.options.music === 'on' && Global.options.sound === 'on') {
            Global.options.music = 'off';
            Global.options.sound = 'off';
            this.soundBtn.spriteFrame = this.soundSpriteFrame[1];
        } else {
            Global.options.music = 'on';
            Global.options.sound = 'on';
            this.soundBtn.spriteFrame = this.soundSpriteFrame[0];
        }
        bgmSwitch();
    }

    // update (dt) {}
}
