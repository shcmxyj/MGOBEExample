const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {
    @property(cc.Node)
    loadingIcon: cc.Node = null;

    update(dt: number) {
        this.loadingIcon.angle -= dt * 540;
    }
}
