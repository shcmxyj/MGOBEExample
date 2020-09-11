import Global from '../Global';

export interface LeaderboardItem {
    rank: number;
    nickName: string;
    avatarUrl: string;
    accuracy: number;
    score: number;
};

export default class LeaderboardManager {
    constructor() {
        if (!LeaderboardManager._instance) {
            LeaderboardManager._instance = this;
        }

        return LeaderboardManager._instance;
    }

    private static _instance: LeaderboardManager = null;

    public static get instance() {
        if (!LeaderboardManager._instance) {
            new LeaderboardManager();
        }

        return LeaderboardManager._instance;
    }

    private _data: Array<LeaderboardItem> = [];
    private _selfRank: LeaderboardItem = null;
    private avatars: any = {};

    public get selfRank() { return this._selfRank; }

    async getLeaderboardData() {
        await this._getLeaderboardData(0, 50);
        return this._data;
    }

    private async _getLeaderboardData(start = 0, size = 20) {
        const res = await wx.cloud.callFunction({
            name: Global.cloudFunc.getRank[ Math.round(Math.random()*(Global.cloudFunc.getRank.length - 1))],
            data: { start, size },
        });

        this._data = this._data.slice(0, start).concat(res.result.list);

        this._selfRank = {
            rank: res.result.myRank,
            nickName: Global.userInfo.nickName,
            avatarUrl: Global.userInfo.avatarUrl,
            accuracy: Global.accuracy,
            score: Global.score,
        };
    }

    getAvatar(data: LeaderboardItem): Promise<cc.SpriteFrame> {
        const url = data.avatarUrl;

        if (this.avatars[url]) {
            return Promise.resolve(this.avatars[url]);
        } else if (url&&url!=='q123') {
            return new Promise((resolve, reject) => {
                cc.loader.load(
                    { url, type: 'jpg' },
                    (err: any, tex: cc.Texture2D) => {
                        if (err) {
                            reject(err);
                        } else {
                            const frame = new cc.SpriteFrame();
                            frame.setTexture(tex);
                            this.avatars[url] = frame;
                            resolve(frame);
                        }
                    }
                );
            });
        } else {
            return Promise.reject();
        }
    }

    reportScore(score: number, accuracy: number) {
        console.log('reportScore:', score, accuracy);
        if (typeof wx !== 'undefined') {
            const context = wx.getOpenDataContext();
            context.postMessage({ cmd: 'report-score', score, accuracy });
        }
    }
};
