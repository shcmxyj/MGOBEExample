import Global from "../Global";
import { audio } from '../components/AudioPlayer';

const { ccclass, property } = cc._decorator;
const { SIZE_CHANGED } = cc.Node.EventType;

@ccclass
export default class NewClass extends cc.Component {
    @property(cc.Label)
    label: cc.Label = null;

    @property(cc.Node)
    bg: cc.Node = null;

    @property(cc.Label)
    titleLabel: cc.Label = null;

    @property(cc.Sprite)
    ownHead: cc.Sprite = null;

    @property(cc.Sprite)
    otherHead: cc.Sprite = null;

    @property(cc.Label)
    ownScore: cc.Label = null;

    @property(cc.Label)
    otherScore: cc.Label = null;

    @property(cc.Node)
    line: cc.Node = null;

    @property(cc.SpriteFrame)
    headSpriteFrame: cc.SpriteFrame = null;

    @property(cc.Label)
    timeLabel: cc.Label = null;

    @property(cc.Node)
    promptMask: cc.Node = null;

    @property([cc.SpriteFrame])
    ansSpriteFrame: Array<cc.SpriteFrame> = [];

    @property([cc.SpriteFrame])
    iconSpriteFrame: Array<cc.SpriteFrame> = [];

    @property([cc.Label])
    ansList: Array<cc.Label> = [];

    @property([cc.Node])
    btnList: Array<cc.Node> = [];

    @property(cc.Node)
    Prompt: cc.Node = null;

    @property(cc.Node)
    loading: cc.Node = null;

    @property(cc.Node)
    loadingBg: cc.Node = null;

    @property(cc.Node)
    loadingIcon: cc.Node = null;

    @property(cc.Sprite)
    stateIconL: cc.Sprite = null;

    @property(cc.Sprite)
    stateIconR: cc.Sprite = null;

    @property(cc.Label)
    addScoreL: cc.Label = null;

    @property(cc.Label)
    addScoreR: cc.Label = null;

    @property(cc.Node)
    double: cc.Node = null;

    @property(cc.Node)
    question: cc.Node = null;

    @property(cc.Node)
    standLabelL: cc.Node = null;

    @property(cc.Node)
    standLabelR: cc.Node = null;

    // LIFE-CYCLE CALLBACKS:
    round = -1;
    ownS = 0;
    otherS = 0;
    ans = null;
    ti = null;
    countnumber = null;

    btnState: boolean = false;


    // onLoad () {}
    init() {
        audio('competeBgm', 'bgm3');

        Global.playerView = this.node;

        this.bg.height = cc.winSize.height;
        this.promptMask.height = cc.winSize.height;
        this.loadingBg.height = cc.winSize.height;
        this.loading.active = true;
        this.loadingProgram();

        this.line.width = 307;
        Global.gameState = true;


        Global.room.onRecvFromGameSvr = (event: any) => {
            if (event.data && event.data.data) {
                if (event.data.data.gameState.isEnd) {
                    //跳转游戏结束
                    console.log("游戏结束");
                    clearInterval(this.ti);
                    Global.gameState = false;
                    Global.room.leaveRoom({}, event => {
                        if (event.code === 0) {
                            // 退房成功
                            console.log("退房成功", Global.room.roomInfo.id);
                            // 可以使用 initRoom 清除 roomInfo
                            Global.room.initRoom();
                        }
                    });
                    const ev = new cc.Event.EventCustom('SettlementView-show', false);
                    ev.detail = { data: event.data.data.gameState };
                    cc.director.dispatchEvent(ev);
                    this.node.destroy();
                } else {
                    if (event.data.data.gameState.curRoundTime === 15000) {
                        clearInterval(this.ti);
                        this.countdown();
                        Global.ansS = false;
                        Global.ansS2 = false;
                        this.stateIconL.node.color = cc.color(255, 255, 255, 255);
                        this.stateIconR.node.color = cc.color(255, 255, 255, 255);
                        this.stateIconR.spriteFrame = null;
                        this.stateIconL.spriteFrame = null;
                        this.standLabelL.active = true;
                        this.standLabelR.active = true;
                    }
                }
                if (event.data.data.gameState.curRound >= 0) {
                    this.loading.active = false;
                    if (event.data.data.gameState.curRound === 5 && event.data.data.gameState.curRoundTime === 15000) {

                        this.double.active = true;
                        this.double.getComponent(cc.Animation).play('double_effect');
                    }
                    this.titleLabel.string = "第" + (event.data.data.gameState.curRound + 1) + "/" + (event.data.data.gameState.ques.length) + "题"

                    if (this.round !== event.data.data.gameState.curRound || event.data.data.gameState.curRoundTime === 0) {
                        this.timeLabel.string = '';
                        this.reset(event.data.data.gameState);
                        this.round = event.data.data.gameState.curRound

                        let data = event.data.data.gameState.teams;
                        let i = updataScore(data, event.data.data.gameState.ques[event.data.data.gameState.curRound].ans);
                        this.setScore(i[0], i[1], i[2], i[3]);

                    }

                    if (this.round === event.data.data.gameState.curRound && event.data.data.gameState.curRoundTime > 0 && event.data.data.gameState.curRoundTime !== 15000) {
                        console.log("游戏中数据", event.data.data.gameState);
                        let data = event.data.data.gameState.teams;
                        let i = updataScore(data, event.data.data.gameState.ques[event.data.data.gameState.curRound].ans);

                        this.setScore(i[0], i[1], i[2], i[3]);
                    }

                    function updataScore(data, ans) {
                        let ownSc = null;
                        let otherSc = null;
                        let ownState = null;
                        let otherState = null;
                        console.log("Global.playerId---------", Global.playerId);
                        console.log("Global.data", data);
                        let play = data[0];

                        if (play[0].playerId === Global.playerId) {
                            console.log("我是第一个");
                            ownSc = data[0];
                            otherSc = data[1];
                        } else {
                            console.log("我是第二个");

                            ownSc = data[1];
                            otherSc = data[0];
                        }
                        ownState = ownSc[0].curRoundAns;
                        otherState = otherSc[0].curRoundAns;
                        let ownAnsS = 0;
                        let otherAnsS = 0;

                        if (ownState !== ans && ownState !== -1 && !Global.ansS) {
                            Global.ansS = true;
                            ownAnsS = 1;
                        }
                        if (otherState !== ans && otherState !== -1 && !Global.ansS2) {
                            Global.ansS2 = true;
                            otherAnsS = 1;
                        }

                        return [ownSc[0].sumScore, otherSc[0].sumScore, ownAnsS, otherAnsS];
                    }
                }
            }
        }

        this.ownScore.string = String(0);
        this.otherScore.string = String(0);
        if (Global.userInfo.avatarUrl !== '' && Global.userInfo.avatarUrl !== 'q123') {
            console.log("-----own");

            cc.loader.load({ url: Global.userInfo.avatarUrl, type: 'png' }, (err, texture) => {
                console.log(texture);
                var sprite = new cc.SpriteFrame(texture);
                this.ownHead.getComponent(cc.Sprite).spriteFrame = sprite;
            });
        } else {
            //qi e 
            this.ownHead.getComponent(cc.Sprite).spriteFrame = this.headSpriteFrame;
        }

        if (Global.otherAvatarUrl !== '' && Global.otherAvatarUrl !== 'q123') {
            console.log("-----other");
            cc.loader.load({ url: Global.otherAvatarUrl, type: 'png' }, (err, texture) => {
                console.log(texture);
                var sprite = new cc.SpriteFrame(texture);
                this.otherHead.getComponent(cc.Sprite).spriteFrame = sprite;
            });
        } else {
            //qi e 
            this.otherHead.getComponent(cc.Sprite).spriteFrame = this.headSpriteFrame;
        }
    }



    reset(data) {
        this.standLabelL.active = true;
        this.standLabelR.active = true;
        console.log("对战数据", data);
        let ques = data.ques[data.curRound]
        console.log("题目数据", ques);
        this.ans = ques.ans;

        this.btnList.forEach(element => {
            element.opacity = 0;
            element.getComponent(cc.Button).interactable = false;
        });

        this.label.string = ques.que;

        for (let i = 0; i < ques.opt.length; i++) {
            this.btnList[i].getChildByName('Judge Icon').getComponent(cc.Sprite).spriteFrame = null;
            this.btnList[i].getChildByName('Background').getComponent(cc.Sprite).spriteFrame = this.ansSpriteFrame[2];
            this.btnList[i].opacity = 255;
            this.btnList[i].getComponent(cc.Button).interactable = true;

            this.ansList[i].string = ques.opt[i];
        }

        this.scheduleOnce(() => {
            this.question.getComponent(cc.Layout).updateLayout();
            this.question.getComponent(cc.Widget).updateAlignment();
        }, 0);
    }

    start() {
        for (let i = 0; i < this.btnList.length; i++) {
            this.btnClick(this.btnList[i], i);
        }

        this.btnList.forEach(option => {
            const label = option.getChildByName('Background')
                .getChildByName('Label');
            label.on(SIZE_CHANGED, () => this.onOptionLabelSizeChanged(label));
        });
    }

    setOptionsInteractable(interactable: boolean) {
        this.btnList.forEach(option => {
            option.getComponent(cc.Button).interactable = interactable;
        });
    }

    onOptionLabelSizeChanged(label: cc.Node) {
        try {
            const option = label.parent.parent;

            if (label.height <= 91) {
                option.height = 91;
            } else {
                option.height = label.height;
            }

            option.children.forEach(node => {
                if (node === label) { return; }

                const widget = node.getComponent(cc.Widget);
                if (widget) { widget.updateAlignment(); }
            });

            this.scheduleOnce(() => {
                this.question.getComponent(cc.Layout).updateLayout();
                this.question.getComponent(cc.Widget).updateAlignment();
            }, 0);
        } catch (err) {
            console.error(err);
        }
    }

    countdown() {
        this.setOptionsInteractable(true);
        clearInterval(this.ti);

        this.countnumber = 15;

        this.ti = setInterval(() => {
            if (this.countnumber <= 0) {
                this.setOptionsInteractable(false);
                this.timeLabel.string = '';
                this.countnumber--;
            } else {
                this.timeLabel.string = String(this.countnumber--);
            }
            if (this.countnumber === -5) {
                console.log("超时掉线");

                const ev = new cc.Event.EventCustom('timeout-line', false);
                cc.director.dispatchEvent(ev);

                clearInterval(this.ti);
                this.endGame();
            }

        }, 1000);
        // }


    }

    setScore(own, oth, ownAnsS, otherAnsS) {
        console.log("-------------", own, oth);

        let oldLine = this.ownS / (this.ownS + this.otherS);
        this.addScoreR.string = '';
        this.addScoreL.string = '';

        this.addScoreR.node.opacity = 255;
        this.addScoreL.node.opacity = 255;

        console.log("====", oth, this.otherS);

        if (otherAnsS === 1) {
            this.standLabelR.active = false;
            this.stateIconR.spriteFrame = this.iconSpriteFrame[1];
            this.stateIconR.node.color = cc.color(255, 0, 0, 255);

        }
        if (oth !== this.otherS) {
            this.standLabelR.active = false;
            let ig = oth - this.otherS;
            console.log("ig", ig);
            if (oth === 0) {
                return;
            }
            this.standLabelR.active = false;
            this.addScoreR.string = "+" + String(ig);
            cc.tween(this.addScoreR.node).to(2, { opacity: 0 })
                .start();
            this.stateIconR.spriteFrame = this.iconSpriteFrame[0];
            this.stateIconR.node.color = cc.color(0, 255, 0, 255);

            this.otherS = oth;
            this.otherScore.string = String(this.otherS);
        }
        console.log("++++", own, this.ownS);

        if (ownAnsS === 1) {
            this.standLabelL.active = false;

            this.stateIconL.spriteFrame = this.iconSpriteFrame[1];
            this.stateIconL.node.color = cc.color(255, 0, 0, 255);
        }

        if (own !== this.ownS) {
            this.standLabelL.active = false;

            let ig = own - this.ownS;
            console.log("ig", ig);
            if (own === 0) {
                return;
            }
            this.addScoreL.string = "+" + String(ig);
            cc.tween(this.addScoreL.node).to(2, { opacity: 0 })
                .start();
            this.stateIconL.spriteFrame = this.iconSpriteFrame[0];
            this.stateIconL.node.color = cc.color(0, 255, 0, 255);
            this.ownS = own;
            this.ownScore.string = String(this.ownS);
        }

        let newLine = this.ownS / (this.ownS + this.otherS);
        let num = oldLine - newLine;
        let su = newLine * 600;
        this.line.width = su;
        if (this.line.width > 523) {
            this.line.width = 523
        } else if (this.line.width < 90) {
            this.line.width = 90;
        }
        if (this.otherS === this.ownS) {
            this.line.width = 300;
        }

        console.log("+++++++++++++++", own, oth);

    }

    btnClick(i, num) {
        i.on('click', () => {
            this.setOptionsInteractable(false);
            console.log('点击按钮', num);
            const sendToGameSvrPara = {
                data: {
                    cmd: "SUBMIT",
                    ans: num
                }
            }

            Global.room.sendToGameSvr(sendToGameSvrPara, event => {
                if (event.code === 0) {
                    console.log("发送成功");
                }
            })

            if (num === this.ans) {
                //选择正确
                audio('right', null);
                this.btnList[num].getChildByName('Judge Icon').getComponent(cc.Sprite).spriteFrame = this.iconSpriteFrame[0];
                this.btnList[num].getChildByName('Background').getComponent(cc.Sprite).spriteFrame = this.ansSpriteFrame[0];
            } else {
                //选择错误
                audio('wrong', null);
                this.btnList[num].getChildByName('Judge Icon').getComponent(cc.Sprite).spriteFrame = this.iconSpriteFrame[1];
                this.btnList[this.ans].getChildByName('Judge Icon').getComponent(cc.Sprite).spriteFrame = this.iconSpriteFrame[0];
                this.btnList[num].getChildByName('Background').getComponent(cc.Sprite).spriteFrame = this.ansSpriteFrame[1];
                this.btnList[this.ans].getChildByName('Background').getComponent(cc.Sprite).spriteFrame = this.ansSpriteFrame[0];
            }

        })
    }

    closeBtnClick() {
        audio('button', null);

        this.Prompt.active = true;
    }

    canclePrompt() {
        if (!this.btnState) {
            this.btnState = true;
            setTimeout(() => {
                this.btnState = false;
            }, 500);
            audio('button', null);

            this.Prompt.active = false;
        }
    }

    ensurePrompt() {
        if (!this.btnState) {
            this.btnState = true;
            setTimeout(() => {
                this.btnState = false;
            }, 500);
            audio('button', null);

            this.endGame();
        }
    }

    loadingProgram() {
        cc.tween(this.loadingIcon).to(20, { rotation: 7200 })
            .start();
    }

    endGame() {
        Global.gameState = false;

        clearInterval(this.ti);

        Global.room.leaveRoom({}, event => {
            if (event.code === 0) {
                // 退房成功
                console.log("退房成功", Global.room.roomInfo.id);
                // 可以使用 initRoom 清除 roomInfo
                Global.room.initRoom();
            }
        });
        const ev = new cc.Event.EventCustom('back-mainView', false);
        // const ev = new cc.Event.EventCustom('SettlementView-show', false);
        cc.director.dispatchEvent(ev);
        this.node.destroy();
    }

    onDestroy() {
        Global.gameState = false;
        clearInterval(this.ti);
        Global.room.leaveRoom({}, event => {
            if (event.code === 0) {
                // 退房成功
                console.log("退房成功", Global.room.roomInfo.id);
                // 可以使用 initRoom 清除 roomInfo
                Global.room.initRoom();
            }
        });
        Global.playerView = null;
    }
    
    // update (dt) {}
}

