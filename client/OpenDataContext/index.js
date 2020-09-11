const Leaderboard = require('./Leaderboard');

console.log('open data context started');

const lb = new Leaderboard();

wx.onMessage(onMessage);

function onMessage(message) {
    switch (message.cmd) {
        case 'update-leaderboard':
            lb.getLeaderboardData();
        case 'render-leaderboard':
            lb.render(message.dy);
            break;
        case 'report-score':
            wx.setUserCloudStorage({
                KVDataList: [
                    { key: 'score', value: JSON.stringify(message.score) },
                    { key: 'accuracy', value: JSON.stringify(message.accuracy) },
                ],

                success() {
                    console.log('STORAGE SET');
                },

                fail(res) {
                    console.log('STORAGE NOT SET', res);
                }
            });
            break;
    }
}
