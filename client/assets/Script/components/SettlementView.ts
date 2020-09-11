const { ccclass, property } = cc._decorator;
import Global from "../Global";
import { share } from '../libs/share';
import LeaderboardManager from '../libs/LeaderboardManager';
import { audio } from '../components/AudioPlayer';

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property(cc.Node)
    bg: cc.Node = null;

    @property(cc.Node)
    title: cc.Node = null;

    @property(cc.Sprite)
    icon: cc.Sprite = null;

    @property(cc.Sprite)
    ownHead: cc.Sprite = null;

    @property(cc.Sprite)
    otherHead: cc.Sprite = null;

    @property(cc.Label)
    ownScoreLabel: cc.Label = null;

    @property(cc.Label)
    otherScoreLabel: cc.Label = null;

    @property([cc.Node])
    particles: Array<cc.Node> = [];

    @property([cc.SpriteFrame])
    iconSpriteFrame: Array<cc.SpriteFrame> = [];

    @property(cc.Node)
    BattleNode: cc.Node = null;

    @property(cc.Node)
    ownScore: cc.Node = null;

    @property(cc.Node)
    otherScore: cc.Node = null;

    @property(cc.Node)
    jumpNode: cc.Node = null;

    btnState: boolean = false;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    init(data) {
        Global.settlementView = this.node;

        this.bg.height = cc.winSize.height;

        let own = data.teams[0];
        let other = data.teams[1];
        if (own[0].playerId === Global.playerId) {
            own = data.teams[0];
            other = data.teams[1];
        } else {
            own = data.teams[1];
            other = data.teams[0];
        }
        if (own[0].sumScore >= other[0].sumScore &&own[0].sumScore !== 0) {
            this.jumpNode.active = false;
            this.title.getChildByName('win_effect').active = true;
            this.title.getChildByName('win_effect').getComponent(cc.Animation).play('win_effect');
            this.particles.forEach(element => {
                element.active = true;
            });
            this.ownScore.active = true;
            this.ownScoreLabel.string = own[0].sumScore;
            cc.tween(this.BattleNode).to(0.5, { x: 69 })
                .start();

        } else {
            this.jumpNode.active = true;
            this.title.getChildByName('lose_effect').active = true;
            this.title.getChildByName('lose_effect').getComponent(cc.Animation).play('lose_effect');
            this.otherScore.active = true;
            this.otherScoreLabel.string = other[0].sumScore;
            cc.tween(this.BattleNode).to(0.5, { x: -69 })
                .start();
        }


        if (Global.userInfo.avatarUrl !== '' && Global.userInfo.avatarUrl !== 'q123') {
            cc.loader.load({ url: Global.userInfo.avatarUrl, type: 'png' }, (err, texture) => {
                console.log(texture);
                var sprite = new cc.SpriteFrame(texture);
                this.ownHead.getComponent(cc.Sprite).spriteFrame = sprite;
            });
        } else {
            //qi e 
            this.ownHead.getComponent(cc.Sprite).spriteFrame = this.iconSpriteFrame[4];
        }

        if (Global.otherAvatarUrl !== ''&& Global.otherAvatarUrl !== 'q123') {
            cc.loader.load({ url: Global.otherAvatarUrl, type: 'png' }, (err, texture) => {
                console.log(texture);
                var sprite = new cc.SpriteFrame(texture);
                this.otherHead.getComponent(cc.Sprite).spriteFrame = sprite;
            });
        } else {
            //qi e 
            this.otherHead.getComponent(cc.Sprite).spriteFrame = this.iconSpriteFrame[4];
        }

        wx.cloud.callFunction({
            name: Global.cloudFunc.getUserInfo[Math.round(Math.random() * (Global.cloudFunc.getUserInfo.length - 1))],
            success: res => {
                console.log("getUserInfo res", res);
                Global.score = res.result.score;
                Global.accuracy = res.result.accuracy;
                console.log('CALL LeaderboardManager.instance.reportScore');
                LeaderboardManager.instance.reportScore(res.result.score, res.result.accuracy);
                const ev = new cc.Event.EventCustom('updateUserInfo', false);
                cc.director.dispatchEvent(ev);
            },
            fail: err => {
                console.error(err);
            },
        });
    }

    againBtnClick() {
        audio('bgm', 'bgm');

        if (!this.btnState) {
            this.btnState = true;
            setTimeout(() => {
                this.btnState = false;
            }, 500);
            audio('button', null);


            const ev = new cc.Event.EventCustom('matching-show', false);
            cc.director.dispatchEvent(ev);
            this.node.destroy();
        }

    }

    shareBtnClick() {
        if (!this.btnState) {
            this.btnState = true;
            setTimeout(() => {
                this.btnState = false;
            }, 500);
            audio('button', null);


            share({
                title: '这个好玩的小游戏，还能学到不少防疫知识，快上车！',
                query: ``
            });
        }
    }

    personalBtnClick() {
        if (!this.btnState) {
            this.btnState = true;
            setTimeout(() => {
                this.btnState = false;
            }, 500);
            audio('button', null);
            const ev = new cc.Event.EventCustom('back-mainView', false);
            cc.director.dispatchEvent(ev);
            if (Global.personalView) { Global.personalView.destroy(); }
            if (Global.resultView) { Global.resultView.destroy(); }
            if (Global.settlementView) { Global.settlementView.destroy(); }
            if (Global.playerView) { Global.playerView.destroy(); }
            this.node.destroy();
            const ep = new cc.Event.EventCustom('jump-personal', false);
            cc.director.dispatchEvent(ep);

        }
    }

    closeBtnClick() {
        if (!this.btnState) {
            this.btnState = true;
            setTimeout(() => {
                this.btnState = false;
            }, 500);
            const ev = new cc.Event.EventCustom('back-mainView', false);
            cc.director.dispatchEvent(ev);
            if (Global.personalView) { Global.personalView.destroy(); }
            if (Global.resultView) { Global.resultView.destroy(); }
            if (Global.settlementView) { Global.settlementView.destroy(); }
            if (Global.playerView) { Global.playerView.destroy(); }
            audio('button', null);
            this.node.destroy();
        }
    }

    onDestroy() {
        Global.settlementView = null;
    }

    // update (dt) {}
}
