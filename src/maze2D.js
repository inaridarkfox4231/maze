
let _IMAGES = []; // とりあえずスタートとゴールとポイントの画像11個からなる配列おねがいね
const FLAG_ROTATE_TERM = 180; // フラッグの回転のスパン

// 表示のオフセット
const OFFSET_X = 80;
const OFFSET_Y = 80;

const DISPLAY_WIDTH = 640;
const DISPLAY_HEIGHT = 480;

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

const GRID = 32; // グリッドサイズ

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
    this.base = createGraphics(640, 480);
    // フロアの縦横の大きさを保持しといてオフセットの計算で使う
    this.w = 0;
    this.h = 0;
		this.verticeArray = [];
		this.edgeArray = [];
    this.floorArray = []; // フロアグラフィックの集合（webglでフロア枚数分）
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
    this.floorArray = [];
    this.w = data.w * GRID;
    this.h = data.h * GRID;
    for(let i = 0; i < data.floorNum; i++){
      let gr = createGraphics(this.w, this.h);
      gr.stroke(255);
      gr.strokeWeight(GRID * 0.1);
      this.floorArray.push(gr);
    }
	}
	initialize(seed = -1){
		// 状態の初期化と起点の設定
	  for(let v of this.verticeArray){ v.setState(UNREACHED); v.setType(NORMAL); v.setOnRoute(false); }
		for(let e of this.edgeArray){ e.setState(UNDETERMINED); e.setFlag(UNCHECKED); }
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
    const L = GRID * 0.5;
    // onRouteの頂点だけ色を付けてテストしたいよね
    for(let e of this.edgeArray){
      if(e.getState() === IS_NOT_PASSABLE){ continue; }
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
  }
  update(){
    const pos = this.getDrawPos(this.player.position);
    this.player.setDirection(pos);
    this.player.update();

    for(let fl of this.flags){ fl.update(); }

    for(let en of this.enemyArray){ en.update(); }
  }
  getOffSet(p){
    // pをプレイヤーのグローバルな位置としたときの画像の貼り付けの左上座標。
    return {x:constrain(p.x * GRID - 320, 0, this.w - 640), y:constrain(p.y * GRID - 240, 0, this.h - 480)};
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
    this.base.image(this.floorArray[currentFloorIndex], 0, 0, this.w, this.h, offSet.x, offSet.y, this.w, this.h);
    this.base.noStroke();

    // 描画に関してはそのうちbaseを渡してそこに描くようにしたいけど・・
    for(let fl of this.flags){
      fl.draw();
      if(fl.position.z === currentFloorIndex){
        const p = this.getDrawPos(fl.position, offSet);
        this.base.image(fl.gr, p.x - GRID * 0.5, p.y - GRID * 0.5);
      }
    }

    // このあとプレイヤーとエネミーの表示。
    this.base.fill(128, 255, 128);
    const p = this.getDrawPos(this.player.position, offSet);
    this.base.square(p.x - GRID * 0.3, p.y - GRID * 0.3, GRID * 0.6);

    this.base.fill(255);
    for(let en of this.enemyArray){
      if(en.position.z !== currentFloorIndex){ continue; } // ごめんなさい違うフロアにいるときも描画してました。。
      const q = this.getDrawPos(en.position, offSet);
      this.base.square(q.x - GRID * 0.4, q.y - GRID * 0.4, GRID * 0.8);
    }

    image(this.base, OFFSET_X, OFFSET_Y);
    //noLoop();
	}
}

// 一般的な長方形のメイズデータ。
// 同じ長方形をn枚用意する感じ
// グリッドサイズはとりあえず考えない。w*GRIDとh*GRIDがキャンバスサイズになり、すべての座標値はGRID倍されて実際の値になる。
// ほかにもひし形とかそういうの作っても面白そう
// 正方形6枚用意して立方体とか、ひし形10枚で正二十面体とか？面白そう。しないけど。三角形4枚とか面白そう。ひし形2枚？方向調整出来ればね。
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

// ひし形、三角形、八角形と正方形の組み合わせ、くらいは考えてる。
// あと六角形も。もうハニカムでいいと思う。難しく考えないで。

// たとえばこうする
// 複数の場合はmultiっていう別のテンプレート用意するといい。2つでも4つでも。(createMultiRectMazeDataとかする)
// んで取得してからconnectをいじって辺をつなぐなどする
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
// 作ってて思ったけどこれあれだね・・全体像見えなくてもなんとなくゴール到着出来ちゃうね・・うん。
// となると周囲を暗くして見えなくしても問題ない？ってわけでもなさそうだけど。んー。
// ここまでくると迷路自体はもはや単なるフィールドでしかないので、敵作ったりしないことには発展しないわね。
// 前言撤回。40x30でやってみたけどこれゴールわかんない・・最後はもう運だわ
// 分かれ道でどっちに進んだか覚えておかないと確実に迷う
// 厳しい・・まあそれはおいといて敵出したいわね。で、マウスダウンでdirectionの方向に発射すると。倒すと。
// 倒すとなんか落とす。触るとゲット。時間経過で消滅。敵は減ると現れる。そんな感じ？そんな多くないので衝突判定も適当でOK.

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
    this.gr = createGraphics(GRID, GRID);
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
    const x = GRID * 0.5 * (1 - abs(sin(progress * TAU)));
    const l = GRID - 2 * x;
    if(progress < 0.5){
      this.gr.image(this.img, x, 0, l, GRID, 0, 0, GRID, GRID);
    }else{
      this.gr.rect(x, 0, l, GRID);
    }
  }
}

// 攻撃クラスって感じでよろしく・・
class Weapon{
  constructor(){}
}

// 当たり判定は円（敵とかプレイヤーとか全部円）
class Bullet extends Weapon{
  constructor(){
    super();
  }
}

// 当たり判定は線分（箇所によりダメージが変化）
class Lance extends Weapon{
  constructor(){
    super();
  }
}

// 当たり判定は半直線（スリップダメージ、当たっている間常にダメージ）
// ギミックとしてのレーザーもあるかも
class Laser extends Weapon{
  constructor(){
    super();
  }
}

function setup(){
	createCanvas(800, 640); // 2Dでやる
  prepareFlagImage();

	const data = createMazeData_3();
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
    let gr = createGraphics(GRID, GRID);
    gr.colorMode(HSB, 100);
    gr.noStroke();
    gr.background(220);
    gr.fill(i * 8, 100, 100);
    gr.triangle(0, GRID, GRID, GRID, GRID, 0);
    gr.fill(0);
    gr.textAlign(CENTER, CENTER);
    gr.textSize(GRID * 0.5);
    gr.text(texts[i], GRID * 0.25, GRID * 0.25);
    _IMAGES.push(gr);
  }
}

// とりあえずクリックで再生成できるようになってるけど暫定処理ね
