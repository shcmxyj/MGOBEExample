const { ccclass, property } = cc._decorator;

@ccclass
export default class InvitationView extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}
    init() { 
        console.log('InvitationView')
    }
    start() {

    }

    closeBtnClick(){
        this.node.destroy();
    }

    // update (dt) {}
}
