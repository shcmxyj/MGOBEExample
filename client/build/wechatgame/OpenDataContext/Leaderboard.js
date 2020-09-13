const { max } = Math;

const assets = {
    bg: { url: 'OpenDataContext/image/bg_leaderboard.png' },
    avatar: { url: 'OpenDataContext/image/avatar.png' },
    iconScore: { url: 'OpenDataContext/image/text_ranking_score.png' },

    rank1: { url: 'OpenDataContext/image/icon_ranking_1.png' },
    rank2: { url: 'OpenDataContext/image/icon_ranking_2.png' },
    rank3: { url: 'OpenDataContext/image/icon_ranking_3.png' },

    digitRank0: { url: 'OpenDataContext/image/list_1_0.png' },
    digitRank1: { url: 'OpenDataContext/image/list_1_1.png' },
    digitRank2: { url: 'OpenDataContext/image/list_1_2.png' },
    digitRank3: { url: 'OpenDataContext/image/list_1_3.png' },
    digitRank4: { url: 'OpenDataContext/image/list_1_4.png' },
    digitRank5: { url: 'OpenDataContext/image/list_1_5.png' },
    digitRank6: { url: 'OpenDataContext/image/list_1_6.png' },
    digitRank7: { url: 'OpenDataContext/image/list_1_7.png' },
    digitRank8: { url: 'OpenDataContext/image/list_1_8.png' },
    digitRank9: { url: 'OpenDataContext/image/list_1_9.png' },

    digitScore0: { url: 'OpenDataContext/image/list_0.png' },
    digitScore1: { url: 'OpenDataContext/image/list_1.png' },
    digitScore2: { url: 'OpenDataContext/image/list_2.png' },
    digitScore3: { url: 'OpenDataContext/image/list_3.png' },
    digitScore4: { url: 'OpenDataContext/image/list_4.png' },
    digitScore5: { url: 'OpenDataContext/image/list_5.png' },
    digitScore6: { url: 'OpenDataContext/image/list_6.png' },
    digitScore7: { url: 'OpenDataContext/image/list_7.png' },
    digitScore8: { url: 'OpenDataContext/image/list_8.png' },
    digitScore9: { url: 'OpenDataContext/image/list_9.png' },
};

const avatars = {};

const W = 598;
const H = 140;

class Leaderboard {
    constructor() {
        this.y = 0;
        this.loadAssets();
        this.canvas = wx.getSharedCanvas();
        this.ctx = this.canvas.getContext('2d');

        this._data = [
            { rank: 1, nickName: 'player 1', score: 123, accuracy: 93 },
            { rank: 2, nickName: '老哥你这名字也太长了吧', score: 103, accuracy: 83 },
            { rank: 37, nickName: '玩家 3', score: 13, accuracy: 83 },
            { rank: 1, nickName: 'player 1', score: 123, accuracy: 93 },
            { rank: 2, nickName: '老哥你这名字也太长了吧', score: 103, accuracy: 83 },
            { rank: 37, nickName: '玩家 3', score: 13, accuracy: 83 },
            { rank: 1, nickName: 'player 1', score: 123, accuracy: 93 },
            { rank: 2, nickName: '老哥你这名字也太长了吧', score: 103, accuracy: 83 },
            { rank: 37, nickName: '玩家 3', score: 13, accuracy: 83 },
            { rank: 1, nickName: 'player 1', score: 123, accuracy: 93 },
            { rank: 2, nickName: '老哥你这名字也太长了吧', score: 103, accuracy: 83 },
            { rank: 37, nickName: '玩家 3', score: 13, accuracy: 83 },
        ];

        this.promise = null;
        this.data = [];
        this.getLeaderboardData();
    }

    setupCanvasSize() {
        this.canvas.height *= W / this.canvas.width;
        this.canvas.width = W;
    }

    getLeaderboardData() {
        // console.log('getLeaderboardData');
        if (!this.promise) {
            this.promise = new Promise((resolve) => {
                wx.getFriendCloudStorage({
                    keyList: ['score', 'accuracy'],

                    success: (res) => {
                        this.data = [];

                        res.data.forEach(data => {
                            const row = {
                                nickName: data.nickname,
                                avatarUrl: data.avatarUrl,
                            }

                            data.KVDataList.forEach(kv => {
                                row[kv.key] = JSON.parse(kv.value);
                            });

                            this.data.push(row);

                            getAvatar(data.avatarUrl);
                        });

                        this.data.sort((a, b) => b.score - a.score);
                        this.data = this.data.slice(0, 50);
                        this.data.forEach((d, i) => {
                            d.rank = i + 1;
                            getAvatar(d.avatarUrl);
                        });
                        resolve(this.data);
                        this.promise = null;

                        console.log(this.data);
                    },

                    fail: (res) => {
                        console.error('FAIL', res);
                        resolve([]);
                        this.promise = null;
                    },
                });
            });
        }
    }

    render(dy = 0) {
        try {
            const data = this.data.slice(0, 50);

            this.y -= dy;

            if (this.y < this.canvas.height - H * data.length) {
                this.y = this.canvas.height - H * data.length;
            }

            if (this.y > 0) { this.y = 0; }

            let y = this.y;

            for (let d of data) {
                this.renderItem(0, y, d);
                y += H;
            }
        } catch (err) {
            console.error(err);
        }
    }

    renderItem(x, y, data) {
        const bg = assets.bg;
        const avatar = getAvatar(data.avatarUrl);
        const cx = W / 2;
        const cy = y + H / 2;

        /**
         * draw avatar
         */

        this.drawImage(avatar, -110, 23, cx, cy, 100, 100);

        this.drawImage(bg.img, 0, 0, cx, cy, W, H);

        /**
         * draw rank
         */
        if (data.rank <= 0) {

        } else if (data.rank <= 3) {
            const icon = assets[`rank${data.rank}`];
            this.drawImage(icon.img, -249, 3, cx, cy);
        } else {
            this.drawSpriteLabel(
                data.rank.toString(),
                -249, 3, cx, cy,
                'digitRank'
            );
        }

        /**
         * draw score
         */
        this.drawImage(assets.iconScore.img, 231, -20, cx, cy);
        this.drawSpriteLabel(
            data.score.toString(),
            262, 20, cx, cy,
            'digitScore', 0.5, -4, 'right'
        );

        /**
         * draw name
         */
        let name = data.nickName;
        const limit = 8;
        if (name.length > limit) { name = `${name.slice(0, limit)}...`; }
        this.fillText(name, 'white', 24, -55, 18, cx, cy);

        /**
         * draw correctness
         */
        this.fillText(
            `比拼正确率: ${data.accuracy}%`, '#B8E2FF', 24, -55, 65, cx, cy
        );
    }

    drawImage(img, x, y, cx, cy, w, h) {
        w = w || img.width;
        h = h || img.height;
        x = cx + x - img.width / 2;
        y = cy + y - img.height / 2;
        this.ctx.drawImage(img, x, y, w, h);
    }

    drawSpriteLabel(
        s, x, y, cx, cy, prefix,
        scale = 1, spacing = 0, align = 'center'
    ) {
        let w = 0;
        let h = 0;
        const images = [];

        for (let i = 0; i < s.length; i++) {
            const img = assets[`${prefix}${s[i]}`].img;
            images.push(img);
            w += img.width;
            h = max(h, img.height);
        }

        w += spacing * (s.length - 1);
        w *= scale;
        h *= scale;

        let _x;
        switch (align) {
            case 'center':
                _x = cx + x - w / 2;
                break;
            case 'right':
                _x = cx + x - w;
        }
        let _y = cy + y - h / 2;

        const ctx = this.ctx;
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const _w = img.width * scale;
            const _h = img.height * scale;
            ctx.drawImage(img, _x, _y, _w, _h);
            _x += _w + spacing;
        }
    }

    fillText(s, color, fontSize, x, y, cx, cy) {
        x = cx + x;
        y = cy + y - 32;
        this.ctx.fillStyle = color;

        this.ctx.font = `normal ${fontSize}px Arial`;
        this.ctx.fillText(s, x, y);
    }

    loadAssets() {
        for (let key in assets) {
            this.loadAsset(assets[key]);
        }
    }

    loadAsset(asset) {
        if (asset.img) {
            return Promise.resolve(asset.img);
        } else {
            return new Promise((resolve, reject) => {
                const img = wx.createImage();
                img.onload = () => {
                    asset.img = img;
                    resolve(img);
                }
                img.onerror = () => { reject(); }
                img.src = asset.url;
            });
        }
    }
};

module.exports = Leaderboard;

function getAvatar(url) {
    if (!url) { return assets.avatar.img; }

    if (!avatars[url]) {
        const img = avatars[url] = wx.createImage();
        img.src = url;
    }

    return avatars[url];
}
