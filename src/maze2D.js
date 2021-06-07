
let _IMAGES = []; // とりあえずスタートとゴールとポイントの画像11個からなる配列おねがいね
const FLAG_ROTATE_TERM = 180; // フラッグの回転のスパン

// スライム画像
let _SLIME = [];
let slimeImages = [];

// 迷路の基本サイズ
const DISPLAY_WIDTH = 640;
const DISPLAY_HEIGHT = 512;
const GRID = 64; // グリッドサイズ
const GRID_W = 10;
const GRID_H = 8;

// 表示のオフセット
const OFFSET_X = 80;
const OFFSET_Y = 64;

// ジャンプ所要時間と高さ
const JUMP_TIME = 32;
const JUMP_HEIGHT = 64;

// フラッグの大きさ
const FRAG_SIZE = GRID * 0.75;

// スタートとゴールと通常床（とワナ？？）
const NORMAL = 0;
const START = 1;
const GOAL = 2;

// ゴールサーチ用
const UNCHECKED = 0;
const CHECKED = 1;

const UNREACHED = 0;
const ARRIVED = 1;

const UNDETERMINED = 0;
const IS_PASSABLE = 1;
const IS_NOT_PASSABLE = 2;

const FORWARD = 0; // 次の頂点が見つかりました。次のステップは新しい頂点から始まります。
const AVOID = 1;   // 頂点は到達済みでした。別の頂点を探します。
const BACK = 2;    // 次の頂点が見つからないので引き返します。
const FINISH = 3;  // 木の作成が完了しました。

let master;

class Component{
  constructor(){
    this.state = undefined;
    this.connected = [];
    this.index = -1;
	}
	setState(newState){ this.state = newState; }
	getState(){ return this.state; }
	setIndex(i){ this.index = i; }
	getIndex(){ return this.index; }
  getCmp(index){ return this.connected[index].cmp; }
  getDir(index){ return this.connected[index].dir; }
	regist(other, dir){ this.connected.push({cmp:other, dir:dir}); } // cmpはコンポーネントオブジェクト、dirは方向。
  // verticeの場合は辺が伸びる方向で、edgeの場合はその頂点から他の頂点に向かう方向。
  // フロアまたぎの場合でも（同じフロアの違う位置同士をつなぐ場合であっても）方向は互いに他の逆となるように
  // ああそうか同じフロアで・・んー。そうね・・頂点をその方向に移動させて簡単に距離測って（xとyの差それぞれのmaxとか）
	draw(gr){}
}

// 頂点
class Vertice extends Component{
	constructor(x, y, z){
		super();
		this.position = createVector(x, y, z);
		this.type = undefined;
		this.value = 0; // 作成時にこの値を更新に使うことでスタートを割り出しその後すべての値をリセットしたうえでゴールを探す感じですかね
    this.onRoute = false; // ゴールへ続く道の途中にあるかないか
    this.degree = 0; // 次数（出ている辺の本数、connectedのlengthではなくIS_PASSABLEな辺の本数なので注意）
    // degreeの計算・・IS_PASSABLEが確定するたびにその両端の頂点に+1していけばOK.
	}
  resetDegree(){
    this.degree = 0;
  }
  increaseDegree(){
    this.degree++;
  }
  decreaseDegree(){
    this.degree--;
  }
	setType(_type){
		this.type = _type;
	}
	getType(){
		return this.type;
	}
	setValue(v){
		this.value = v;
	}
	getValue(){
		return this.value;
	}
  setOnRoute(flag){
    this.onRoute = flag;
  }
  getOnRoute(){
    return this.onRoute;
  }
  // 特定の頂点のdrawに使う・・？
}

// 辺
class Edge extends Component{
	constructor(_separate = false){
		super();
		this.flag = undefined; // ゴールサーチ用
    this.separate = _separate; // 分かれてるかどうかっていう。
    // connectedに方向情報入れることにしたのでdirectionは廃止。
    this.visible = false; // プレイヤーが通ったら白で塗る
	}
  setVisible(_visible){
    this.visible = _visible;
  }
  getVisible(){
    return this.visible;
  }
	setFlag(_flag){
		this.flag = _flag;
	}
	getFlag(){
		return this.flag;
	}
	getOther(v){
		// 与えられた引数の頂点とは反対側の頂点を返す。
		if(this.getCmp(0).getIndex() === v.getIndex()){ return this.getCmp(1); }
	  if(this.getCmp(1).getIndex() === v.getIndex()){ return this.getCmp(0); }
		return undefined;
	}
}

// data = {vNum:12, eNum:17, connect:[[0, 8], [1, 8, 11], [2, 11, 14], ...], x:[...], y:[...]}
// connectはindex番目の頂点に接する辺のindexの配列が入ったもの。
// x, yには頂点の座標が入る予定だけど今はそこまで余裕ないです。
// dataを元にまず頂点と辺が用意されて接続情報が登録されます。
class Maze{
	constructor(){
    this.base = createGraphics(DISPLAY_WIDTH, DISPLAY_HEIGHT);
    // フロアの縦横の大きさを保持しといてオフセットの計算で使う
    this.w = 0;
    this.h = 0;
		this.verticeArray = [];
		this.edgeArray = [];
    this.floorArray = []; // フロアグラフィックの集合（webglでフロア枚数分）// つまりこれを廃止・・
    // this.areas = [];
    // for(let i = 0; i < 20; i++){ this.areas.push(new Area()); } // 辺とかはここに描画（プレイヤーが足を踏み入れたら更新）
    // this.playerArea = createGraphics(DISPLAY_WIDTH, DISPLAY_HEIGHT); // プレイヤーの存在するエリア
    // this.playerAroundAreas = []; // プレイヤーの存在するエリアの上下左右
    // for(let i = 0; i < 4; i++){ this.playerAroundAreas.push(createGraphics(DISPLAY_WIDTH, DISPLAY_HEIGHT)); }
		this.start = undefined; // 最初の頂点を設定し、それよりvalueの大きな頂点で随時更新し続ける
		this.goal = undefined; // valueの値を全部リセットしかつstartを起点としてサーチを進め、同じように更新し続ける感じ

    this.flags = []; // フラッグたち
    for(let i = 0; i < 11; i++){
      this.flags.push(new Flag(_IMAGES[i]));
    }

    this.player = new Player(); // player動かすのもいろいろ考えないとね・・
    this.enemyArray = [];
    for(let i = 0; i < 5; i++){
      this.enemyArray.push(new Enemy());
    }
	}
	prepareComponents(data){
		const {vNum:vn} = data;
		this.verticeArray = [];
		for(let i = 0; i < vn; i++){
			let newV = new Vertice(data.x[i], data.y[i], data.z[i]); // zはフロア番号
			newV.setIndex(i);
			this.verticeArray.push(newV);
		}
    // connectの各元はedgeと一対一で対応しているので、connectを走査してedgeをその都度
    // 作っていけばいい。だからここで作る必要はない。

    // connectの中身から2つの頂点を出してfromが0でtoが1で順繰りに。
    // fromでまず頂点のconnectedに辺を追加する・・どこの？？
    // 手順としては先に辺のconnectedに頂点を追加しますね。fromが0でtoが1でdirはfromはdirでtoはdir+PIだよね。
    // で、その際にオブジェクトにedge:作ったedgeって感じで追加する。
    // で、2周目に・・？
    // いや、しなくても辺作ったらそのまま頂点にその辺を接続してしまえばいい。順番が大事なのね。
    let edgeIndex = 0;
    this.edgeArray = [];
    for(let cn of data.connect){
      const v0 = this.verticeArray[cn.from];
      const v1 = this.verticeArray[cn.to];
      let newE = new Edge(cn.separate); // いちいちseparateかどうかの判定はしない。connectを構成する際に付与しちゃう。
      newE.regist(v0, cn.dir);
      newE.regist(v1, cn.dir + Math.PI);
      v0.regist(newE, cn.dir);
      v1.regist(newE, cn.dir + Math.PI);
      newE.setIndex(edgeIndex);
      edgeIndex++;
      this.edgeArray.push(newE);
    }
    // フロア枚数分だけ用意する感じ。描画の時にオフセットを考慮して描画する。プレイヤーも。
    // キャンバス上のプレイヤーの位置とマウス位置で移動についての情報が決まる感じ。

    // ここはなくなる・・というかフロアの枚数分初期化する？ああでもstrokeを64に戻す必要があるか。
    // 完成してから255にすると。それ以外特にやることないかも。
    // あ、そうか、エリアの接続状況をここで登録しておかないと。
    // 接続の具合から自動的に辺の接続が行われるメソッドも作らないと（いろいろ大変・・・）
    this.floorArray = [];
    this.w = GRID_W * GRID;
    this.h = GRID_H * GRID;
    for(let i = 0; i < data.floorNum; i++){
      let gr = createGraphics(this.w, this.h);
      gr.stroke(64); // 通ったところは白で
      gr.strokeWeight(GRID * 0.1);
      this.floorArray.push(gr);
    }
	}
	initialize(seed = -1){
		// 状態の初期化と起点の設定
    // これリセットでまとめて書いた方がいい
	  for(let v of this.verticeArray){ v.setState(UNREACHED); v.setType(NORMAL); v.setOnRoute(false); v.resetDegree(); }
		for(let e of this.edgeArray){ e.setState(UNDETERMINED); e.setFlag(UNCHECKED); e.setVisible(false); }
		// 一応シードつけておくか
		if(seed >= 0){ randomSeed(seed); }
		this.currentVertice = random(this.verticeArray);
		this.currentVertice.setState(ARRIVED);
		this.start = this.currentVertice; // スタート設定
		this.edgeStack = []; // 辺スタック
	}
	step(){
		// 終了状況を返す。FINISHを返したら処理終了。
		const undeterminedEdges = this.currentVertice.connected.filter((e) => { return e.cmp.getState() === UNDETERMINED; })
		if(undeterminedEdges.length + this.edgeStack.length === 0){ return FINISH; }
		if(undeterminedEdges.length > 0){
			// 現在の頂点から未確定の辺が伸びている場合
			let connectedEdge = random(undeterminedEdges).cmp;
			let nextVertice = connectedEdge.getOther(this.currentVertice);
			if(nextVertice.getState() === UNREACHED){
				// 辺の先の頂点が未到達の場合
				nextVertice.setState(ARRIVED);
				connectedEdge.setState(IS_PASSABLE);
				// valueを更新してスタートも更新
				const v = this.currentVertice.getValue();
				nextVertice.setValue(v + 1);
				if(this.start.getValue() < v + 1){ this.start = nextVertice; } // スタート位置更新
        // degreeをそれぞれ増やす
        this.currentVertice.increaseDegree();
        nextVertice.increaseDegree();
        // currentVerticeを更新
				this.currentVertice = nextVertice;
				this.edgeStack.push(connectedEdge);
				return FORWARD;
			}else{
				// すでに到達済みの場合
				connectedEdge.setState(IS_NOT_PASSABLE);
			}
			return AVOID;
		}
		// 現在の頂点から伸びているすべての辺が確定済みの場合
		const backEdge = this.edgeStack.pop();
		const backVertice = backEdge.getOther(this.currentVertice);
		this.currentVertice = backVertice;
		return BACK;
	}
	createMaze(){
		let debug = 99999;
		while(debug--){
			const state = this.step();
			if(state === FINISH){ break; }
		}
		this.start.setType(START);
		this.searchGoal();
		this.goal.setType(GOAL);
    this.createFloorGraphics();

    // オブジェクトの配置メソッドはそのうち別立て処理にする
    this.player.setting(this.start);
    for(let en of this.enemyArray){ en.setting(random(this.verticeArray)); }
	}
	searchGoal(){
		// すべてのvalueを0にする→currentVerticeとgoalをstartにして出発→connectedな辺でUNCHECKEDなものだけ選んで進みvalueを1大きいものにしていく
		// その過程で随時goalを更新→CHECKEDしかないなら引き返すしその場合は更新しない
		// edgeStackを使うことで空になったときに終了ってできるのでそうする（戻るときにpopするなど、作成時の処理と同様）
		// 正確には「edgeStackが空」なおかつ「その頂点から行ける場所が皆無」。

    // onRouteについて
    // onRouteどうしようね？？？ゴールからさかのぼっていくしかない？？？
    // 辺に向きがつくのね
    // 向きはedgeStackに放り込んだ時のcurrentからnextへの向き
    // このときのnextにおけるedgeのindexを記録しておく
    // verticeの数だけの配列を用意しておいて
    // 各indexのところにそれがnextのときのつなぐ辺の出ているindexを記録しておく
    // 最後にgoalからgoalも含めてそのedgeのindexにしたがってさかのぼっていって
    // startまでいく、その過程をすべてonRouteにすればいい。OK!

    // これです
    let indexArray = new Array(this.verticeArray.length);
    // indexArray[v.getIndex()] = 「さかのぼるときに選ぶ辺のconnectedにおけるindexというかgetCmp(~~)に入れる引数」

		for(let v of this.verticeArray){ v.setValue(0); }
		this.goal = this.start;
		this.currentVertice = this.start;
    this.start.setOnRoute(true);
		let debug = 99999;
		while(debug--){
		  const uncheckedEdges = this.currentVertice.connected.filter((e) => {
        return (e.cmp.getState() === IS_PASSABLE) && (e.cmp.getFlag() === UNCHECKED);
      });
		  if(uncheckedEdges.length + this.edgeStack.length === 0){ break; }
			if(uncheckedEdges.length === 0){
		    const backEdge = this.edgeStack.pop();
		    const backVertice = backEdge.getOther(this.currentVertice);
		    this.currentVertice = backVertice;
				continue;
			}
			let connectedEdge = random(uncheckedEdges).cmp;
			let nextVertice = connectedEdge.getOther(this.currentVertice);
			connectedEdge.setFlag(CHECKED);
			const v = this.currentVertice.getValue();
			nextVertice.setValue(v + 1);
			if(this.goal.getValue() < v + 1){ this.goal = nextVertice; }
      // ここでnextVerticeにおいてconnectedEdgeが何番なのかサーチする
      const targetIndex = connectedEdge.getIndex();
      for(let i = 0; i < nextVertice.connected.length; i++){
        if(nextVertice.getCmp(i).getIndex() === targetIndex){
          indexArray[nextVertice.getIndex()] = i;
          break;
        }
      }
			this.currentVertice = nextVertice;
			this.edgeStack.push(connectedEdge);
		}
    // 今からgoalからstartまで一気にさかのぼっていきます。
    // その過程で1～9合目が見つかったら随時フラッグに画像をセットしていきます
    // めんどくさい・・・・・
    // 思いついたよ。
    // tmpVはこの探索においてゴール以外のすべての頂点を網羅している
    // いま長さ9の配列を用意して、floor(value*10/goalValue)が正だったら
    // それを-1してindexとしてそこに頂点のindexをぶち込んで逐次更新して
    // 最後に残ったすべての頂点のindexが1合目～9合目に相当する！
    let flagIndexArray = new Array(9);
    this.flags[0].setPosition(this.start.position);
    this.flags[10].setPosition(this.goal.position);
    const goalValue = this.goal.getValue();
    this.goal.setOnRoute(true);
    this.currentVertice = this.goal;
    debug = 99999;
    const startIndex = this.start.getIndex();
    let id = this.currentVertice.getIndex();
    let flagIndex;
    while(debug--){
      // indexArrayの情報をもとに頂点をさかのぼります
      let tmpE = this.currentVertice.getCmp(indexArray[id]);
      let tmpV = tmpE.getOther(this.currentVertice);
      // 途中のマスをすべてtrueにしていきます
      tmpV.setOnRoute(true);
      // tmpVのvalueがgoalValueの0.1倍~0.9倍の整数部分なら・・ってやる。
      this.currentVertice = tmpV;
      id = tmpV.getIndex();
      flagIndex = floor(tmpV.getValue() * 10 / goalValue);
      if(flagIndex > 0){
        flagIndexArray[flagIndex - 1] = id;
      }
      if(id === startIndex){ break; } // startに着いたら終了
    }
    for(let k = 1; k < 10; k++){
      this.flags[k].setPosition(this.verticeArray[flagIndexArray[k - 1]].position);
    }
	}
  createFloorGraphics(){
    //const L = GRID * 0.5;
    // onRouteの頂点だけ色を付けてテストしたいよね
    for(let e of this.edgeArray){
      if(e.getState() === IS_NOT_PASSABLE){ continue; }
      this.drawEdge(e); // 辺描画をメソッド化
    }
    for(let fg of this.floorArray){ fg.stroke(255); }
  }
  drawEdge(e){
    const L = GRID * 0.5;
    const v0 = e.getCmp(0).position;
    const v1 = e.getCmp(1).position;
    const dir0 = e.getDir(0);
    const dir1 = e.getDir(1);
    const z0 = int(v0.z);
    const z1 = int(v1.z);
    if(!e.separate){
      this.floorArray[z0].line(v0.x * GRID, v0.y * GRID, v1.x * GRID, v1.y * GRID);
    }else{
      this.floorArray[z0].line(v0.x * GRID, v0.y * GRID, v0.x * GRID + L * cos(dir0), v0.y * GRID + L * sin(dir0));
      this.floorArray[z1].line(v1.x * GRID, v1.y * GRID, v1.x * GRID + L * cos(dir1), v1.y * GRID + L * sin(dir1));
    }
  }
  update(){
    const pos = this.getDrawPos(this.player.position);
    this.player.setDirection(pos);
    this.player.update();
    this.eventCheck(); // イベントフラグがONならイベントを実行してフラグを折る

    for(let fl of this.flags){ fl.update(); }

    for(let en of this.enemyArray){ en.update(); }
  }
  eventCheck(){
    if(this.player.getEventFlag()){
      // とりあえず到達した頂点についてそこについてる辺をとりだす
      const v = this.player.getLastVertice();
      // 辺が見えていなければ見えるようにする
      for(let eData of v.connected){
        let e = eData.cmp;
        if(e.getState() === IS_NOT_PASSABLE){ continue; }
        if(!e.getVisible()){
          e.setVisible(true);
          this.drawEdge(e);
        }
      }
      this.player.setEventFlag(false);
    }
  }
  getOffSet(p){
    // pをプレイヤーのグローバルな位置としたときの画像の貼り付けの左上座標。
    return {x:constrain(p.x * GRID - DISPLAY_WIDTH * 0.5, 0, this.w - DISPLAY_WIDTH),
            y:constrain(p.y * GRID - DISPLAY_HEIGHT * 0.5, 0, this.h - DISPLAY_HEIGHT)};
  }
  getDrawPos(p, offSet){
    // 画面に表示される位置の計算。
    if(!offSet){ offSet = this.getOffSet(p); } // offSetがundefinedの場合はp自身から計算されたoffSet値を使う
    return {x:p.x * GRID - offSet.x, y:p.y * GRID - offSet.y};
  }
	draw(){
    background(220);
    const currentFloorIndex = this.player.position.z;
    this.base.background(0);
    // ゆくゆくはプレイヤーの存在するフロアに応じたグラフィックが呼び出されて
    // プレイヤーの位置に応じてオフセット処理されたうえで描画される感じ
    const offSet = this.getOffSet(this.player.position);
    // image関数の使い方に注意してね
    // ここで描画部分をいじってプレイヤーが存在するエリアの向こう側も描画するようにするんかな・・
    // となると最大で4つくらいにわけることになりそう
    this.base.image(this.floorArray[currentFloorIndex], 0, 0, this.w, this.h, offSet.x, offSet.y, this.w, this.h);
    this.base.noStroke();

    // 描画に関してはそのうちbaseを渡してそこに描くようにしたいけど・・
    for(let fl of this.flags){
      fl.draw();
      if(fl.position.z === currentFloorIndex){
        const p = this.getDrawPos(fl.position, offSet);
        this.base.image(fl.gr, p.x - FRAG_SIZE * 0.5, p.y - FRAG_SIZE * 0.5);
      }
    }

    // このあとプレイヤーとエネミーの表示。
    this.base.fill(128, 255, 128);
    const p = this.getDrawPos(this.player.position, offSet);
    // ここをスライムの画像表示に書き換える
    const imgId = getImgId(this.player.direction);
    this.base.image(slimeImages[imgId], p.x - GRID * 0.5, p.y - GRID * 0.5 - this.player.getJumpHeight(), GRID, GRID,
                    ((frameCount%32)/4|0) * GRID, 0, GRID, GRID);

    this.base.fill(255);
    for(let en of this.enemyArray){
      if(en.position.z !== currentFloorIndex){ continue; } // ごめんなさい違うフロアにいるときも描画してました。。
      const q = this.getDrawPos(en.position, offSet);
      this.base.square(q.x - GRID * 0.4, q.y - GRID * 0.4, GRID * 0.8);
    }

    image(this.base, OFFSET_X, OFFSET_Y);
    //noLoop();
	}
  clickAction(){
    // クリックされたときの処理
    this.player.jump();
  }
}

function getImgId(dir){
  if(cos(dir) > 0.5){ return 0; }
  else if(cos(dir) < -0.5){ return 2; }
  else if(sin(dir) > 0.5){ return 1; }
  return 3;
}

// 雑に修正案
// まずフロアを何枚か用意させる関数、20x15を何枚か、それを用意して、
// 接続は[[],[],...]って感じで長さ4の配列を用意、
// それに応じて接続を与えるメソッドを用意して完成
// dataにもそれを含めておいてareaの構成で使う
// 16や32や48を足せば反転を表現できるよおわり

// ついでにオフセットについて
// もう遅いので手短に
// まず存在するフロアについて
// その左側がある場合プレイヤーが中央より左なら中心、
// その右側がある場合プレイヤーが中央より右なら中心とする。
// 左側がなくて中央より左なら画面全体ぴったり
// 右側がなくて中央より右なら画面全体ぴったり
// 中央のエリアのオフセット（描画位置の左上座標）が決まったら残りはそれをずらすだけなので楽ちん
// 以上

// GRID_W * GRID_Hをn枚用意する
function createBaseMazeData(n){
  let data = {};
  data.vNum = 0;
  const w = GRID_W;
  const h = GRID_H;
  data.floorNum = n;
  data.x = [];
  data.y = [];
  data.z = [];
  data.connect = []; // インデックスは頂点番号、from:始点、to:終点、dir:辺の出ている方向、separate:フロアまたぎならtrue
  // これはベースデータなのですべてfalse
  // 番号は各フロアについて一番上「左→右」で以下1段ずつ降りていく
  // 終わったら次のフロア
  for(let i = 0; i < n; i++){
    for(let k = 0; k < h; k++){
      for(let m = 0; m < w; m++){
        data.x.push(0.5 + m);
        data.y.push(0.5 + k);
        data.z.push(i);
        data.vNum++;
        const index = i * w * h + w * k + m;
        if(m < w - 1){
          // separateはすべてfalse. フロアまたぎや同じ迷路でのループはtrueになるがそれは個別に指定する。
          data.connect.push({from:index, to:index + 1, dir:0, separate:false});
        }
        if(k < h - 1){
          data.connect.push({from:index, to:index + w, dir:Math.PI * 0.5, separate:false});
        }
      }
    }
  }
  return data;
}

function mazeConnecting(data, connectingInfo){
  data.floorConnect = connectingInfo; // infoは個別にとっておいてエリアの構築で使う
  const w = GRID_W;
  const h = GRID_H;
  for(let i = 0; i < connectingInfo.length; i++){
    const info = connectingInfo[i];
    // connectingInfoの各元はたとえば[0,1,4,5]みたいになっててどのフロアに通じるか書いてある
    // こっちの方がフロア番号が小さいか同じ場合だけ記述する（同じ場合は1回しか出てこないので）
    for(let dir = 0; dir < 4; dir++){
      const k = info[dir];
      if(k < 0){ continue; }
      const q = k / 64 | 0;
      const r = k % 64; // 64で割った余りと商に分けるのは今後の課題(つなぎ方が変わる)
      if(i > r){ continue; }
      // dirで場合分け。
      // dirが0のときはiの右とkの左、dirが1のときはiの下とkの上、dirが2のときはiの左とkの右、dirが3のときはiの上とkの下を
      // つなげる
      switch(dir){
        case 0:
          for(let m = 0; m < h; m++){
            cn0 = {from:i * w * h + w - 1 + m * w, to:r * w * h + m * w, dir:0, separate:true};
            data.connect.push(cn0);
          }
          break;
        case 1:
          for(let m = 0; m < w; m++){
            data.connect.push({from:(i + 1) * w * h - w + m, to:r * w * h + m, dir:Math.PI/2, separate:true});
          }
          break;
        case 2:
          for(let m = 0; m < h; m++){
            data.connect.push({from:i * w * h + m * w, to:r * w * h + w - 1 + m * w, dir:Math.PI, separate:true});
          }
          break;
        case 3:
          for(let m = 0; m < w; m++){
            data.connect.push({from:i * w * h + m, to:(r + 1) * w * h - w + m, dir:Math.PI*3/2, separate:true});
          }
          break;
      }
    }
  }
}

function createMazeData_0(){
  let data = createBaseMazeData(1);
  return data;
}

function createMazeData_1(){
  let data = createBaseMazeData(2);
  //mazeConnecting(data, [[0,0,0,0]]);
  mazeConnecting(data, [[1,1,1,-1], [0,-1,0,0]]); // 作った迷路を右にドッキング
  // 上下左右調べてください
  // それが終わったら迷路の数を増やしてみてください
  // できたね
  return data;
}

// 一般的な長方形のメイズデータ。
// 同じ長方形をn枚用意する感じ
// グリッドサイズはとりあえず考えない。w*GRIDとh*GRIDがキャンバスサイズになり、すべての座標値はGRID倍されて実際の値になる。
// ほかにもひし形とかそういうの作っても面白そう
// 正方形6枚用意して立方体とか、ひし形10枚で正二十面体とか？面白そう。しないけど。三角形4枚とか面白そう。ひし形2枚？方向調整出来ればね。

/*
function createRectMazeData(w, h, n){
  let data = {};
  data.vNum = 0;
  // 冷静に考えたらeNum要らないや。廃止。
  data.w = w;
  data.h = h;
  data.floorNum = n; // フロア数
  data.x = [];
  data.y = [];
  data.z = [];
  data.connect = [];
  // 点のインデックスは左から右へを上から下まで、フロア順に。
  // connectの頂点のインデックスに対応する部屋に配列が入ってて
  // その配列に{index:~~,dir:~~}っていうオブジェクトからなるんだけどそういう感じ
  // dirはラジアン角でその頂点が存在する方向だけどその方向にあるとは限らない、だから個別に情報を用意するわけ。
  // もしその方向にあるならそれ使って計算できちゃうからね。
  // 方針転換・・・・
  // 辺のインデックスのやり方だと複雑化に対応できないので、重複を許さない頂点のペア全体でやる。インデックスの。
  // {from:始点のインデックス、to:終点のインデックス、dir:始点から終点に向かう方向}で。ただしその方向に頂点が
  // あるとは限らない。
  for(let i = 0; i < n; i++){
    for(let k = 0; k < h; k++){
      for(let m = 0; m < w; m++){
        data.x.push(0.5 + m);
        data.y.push(0.5 + k);
        data.z.push(i);
        data.vNum++;
        const index = i * w * h + w * k + m;
        if(m < w - 1){
          // separateはすべてfalse. フロアまたぎや同じ迷路でのループはtrueになるがそれは個別に指定する。
          data.connect.push({from:index, to:index + 1, dir:0, separate:false});
        }
        if(k < h - 1){
          data.connect.push({from:index, to:index + w, dir:Math.PI * 0.5, separate:false});
        }
      }
    }
  }
  return data;
}
*/

// ひし形、三角形、八角形と正方形の組み合わせ、くらいは考えてる。
// あと六角形も。もうハニカムでいいと思う。難しく考えないで。

// たとえばこうする
// 複数の場合はmultiっていう別のテンプレート用意するといい。2つでも4つでも。(createMultiRectMazeDataとかする)
// んで取得してからconnectをいじって辺をつなぐなどする

/*
function createMazeData_0(){
  let data = createRectMazeData(20, 15, 1);
  return data;
}
// たとえばトーラスにするならこの後でdataをいじってeNum増やしたり接続増やしたりする。
// 上下をつなぐ
function createMazeData_1(){
  let data = createRectMazeData(20, 15, 1);
  // 0~19と280~299をつなぐ
  let info = [];
  for(let i = 0; i < 20; i++){
    info.push({from:i, to:280 + i, dir:Math.PI * 1.5, separate:true});
  }
  data.connect.push(...info);
  return data;
}
// 上下左右をつなぐ
function createMazeData_2(){
  let data = createRectMazeData(20, 15, 1);
  // 0~19と280~299をつなぐ
  let info = [];
  for(let i = 0; i < 20; i++){
    info.push({from:i, to:280 + i, dir:Math.PI * 1.5, separate:true});
  }
  // 0,20,40,...,280と19,39,59,...,299をつなぐ
  for(let j = 0; j < 15; j++){
    info.push({from:20 * j, to:19 + 20 * j, dir:Math.PI, separate:true});
  }
  data.connect.push(...info);
  return data;
}
// 2つのフロアをつなぐ
function createMazeData_3(){
  let data = createRectMazeData(20, 15, 2);
  // 0~19と580~599をつなぐ感じで。
  let info = [];
  for(let i = 0; i < 20; i++){
    info.push({from:i, to:580 + i, dir:Math.PI * 1.5, separate:true});
    info.push({from:280 + i, to:300 + i, dir:Math.PI * 0.5, separate:true});
  }
  // さらに280~299と300~319をつなぎ、0,20,40,...と319,339,359,...もつなぎ、19,39,59,...と300,320,340,...もつなぐ。
  for(let j = 0; j < 15; j++){
    info.push({from:20 * j, to:319 + 20 * j, dir:Math.PI, separate:true});
    info.push({from:19 + 20 * j, to:300 + 20 * j, dir:0, separate:true});
  }
  data.connect.push(...info);
  return data;
}
// つなぎ方を変える
function createMazeData_4(){
  let data = createRectMazeData(20, 15, 1);
  // 0~19と299~280をつなぐ（逆順）。さらに0,20,40,...と299,279,259,...をつなぐ（逆順）
  let info = [];
  for(let i = 0; i < 20; i++){
    info.push({from:i, to:299 - i, dir:Math.PI * 1.5, separate:true});
  }
  for(let j = 0; j < 15; j++){
    info.push({from:20 * j, to:299 - 20 * j, dir:Math.PI, separate:true});
  }
  data.connect.push(...info);
  return data;
}
*/

// 作ってて思ったけどこれあれだね・・全体像見えなくてもなんとなくゴール到着出来ちゃうね・・うん。
// となると周囲を暗くして見えなくしても問題ない？ってわけでもなさそうだけど。んー。
// ここまでくると迷路自体はもはや単なるフィールドでしかないので、敵作ったりしないことには発展しないわね。
// 前言撤回。40x30でやってみたけどこれゴールわかんない・・最後はもう運だわ
// 分かれ道でどっちに進んだか覚えておかないと確実に迷う
// 厳しい・・まあそれはおいといて敵出したいわね。で、マウスダウンでdirectionの方向に発射すると。倒すと。
// 倒すとなんか落とす。触るとゲット。時間経過で消滅。敵は減ると現れる。そんな感じ？そんな多くないので衝突判定も適当でOK.

// 単位
// maze本体に・・20個くらい持たせる（暫定）
// 迷路作成の際にそれらにclearして辺を描画
// 薄い色で
// プレイヤーが訪れたら白で新しく塗り替える
// これを使って・・
// うん。2枚用意する
// 片方は今までfloorArrayでやってたやつ（辺とか描いてある）
// もう片方はそこからコピーして使うやつ
// 最後にこれを適当に組み合わせてメインの640x480を構成する流れ
// だから従来の頂点とか辺とかそこらへんは一緒だけど
// そこから先を変える感じ
// 今までは一つのフロアしか扱わなかった
// これからは毎フレームプレイヤーの存在するフロアの上下左右すべて使うことになる感じ・・
// あーなるほどどうするか・・ん－
// じゃあメイン側にも・・全部で5枚くらい用意？
// というかmainGrが要らないのか
// mainGr要らない？？？？？
// 上下左右含めて5つのグラフィックをあらかじめ用意しておいて、
// プレイヤーのいるフロアのあれを描画して（プレイヤー自身が反転フロアにいる場合を考慮してphaseとかいう変数作って）
// 最終的にはそれも考慮するけど・・（反転に対しても上下左右用意する必要はない、あくまで相対的にどうかみたいな）
// 反転描画は位置だけ反転させて普通におけばいい

class Area{
  constructor(id){
    this.id = id;
    this.base = createGraphics(DISPLAY_WIDTH, DISPLAY_HEIGHT);
    this.connected = new Array(4); // ここにdata.floorConnectの情報を格納する感じ
  }
}

// うごめくもの
// まあ、敵とアイテム、かなぁ
// 敵の場合は種類を渡してそれによりスピードHP攻撃力グラフィックもろもろ設定される感じ？
// プレイヤーもそのうちグラフィック用意されるし
class Wanderer{
  constructor(){
    this.currentEdge = undefined;
    this.progress = 0;
    this.from = createVector(0, 0, 0);
    this.to = createVector(0, 0, 0);
    this.currentEdgeDirection = 0;
    this.position = createVector(0, 0, 0); // 3番目の引数はフロア番号
    this.direction = 0;
    this.lastVertice = undefined; // 最後に訪れた頂点。edgeの乗り換えの際に更新される感じ。
    this.speed = 0; // いろいろ。
  }
  setting(v){
    const candidate = v.connected.filter((e) => { return e.cmp.state === IS_PASSABLE });
    const edg = random(candidate).cmp;
    this.setEdge(edg);
    // directionの初期値がないとまずいね（playerはマウスで決めるが任意移動には使えないので）
    if(v.getIndex() === edg.getCmp(0).getIndex()){
      this.progress = 0; this.direction = edg.getDir(0);
    }else{
      this.progress = 1; this.direction = edg.getDir(1);
    }
  }
  setEdge(e){
    this.currentEdge = e;
    this.from = e.getCmp(0).position;
    this.to = e.getCmp(1).position;
    this.currentEdgeDirection = e.getDir(0); // 0から1に向かう方向
  }
  setLastVertice(v){
    // たとえば、このときにイベントフラグをONにして・・・
    this.lastVertice = v;
  }
  getLastVertice(vtc){
    // 取得の際にフラグが立っていたら何かしらあっちで処理してフラグを折る、みたいなことが考えられる。
    // ワナだったらその際に床で置き換えるなど。ああでも動的更新できない・・？？それは不必要だよ。
    // ん－・・テクスチャでインチキして画像差し替えちゃえばできるよ（え）
    return this.lastVertice;
  }
  getPosition(){
    return this.position;
  }
  getDirection(){
    return this.direction;
  }
  update(){
    this.advance();
    this.setPosition();
  }
  advance(){}
  operation(){}
  setPosition(){
    // separate辺の場合はz座標についてあれこれする
    if(!this.currentEdge.separate){
      this.position.set(this.from.x * (1 - this.progress) + this.to.x * this.progress,
                      this.from.y * (1 - this.progress) + this.to.y * this.progress, this.from.z);
    }else{
      let dir;
      // そうか、GRID掛けちゃまずかったっけ・・反省・・
      if(this.progress < 0.5){
        dir = this.currentEdge.getDir(0);
        this.position.set(this.from.x + this.progress * cos(dir), this.from.y + this.progress * sin(dir), this.from.z);
      }else{
        dir = this.currentEdge.getDir(1);
        this.position.set(this.to.x + (1 - this.progress) * cos(dir), this.to.y + (1 - this.progress) * sin(dir), this.to.z);
      }
    }
  }
}

// directionの設定
// プレイヤーの画面内での位置はあっちで計算するのでそれをインプットしてこっちで計算する（マウス使って）
class Player extends Wanderer{
  constructor(){
    super();
    this.speed = 0.125; // 8フレームで1GRID移動する感じ。
    this.eventFlag = false;
    this.jumpFlag = false;
    this.jumpHeight = 0;
    this.jumpCount = 0;
  }
  setEventFlag(flag){
    this.eventFlag = flag;
  }
  getEventFlag(){
    return this.eventFlag;
  }
  jump(){
    if(!this.jumpFlag){
      this.jumpFlag = true;
      this.jumpCount = JUMP_TIME;
    }
  }
  jumpAdjustment(){
    if(this.jumpFlag){
      const c = this.jumpCount;
      this.jumpHeight = c * (JUMP_TIME - c) * 4 * JUMP_HEIGHT / pow(JUMP_TIME, 2); // ジャンプの高さ（GRID考慮済み）
      this.jumpCount--;
      if(this.jumpCount === 0){
        this.jumpFlag = false;
        this.jumpHeight = 0;
      }
    }
  }
  getJumpHeight(){
    return this.jumpHeight;
  }
  update(){
    this.advance();
    this.setPosition();
    this.jumpAdjustment();
  }
  setDirection(pos){
    // posは画面内でのプレイヤーの位置(maze側から送る)
    // マウス位置の取得情報はOFFSETでいじる（迷路ボードの表示位置）
    this.direction = atan2(mouseY - OFFSET_X - pos.y, mouseX - OFFSET_Y - pos.x);
  }
  advance(){
    // prgを増減させる
    const dir = this.direction;
    const edgeDir = this.currentEdgeDirection;
    const criterion = cos(dir - edgeDir);
    this.progress += this.speed * criterion;
    // ここでconstrainをやめる。
    // 0より小さいか1より大きいか
    // 乗り換えの際に候補のedgeがいくつか出現するのね
    // verticeの今のedgeじゃないやつ(0～3個)のどれか。
    // 乗り換えられるedgeが無いか、あっても進行方向に対して内積が負なら乗り換えは起きない。据え置き。
    // ただし据え置きであってもlastVerticeは更新される。これをやらないとクリア判定できないので注意！！
    // 正のものがあるなら乗り換えが起こる。cosが一番大きいものに乗り換える。progressも切り替える。
    // その際にlastVertice（最後に訪れた頂点）を更新する。これをMaze側が取得、それに応じてイベントを発生させる。
    // たとえばGOALならクリアみたいな感じ。
    if(this.progress < 0 || this.progress > 1){
      this.operation();
    }
  }
  operation(){
    // まずたどり着いた頂点をlastVerticeに設定
    // 次にその頂点から伸びる辺でcurrentedgeでないものを洗い出す
    // なければconstrainして処理は終了
    // あればそれらについてこの頂点が1ならdirectionを反転させてから判定する
    // cos(それ-this.direction)が負のものしかなければconstrainして処理は終了
    // あれば一番大きいものを選びそのedgeにする
    // あとはsetEdgeが全部やってくれる
    // 要するにMAX取ってMAXが負ならやることない、正なら・・って感じ。
    const index = (this.progress < 0 ? 0 : 1);
    const vtc = this.currentEdge.getCmp(index);
    this.setLastVertice(vtc);
    this.setEventFlag(true); // イベントフラグをONにする
    const dir = this.direction;
    let edgeDir;
    let nextEdge = undefined;
    let criterion = -1;
    for(let index = 0; index < vtc.connected.length; index++){
      const edg = vtc.getCmp(index);
      if(edg.getState() !== IS_PASSABLE){ continue; } // 通れない辺はスルー
      if(edg.getIndex() === this.currentEdge.getIndex()){ continue; } // 同じ辺の場合はスルー
      edgeDir = edg.getDir(0);
      if(edg.getCmp(0).getIndex() !== vtc.getIndex()){ edgeDir += PI; } // 反対側の頂点の場合は方向を逆にする
      const newCriterion = cos(dir - edgeDir);
      if(criterion < newCriterion){ criterion = newCriterion; nextEdge = edg; }
    }
    if(nextEdge === undefined){
      // 次の行先がない場合は据え置き
      this.progress = constrain(this.progress, 0, 1); return;
    }
    if(criterion > 0){
      // 次の行先があってその方向に進める場合
      this.setEdge(nextEdge);
      if(vtc.getIndex() === nextEdge.getCmp(0).getIndex()){ this.progress = 0; }else{ this.progress = 1; }
      return;
    }else{
      // 次の行先があっても方向が逆の場合
      this.progress = constrain(this.progress, 0, 1); return;
    }
  }
}

// 敵の場合
// 種類により辺の選び方が違ったりする？
// 攻撃とかさせないでジャンプでかわす感じになりそう
class Enemy extends Wanderer{
  constructor(){
    super();
    this.speed = 0.05;
  }
  advance(){
    const criterion = cos(this.direction - this.currentEdgeDirection); // 基本1か-1的な
    this.progress += this.speed * criterion;
    if(this.progress < 0 || this.progress > 1){ this.operation(); }
  }
  operation(){
    // indexを取得→たどり着いた頂点を取得→lastVerticeに登録→来た方向を調べてそっちではない進める辺をランダムで取得
    // それが存在しなければcurrentEdgeに変更はない、directionを逆にする（PIを足す）のをやってから離脱
    // 存在するならそれをセットする。おわり。
    const index = (this.progress < 0 ? 0 : 1);
    const v = this.currentEdge.getCmp(index);
    this.setLastVertice(v);
    const dir = this.direction;
    // 通れる辺で今通ってきたのとは別の辺
    const candidate = v.connected.filter((e) => {
      return e.cmp.getState() === IS_PASSABLE && e.cmp.getIndex() !== this.currentEdge.getIndex();
    });
    if(candidate.length === 0){
      // もともと来た辺を逆走する
      this.direction += Math.PI;
      this.progress = constrain(this.progress, 0, 1);
      return;
    }else{
      // 候補からランダムに選ぶ感じ
      const nextEdge = random(candidate).cmp;
      this.setEdge(nextEdge);
      if(v.getIndex() === nextEdge.getCmp(0).getIndex()){
        this.progress = 0; this.direction = nextEdge.getDir(0);
      }else{
        this.progress = 1; this.direction = nextEdge.getDir(1);
      }
    }
  }
}

class Flag{
  constructor(_img){
    this.img = _img;
    this.gr = createGraphics(FRAG_SIZE, FRAG_SIZE);
    this.gr.fill(128);
    this.gr.noStroke();
    this.durationCount = floor(random(FLAG_ROTATE_TERM));
    this.position = createVector(0, 0, 0);
  }
  setImg(_img){
    this.img = _img;
  }
  setPosition(pos){
    this.position.set(pos);
  }
  update(){
    this.durationCount++;
    if(this.durationCount === FLAG_ROTATE_TERM){
      this.durationCount = 0;
    }
  }
  draw(){
    if(this.durationCount === 0){ return; } // よくわからんけど0でエラーが生じてるので暫定処理
    const progress = this.durationCount / FLAG_ROTATE_TERM;
    this.gr.clear();
    const x = FRAG_SIZE * 0.5 * (1 - abs(sin(progress * TAU)));
    const l = FRAG_SIZE - 2 * x;
    if(progress < 0.5){
      this.gr.image(this.img, x, 0, l, FRAG_SIZE, 0, 0, FRAG_SIZE, FRAG_SIZE);
    }else{
      this.gr.rect(x, 0, l, FRAG_SIZE);
    }
  }
}

function preload(){
  for(let i = 0; i < 4; i++){
    _SLIME.push(loadImage("https://inaridarkfox4231.github.io/assets/slime/slimes_" + i + ".png"));
  }
}

function setup(){
	createCanvas(800, 640); // 2Dでやる
  prepareFlagImage();
  prepareSlimeImage();

	const data = createMazeData_1();
	master = new Maze();
  // 以下の処理はステージ開始時に行われるようにしていきたい・・
  // 同じ形式ならinitializeでいいけど迷路のスタイルを変える場合はふたたびデータ作ってprepareComponentsで
  // 整える必要がある。Mazeは一つだけ用意して使いまわす。
  master.prepareComponents(data);
	master.initialize();
	master.createMaze();
}

function draw(){
  master.update();
	master.draw();
}

// モデルを作る・・オリエンテーリングのあれみたいな感じで。
// と思ったけどS,0,1,2,3,4,5,6,7,8,9,Gの11種類のフラッグ画像作ってね。
// 裏側は灰色で。それをくるくるまわす。
function prepareFlagImage(){
  const texts = ["S", "1", "2", "3", "4", "5", "6", "7", "8", "9", "G"];
  for(let i = 0; i < 11; i++){
    let gr = createGraphics(FRAG_SIZE, FRAG_SIZE);
    gr.colorMode(HSB, 100);
    gr.noStroke();
    gr.background(220);
    gr.fill(i * 8, 100, 100);
    gr.triangle(0, FRAG_SIZE, FRAG_SIZE, FRAG_SIZE, FRAG_SIZE, 0);
    gr.fill(0);
    gr.textAlign(CENTER, CENTER);
    gr.textSize(FRAG_SIZE * 0.5);
    gr.text(texts[i], FRAG_SIZE * 0.25, FRAG_SIZE * 0.25);
    _IMAGES.push(gr);
  }
}

function prepareSlimeImage(){
  for(let i = 0; i < 4; i++){
    let gr = createGraphics(GRID * 8, GRID);
    gr.image(_SLIME[i], 0, 0);
    slimeImages.push(gr);
  }
}

function mouseClicked(){
  master.clickAction();
}

// とりあえずクリックで再生成できるようになってるけど暫定処理ね
