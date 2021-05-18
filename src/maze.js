// グラフが与えられたとき、それに対して木をランダムで生成する、
// つまりランダムチョイスでいくつか辺を消して木にするアルゴリズムを書きたいの。
// その応用として、迷路。

// 頂点と辺を用意して頂点には辺の情報を入れておく
// それぞれの辺は通行可能かどうかについて3種類のフラグをもつ
// UNDETERMINED, PASSABLE, NOT_PASSABLE.
// 頂点は到達したか否か。
// UNREACHED, ARRIVED.

// 頂点をランダムにチョイスしてARRIVEDマークする。
// 連結であることが前提、まあ、木にするので。
// 伸びている辺をランダムにチョイスする。ただしUNDETERMINEDから選ぶ。p5には配列からのランダムチョイス関数があるので、
// filterと組み合わせれば簡単に書ける。その辺をスタックに入れていくのだが・・
// 主に3つの可能性がある。
// まず、最初の状態では、ランダムに選んだ頂点がcurrentVerticeとして選ばれていて辺スタックedgeStackは空になってる。
// ここでもし辺が伸びてなければやることは何もない（連結だし）。つまり頂点1個だけ。
// 終了条件は至ってシンプル：edgeStack is empty && currentVerticeから伸びるすべての辺がUNDETERMINEDでない.
// これだけ。簡単でしょ。
// stepでやること。
// 1.currentVerticeから伸びている辺のうちUNDETERMINEDなものがある場合：
//   それをランダムに取る。その先のverticeがUNREACHEDならば、辺をPASSABLEにしたあとスタックに放り込んで、
//   currentVerticeをそのverticeに更新して処理終了。
//   （つまり元来た方向の辺は常にPASSABLEなので後戻りしなくて済むわけ）
// 2.そうではなく、ARRIVEDであるなら、辺をNOT_PASSABLEにして処理終了。
// 3.UNDETERMINEDな辺がない場合、辺スタックが空でなければ処理は続く。そこからpopした辺の先の頂点でcurrentVerticeを更新して処理終了。
//   つまり一つ後ろの頂点に戻って処理を再開するわけ。

// あとはVISUALIZEですねーーーー課題ですね。はぁ。
// 頂点を円で。辺をサークルで。
// 辺はグレー、通れるなら黒、通れないなら白で色付け。
// 頂点は未到達なら薄い水色、到達済みなら濃い水色。以上！

// すでにあるものを使おう・・・
// これ応用次第で六角形とかもいけるやつ。
// verticeを3次元にしたりとかね

// 最終的に得られる・・
// verticeにvalueを設定する
// はじめははじめのcurrentを0として最後にできるところというかvalueの
// さいだいになるところをスタート、つまりそこを0に再設定して
// そこを0としてサーチで最大を割り出してゴールとする
// verticeの描画を正方形でおきかえ
// edgeの描画を両端のverticeの情報から壁みたいにして描画すればOK
// connectedDataには何番の頂点が何番の辺と結びついているかの
// インデックス情報が入っている
// xとyの配列は頂点の位置情報
// 辺の描画は両端の頂点の情報を元に行われる
// しきいにするならフラグでそこら辺分けたりする
// しきいの場合通れない時だけ描画なのでそこ逆にしたりする感じで
// ハチの巣でもいけるしもっと複雑でもいける

// 辺はIS_PASSABLEのだけがconnectedに入ってる
// そのような辺のフラグをCHECKEDとNON_CHECKEDにわけて
// NON_CHECKEDだけ選んで進んでいく
// 選べなくなったら戻る感じ・・・
// ああ、辺のフラグだけで充分だわね。セルはvalueだけ設定していけばいい。
// currentCellからNON_CHECKEDを選んで別のセルに移動するときだけ
// valueの更新を行う（1を足す）ようにすればいい。
// 最後にvalueが一番大きいところ・・
// これについては何かしら値を保持しておいて
// value設定の際にgoalとかstart？を常に更新し続ける・・
// つまり迷路作成の際にstartをvalueの最大値として更新し続け
// startが決まったらそこを0としてふたたびサーチで
// 今度はgoalをvalue最大のセルとして更新し続ければ手間が省けるんじゃない
// ですかね。

// やること
// これ全体でひとつの「部品」にする
// でないとゲームに使えないので

// 描画については迷路作成の過程では一切やらないで
// 完了した後でまとめて描画する
// それをグラフに貼り付ける
// とりあえず
// 頂点：グラデーションセルを貼り付ける感じ
// 辺：通れない時だけ茶色の壁
// 周囲も茶色の壁

// やり直しについてはフラグを全部リセットしたうえで
// もう一度作ればいいので簡単

// createMazeDataのところですべての・・その、形が正方形や長方形とは限らないっていうやつ。
// 凸型とか凹型とかいろいろ。そういうの。
// 同じ型から違う迷路を作る場合にはフラグをすべてリセットしたうえで

// マウスの方向にユニットが動くようにすれば一応ユニットを動かしてゴールまで連れていく形式でゲームにはできるけど。
// あとなんか徘徊させて当たらないようにするなど。
// アイテムを用意するなど。そこらへん。
// たとえば次数1の頂点をvalueがばらけるように適当に取得してそこにおくとかする

// もしくはこのデータから3次元の迷路作ってカメラで移動できるようにする
// その際は迷わないように途中の床に適切に番号振るとかした方がいい（value50ごととか）
// あるいはもう3次元全域木でやっちゃうとか

// 方向性1：3Dで描く（カメラ位置工夫）
// 方向性2：トーラスにするとか（上下左右くっつける）
// その場合、マウスの方向に動かすとかそういうのも特に問題ない（端っこがつながるので）
// あとcontourやめてcontoursにして線分のつながりだけにするのもありね

// 思ったんだけどさ
// これもしあれ、今迄みたいに「このステージ！はい次！はい次！」だとさ、多分受けないよ。
// ていうか自分も楽しくないよそれ。多分。
// 例えばドラクリとかさ、あれステージ次々クリアするだけだと多分誰もやらないんだよ（今の仕様でもやる人少な・・おっと誰か来たようだ）。
// だから華がないといけない。なんか。なんか必要なんだろ。ストーリーみたいな、何か。
// 無味乾燥だからだめ。なんかを真似するとか・・なんかないと。ただの迷路、じゃ、だめ。

// それはおいといてとりあえず3次元にしてみるか（実験）

let _FLOOR_IMAGE;
let _START_IMAGE;
let _GOAL_IMAGE;

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
	regist(other){ this.connected.push(other); }
	draw(gr){}
}

// 頂点
class Vertice extends Component{
	constructor(x = 0, y = 0, grid = 0){
		super();
		this.position = createVector(x, y);
		this.grid = grid;
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
}

// 辺
class Edge extends Component{
	constructor(grid = 0){
		super();
		this.grid = grid;
		this.flag = undefined; // ゴールサーチ用
	}
	setFlag(_flag){
		this.flag = _flag;
	}
	getFlag(){
		return this.flag;
	}
	getOther(v){
		// 与えられた引数の頂点とは反対側の頂点を返す。
		if(this.connected[0].getIndex() === v.getIndex()){ return this.connected[1]; }
	  if(this.connected[1].getIndex() === v.getIndex()){ return this.connected[0]; }
		return undefined;
	}
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
}

// data = {vNum:12, eNum:17, connect:[[0, 8], [1, 8, 11], [2, 11, 14], ...], x:[...], y:[...]}
// connectはindex番目の頂点に接する辺のindexの配列が入ったもの。
// x, yには頂点の座標が入る予定だけど今はそこまで余裕ないです。
// dataを元にまず頂点と辺が用意されて接続情報が登録されます。
class Graph{
	constructor(data){
		this.base = createGraphics(width, height);
		this.verticeArray = [];
		this.edgeArray = [];
		this.contour = []; // 輪郭線
		this.prepareComponents(data); // 頂点の個数だけ入っててその分verticeを準備し端点として登録・・
		this.start = undefined; // 最初の頂点を設定し、それよりvalueの大きな頂点で随時更新し続ける
		this.goal = undefined; // valueの値を全部リセットしかつstartを起点としてサーチを進め、同じように更新し続ける感じ
	}
	prepareComponents(data){
		const {vNum:vn, eNum:en} = data;
		this.contour = data.contour;
		this.verticeArray = [];
		for(let i = 0; i < vn; i++){
			let newV = new Vertice(data.x[i], data.y[i], data.grid);
			newV.setIndex(i);
			this.verticeArray.push(newV);
		}
		this.edgeArray = [];
		for(let i = 0; i < en; i++){
			let newE = new Edge(data.grid);
			newE.setIndex(i);
			this.edgeArray.push(newE);
		}
		for(let vIndex = 0; vIndex < vn; vIndex++){
			for(let eIndex of data.connect[vIndex]){
				let v = this.verticeArray[vIndex];
				let e = this.edgeArray[eIndex];
				v.regist(e);
				e.regist(v);
			}
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
		const undeterminedEdges = this.currentVertice.connected.filter((e) => { return e.getState() === UNDETERMINED; })
		if(undeterminedEdges.length + this.edgeStack.length === 0){ return FINISH; }
		if(undeterminedEdges.length > 0){
			// 現在の頂点から未確定の辺が伸びている場合
			let connectedEdge = random(undeterminedEdges);
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
		console.log(this.goal.getValue());
		this.createMazeImage();
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
		  const uncheckedEdges = this.currentVertice.connected.filter((e) => { return (e.getState() === IS_PASSABLE) && (e.getFlag() === UNCHECKED); });
		  if(uncheckedEdges.length + this.edgeStack.length === 0){ break; }
			if(uncheckedEdges.length === 0){
		    const backEdge = this.edgeStack.pop();
		    const backVertice = backEdge.getOther(this.currentVertice);
		    this.currentVertice = backVertice;
				continue;
			}
			let connectedEdge = random(uncheckedEdges);
			let nextVertice = connectedEdge.getOther(this.currentVertice);
			connectedEdge.setFlag(CHECKED);
			const v = this.currentVertice.getValue();
			nextVertice.setValue(v + 1);
			if(this.goal.getValue() < v + 1){ this.goal = nextVertice; }
			this.currentVertice = nextVertice;
			this.edgeStack.push(connectedEdge);
		}
	}
	createMazeImage(){
		this.base.clear();
		for(let v of this.verticeArray){ v.draw(this.base); }
		this.base.stroke(0);
		this.base.strokeWeight(4);
		for(let e of this.edgeArray){ e.draw(this.base); }
		const L = this.contour.length;
		for(let i = 0; i < L; i++){
			this.base.line(this.contour[i].x, this.contour[i].y, this.contour[(i + 1) % L].x, this.contour[(i + 1) % L].y);
		}
	}
	draw(offSetX, offSetY){
		image(this.base, offSetX, offSetY);
	}
}

// 迷路とは限らない以上、迷路用のデータ作成部分は分離して記述すべき。
// wは格子の横のサイズ、hは格子の縦のサイズ。
function createMazeData(w, h, grid){
	let data = {};
	data.grid = grid;
	data.contour = [{x:0, y:0}, {x:w * grid, y:0}, {x:w * grid, y:h * grid}, {x:0, y:h * grid}];
	data.vNum = w * h;
	data.eNum = w * (h - 1) + (w - 1) * h;
	data.x = [];
	data.y = [];
	for(let k = 0; k < h; k++){
		for(let m = 0; m < w; m++){
			data.x.push(grid * (0.5 + m));
		}
	}
	for(let k = 0; k < h; k++){
		for(let m = 0; m < w; m++){
			data.y.push(grid * (0.5 + k));
		}
	}
	data.connect = [];
	for(let index = 0; index < w * h; index++){
		const x = index % w;
		const y = Math.floor(index / w);
		let connectedData = [];
		if(y > 0){ connectedData.push(x + (y - 1) * w); }
		if(y < h - 1){ connectedData.push(x + y * w); }
		if(x > 0){ connectedData.push(w * (h - 1) + h * (x - 1) + y); }
		if(x < w - 1){ connectedData.push(w * (h - 1) + h * x + y); }
		data.connect.push(connectedData);
	}
	return data;
}

function setup(){
	createCanvas(640, 480);
	createFloor();
	createStart();
	createGoal();
	const data = createMazeData(32, 24, 20);
	master = new Graph(data);
	master.initialize();
	master.createMaze();
}

function draw(){
  background(220);
	master.draw(0, 0);
}

function createFloor(){
	_FLOOR_IMAGE = createGraphics(100, 100);
	let gr = _FLOOR_IMAGE;
	gr.colorMode(HSB,100);
	gr.noStroke();
	for(let i = 0; i < 50; i++){
		gr.fill(55, 100 - 2 * i, 100);
		gr.rect(i, i, 100 - 2 * i, 100 - 2 * i);
	}
}

function createStart(){
	_START_IMAGE = createGraphics(100, 100);
	let gr = _START_IMAGE;
	gr.colorMode(HSB,100);
	gr.noStroke();
	for(let i = 0; i < 50; i++){
		gr.fill(5, 100 - 2 * i, 100);
		gr.rect(i, i, 100 - 2 * i, 100 - 2 * i);
	}
	gr.fill(0);
	gr.textSize(60);
	gr.textAlign(CENTER, CENTER);
	gr.text("S", 50, 50);
}

function createGoal(){
	_GOAL_IMAGE = createGraphics(100, 100);
	let gr = _GOAL_IMAGE;
	gr.colorMode(HSB,100);
	gr.noStroke();
	for(let i = 0; i < 50; i++){
		gr.fill(75, 100 - 2 * i, 100);
		gr.rect(i, i, 100 - 2 * i, 100 - 2 * i);
	}
	gr.fill(0);
	gr.textSize(60);
	gr.textAlign(CENTER, CENTER);
	gr.text("G", 50, 50);
}

// とりあえずクリックで再生成できるようになってるけど暫定処理ね
function mouseClicked(){
	master.initialize();
	master.createMaze();
}
