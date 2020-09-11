# 答题游戏部署说明

## 1 开发环境
### 1.1 开发环境说明

游戏使用 Cocos Creator 开发并打包为微信小游戏，主要开发语言为 TypeScript。游戏玩家数据存储使用[微信云开发](https://developers.weixin.qq.com/minigame/dev/wxcloud/basis/getting-started.html)实现。游戏内玩家匹配、对战功能使用 [MGOBE](https://cloud.tencent.com/document/product/1038) 实现。游戏不同页面的背景音乐使用[腾讯云AME](https://cloud.tencent.com/document/product/1155)实现。主要开发环境如下：

- cocos creator v2.2.1
- Node.js v10.18.1 以上
- typescript v3.4.5 以上
- 微信开发者工具 v1.02.1911180 以上（推荐最新版）

**提示**： typescript 使用 npm 安装，安装完毕之后可以使用 tsc 命令：

```
npm install -g typescript
```
![](/img/2020-05-07-16-17-59.png)

### 1.2 文件目录说明

源码目录中包含三个文件：client、cloudfunction、gamesvr，分别表示客户端源码、云函数源码、MGOBE 实时服务器源码。

```
├─ client // 客户端Cocos Creator项目目录
├─ cloudfunction
│  ├─ f1_getBattleQuestions // 云函数代码：获取对战题目
│  ├─ f1_getBgm // 云函数代码：获取背景乐URL
│  ├─ f1_getRank // 云函数代码：获取排行榜
│  ├─ f1_getTestQuestions // 云函数代码：获取评测题目
│  ├─ f1_getUserInfo // 云函数代码：获取玩家信息
│  ├─ f1_saveTestRes // 云函数代码：保存评测答题数据
│  ├─ f1_updateUsers // 云函数代码：更新玩家对战数据
│  └─ getConfig // 云函数代码：获取游戏配置
└─ gamesvr
   └─ mgobexs // MGOBE 实时服务器代码
```

### 1.3 客户端/服务端交互说明

游戏涉及三端交互，分别为：客户端、云开发、MGOBE 实时服务器。客户端与云开发之间使用云函数交互，MGOBE 实时服务器与云开发之间使用云函数交互，客户端与 MGOBE 实时服务器之间使用 MGOBE SDK 接口进行交互（[sendToGameSvr](https://cloud.tencent.com/document/product/1038/33809#sendtogamesvr)、[onRecvFromGameSvr](https://cloud.tencent.com/document/product/1038/33809#onrecvfromgamesvr)）。

![](/img/2020-05-07-19-41-27.png)

#### 1.3.1 客户端与微信云开发

游戏客户端通过微信提供的接口调用云函数，从而对云数据库进行读写，实现玩家数据的更新。涉及的云函数有：
- getConfig：获取游戏配置。包括MGOBE游戏配置、云函数列表。
- f1_getUserInfo：获取玩家信息。包括玩家openId、积分、对战答题正确率、评测答题数据。
- f1_getBgm：获取背景乐URL。通过云函数调用腾讯云AME接口获得音乐链接。
- f1_getRank：获取排行榜。返回世界排行榜以及玩家排名。
- f1_getTestQuestions：获取评测题目。
- f1_saveTestRes：保存评测答题数据。

云数据库中有两个集合（[collection](https://developers.weixin.qq.com/minigame/dev/wxcloud/basis/capabilities.html#%E6%95%B0%E6%8D%AE%E5%BA%93)）：User、Bgm，分别保存玩家信息、背景乐URL。

#### 1.3.2 MGOBE 实时服务器与微信云开发

MGOBE 实时服务器（GameSvr）同样调用云函数来读写云数据库，使用的库是[tcb-admin-node](https://cloud.tencent.com/document/product/876/18443)，实时服务器已经集成该库。涉及到的云函数有：
- f1_getBattleQuestions：获取对战题目。
- f1_updateUsers：更新玩家对战数据。对战结束后，由实时服务器进行结算玩家积分，然后通过云函数更新到云数据库。

#### 1.3.3 客户端与 MGOBE 实时服务器

客户端在进行游戏对战时使用状态同步方式，需要与实时服务器进行交互。使用[sendToGameSvr](https://cloud.tencent.com/document/product/1038/33809#sendtogamesvr)接口发送消息给实时服务器，使用[onRecvFromGameSvr](https://cloud.tencent.com/document/product/1038/33809#onrecvfromgamesvr)监听实时服务器广播。

客户端发给实时服务器的消息类型有两种（即两种命令字，可以在 client 代码中查看具体内容）：

- READY：玩家准备对战。只要一个玩家准备后，对战就会开始。
- SUBMIT：玩家提交答案。

实时服务器每次下发的广播数据结构都是相同的，表示当前游戏数据。可以在 gamesvr/mgobexs 查看具体内容。

## 2 使用微信小游戏部署
### 2.1 创建 MGOBE 游戏项目

#### 2.1.1 创建游戏

打开 [MGOBE 控制台](https://console.cloud.tencent.com/minigamecloud)，点击“添加游戏”。创建成功并等待服务开通完毕后，可以拿到“游戏ID”、“游戏key”、“域名”信息。

![](/img/2020-05-08-14-47-46.png)

#### 2.1.2 创建匹配

创建好游戏后，需要为该游戏创建一条匹配规则，以支持玩家在线匹配。
继续打开[规则集列表](https://console.cloud.tencent.com/minigamecloud/room/ruleset)，点击“新建规则集”，创建一条名为“答题1V1”的规则集。

![](/img/2020-05-08-14-52-00.png)

规则集内容如下：
```
{
	"version": "V1.0",
	"teams": [
		{
			"name": "1v1",
			"maxPlayers": 1,
			"minPlayers": 1,
			"number": 2
		}
	],
	"timeout": 10
}
```

点击“提交规则集”完成创建。然后打开[在线匹配](https://console.cloud.tencent.com/minigamecloud/room/play)，点击“新建匹配”，创建一条名为“答题1V1匹配”的匹配，并选择刚才创建的规则集。同时，需要开启机器人选项。

![](/img/2020-05-08-14-56-12.png)

点击“确定”完成新建匹配，并回到在线匹配列表。在列表第一列可以得到“匹配Code”。

![](/img/2020-05-08-14-58-42.png)

至此，完成了 MGOBE 游戏项目的创建，并得到“游戏ID”、“游戏key”、“域名”、“匹配Code”，将这些信息填入 cloudfunction/getConfig/index.js 脚本的 gameInfo 对象中。

```
  // 从 MGOBE 控制台获取信息替换以下参数
  // match1v1 是指一条满足1v1匹配规则的匹配Code
  const gameInfo = {
    gameId: "MGOBE 游戏ID",
    secretKey: "MGOBE 游戏Key",
    url: "MGOBE 服务域名",
    match1v1: "MGOBE 匹配Code",
  };
```

### 2.2 开通微信小游戏与云开发

#### 2.2.1 创建小游戏

打开[微信公众平台](https://mp.weixin.qq.com/cgi-bin/wx)，创建一个小程序账号，并将服务类目设置为“游戏”。

![](/img/2020-05-08-15-21-22.png)

创建成功后，在“开发设置”页面下可以得到AppID。

![](/img/2020-05-08-15-23-34.png)

**提示**：微信小游戏中使用到的https、wss域名都需要在微信平台上进行配置。MGOBE JS SDK 在使用过程中会建立两条 wss 链接和一条 https 链接，[点击参看参考文档](https://cloud.tencent.com/document/product/1038/33315#.E8.AE.BE.E7.BD.AE.E8.AF.B7.E6.B1.82.E5.9F.9F.E5.90.8D)。

![](/img/2020-06-01-15-04-54.png)

#### 2.2.2 开通云开发

打开微信开发者工具创建，创建一个新的小游戏项目。需要填入AppID并且开通“小程序-云开发”。

![](/img/2020-05-08-15-29-46.png)

创建成功后，如果项目 cloudfunction 目录下有文件夹存在，可以将其删除掉，保持 cloudfunction 为空文件夹。

点击“云开发”按钮进入云开发控制台，填入环境名称和ID开通云开发。

![](/img/2020-05-08-15-34-42.png)

![](/img/2020-05-08-15-36-36.png)

#### 2.2.3 创建云数据库集合

在云开发控制台点击“数据库”，新建两个集合User、Bgm。

![](/img/2020-05-08-15-46-13.png)

#### 2.2.4 创建云函数

回到微信开发者工具，右键点击 cloudfunction 目录，将“当前环境”指定为刚才创建的云开发环境（如果无法指定可以先右键后点击“同步云函数列表”）。

![](/img/2020-05-08-15-53-01.png)

将本游戏源码中 cloudfunction 目录下的全部文件夹拷贝到微信小游戏项目的 cloudfunction 文件夹下。

![](/img/2020-05-08-15-56-20.png)

接下来需要将这些文件夹部署为云函数。针对 cloudfunction 下的每个文件夹进行如下操作：右键点击文件夹，点击“创建并部署：云安装依赖（不上传node_modules）”。

![](/img/2020-05-08-17-53-23.png)

**提示**：对于云函数 f1_getBgm，由于调用[腾讯云正版曲库直通车AME的API](https://cloud.tencent.com/document/product/1155/40110)，需要传入腾讯云账号secretId、secretKey。开发者可以使用任意腾讯云账号开通AME，并且在[API密钥管理](https://console.cloud.tencent.com/cam/capi)获取secretId、secretKey。此外，还需要为AME准备一个[域名](https://cloud.tencent.com/document/product/1155/38827#.E5.9F.9F.E5.90.8D.E6.8E.A5.E5.85.A5)，用于获取音乐链接。

拿到secretId、secretKey、域名后，可以填入 f1_getBgm/index.js 中，并且重新部署云函数。

如果在接入中不需要使用背景乐，可以直接部署 f1_getBgm 云函数，那么该云函数返回的链接为空字符串，客户端不会播放音乐。

### 2.3 上传 MGOBE 实时服务器代码

#### 2.3.1 获取微信云开发账号secretId和secretKey

实时服务器使用[云开发 Node.js SDK](https://cloud.tencent.com/document/product/876/19391) 访问微信云函数，需要指定账号的 secretId、secretKey。

- 使用浏览器打开 https://cloud.tencent.com/login/mp
- 使用微信小游戏的管理员微信扫描二维码
- 选择对应的微信小游戏进行授权登录，成功后浏览器也会会跳转腾讯云官网
- 浏览器访问 https://console.cloud.tencent.com/cam/capi ，新建密钥后可以得到 secretId、secretKey。

#### 2.3.2 修改编译GameSvr代码

打开游戏代码中的 gamesvr/mgobexs/index.ts 脚本（注意打开.ts文件）。将 secretId、secretKey、云开发环境ID（打开微信开发者工具的云开发控制台可以获得）替换到脚本中的 onInitGameServer 方法内。
```
// 服务器初始化时调用
function onInitGameServer(tcb: any) {
	// 如需要，可以在此初始化 TCB
	const tcbApp = tcb.init({
		secretId: "请填写使用云开发的腾讯云账号secretId",
		secretKey: "请填写使用云开发的腾讯云账号secretKey",
		env: "请填写云开发环境ID",
		serviceUrl: 'http://tcb-admin.tencentyun.com/admin',
		timeout: 5000,
	});

	initTcb(tcbApp);
}

```

然后在 gamesvr/mgobexs 目录下执行 tsc 命令，将 ts 脚本编译为 js 脚本。

![](/img/2020-05-08-19-35-43.png)

#### 2.3.3 打包上传GameSvr代码

将 gamesvr 文件夹下面的 mgobexs 文件夹压缩为 mgobexs.zip。注意压缩包内的第一级目录需要为 mgobexs，否则可能会上传失败。

![](/img/2020-05-08-19-39-06.png)

打包完毕后使用开通 MGOBE 的腾讯云账号访问 [MGOBE 实时服务器](https://console.cloud.tencent.com/minigamecloud/server)，点击“发布”按钮上传 zip 文件（如果是第一次发布需要点击“创建服务”按钮）发布 GameSvr 代码。

### 2.4 使用 Cocos Creator 打包游戏

#### 2.4.1 修改微信云开发环境ID

将 client\assets\Script\Global.ts 脚本中的 cloudEnvId 修改为微信云开发环境ID。

```
class Global {
	// 云开发环境ID
	public cloudEnvId: string = "请填写微信云开发环境ID";

	// 游戏信息由云函数下发
	// MGOBE 游戏ID
	public gameId: string;
	// MGOBE 游戏密钥
	public secretKey: string;
	// MGOBE 服务域名
	public server: string;
	// MGOBE 匹配Code
	public matchCode: string = null;

	// ...
```

#### 2.4.2 打包为微信小游戏

使用 Cocos Creator 打开游戏代码中的 client 目录，然后点击“项目”、“构建发布”。
![](/img/2020-05-08-19-45-38.png)

在构建发布界面，选择发布平台为“微信小游戏”，填入微信小游戏 AppID，并将“开放数据域代码目录”设置为“OpenDataContext”。然后点击“构建”按钮。

![](/img/2020-05-08-19-48-49.png)

构建完毕之后，将 client/OpenDataContext、client/image 目录复制到 client/build/wechatgame 目录下。

![](/img/2020-05-08-19-52-24.png)
![](/img/2020-05-08-21-19-39.png)

然后使用微信开发者工具导入 client/build/wechatgame 项目，即可预览答题游戏DEMO。


**提示**：也可以继续将 client/build/wechatgame 目录下的内容全部拷贝到步骤 2.2.2 中创建的游戏项目目录下进行预览，方便同时修改云函数和小游戏客户端代码。

![](/img/2020-05-08-21-17-36.png)

#### 2.4.3 配置静态资源到CDN

如果在进行真机预览发现代码包过大时，可以将 wechatgame/res 目录部署在服务器上（比如[腾讯云COS](https://console.cloud.tencent.com/cos5/bucket)）。步骤如下：

- 在[腾讯云COS](https://console.cloud.tencent.com/cos5/bucket)上创建一个存储桶，并在[域名管理](https://cloud.tencent.com/document/product/436/18424)中开启默认 CDN 加速域名。
- 在 Cocos Creator 中进行构建发布时，将 COS 加速域名填入“远程服务器地址”（注意添加 https:// 前缀）。
- 在微信控制台页面配置downloadFile合法域名，加入 COS 加速域名。
- 构建完毕后将 wechatgame/res 整个文件夹上传到 COS 存储桶中，并删除 wechatgame/res 文件夹。
- 使用微信开发者工具打开 wechatgame 项目，此时项目总大小减小，可以使用手机预览。