class botData {
  public bot = [
    {
      name: '我是机器人1',
      // 机器人头像URL
      figureurl: '',
      country: 'zh_CN'
    },
    {
      name: '我是机器人2',
      // 机器人头像URL
      figureurl: '',
      country: 'zh_CN'
    },
    {
      name: '我是机器人3',
      // 机器人头像URL
      figureurl: '',
      country: 'zh_CN'
    },
  ];
  public random() {
    return this.bot[Math.round(Math.random() * this.bot.length)];
  }
}

const bot = new botData();

export default bot;