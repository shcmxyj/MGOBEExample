import Global from '../Global';
import { personalShare } from '../libs/share';
import { audio } from '../components/AudioPlayer';

const { ccclass, property } = cc._decorator;
const { abs, round } = Math;

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
export default class ExplanationUI extends cc.Component {
    @property(cc.Sprite)
    avatar: cc.Sprite = null;

    @property(cc.Label)
    nameLabel: cc.Label = null;

    @property(cc.Label)
    correctnessLabel: cc.Label = null;

    @property(cc.Label)
    incorrectnessLabel: cc.Label = null;

    @property(cc.Label)
    scoreLabel: cc.Label = null;

    @property(cc.Node)
    titleWin: cc.Node = null;

    @property(cc.Node)
    titleLose: cc.Node = null;

    @property(cc.Sprite)
    title: cc.Sprite = null;

    @property(cc.Node)
    points: cc.Node = null;

    @property(cc.Node)
    pointTemplate: cc.Node = null;

    @property(cc.Node)
    explanations: cc.Node = null;

    @property(cc.Node)
    explanationTemplate: cc.Node = null;

    @property(cc.Node)
    topButton: cc.Node = null;

    @property(cc.ScrollView)
    scrollView: cc.ScrollView = null;

    @property(cc.SpriteFrame)
    rightIcon: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    wrongIcon: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    rightIcon2: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    wrongIcon2: cc.SpriteFrame = null;

    @property([cc.SpriteFrame])
    assesmentSpriteFrames: Array<cc.SpriteFrame> = [];

    private _p = cc.v2();
    private _scrollPos = cc.v2();
    private _topButtonTween: cc.Tween = null;
    private _topButtonVisible = false;

    onLoad() {
        this.pointTemplate.removeFromParent();
        this.explanationTemplate.removeFromParent();
        this.topButton.active = this._topButtonVisible;

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
        this.renderPoints();
        this.renderExplanations();
    }

    renderHeader() {
        const { questions, mistakes, score } = Global.assesment;

        this.scoreLabel.string = score.toString();

        if (score >= 60) {
            this.titleWin.active = true;
            this.titleLose.active = false;
        } else {
            this.titleWin.active = false;
            this.titleLose.active = true;
        }

        if (score === 100) {
            this.title.spriteFrame = this.assesmentSpriteFrames[0];
        } else if (score >= 80) {
            this.title.spriteFrame = this.assesmentSpriteFrames[1];
        } else if (score >= 60) {
            this.title.spriteFrame = this.assesmentSpriteFrames[2];
        } else {
            this.title.spriteFrame = this.assesmentSpriteFrames[3];
        }

        this.nameLabel.string = Global.userInfo.nickName;

        const w = round(mistakes.length / questions.length * 100);
        this.correctnessLabel.string = `正确率: ${100 - w}%`;
        this.incorrectnessLabel.string = `错误率: ${w}%`;

        if (Global.userInfo.avatarUrl && Global.userInfo.avatarUrl !== 'q123') {
            cc.loader.load(
                { url: Global.userInfo.avatarUrl, type: 'png' },
                (err, tex) => {
                    this.avatar.spriteFrame = new cc.SpriteFrame(tex);
                }
            );
        }
    }

    renderPoints() {
        this.points.removeAllChildren();
        const { questions, mistakes } = Global.assesment;

        for (let i = 0; i < questions.length / 2; i++) {
            const point = cc.instantiate(this.pointTemplate);
            this.points.addChild(point);
            this.renderPoint(point, i, mistakes.indexOf(i) < 0);
        }

        for (let i = questions.length - 1; i >= questions.length / 2; i--) {
            const point = cc.instantiate(this.pointTemplate);
            this.points.addChild(point);
            this.renderPoint(point, i, mistakes.indexOf(i) < 0);
        }

        this.points.getComponent(cc.Layout).updateLayout();
    }

    renderPoint(point: cc.Node, idx: number, correct: boolean) {
        if (correct) {
            point.getComponent(cc.Sprite).spriteFrame = this.rightIcon;
        } else {
            point.getComponent(cc.Sprite).spriteFrame = this.wrongIcon;
        }

        const button = point.getComponent(cc.Button);
        const handler = button.clickEvents[0];
        handler.customEventData = JSON.stringify({ idx: idx });
    }

    renderExplanations() {
        const { questions, mistakes } = Global.assesment;

        for (let i = 0; i < questions.length; i++) {
            const exp = cc.instantiate(this.explanationTemplate);
            this.explanations.addChild(exp);
            this.renderExplanation(
                exp, questions[i], i, questions.length, mistakes.indexOf(i) < 0
            );
        }

        this.explanations.getComponent(cc.Layout).updateLayout();
    }

    renderExplanation(
        node: cc.Node, question: any,
        idx: number, total: number, correct: boolean
    ) {
        const number = node.getChildByName('Number').getChildByName('Label');
        number.getComponent(cc.Label).string = `第${idx + 1}/${total}题`;

        const questionLabel = node.getChildByName('QuestionLabel');
        questionLabel.getComponent(cc.Label).string = question.que;

        const detail = node.getChildByName('Detail');
        detail.getComponent(cc.Label).string = `${question.exp}`;

        const correctness = node.getChildByName('Splitter')
            .getChildByName('Correctness');
        correctness.getComponent(cc.Sprite).spriteFrame =
            correct ? this.rightIcon2 : this.wrongIcon2;

        node.getComponent(cc.Layout).updateLayout();
    }

    onPointClick(ev: cc.Event.EventTouch, data: string) {
        const json = JSON.parse(data);

        const content = this.scrollView.content;
        const p = this._p;
        this.explanations.children[json.idx]
            .convertToWorldSpaceAR(cc.Vec2.ZERO, p);
        content.convertToNodeSpaceAR(p, p);

        p.y = abs(p.y) - 200;
        this.scrollView.scrollToOffset(p, 0.75);
    }

    onScroll() {
        const limit = 500;
        const y = this.scrollView.getScrollOffset().y;

        if (y > limit && !this._topButtonVisible) {
            this._topButtonVisible = true;

            if (this._topButtonTween) {
                this._topButtonTween.stop();
                this._topButtonTween = null;
            }

            this.topButton.active = true;
            this.topButton.opacity = 0;
            this._topButtonTween = cc.tween(this.topButton)
                .to(0.3, { opacity: 255 })
                .call(() => { this._topButtonTween = null; })
                .start();
        }

        if (
            this.scrollView.getScrollOffset().y < limit &&
            this._topButtonVisible
        ) {
            this._topButtonVisible = false;

            if (this._topButtonTween) {
                this._topButtonTween.stop();
                this._topButtonTween = null;
            }

            this._topButtonTween = cc.tween(this.topButton)
                .to(0.2, { opacity: 0 })
                .call(() => {
                    this.topButton.active = false
                    this._topButtonTween = null;
                })
                .start();
        }
    }

    onTopButtonClick() {
        audio('button', null);
        this.scrollView.scrollTo(cc.v2(0, 1), 1);
    }

    onBackButtonClick() {
        audio('button', null);
        this.node.active = false;
    }

    onShareButtonClick() {
        audio('button', null);
        personalShare({
            title: '这个好玩的小游戏，还能学到不少防疫知识，快上车！',
            query: ``
        });
    }
};
