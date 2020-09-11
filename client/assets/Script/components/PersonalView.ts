import Global from '../Global';
import OverView from './OverViewIcon';
import { audio } from '../components/AudioPlayer';
import { randomCloudFuncName } from '../libs/utils';

const { ccclass, property } = cc._decorator;
const { SIZE_CHANGED } = cc.Node.EventType;
const { floor, random } = Math;
const { clamp01 } = cc.misc;

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

enum OptionState {
    Right = 'Right',
    Wrong = 'Wrong',
    Miss = 'Miss',
    Selected = 'Selected',
};

@ccclass
export default class PersonalView extends cc.Component {
    @property(cc.Node)
    question: cc.Node = null;

    @property(cc.Label)
    questionLabel: cc.Label = null;

    @property(cc.Label)
    progressLabel: cc.Label = null;

    @property(cc.Label)
    scoreLabel: cc.Label = null;

    @property(cc.Node)
    options: cc.Node = null;

    @property(cc.Node)
    submit: cc.Node = null;

    @property(cc.Node)
    loadingModal: cc.Node = null;

    @property(cc.Node)
    exitModal: cc.Node = null;

    @property(cc.Node)
    overview: cc.Node = null;

    @property(cc.SpriteFrame)
    pointIconRight: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    pointIconWrong: cc.SpriteFrame = null;

    idx = 0;
    score = 0;
    questions: Array<any> = [];
    mistakes: Array<any> = [];
    scorePerQuestion = 0;
    selected: Array<boolean> = [];
    points: cc.Node = null;
    pointTemplate: cc.Node = null;
    segA: cc.Node = null;
    segB: cc.Node = null;
    segC: cc.Node = null;
    btnState: boolean = false;

    private _points: Array<cc.Node> = [];
    private _submitButtonOffset: number = 0;
    private _minQuestionHeight: number = 0;

    onLoad() {
        Global.personalView = this.node;
    }

    start() {
        console.log('PersonalView.start');

        this.question.active = false;
        this._minQuestionHeight = this.question.height;

        this.overview.active = false;
        this.segA = this.overview.getChildByName('LineA')
            .getChildByName('Progress');
        this.segB = this.overview.getChildByName('LineB')
            .getChildByName('Progress');
        this.segC = this.overview.getChildByName('LineC')
            .getChildByName('Progress');
        this.segA.scaleX = this.segB.scaleX = this.segC.scaleX = 0;
        this.points = this.overview.getChildByName('Points');
        this.pointTemplate = this.points.getChildByName('PointTemplate');
        this.showLoadingModal();
        this.hideExitModal();

        /**
         * Calculate submit button offset from question bottom
         */
        const { y, height } = this.question;
        this._submitButtonOffset = y - height / 2 - this.submit.y;

        if (typeof wx === 'undefined') {
            this.questions = QUESTIONS.slice(0, 10);
            this.scorePerQuestion = 100 / this.questions.length;
            this.idx = 0;
            this.score = 0;
            this.scoreLabel.string = this.score.toString();
            this.scheduleOnce(() => {
                this.renderOverview();
                this.renderQuestion();
                this.hideLoadingModal();
            }, 2);
        } else {
            wx.cloud.callFunction({
                name: randomCloudFuncName(Global.cloudFunc.getTestQuestions),
                data: { size: 10 },
                success: res => {
                    this.questions = res.result.list;
                    this.scorePerQuestion = 100 / this.questions.length;
                    this.idx = 0;
                    this.score = 0;
                    this.scoreLabel.string = this.score.toString();
                    this.renderOverview();
                    this.renderQuestion();
                    this.hideLoadingModal();
                },
                fail: err => {
                    console.error(err);
                },
            });
        }

        this.options.children.forEach(option => {
            const label = option.getChildByName('Label');
            label.on(SIZE_CHANGED, () => this.onOptionLabelSizeChanged(label));
        });
    }

    renderOverview() {
        const { questions } = this;

        this.points.removeAllChildren();

        const a = [];
        for (let i = 0; i < questions.length / 2; i++) {
            const point = cc.instantiate(this.pointTemplate);
            this.points.addChild(point);
            a.push(point);
            this.renderPoint(point, i);
        }

        const b = [];
        for (let i = questions.length - 1; i >= questions.length / 2; i--) {
            const point = cc.instantiate(this.pointTemplate);
            this.points.addChild(point);
            b.unshift(point);
            this.renderPoint(point, i);
        }

        this._points = a.concat(b);
        this.points.getComponent(cc.Layout).updateLayout();
        this.overview.active = true;
    }

    renderPoint(node: cc.Node, idx: number) {
        const label = node.getChildByName('Label').getComponent(cc.Label);
        label.string = (idx + 1).toString();
    }

    renderQuestion() {
        if (this.idx >= this.questions.length) {
            return this.onFinish();
        }

        const question = this.questions[this.idx];
        const options = this.options.children;

        this.questionLabel.string = question.que;

        this.selected.length = 0;

        for (let i = 0; i < question.opt.length; i++) {
            const opt = question.opt[i];
            const node = options[i];
            node.opacity = 255;
            node.getComponent(cc.Button).interactable = true;

            node.getChildByName('Label').getComponent(cc.Label).string = opt;
            node.getChildByName('Background').active = true;
            node.getChildByName('BackgroundRight').active = false;
            node.getChildByName('BackgroundWrong').active = false;
            node.getChildByName('BackgroundMiss').active = false;
            node.getChildByName('BackgroundSelected').active = false;
            node.getChildByName('IconRight').active = false;
            node.getChildByName('IconWrong').active = false;
            node.getChildByName('IconMiss').active = false;

            const handler = node.getComponent(cc.Button).clickEvents[0];
            handler.customEventData = JSON.stringify({ answer: i });
        }

        for (let i = question.opt.length; i < options.length; i++) {
            const node = options[i];
            node.opacity = 0;
            node.getComponent(cc.Button).interactable = false;
        }

        const i = this.idx + 1;
        const l = this.questions.length;
        this.progressLabel.string = `第 ${i} / ${l} 题`;

        this.setSubmitInteractable(true);
        this.question.active = true;
        this.question.getComponent(cc.Layout).updateLayout();
        this.question.getComponent(cc.Widget).updateAlignment();
        this.submit.getComponent(cc.Button).interactable = false;

        this.updateQuestionLayout();
    }

    onOptionLabelSizeChanged(label: cc.Node) {
        // console.log('Label size changed:', label.getComponent(cc.Label).string);
        const option = label.parent;

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

        // this.updateQuestionLayout();
    }

    updateQuestionLayout(delay = 0) {
        this.scheduleOnce(() => {
            this.options.getComponent(cc.Layout).updateLayout();
            this.question.getComponent(cc.Layout).updateLayout();
            this.question.getComponent(cc.Widget).updateAlignment();
        }, delay);
    }

    onOptionClick(ev: cc.Event.EventTouch, data: string) {
        audio('button', null);

        const { answer } = JSON.parse(data);

        this.selected[answer] = !this.selected[answer];
        const selected = ev.target.getChildByName('BackgroundSelected');
        selected.active = this.selected[answer];

        this.submit.getComponent(cc.Button).interactable =
            this.selected.some(value => !!value);
    }

    onSubmitClick() {
        const answer = this.questions[this.idx].ans;
        const options = this.options.children;
        let right = true;

        this.setOptionsInteractable(false);
        this.setSubmitInteractable(false);

        for (let i = 0; i < options.length; i++) {
            if (this.selected[i] && answer.indexOf(i) >= 0) {
                this.markState(options[i], OptionState.Right);
            } else if (this.selected[i] && answer.indexOf(i) < 0) {
                this.markState(options[i], OptionState.Wrong);
                right = false;
            } else if (!this.selected[i] && answer.indexOf(i) >= 0) {
                this.markState(options[i], OptionState.Miss);
                right = false;
            }
        }

        if (right) {
            audio('right', null);

            this.score += this.scorePerQuestion;
            this.scoreLabel.string = this.score.toString();
            this.playScoreTween();
        } else {
            audio('wrong', null);
            this.mistakes.push(this.idx);
        }

        this.progressOverview(right);

        this.scheduleOnce(() => {
            this.idx++;
            this.renderQuestion();
        }, 1);
    }

    progressOverview(right: boolean) {
        const point = this._points[this.idx];
        point.getChildByName('Label').active = false;
        point.getComponent(cc.Sprite).spriteFrame =
            right ? this.pointIconRight : this.pointIconWrong;

        const l = this.questions.length / 2;
        const i = this.idx;

        this.segA.scaleX = clamp01(i / (l - 1));
        this.segB.scaleX = i >= l ? 1 : 0;
        this.segC.scaleX = clamp01((i - l) / (l - 1));
    }

    markState(option: cc.Node, state: OptionState) {
        const bg = option.getChildByName(`Background${state}`);
        bg.active = true;
        bg.opacity = 0;
        cc.tween(bg)
            .to(0.2, { opacity: 255 })
            .start();

        const icon = option.getChildByName(`Icon${state}`);
        icon.active = true;
        icon.scale = 0;
        cc.tween(icon)
            .delay(0.1)
            .to(0.5, { scale: 1 }, { easing: cc.easing.elasticOut })
            .start();
    }

    setOptionsInteractable(interactable: boolean) {
        this.options.children.forEach(option => {
            option.getComponent(cc.Button).interactable = interactable;
        });
    }

    setSubmitInteractable(interactable: boolean) {
        this.submit.getComponent(cc.Button).interactable = interactable;
    }

    showLoadingModal() {
        this.loadingModal.active = true;
    }

    hideLoadingModal() {
        this.loadingModal.active = false;
    }

    showExitModal() {
        this.exitModal.active = true;
    }

    hideExitModal() {
        this.exitModal.active = false;
    }

    playScoreTween() {
        cc.tween(this.scoreLabel.node)
            .to(0.1, { scale: 1.5 })
            .to(0.1, { scale: 1 })
            .to(0.1, { scale: 1.5 })
            .to(0.1, { scale: 1 })
            .start();
    }

    onBackButtonClick() {
        if (!this.btnState) {
            this.btnState = true;
            setTimeout(() => {
                this.btnState = false;
            }, 500);
            console.log('PersonalView.onBackButtonClick');
            this.showExitModal();
        }
    }

    onCancelExitButtonClick() {
        if (!this.btnState) {
            this.btnState = true;
            setTimeout(() => {
                this.btnState = false;
            }, 500);
            this.hideExitModal();
        }
    }

    onConfirmExitButtonClick() {
        if (!this.btnState) {
            this.btnState = true;
            setTimeout(() => {
                this.btnState = false;
            }, 500);
            const ev = new cc.Event.EventCustom('back-mainView', false);
            cc.director.dispatchEvent(ev);
            this.node.destroy();
        }
    }

    onFinish() {
        Global.assesment.questions = this.questions;
        Global.assesment.mistakes = this.mistakes;
        Global.assesment.score = this.score;

        if (typeof wx !== 'undefined') {
            const names = Global.cloudFunc.saveTestRes;
            wx.cloud.callFunction({
                name: names[floor(random() * names.length)],
                data: { testRes: JSON.stringify(Global.assesment) },
            });
        }

        this.showResult();
    }

    showResult() {
        cc.loader.loadRes('Prefab/ResultsView', cc.Prefab, (err, prefab) => {
            if (err) {
                console.error('err');
            } else {
                const instance = cc.instantiate(prefab);
                instance.active = true;
                this.node.parent.addChild(instance);
                this.node.destroy();
            }
        });
    }

    onDestroy() {
        Global.personalView = null;
    }
};
