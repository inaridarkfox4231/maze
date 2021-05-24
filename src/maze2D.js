// 2Dでやるぜ

// TODO
// 余計なコードの削除
// トーラス構造でのテスト
// 線の装飾や背景はどうするか
// オフセットは機能しているのか（大きなサイズでもきちんと動くのか）
// 各種アイコン、プレイヤーの表示
// あと挙動が若干不自然なのをどう解消するのか
// などなど

// オフセット失敗してますね・・
// ただおでかけしたいので後回しにしましょう。
// とりあえず今は癒しの時間が欲しいです。

let _IMAGE; // すべてのイメージ。とりあえず400x100にして左から順に床、スタート、ゴール、壁。

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
  /*
	draw(gr){
		//gr.noStroke();
		//if(this.state === UNREACHED){ gr.fill(158, 198, 255); }else{ gr.fill(0, 0, 225); }
		//gr.circle(this.position.x, this.position.y, 8);
		let img;
		if(this.type === NORMAL){ img = _FLOOR_IMAGE; }
		else if(this.type === START){ img = _START_IMAGE; }
		else if(this.type === GOAL){ img = _GOAL_IMAGE; }
		gr.image(img, this.position.x - this.grid * 0.5, this.position.y - this.grid * 0.5, this.grid, this.grid, 0, 0, 100, 100);
	}
  */
}

// 辺
class Edge extends Component{
	constructor(_separate = false){
		super();
		this.flag = undefined; // ゴールサーチ用
    this.separate = _separate; // 分かれてるかどうかっていう。
    //this.direction = 0; // 0から1へ向かう方向。
    // connectedに方向情報入れることにしたのでdirectionは廃止。
	}
	setFlag(_flag){
		this.flag = _flag;
	}
	getFlag(){
		return this.flag;
	}
  /*
  // ここは、廃止かなぁ。
  setDirection(){
    // このやり方だとフロアまたぎ出来ないのでもう定義するときに決めちゃおう。引数で。
    // 0から1に向かう方向で一定。またぎでも。
    const dx = this.connected[1].position.x - this.connected[0].position.x;
    const dy = this.connected[1].position.y - this.connected[0].position.y;
    this.direction = atan2(dy, dx);
  }
  getDirection(){
    return this.direction;
  }
  */
	getOther(v){
		// 与えられた引数の頂点とは反対側の頂点を返す。
		if(this.getCmp(0).getIndex() === v.getIndex()){ return this.getCmp(1); }
	  if(this.getCmp(1).getIndex() === v.getIndex()){ return this.getCmp(0); }
		return undefined;
	}
  /*
	draw(gr){
		if(this.state !== IS_NOT_PASSABLE){ return; }
		const {x:fx, y:fy} = this.connected[0].position;
		const {x:tx, y:ty} = this.connected[1].position;
		const mx = (fx + tx) * 0.5;
		const my = (fy + ty) * 0.5;
		const dx = (fx - tx) * 0.5;
		const dy = (fy - ty) * 0.5;
		gr.line(mx + dy, my - dx, mx - dy, my + dx);
	}
  */
}

// data = {vNum:12, eNum:17, connect:[[0, 8], [1, 8, 11], [2, 11, 14], ...], x:[...], y:[...]}
// connectはindex番目の頂点に接する辺のindexの配列が入ったもの。
// x, yには頂点の座標が入る予定だけど今はそこまで余裕ないです。
// dataを元にまず頂点と辺が用意されて接続情報が登録されます。

// WEBGLで背景として迷路のボードを
// WEBGLのgrの配列のプロパティを持たせる！それと別に640x480のボードを！そこにオフセット考慮してはりつけ！！！！！！
class Maze{
	constructor(){
		//this.base = createGraphics(width, height);
    //this.grid = 0; // グリッド情報はグラフが持つ・・もうMazeの方がいいかな。
    this.base = createGraphics(640, 480);
    // フロアの縦横の大きさを保持しといてオフセットの計算で使う
    this.w = 0;
    this.h = 0;
		this.verticeArray = [];
		this.edgeArray = [];
    this.floorArray = []; // フロアグラフィックの集合（webglでフロア枚数分）
		//this.contour = []; // 輪郭線 // はいcontourは廃止です
		//this.prepareComponents(data); // 頂点の個数だけ入っててその分verticeを準備し端点として登録・・
		this.start = undefined; // 最初の頂点を設定し、それよりvalueの大きな頂点で随時更新し続ける
		this.goal = undefined; // valueの値を全部リセットしかつstartを起点としてサーチを進め、同じように更新し続ける感じ

    this.player = new Player(); // player動かすのもいろいろ考えないとね・・ // プレイヤーは後回し
	}
	prepareComponents(data){
		const {vNum:vn} = data;
		//this.contour = data.contour; // {x0,y0,x1,y1}が入っててgridを掛け算して線分ができてそれをもとにアウターウォール
    // contourは廃止。
    //this.grid = data.grid;
		this.verticeArray = [];
		for(let i = 0; i < vn; i++){
			let newV = new Vertice(data.x[i], data.y[i], data.z[i]); // zはフロア番号
			newV.setIndex(i);
			this.verticeArray.push(newV);
		}
    // connectの各元はedgeと一対一で対応しているので、connectを走査してedgeをその都度
    // 作っていけばいい。だからここで作る必要はない。
    /*
		this.edgeArray = [];
		for(let i = 0; i < en; i++){
			let newE = new Edge();
			newE.setIndex(i);
			this.edgeArray.push(newE);
		}
    */
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
	  for(let v of this.verticeArray){ v.setState(UNREACHED); v.setType(NORMAL); }
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

    // ここまでは一緒。
    // ここから先はまずdata.floorNumの数だけグラフィックが与えられているのでstrokeShaderを使ってvalue値をもとに
    // 各々のグラフィックに経路を描画する。ただし0の向こうに1がない場合は分けて半分ずつ。それを忘れずに。
    // separateがtrueかfalseかっていうのを用意しましょう。で、基本はtrueだけどまたぐ場合にfalseにする・・・
    // connectの中に放り込んでおいてそこから情報を取得、edgeのseparateにtrueかfalseがぶち込まれる感じ。
    // separateがtrueの場合は半分ずつ、って感じ。
    // フロアごとに[]を作り、その元は何からなるかというとGRID考慮したうえでの始点の座標、終点の座標。ただしz座標は
    // フロアナンバーではなくvalueから計算したバーテックスの色のhue値。だからまたぐ場合は半分になるわけ（dir*GRIDだけ半分進む）。
    // 中点だったり画面の橋だったり。ひし形図形ならその限りじゃないけど。
    // zからhue値を割り出せればそれによりグラデーショナルラインが引けるのでよし！
    // 迷路とは別の背景画像やスタート、ゴール、プレイヤーは2Dで描くなど自前で用意する。

    // もろもろ終わったらプレイヤーのセッティング。

		//console.log(this.goal.getValue());
    // startから出ているIS_PASSABLEな唯一の辺をthis._playerにセットして
    // かつプログレス(0か1)を与える。
    this.player.setting(this.start); // プレイヤーは後回し。
    //this.playerPos.set(this.start.position.x, this.start.position.y, 0.5); // gridは掛けなくていい
		//this.createMazeModel(); // 廃止。
	}
	searchGoal(){
		// すべてのvalueを0にする→currentVerticeとgoalをstartにして出発→connectedな辺でUNCHECKEDなものだけ選んで進みvalueを1大きいものにしていく
		// その過程で随時goalを更新→CHECKEDしかないなら引き返すしその場合は更新しない
		// edgeStackを使うことで空になったときに終了ってできるのでそうする（戻るときにpopするなど、作成時の処理と同様）
		// 正確には「edgeStackが空」なおかつ「その頂点から行ける場所が皆無」。
		for(let v of this.verticeArray){ v.setValue(0); }
		this.goal = this.start;
		this.currentVertice = this.start;
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
			this.currentVertice = nextVertice;
			this.edgeStack.push(connectedEdge);
		}
	}
  createFloorGraphics(){
    const L = GRID * 0.5;
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
    // ちょっとカメラ動かしてよ
    //if(keyIsDown(LEFT_ARROW)){ this.direction += 0.01 * TAU; }
    //if(keyIsDown(RIGHT_ARROW)){ this.direction -= 0.01 * TAU; }
    // this._player.update(); // プレイヤーは後回し
    // 正面行けないかな・・
    // まずプレイヤーがどのセルにいるかの情報に基づいてIS_PASSABLEなedgeの方向があるので、いくつかあるので、
    // それとdirectionで内積取って一番デカかったらそっちへ進むわけ。で、edgeの中におけるプログレスを記録しといて
    // 0か1になるからそのときに・・ていうかああそうね、edgeの上にいるって思った方がいいかもだね。
    // edgeのはしっこ(0か1)についたらそこのverticeを見て乗り換える。verticeから出ているedgeで方向がdirectionに近いものに乗り換え。
    // プログレスも0か1で。んで、そっちで計算。
    const pos = this.getDrawPos(this.player.position);
    this.player.setDirection(pos);
    this.player.update();
  }
  getOffSet(p){
    // pをプレイヤーのグローバルな位置としたときの画像の貼り付けの左上座標。
    return {x:constrain(p.x * GRID - 320, 0, this.w - 640), y:constrain(p.y * GRID - 240, 0, this.h - 480)};
  }
  getDrawPos(p){
    // 画面に表示される位置の計算。
    return {x:p.x * GRID - constrain(p.x * GRID - 320, 0, this.w - 640), y:p.y * GRID - constrain(p.y * GRID - 240, 0, this.h - 480)};
  }
	draw(){
    background(220);
    const currentFloorIndex = this.player.position.z;
    this.base.background(0);
    // ゆくゆくはプレイヤーの存在するフロアに応じたグラフィックが呼び出されて
    // プレイヤーの位置に応じてオフセット処理されたうえで描画される感じ
    this.base.image(this.floorArray[currentFloorIndex], 0, 0); // とりあえずこれだけ
    this.base.noStroke();
    if(this.start.position.z === currentFloorIndex){
      this.base.fill(255, 128, 0);
      const s = this.getDrawPos(this.start.position);
      this.base.circle(s.x, s.y, GRID * 0.8);
    }
    if(this.goal.position.z === currentFloorIndex){
      this.base.fill(0, 128, 255);
      const g = this.getDrawPos(this.goal.position);
      this.base.circle(g.x, g.y, GRID * 0.8);
    }
    // このあとスタート、ゴール、プレイヤーの表示。
    this.base.fill(128, 255, 128);
    const p = this.getDrawPos(this.player.position);
    this.base.circle(p.x, p.y, GRID * 0.4);
    image(this.base, 0, 0);
    //noLoop();
	}
}

// 迷路とは限らない以上、迷路用のデータ作成部分は分離して記述すべき。
// wは格子の横のサイズ、hは格子の縦のサイズ。
// んー
// 長方形と、それを組み合わせたものしか使わないので、、、
// 自由なつなぎ方をさせるにはどうするか？？？
// データを増やす
// 0,1,2,3のいずれの方向に接続点が伸びているかの情報を与えて辺が点からその情報を取得してそれに基づいて
// グラフに描画する、たとえば階層0から階層2に伸びる場合は階層0の方を見て1に伸びてたら下に半分伸ばして2の方がこの場合
// 3に伸びてるから上に半分伸ばす、プレイヤーがその上を移動する際にも階層0の側から行く場合はプログレス0.5までその方向に移動する感じ
// 実際に点が見えてなくてもこれでいける
// これ使えば折れ曲がった経路も可能？マウス操作がめんどいので却下。

// あーーーー、そうだ、階層を引数に加えて、複数用意して統合、とかできたらいいのに！じかんがない！
// 通常の長方形迷路。輪郭は周囲全体。

// 全部統一
// その、まずcontourは廃止。で、線分ごとにそれぞれのフロアの情報配列に放り込んで・・
// あー、頂点と方向と長さの組をね。2つの頂点を参照して同じフロアなら0から1まで普通に。
// 違うフロアの場合は・・まあ辺が0から1に向かうdirectionの情報を持ってるので、それに従って半分までって感じ。
// 書き方を統一したいので{頂点、方向、長さ}？？あ、まあ、そうね・・{x,y,z,w}で(x,y)と(z,w)でやればいいか？
// んーと。valueからhue値計算してそれをz座標として渡したいのでそれも追加で。{x0,y0,z0,x1,y1,z1}ですね。
// そうしてフロアの枚数だけオブジェクトの配列ができたらそれをもとにそれぞれのフロアに相当するWEBGLのキャンバスに線分の
// データを放り込んでそんな感じで。うん。
// これを背景として使う。黒一色のバックグラウンドに貼り付ける。なんかアニメーションあってもいいかも。三角四角がくるくる～とか。
// もういっそ毎フレーム描画でいいのでは？？とか思ったりする。

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
/*
function createSingleRectMazeData(w, h){
	let data = {};
	data.grid = GRID;
  data.contours = [];
  let contour = [];
	//data.contour = [{x:0, y:0}, {x:w * grid, y:0}, {x:w * grid, y:h * grid}, {x:0, y:h * grid}];
  for(let i = 0; i < w; i++){ contour.push({x0:i, y0:0, z0:0, x1:i + 1, y1:0, z1:0}); }
  for(let j = 0; j < h; j++){ contour.push({x0:w, y0:j, z0:0, x1:w, y1:j + 1, z1:0}); }
  for(let i = w; i > 0; i--){ contour.push({x0:i, y0:h, z0:0, x1:i - 1, y1:h, z1:0}); }
  for(let j = h; j > 0; j--){ contour.push({x0:0, y0:j, z0:0, x1:0, y1:j - 1, z1:0}); }
  data.contours.push(contour);
	data.vNum = w * h;
	data.eNum = w * (h - 1) + (w - 1) * h;
	data.x = [];
	data.y = [];
  data.z = []; // 0とか1とか。つなぐときに使う。
	for(let k = 0; k < h; k++){
		for(let m = 0; m < w; m++){
			//data.x.push(grid * (0.5 + m));
      data.x.push(0.5 + m);
      data.z.push(0);
		}
	}
	for(let k = 0; k < h; k++){
		for(let m = 0; m < w; m++){
			//data.y.push(grid * (0.5 + k));
      data.y.push(0.5 + k);
		}
	}
	data.connect = [];
  // 各頂点についてどこと接続してるかみたいなのを入力
  // 別階層の場合は追加でコードを・・すればいいはず
	for(let index = 0; index < w * h; index++){
		const x = index % w;
		const y = Math.floor(index / w);
		let connectedData = [];
    // idは接続されてる点のidでdirはそれがある方向ですね。
		if(y > 0){ connectedData.push({id:x + (y - 1) * w, dir:3}); }
		if(y < h - 1){ connectedData.push({id:x + y * w, dir:1}); }
		if(x > 0){ connectedData.push({id:w * (h - 1) + h * (x - 1) + y, dir:2}); }
		if(x < w - 1){ connectedData.push({id:w * (h - 1) + h * x + y, dir:0}); }
		data.connect.push(connectedData);
	}
	return data;
  // 同じ階層で上下をつなぐとか、違う階層を使う場合っていうのは、
  // これをいくつも用意したうえで適切につなぐ処理した方が楽そうだね
  // もっとも十字型とかH字型とか凹字型だったら別のテンプレートが必要になるけど。
}

// 複数版（nは階層数）
// contoursについては別枠（どこが輪郭になるかでバリエーションがあるので）
// 作ったうえでの接続については別枠（辺の個数eNumを増やしたり新たに接続を作ったりするので）
function createMultiRectMazeData(w, h, n){

}
*/

// たとえばこうする
// datumの配列とかじゃないよ・・ひとつにおさまってるので。
// 複数の場合はmultiっていう別のテンプレート用意するといい。2つでも4つでも。(createMultiRectMazeDataとかする)
// んで取得してからconnectをいじって辺をつなぐなどする
function createMazeData_0(){
  let data = createRectMazeData(20, 15, 1);
  return data;
}
// たとえばトーラスにするならこの後でdataをいじってeNum増やしたり接続増やしたりする。

// directionの設定
// プレイヤーの画面内での位置はあっちで計算するのでそれをインプットしてこっちで計算する（マウス使って）
class Player{
  constructor(){
    this.currentEdge = undefined;
    this.progress = 0;
    this.from = createVector(0, 0);
    this.to = createVector(0, 0);
    this.currentEdgeDirection = 0;
    this.position = createVector(0, 0, 0); // 3番目の引数はフロア番号
    this.direction = 0;
    this.lastVertice = undefined; // 最後に訪れた頂点。edgeの乗り換えの際に更新される感じ。
    this.speed = 0.125; // 8フレームで1GRID移動する感じ。
  }
  setting(start){
    for(let index = 0; index < start.connected.length; index++){
      const edg = start.getCmp(index);
      if(edg.getState() === IS_PASSABLE){
        this.setEdge(edg);
        if(start.getIndex() === edg.getCmp(0).getIndex()){ this.progress = 0; }else{ this.progress = 1; }
        break;
      }
    }
  }
  setEdge(edg){
    this.currentEdge = edg;
    this.from = edg.getCmp(0).position;
    this.to = edg.getCmp(1).position;
    this.currentEdgeDirection = edg.getDir(0); // 0から1に向かう方向
  }
  update(){
    /*
    if(keyIsDown(LEFT_ARROW)){ this.direction += this.rotationSpeed; }
    else if(keyIsDown(RIGHT_ARROW)){ this.direction -= this.rotationSpeed; }
    else if(keyIsDown(UP_ARROW)){ this.advance(); }
    */
    this.advance();
    this.setPosition();
  }
  setDirection(pos){
    // posは画面内でのプレイヤーの位置(maze側から送る)
    this.direction = atan2(mouseY - pos.y, mouseX - pos.x);
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
  advance(){
    // prgを増減させる
    const dir = this.direction;
    const edgeDir = this.currentEdgeDirection;
    const criterion = cos(dir - edgeDir);
    if(criterion > 0){ this.progress += this.speed; }else{ this.progress -= this.speed; }
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
    //this.progress = constrain(this.progress, 0, 1);
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
  setPosition(){
    // separate辺の場合はz座標についてあれこれする
    let zCoord;
    if(this.progress < 0.5){
      zCoord = this.from.z;
    }else{
      zCoord = this.to.z;
    }
    this.position.set(this.from.x * (1 - this.progress) + this.to.x * this.progress,
                      this.from.y * (1 - this.progress) + this.to.y * this.progress, zCoord);
  }
  getPosition(){
    return this.position;
  }
  getDirection(){
    return this.direction;
  }
}

function setup(){
	createCanvas(640, 480); // 2Dでやる
  prepareImage();

	const data = createMazeData_0();
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

function prepareImage(){
  _IMAGE = createGraphics(200, 100);
  let gr = _IMAGE;
  gr.textSize(60);
  gr.textAlign(CENTER, CENTER);
  // スタート
  for(let i = 0; i < 50; i++){
		gr.fill(5, 100 - 2 * i, 100);
		gr.rect(100 + i, i, 100 - 2 * i, 100 - 2 * i);
	}
  gr.fill(0);
	gr.text("S", 150, 50);
  // ゴール
  for(let i = 0; i < 50; i++){
		gr.fill(75, 100 - 2 * i, 100);
		gr.rect(200 + i, i, 100 - 2 * i, 100 - 2 * i);
	}
  gr.fill(0);
	gr.text("G", 250, 50);
}

// とりあえずクリックで再生成できるようになってるけど暫定処理ね
