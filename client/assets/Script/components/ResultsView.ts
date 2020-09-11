import Global from '../Global';
import { personalShare } from '../libs/share';
import { audio } from '../components/AudioPlayer';

const { ccclass, property } = cc._decorator;

const QUESTIONS = [
    {
        "id": "8",
        "que": "TEST",
        "opt": ["TEST", "TEST"],
        "ans": [0],
        "exp": "TEST_TEST"
    }, {
        "id": "2",
        "que": "TEST",
        "opt": ["TEST", "TEST"],
        "ans": [1],
        "exp": "TEST_TEST"
    }
];

@ccclass
export default class NewClass extends cc.Component {
    @property(cc.Label)
    scoreLabel: cc.Label = null;

    @property(cc.Label)
    assesmentLabel: cc.Label = null;

    @property(cc.Label)
    rightLabel: cc.Label = null;

    @property(cc.Label)
    wrongLabel: cc.Label = null;

    @property(cc.Sprite)
    titleText: cc.Sprite = null;

    @property(cc.Node)
    titleWin: cc.Node = null;

    @property(cc.Node)
    titleLose: cc.Node = null;

    @property([cc.SpriteFrame])
    assesmentSpriteFrames: Array<cc.SpriteFrame> = [];

    @property(cc.Node)
    transcript: cc.Node = null;

    @property(cc.Node)
    loadingModal: cc.Node = null;

    @property(cc.Node)
    TranscriptButton: cc.Node = null;

    explanation: cc.Node = null;

    btnState: boolean = false;


    onLoad() {
        Global.resultView = this.node;

        if (typeof wx === 'undefined') {
            Global.assesment.questions = QUESTIONS;
            Global.assesment.mistakes = [1, 4, 7, 8];
            Global.assesment.score = 50;
            (Global.userInfo as any) = {
                nickName: 'voidx',
                avatarUrl: '',
            };
        }
    }

    start() {
        this.renderHeader();
        this.transcript.active = true;
    }

    renderHeader() {
        const { questions, mistakes, score } = Global.assesment;
        const wrong = mistakes.length;
        const right = questions.length - wrong;
        this.scoreLabel.string = score.toString();
        this.rightLabel.string = `正确${right}题`;
        this.wrongLabel.string = `错误${wrong}题`;

        if (score >= 60) {
            this.assesmentLabel.string = '你的防疫知识很好哦';
            this.titleWin.active = true;
            this.titleLose.active = false;
        } else {
            this.assesmentLabel.string = '你需要加强防疫知识哦';
            this.titleWin.active = false;
            this.titleLose.active = true;
        }

        if (score === 100) {
            this.titleText.spriteFrame = this.assesmentSpriteFrames[0];
        } else if (score >= 80) {
            this.titleText.spriteFrame = this.assesmentSpriteFrames[1];
        } else if (score >= 60) {
            this.titleText.spriteFrame = this.assesmentSpriteFrames[2];
        } else {
            this.titleText.spriteFrame = this.assesmentSpriteFrames[3];
        }
    }

    onRetryButtonClick() {
        if (!this.btnState) {
            this.btnState = true;
            setTimeout(() => {
                this.btnState = false;
            }, 500);
            console.log('Retry Button Click');
            this.showLoadingModal();
            audio('button', null);

            cc.loader.loadRes("Prefab/PersonalView", (err, prefab) => {
                if (err) {
                    console.error(err);
                } else {
                    let instance = cc.instantiate(prefab);
                    instance.active = true;
                    this.node.parent.addChild(instance, 102);
                    this.node.destroy();
                    this.hideLoadingModal();
                }
            });
        }
    }

    onShareButtonClick() {
        if (!this.btnState) {
            this.btnState = true;
            setTimeout(() => {
                this.btnState = false;
            }, 500);
            audio('button', null);


            personalShare({
                title: '这个好玩的小游戏，还能学到不少防疫知识，快上车！',
                query: ``
            });
        }
    }

    onTranscriptButtonClick() {
        if (!this.btnState) {
            this.btnState = true;
            setTimeout(() => {
                this.btnState = false;
            }, 500);
            audio('button', null);


            if (this.transcript) {
                this.transcript.active = true;
            } else {
                this.showLoadingModal();
                cc.loader.loadRes("Prefab/TranscriptUI", (err, prefab) => {
                    this.hideLoadingModal();

                    if (err) {
                        console.error(err);
                    } else {
                        this.transcript = cc.instantiate(prefab);
                        this.transcript.active = true;
                        this.node.addChild(this.transcript);
                    }
                });
            }
        }
    }

    onReviewButtonClick() {
        if (!this.btnState) {
            this.btnState = true;
            setTimeout(() => {
                this.btnState = false;
            }, 500);
            audio('button', null);


            if (this.explanation) {
                this.explanation.active = true;
            } else {
                this.showLoadingModal();
                cc.loader.loadRes("Prefab/ExplanationUI", (err, prefab) => {
                    this.hideLoadingModal();
                    if (err) {
                        console.error(err);
                    } else {
                        this.explanation = cc.instantiate(prefab);
                        this.explanation.active = true;
                        this.node.addChild(this.explanation);
                    }
                });
            }
        }
    }

    onHomeButtonClick() {
        if (!this.btnState) {
            this.btnState = true;
            setTimeout(() => {
                this.btnState = false;
            }, 500);
            audio('button', null);

            const ev = new cc.Event.EventCustom('back-mainView', false);
            cc.director.dispatchEvent(ev);
            this.node.destroy();
        }
    }

    showLoadingModal() {
        this.loadingModal.active = true;
    }

    hideLoadingModal() {
        this.loadingModal.active = false;
    }

    onDestroy() {
        Global.resultView = null;
    }
}
