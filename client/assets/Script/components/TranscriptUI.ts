import Global from '../Global';

const { ccclass, property } = cc._decorator;

@ccclass
export default class TranscriptUI extends cc.Component {
    @property(cc.Sprite)
    transcript: cc.Sprite = null;

    @property(cc.Node)
    toast: cc.Node = null;

    @property(cc.Node)
    authModal: cc.Node = null;

    private _image: any = null;
    private _canvas: any = null;
    private _filePath: string = '';
    private _ready = false;
    private _toastTween: cc.Tween = null;
    private _retryCount: number = 0;
    private _retryTimeout: number = null;
    private _retryInterval = 300;

    onLoad() {
    }

    start() {
    }

    onEnable() {
        this.toast.active = false;
        this.hideAuthModal();
        this.loadImageAndDrawTranscript();
    }

    loadImageAndDrawTranscript() {
        if (typeof wx === 'undefined') {
            (Global.userInfo as any) = {
                nickName: '布大人多肉花园',
            }

            Global.assesment.score = 100;

            this._image =
                (this.transcript.spriteFrame.getTexture() as any)._image;
            this._drawTranscript();
        } else {

            if (!wx.createImage) {
                return;
            }

            if (!this._image) {
                this._image = wx.createImage();

                this._image.onload = () => {
                    this._ready = true;
                    clearInterval(this._retryTimeout);
                    this._drawTranscript();
                }

                if (this._retryCount < 3) {
                    this._retryTimeout = setTimeout(() => {
                        console.log('Retry loading transcript image');
                        this._image.onload = null;
                        this._image = null;
                        this._retryCount++;
                        this.loadImageAndDrawTranscript();
                    }, this._retryInterval);
                }

                this._image.src = 'image/transcript.png';
            } else {
                this._drawTranscript();
            }
        }
    }

    onBackButtonClick() {
        this.node.active = false;
    }

    showAuthModal() {
        this.authModal.active = true;
    }

    hideAuthModal() {
        this.authModal.active = false;
    }

    onCancelAuthButtonClick() {
        this.hideAuthModal();
    }

    onConfirmAuthButtonClick() {
        wx.openSetting({
            success: (res) => {
                if (res.authSetting['scope.writePhotosAlbum']) {
                    this.hideAuthModal();
                }
            }
        });
    }

    onSaveButtonClick() {
        if (typeof wx === 'undefined') {
            document.body.appendChild(this._canvas);
            this._showToast();
        } else if (this._ready) {
            wx.authorize({
                scope: 'scope.writePhotosAlbum',
                success: () => {
                    wx.saveImageToPhotosAlbum({
                        filePath: this._filePath,
                        success: () => { this._showToast(); },
                    });
                },
                fail: () => {
                    this.showAuthModal();
                }
            });
        }
    }

    onShareButtonClick() {
        if (typeof wx === 'undefined') {
            document.body.appendChild(this._canvas);
        } else if (this._ready) {
            wx.shareAppMessage({ title: '', imageUrl: this._filePath });
        }
    }

    private _showToast() {
        this.toast.active = true;
        this.toast.opacity = 0;

        if (this._toastTween) { this._toastTween.stop(); }

        this._toastTween = cc.tween(this.toast)
            .to(0.2, { opacity: 255 })
            .delay(1)
            .to(0.2, { opacity: 0 })
            .call(() => {
                this.toast.active = false;
                this._toastTween = null;
            })
            .start();
    }

    private _drawTranscript() {
        console.log('draw transcript');

        if (typeof wx === 'undefined' || !wx.createCanvas) {
            this._canvas = document.createElement('canvas');
        } else {
            this._canvas = wx.createCanvas();
        }

        this._canvas.width = 720;
        this._canvas.height = 1280;

        const ctx = this._canvas.getContext('2d');
        ctx.drawImage(this._image, 0, 0);

        let name = Global.userInfo.nickName;
        if (name.length > 7) { name = `${name.slice(0, 7)}...` };
        ctx.fillStyle = 'white';
        ctx.font = 'normal 28px Arial';
        ctx.fillText(name, 220, 324);

        const score = `${Global.assesment.score}分`;
        ctx.fillStyle = '#E26E6E';
        ctx.font = 'normal 48px Arial';
        ctx.fillText(score, 530, 328);

        const texture = new cc.Texture2D();
        texture.initWithElement(this._canvas);
        texture.handleLoadedTexture();

        const frame = new cc.SpriteFrame(texture);
        this.transcript.spriteFrame = frame;

        if (typeof wx !== 'undefined') {
            this._filePath = this._canvas.toTempFilePathSync({
                fileType: 'jpg'
            });
        }
    }
}
