import LeaderboardManager from '../libs/LeaderboardManager';
import { LeaderboardItem } from '../libs/LeaderboardManager';

const { ccclass, property } = cc._decorator;

@ccclass
export default class Leaderboard extends cc.Component {
    @property(cc.Toggle)
    worldToggle: cc.Toggle = null;

    @property(cc.Toggle)
    friendToggle: cc.Toggle = null;

    @property(cc.Node)
    worldListContent: cc.Node = null;

    @property(cc.Node)
    itemTemplate: cc.Node = null;

    @property(cc.Node)
    digitRank: cc.Node = null;

    @property(cc.Node)
    digitScore: cc.Node = null;

    @property(cc.Node)
    selfItem: cc.Node = null;

    @property(cc.Sprite)
    friendLeaderBoardSprite: cc.Sprite = null;

    @property(cc.Node)
    friendLeaderboard: cc.Node = null;

    @property(cc.Node)
    worldLeaderboard: cc.Node = null;

    texture: cc.Texture2D = new cc.Texture2D();
    timer = 0;
    private _dy = 0;

    onLoad() {
        console.log('Leaderboard.onLoad');
        this.itemTemplate.removeFromParent();
        this.digitRank.removeFromParent();
        this.digitScore.removeFromParent();
        this.friendLeaderboard.active = true;
        this.worldLeaderboard.active = false;
    }

    async onEnable() {
        if (typeof wx === "undefined") {
            return;
        }

        if (!wx.getOpenDataContext) {
            return;
        }

        wx.getOpenDataContext().postMessage({ cmd: 'update-leaderboard' });

        const data = await LeaderboardManager.instance.getLeaderboardData();
        this._renderWorldList(data);
    }

    start() {
        this.friendLeaderBoardSprite.node.on(
            cc.Node.EventType.TOUCH_MOVE,
            this.onFriendTouchMove,
            this
        );
    }

    update(dt: number) {
        if (this.friendLeaderboard.active) {
            this.timer += dt;

            if (this.timer >= 0.1) {
                this.showFriendLeaderBoard();
            }
        }
    }

    onToggle() {
        if (this.worldToggle.isChecked) {
            this.friendLeaderboard.active = false;
            this.worldLeaderboard.active = true;
        } else {
            this.friendLeaderboard.active = true;
            this.worldLeaderboard.active = false;
        }
    }

    showFriendLeaderBoard() {
        if (typeof wx === 'undefined') { return; }
        if (!wx.getOpenDataContext) { return; }

        const context = wx.getOpenDataContext();
        const canvas = context.canvas;
        this.texture.initWithElement(canvas);
        this.texture.handleLoadedTexture();
        const frame = new cc.SpriteFrame(this.texture);
        this.friendLeaderBoardSprite.spriteFrame = frame;

        const node = this.friendLeaderBoardSprite.node;
        const wrapper = this.friendLeaderBoardSprite.node.parent;
        let w = wrapper.width - 40;
        let h = wrapper.height - 135;
        node.width = w;
        node.height = h;
        canvas.width = w;
        canvas.height = h;
        context.postMessage({ cmd: 'render-leaderboard', dy: this._dy });
        this._dy = 0;
    }

    onCloseButtonClick() {
        this.node.active = false;
    }

    onFriendTouchMove(ev: cc.Event.EventTouch) {
        this._dy += ev.getDeltaY();
    }

    private _renderWorldList(data: Array<LeaderboardItem>) {
        this.worldListContent.removeAllChildren();

        for (let i = 0; i < data.length; i++) {
            let item = this.worldListContent.children[i];
            if (!item) {
                item = cc.instantiate(this.itemTemplate);
                this.worldListContent.addChild(item);
            }
            this._renderItem(item, data[i]);
        }

        const selfRank = LeaderboardManager.instance.selfRank;
        this._renderItem(this.selfItem, selfRank);
    }

    private async _renderItem(item: cc.Node, data: LeaderboardItem) {
        const rankBackground = item.getChildByName('RankBackground');
        const rankIcon = rankBackground.getChildByName('RankIcon');
        const rankLayout = rankBackground.getChildByName('RankLayout');
        const notOnBoard = rankBackground.getChildByName('NotOnBoard');
        const avatar = item.getChildByName('Mask').getChildByName('Avatar');
        const nameLabel = item.getChildByName('NameLabel');
        const correctnessLabel = item.getChildByName('CorrectnessLabel');
        const scoreLayout = item.getChildByName('ScoreLayout');

        /**
         * Setup rank
         */
        if (data.rank === 0) {
            rankIcon.active = false;
            rankLayout.active = false;
            notOnBoard.active = true;
        } else if (data.rank <= 3) {
            rankIcon.active = true;
            const url = `image/Leaderboard/icon_ranking_${data.rank}`;
            cc.loader.loadRes(url, cc.SpriteFrame, (err, frame) => {
                rankIcon.getComponent(cc.Sprite).spriteFrame = frame;
            });

            rankLayout.active = false;
            notOnBoard.active = false;
        } else {
            rankIcon.active = false;
            rankLayout.active = true;
            notOnBoard.active = false;
            this._setupStringLayout(
                rankLayout, data.rank.toString(), this.digitRank
            );
        }

        /**
         * Setup name
         */
        nameLabel.getComponent(cc.Label).string = data.nickName;
        correctnessLabel.getComponent(cc.Label).string =
            `比拼正确率: ${data.accuracy}%`;

        /**
         * Setup score
         */
        this._setupStringLayout(
            scoreLayout, data.score.toString(), this.digitScore
        );

        /**
         * Setup avatar
         */
        try {
            const avatarFrame =
                await LeaderboardManager.instance.getAvatar(data);
            if (avatarFrame) {
                avatar.getComponent(cc.Sprite).spriteFrame = avatarFrame;
            }
        } catch (err) {
            // Do nothing
        }
    }

    private _setupStringLayout(layoutNode: cc.Node, s: string, chars: cc.Node) {
        layoutNode.removeAllChildren();

        for (let i = 0; i < s.length; i++) {
            layoutNode.addChild(cc.instantiate(chars.getChildByName(s[i])));
        }

        const layout = layoutNode.getComponent(cc.Layout);

        if (!layout) {
            console.error(layoutNode.name);
        } else {
            layoutNode.getComponent(cc.Layout).updateLayout();
        }
    }
}
