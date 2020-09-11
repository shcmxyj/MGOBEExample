const { ccclass, property } = cc._decorator;

@ccclass
export default class OverView extends cc.Component {
    @property(cc.Prefab)
    icon: cc.Prefab = null;

    @property([cc.SpriteFrame])
    iconState: Array<cc.SpriteFrame> = [];

    @property(cc.Node)
    top: cc.Node = null;

    @property(cc.Node)
    bottom: cc.Node = null;

    @property(cc.Node)
    topLine: cc.Node = null;

    @property(cc.Node)
    bottomLine: cc.Node = null;

    @property(cc.Node)
    topLineB: cc.Node = null;

    @property(cc.Node)
    bottomLineB: cc.Node = null;

    @property(cc.Node)
    lineV: cc.Node = null

    @property(cc.Node)
    lineVB: cc.Node = null

    list = [];
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    init(number) {
        if (number <= 10) {
            this.bottomLine.active = false;
            this.lineV.active = false;
            this.topLine.width = 69 * (number - 1);
        } else if (number === 11) {
            this.bottomLine.active = false;
            this.lineV.active = true;
        } else {
            this.bottomLine.active = true;
            this.lineV.active = true;
            this.bottomLine.width = 69 * (number - 11);
        }
        for (let i = 0; i < number; i++) {
            let icon = cc.instantiate(this.icon);
            icon.getChildByName('Label').getComponent(cc.Label).string = String(i + 1);
            this.list.push(icon);
            if (i < 10) {
                this.top.addChild(icon);
            } else {
                this.bottom.addChild(icon);
            }
        }
    }

    reset(num, active) {
        console.log("reset");
        this.list[num - 1].getChildByName('Sprite').active = false;
        if (active === 1) {
            this.list[num - 1].getChildByName('SpriteC').active = true;
        } else {
            this.list[num - 1].getChildByName('SpriteD').active = true;
        }

        if (num < 10) {
            this.topLineB.active = true;
            this.topLineB.width = 69 * num;
        } else if (num = 10) {
            this.topLineB.width = 69 * 9;
            this.lineV.active = true;
            this.lineVB.active = true;
        } else if (num > 10) {
            this.bottomLineB.active = true;
            this.topLineB.width = 69 * 9;
            this.lineV.active = true;
            this.lineVB.active = true;
            this.bottomLineB.width = 69 * (num - 10);
        }
    }

    // update (dt) {}
}
