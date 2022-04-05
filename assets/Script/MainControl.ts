const { ccclass, property } = cc._decorator;

enum STATUS {
    GameStart = 0,
    GamePlaying,
    GamePause,
    GameOver
}

@ccclass
export default class MainControl extends cc.Component {

    @property(cc.Node)
    Ball: cc.Node = null;

    @property(cc.Prefab)
    prefab_monster: cc.Prefab = null;

    @property(cc.Label)
    Lb_score: cc.Label = null;

    @property(cc.Label)
    Max_score: cc.Label = null;

    @property(cc.Sprite)
    GameOver: cc.Sprite = null;

    BStart: cc.Button = null
    Replay: cc.Button = null
    Pause: cc.Button = null
    Resume: cc.Button = null
    Home: cc.Button = null

    status = STATUS.GameStart

    clock = true;
    monster_speed = 2.8;
    ball_speed = 2.5;
    time = 0;
    time_monster = 1.2;
    list_monster: cc.Node[] = []
    score = 0;
    max_score = 0;

    // onLoad () {}

    start() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.TouchStart, this)
        this.BStart = this.node.getChildByName("BStart").getComponent(cc.Button)
        this.Replay = this.node.getChildByName("Replay").getComponent(cc.Button)
        this.Pause = this.node.getChildByName("Pause").getComponent(cc.Button)
        this.Resume = this.node.getChildByName("Resume").getComponent(cc.Button)
        this.Home = this.node.getChildByName("Home").getComponent(cc.Button)
        this.BStart.node.on(cc.Node.EventType.TOUCH_END, this.touchBStart, this)
        this.Replay.node.on(cc.Node.EventType.TOUCH_END, this.touchReplay, this)
        this.Pause.node.on(cc.Node.EventType.TOUCH_END, this.touchPause, this)
        this.Resume.node.on(cc.Node.EventType.TOUCH_END, this.touchResume, this)
        this.Home.node.on(cc.Node.EventType.TOUCH_END, this.touchHome, this)
    }

    touchBStart() {
        this.BStart.node.active = false
        this.Home.node.active = true
        this.Pause.node.active = true
        this.status = STATUS.GamePlaying
        this.GameOver.node.active = false
        this.Lb_score.string = '0'
        this.Lb_score.node.active = true
    }

    touchReplay() {
        this.Replay.node.active = false
        this.status = STATUS.GamePlaying
        this.GameOver.node.active = false
        this.Pause.node.active = true
        this.Home.node.active = true
        this.Lb_score.string = '0'
        this.score = 0
        this.Ball.angle = 0
        this.Max_score.node.active = false
    }

    touchPause() {
        this.status = STATUS.GamePause
        this.Resume.node.active = true
        this.Pause.node.active = false
    }

    touchResume() {
        this.status = STATUS.GamePlaying
        this.Pause.node.active = true
        this.Resume.node.active = false
        this.Max_score.node.active = false
    }

    touchHome() {
        this.status = STATUS.GameStart
        this.Ball.angle = 0
        this.BStart.node.active = true
        this.Pause.node.active = false
        this.Home.node.active = false
        this.Lb_score.node.active = false
        this.Replay.node.active = false
        this.GameOver.node.active = false
        this.Max_score.node.active = false
        this.score = 0;
        for (let i = 0; i < this.list_monster.length; i++)
            this.list_monster[i].destroy()
        this.list_monster = []
    }

    TouchStart() {
        this.clock = !this.clock
    }

    update(dt) {
        if (this.status === STATUS.GameOver) {
            for (let i = 0; i < this.list_monster.length; i++)
                this.list_monster[i].destroy()
            this.list_monster = []
        }
        if (this.status !== STATUS.GamePlaying) return

        if (this.clock) this.Ball.angle += this.ball_speed
        else this.Ball.angle -= this.ball_speed

        this.time += dt
        if (this.time >= this.time_monster) {
            this.time = 0;
            this.creep_monster();
        }

        for (let i = 0; i < this.list_monster.length; i++) {
            let mons = this.list_monster[i]
            let pos = mons.position

            pos.x += this.monster_speed * mons['dir'].x;
            pos.y += this.monster_speed * mons['dir'].y;

            if (Math.sqrt(pos.x * pos.x + pos.y * pos.y) >= 225) {
                this.list_monster.splice(i, 1)
                i--
                cc.tween(mons).to(0.5, { scale: 0, opacity: 0 }).removeSelf().start();
            } else {
                mons.position = pos
                for (let j = 0; j < this.Ball.childrenCount; j++) {
                    let v1 = this.node.convertToNodeSpaceAR(this.Ball.convertToWorldSpaceAR(this.Ball.children[j].position))
                    let dis = Math.sqrt(Math.pow((v1.x - pos.x), 2) + Math.pow((v1.y - pos.y), 2))
                    if (dis <= 45) {
                        if (mons['score'] == 1) {
                            this.score++;
                            this.Lb_score.string = this.score.toString()
                            this.Max_score.string = this.max_score.toString()
                            this.list_monster.splice(i, 1)
                            i--;
                            cc.tween(mons).to(0.5, { scale: 0, opacity: 0 }).removeSelf().start();
                        }
                        else {
                            console.log('GameOver')
                            this.list_monster.splice(i, 1)
                            i--;
                            cc.tween(mons).to(0.5, { scale: 0, opacity: 0 }).removeSelf().start();
                            this.status = STATUS.GameOver
                            if (this.score > this.max_score) {
                                this.max_score = this.score
                                this.Max_score.string = this.max_score.toString()
                            }
                            this.Ball.angle = 0
                            this.GameOver.node.active = true
                            this.Replay.node.active = true
                            this.Pause.node.active = false
                            this.Max_score.node.active = true
                        }
                        break;
                    }
                }
            }
        }
    }

    creep_monster() {
        let mons = cc.instantiate(this.prefab_monster)
        mons.parent = this.node

        mons['dir'] = new cc.Vec2(Math.random() * 2 - 1, 0)
        mons['dir'].y = Math.sqrt(1 - mons['dir'].x * mons['dir'].x)
        if (Math.random() > 0.5) mons['dir'].y = - mons['dir'].y

        cc.tween(mons).set({ x: 0, y: 0, scale: 0, opacity: 0 }).to(.5, { scale: 1, opacity: 255 }).start()

        let rr = Math.random()
        mons.color = rr <= 0.35 ? cc.Color.GREEN : cc.Color.WHITE
        mons['score'] = rr <= 0.35 ? 1 : 0

        this.list_monster.push(mons)
    }
}
