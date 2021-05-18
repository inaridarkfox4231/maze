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
// バーテックスカラーでフラグにしてどんなテクスチャを貼り付けるのか決める感じ（スタートとかゴールとか）
// 壁とかいろいろ、壁はとりあえず灰色で床は水色で天井は・・天井は一枚にして（一枚とは限らないけど）

// baseを用意してそこに描いて・・ではなくて、
// WEBGLのモデルを用意して・・ってやる。
// drawではなくデータをもとに、verticeの場合は床を描画、
// edgeの場合は通れないところについて壁を

// UV座標は1より大きいものも設定できるので
// UもVも小数部分を0.01～0.99くらいにしてfloor取って種類を決められるようにする感じ。
// たとえば1.01～1.99にしてスタートの画像を貼り付けるなど。やったことないけどできるでしょう。
// データが完成したらdraw部分をまず破棄したうえでvertice情報に従って床の正方形を用意する
// 普通の床は0でスタートが1でゴールが2.
// 天井は3で壁が4.これはそのうちなんとかする・・種類をね・・今は全部同じでいいので。多分このスケールで2000行かないはず。
// 最後にスタート位置に相当する場所にカメラをおいて完成、のはず。左右キーで横回転、スペースで前進、
// 移動するのは中心
// 斜めについては、、そうね。スペースキーで進む時に方向を補正するといいかも。十字路の場合は前方方向に対して
// 一番近い方に曲がるようにする。とにかくレールからははずさないこと。

// 天井は床の上に設置する。アウターウォールだけ別に用意する。contourをやめてアウターウォールのとこだけ線分の集合を用意するだけ。
// 線分をもとにしてgridに応じて正方形を立ち上げる。
// ていうかgridあるんだから整数でいいよね？？？？整数にしようね？？

// ライティングに問題があるので天井だけなくす。うん。かわりになんか背景用意する。

// まあまあいい感じ・・
// とりあえずplayerはクラスにして、コンポーネントで。
// 存在するedgeとprogress.0～1で。edgeの0番と1番の間のどこにいるかっていうのを毎フレーム計算で出す感じ。
// スペースキーでprgが増えたり減ったりする。どっちであるかはedgeに0から1に向かう方向のdirectionを計算させておいて、
// それと内積取って正なら増やす、負なら減らす。
// 0か1になったらverticeに到達する。verticeに対し各々のedgeでIS_PASSABLEなものを調べ、別のverticeに向かう
// 方向をすべて割り出したうえで、進行方向と内積取って一番デカいものを選んでそっちに行く。つまりedgeを乗り換える。
// プログレスが0か1かはそのedgeでverticeが0か1かで決める。以上。
// 超えたら。
// 0より小さくなったり1より大きくなった時にこの処理を行う。OK.

// まずstartは次数1なのでIS_PASSABLEなedgeはひとつだけ。で、それがcurrentEdge.
// startがどっちであるかで最初のprgを決める。

// 完成したらとりあえず↑キーで進めるようにしますね。

/*
let _FLOOR_IMAGE; // 水色
let _START_IMAGE;
let _GOAL_IMAGE;
let _WALL_IMAGE; // 灰色
*/
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

let master;

let gl, _gl;
let myFillShader;

let vsFill =
"precision mediump float;" +
"precision mediump int;" +

"uniform mat4 uViewMatrix;" +

"uniform bool uUseLighting;" +

"uniform int uAmbientLightCount;" +
"uniform vec3 uAmbientColor[5];" +

"uniform int uDirectionalLightCount;" +
"uniform vec3 uLightingDirection[5];" +
"uniform vec3 uDirectionalDiffuseColors[5];" +
"uniform vec3 uDirectionalSpecularColors[5];" +

"const float specularFactor = 2.0;" +
"const float diffuseFactor = 0.73;" +

"struct LightResult{" +
"  float specular;" +
"  float diffuse;" +
"};" +

"float _lambertDiffuse(vec3 lightDirection, vec3 surfaceNormal){" +
// ここですね。法線ベクトルとライトベクトルで内積を取ってるのは。
"  return max(0.0, dot(-lightDirection, surfaceNormal));" +
"}" +

"LightResult _light(vec3 viewDirection, vec3 normal, vec3 lightVector){" +
"  vec3 lightDir = normalize(lightVector);" +
//compute our diffuse & specular terms
"  LightResult lr;" +
"  lr.diffuse = _lambertDiffuse(lightDir, normal);" +
"  return lr;" +
"}" +

"void totalLight(vec3 modelPosition, vec3 normal, out vec3 totalDiffuse, out vec3 totalSpecular){" +
// Diffuseのデフォは1.0でSpecularのデフォは0.0です。まあ当然よね。
"  totalSpecular = vec3(0.0);" +
"  if(!uUseLighting){" +
"    totalDiffuse = vec3(1.0);" +
"    return;" +
"  }" +
// ライティング使ってるならDiffuseをいちから計算する
"  totalDiffuse = vec3(0.0);" +
"  vec3 viewDirection = normalize(-modelPosition);" +
// これ以降の処理は定められたライトに対してのみ行なわれる感じね

"  for(int j = 0; j < 5; j++){" +
"    if(j < uDirectionalLightCount){" +
"      vec3 lightVector = (uViewMatrix * vec4(uLightingDirection[j], 0.0)).xyz;" +
"      vec3 lightColor = uDirectionalDiffuseColors[j];" +
"      vec3 specularColor = uDirectionalSpecularColors[j];" +
"      LightResult result = _light(viewDirection, normal, lightVector);" +
"      totalDiffuse += result.diffuse * lightColor;" +
"      totalSpecular += result.specular * lightColor * specularColor;" +
"    }" +
"  }" +
"}" +

// こっから下が追加部分
// ライティング適用するならほんとはこういうの書かないといけなかったのよね
// ディレクショナルオンリーにして余計な部分省いてもいいけど
// アンビエント追加

// include lighting.glgl

"attribute vec3 aPosition;" +
"attribute vec3 aNormal;" +
"attribute vec2 aTexCoord;" +
//"attribute vec4 aMaterialColor;" +

"uniform mat4 uModelViewMatrix;" +
"uniform mat4 uProjectionMatrix;" +
"uniform mat3 uNormalMatrix;" +

"varying highp vec2 vVertTexCoord;" +
"varying vec3 vDiffuseColor;" +
"varying vec3 vSpecularColor;" +
"varying vec4 vVertexColor;" +

"void main(void){" +
  // 位置の変更はここでpのところをいじる
"  vec3 p = aPosition;" +
"  vec4 viewModelPosition = uModelViewMatrix * vec4(p, 1.0);" +
"  gl_Position = uProjectionMatrix * viewModelPosition;" +

"  vec3 vertexNormal = normalize(uNormalMatrix * aNormal);" +
"  vVertTexCoord = aTexCoord;" +
//"  vVertexColor = aMaterialColor;" +

// totalLight
// ここでvDiffuseColorとvSpecularColorに色情報をぶち込んでる
// それらはここでは使われずvarying経由でlightTextureに送られて参照され色が決まる
"  totalLight(viewModelPosition.xyz, vertexNormal, vDiffuseColor, vSpecularColor);" +
"  for(int i = 0; i < 5; i++){" +
"    if (i < uAmbientLightCount){" +
"      vDiffuseColor += uAmbientColor[i];" +
"    }" +
"  }" +
"}";

// 若干変更しました
// tintは使いたかったら0～1で今まで通り指定して掛けたかったら掛けてね
// テクスチャで色変えたかったらvVertTexCoordに入ってるから
// 自由に加工して使ってね
// 以上

let fsFill =
"precision mediump float;" +

"uniform vec4 uMaterialColor;" +
"uniform vec4 uTint;" +

// テクスチャ関連
"uniform sampler2D uImg;" +

"uniform bool isTexture;" +
"uniform bool uEmissive;" +

"varying highp vec2 vVertTexCoord;" +
"varying vec3 vDiffuseColor;" +
"varying vec3 vSpecularColor;" +
//"varying vec4 vVertexColor;" +

// getRGB,参上！
"vec3 getRGB(float h, float s, float b){" +
"    vec3 c = vec3(h, s, b);" +
"    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);" +
"    rgb = rgb * rgb * (3.0 - 2.0 * rgb);" +
"    return c.z * mix(vec3(1.0), rgb, c.y);" +
"}" +

"void main(void) {" +
"  vec4 col = texture2D(uImg, vVertTexCoord * vec2(0.25, 1.0));" + // ひとつにまとめてから・・これでいいはず。
// "col = uMaterialColor;" +
"  col.rgb = col.rgb * vDiffuseColor + vSpecularColor;" +
"  gl_FragColor = col;" +
"}";


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
	constructor(x = 0, y = 0){
		super();
		this.position = createVector(x, y);
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
	constructor(grid = 0){
		super();
		this.flag = undefined; // ゴールサーチ用
    this.direction = 0; // 0から1へ向かう方向。
	}
	setFlag(_flag){
		this.flag = _flag;
	}
	getFlag(){
		return this.flag;
	}
  setDirection(){
    const dx = this.connected[1].position.x - this.connected[0].position.x;
    const dy = this.connected[1].position.y - this.connected[0].position.y;
    this.direction = atan2(dy, dx);
  }
  getDirection(){
    return this.direction;
  }
	getOther(v){
		// 与えられた引数の頂点とは反対側の頂点を返す。
		if(this.connected[0].getIndex() === v.getIndex()){ return this.connected[1]; }
	  if(this.connected[1].getIndex() === v.getIndex()){ return this.connected[0]; }
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
class Maze{
	constructor(data){
		//this.base = createGraphics(width, height);
    this.grid = 0; // グリッド情報はグラフが持つ・・もうMazeの方がいいかな。
		this.verticeArray = [];
		this.edgeArray = [];
		this.contour = []; // 輪郭線
		this.prepareComponents(data); // 頂点の個数だけ入っててその分verticeを準備し端点として登録・・
		this.start = undefined; // 最初の頂点を設定し、それよりvalueの大きな頂点で随時更新し続ける
		this.goal = undefined; // valueの値を全部リセットしかつstartを起点としてサーチを進め、同じように更新し続ける感じ
    //this.playerPos = createVector();
    this._player = new Player();
    this.direction = 0;
	}
	prepareComponents(data){
		const {vNum:vn, eNum:en} = data;
		this.contour = data.contour; // {x0,y0,x1,y1}が入っててgridを掛け算して線分ができてそれをもとにアウターウォール
    this.grid = data.grid;
		this.verticeArray = [];
		for(let i = 0; i < vn; i++){
			let newV = new Vertice(data.x[i], data.y[i]);
			newV.setIndex(i);
			this.verticeArray.push(newV);
		}
		this.edgeArray = [];
		for(let i = 0; i < en; i++){
			let newE = new Edge();
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
    // 0から1へ向かう方向を計算
    for(let edg of this.edgeArray){
      edg.setDirection();
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
		//console.log(this.goal.getValue());
    // startから出ているIS_PASSABLEな唯一の辺をthis._playerにセットして
    // かつプログレス(0か1)を与える。
    this._player.setting(this.start);
    //this.playerPos.set(this.start.position.x, this.start.position.y, 0.5); // gridは掛けなくていい
		this.createMazeModel();
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
	createMazeModel(){
    // モデルを作る
    /*
		this.base.clear();
		for(let v of this.verticeArray){ v.draw(this.base); }
		this.base.stroke(0);
		this.base.strokeWeight(4);
		for(let e of this.edgeArray){ e.draw(this.base); }
		const L = this.contour.length;
		for(let i = 0; i < L; i++){
			this.base.line(this.contour[i].x, this.contour[i].y, this.contour[(i + 1) % L].x, this.contour[(i + 1) % L].y);
		}
    */
    const gId = "maze_0";
    this.gId = gId;
    if(!_gl.geometryInHash(gId)){
      const _geom = new p5.Geometry();
      // ベクトルの用意
      let v = createVector();
      // 床と内壁と外壁を用意する
      // 内壁と外壁のテクスチャは全部同じで3（上がv=0で下がv=1って感じで）
      // 床はスタートとゴールは1と2で他はすべて0でお願い。バーテックスカラーは今回不使用。
      // 床はvertice情報に基づいてベクトル用意するだけ、外壁もcontour情報に基づいてベクトル用意するだけ。edgeがめんどくさい。
      // これはIS_NOT_PASSABLEのものすべてに対して90°回転で線分を作ってその上に外壁と同じようにしてやる感じですね。
      // まず床
      let index = 0;
      for(let vtc of this.verticeArray){
        // ±0.5で4つの点を用意する。xで-0.5に対しyで-0.5,+0.5でxで+0.5に対しyで-0.5,+0.5する、で、0,1,2の2,1,3する。
        for(let dx = -0.5; dx < 1; dx += 1){
          for(let dy = -0.5; dy < 1; dy += 1){
            v.set(vtc.position.x + dx, vtc.position.y + dy, 0);
            const _vtcType = vtc.getType(); // 0,1,2.NORMAL,START,GOAL.
            _geom.vertices.push(v.copy());
            _geom.uvs.push(_vtcType + dx + 0.5, dy + 0.5);
          }
        }
        _geom.faces.push(...[[index, index + 1, index + 2], [index + 2, index + 1, index + 3]]);
        index += 4;
      }

      // 次に外壁。ここはとりあえず3で。
      for(let seg of this.contour){
        // seg.x0,seg.y0,seg.x1,seg.y1で下の線分。これを上に1だけ伸ばす。平行移動の軌跡。
        v.set(seg.x0, seg.y0, 1);
        _geom.vertices.push(v.copy()); _geom.uvs.push(3, 0);
        v.set(seg.x0, seg.y0, 0);
        _geom.vertices.push(v.copy()); _geom.uvs.push(3, 1);
        v.set(seg.x1, seg.y1, 1);
        _geom.vertices.push(v.copy()); _geom.uvs.push(4, 0);
        v.set(seg.x1, seg.y1, 0);
        _geom.vertices.push(v.copy()); _geom.uvs.push(4, 1);
        _geom.faces.push(...[[index, index + 1, index + 2], [index + 2, index + 1, index + 3]]);
        index += 4;
      }
      // 最後に内壁・・これはめんどくさいね。
      for(let edg of this.edgeArray){
        if(edg.getState() !== IS_NOT_PASSABLE){ continue; }
        const {x:fx, y:fy} = edg.connected[0].position;
    		const {x:tx, y:ty} = edg.connected[1].position;
    		const mx = (fx + tx) * 0.5;
    		const my = (fy + ty) * 0.5;
    		const dx = (fx - tx) * 0.5;
    		const dy = (fy - ty) * 0.5;
    		const x0 = mx + dy;
        const y0 = my - dx;
        const x1 = mx - dy;
        const y1 = my + dx;
        v.set(x0, y0, 1);
        _geom.vertices.push(v.copy()); _geom.uvs.push(3, 0);
        v.set(x0, y0, 0);
        _geom.vertices.push(v.copy()); _geom.uvs.push(3, 1);
        v.set(x1, y1, 1);
        _geom.vertices.push(v.copy()); _geom.uvs.push(4, 0);
        v.set(x1, y1, 0);
        _geom.vertices.push(v.copy()); _geom.uvs.push(4, 1);
        _geom.faces.push(...[[index, index + 1, index + 2], [index + 2, index + 1, index + 3]]);
        index += 4;
      }

      // 法線・辺計算
      _geom._makeTriangleEdges()._edgesToVertices();
      _geom.computeNormals();

      // バッファ作成
      _gl.createBuffers(gId, _geom);
    }
	}
  update(){
    // ちょっとカメラ動かしてよ
    //if(keyIsDown(LEFT_ARROW)){ this.direction += 0.01 * TAU; }
    //if(keyIsDown(RIGHT_ARROW)){ this.direction -= 0.01 * TAU; }
    this._player.update();
    // 正面行けないかな・・
    // まずプレイヤーがどのセルにいるかの情報に基づいてIS_PASSABLEなedgeの方向があるので、いくつかあるので、
    // それとdirectionで内積取って一番デカかったらそっちへ進むわけ。で、edgeの中におけるプログレスを記録しといて
    // 0か1になるからそのときに・・ていうかああそうね、edgeの上にいるって思った方がいいかもだね。
    // edgeのはしっこ(0か1)についたらそこのverticeを見て乗り換える。verticeから出ているedgeで方向がdirectionに近いものに乗り換え。
    // プログレスも0か1で。んで、そっちで計算。
  }
	draw(){
		//image(this.base, offSetX, offSetY);
    // カメラ？？
    // まずスタート位置にその・・
    const g = this.grid;
    const pos = this._player.getPosition();
    const dir = this._player.getDirection();
    const px = pos.x * g;
    const py = pos.y * g;
    const pz = pos.z * g;
    const dx = cos(dir) * g;
    const dy = sin(dir) * g;
    const dz = 0;
    //console.log(px,py,pz);
    directionalLight(255, 255, 255, 1, 1, 1);
    ambientLight(64);
    camera(px - dx * 0.8, py - dy * 0.8, pz - dz * 0.8, px + dx * 0.4, py + dy * 0.4, pz + dz * 0.4, 0, 0, -1);
    resetShader();
    shader(myFillShader);
    myFillShader.setUniform("uImg", _IMAGE);
    _gl.drawBuffersScaled(this.gId, this.grid, this.grid, this.grid);
    resetShader();
    fill(128, 128, 255);
    translate(px, py, pz * 0.5);
    sphere(this.grid * 0.05);
    //noLoop();
	}
}

// 迷路とは限らない以上、迷路用のデータ作成部分は分離して記述すべき。
// wは格子の横のサイズ、hは格子の縦のサイズ。
function createMazeData(w, h, grid){
	let data = {};
	data.grid = grid;
  data.contour = [];
	//data.contour = [{x:0, y:0}, {x:w * grid, y:0}, {x:w * grid, y:h * grid}, {x:0, y:h * grid}];
  for(let i = 0; i < w; i++){ data.contour.push({x0:i, y0:0, x1:i + 1, y1:0}); }
  for(let j = 0; j < h; j++){ data.contour.push({x0:w, y0:j, x1:w, y1:j + 1}); }
  for(let i = w; i > 0; i--){ data.contour.push({x0:i, y0:h, x1:i - 1, y1:h}); }
  for(let j = h; j > 0; j--){ data.contour.push({x0:0, y0:j, x1:0, y1:j - 1}); }
	data.vNum = w * h;
	data.eNum = w * (h - 1) + (w - 1) * h;
	data.x = [];
	data.y = [];
	for(let k = 0; k < h; k++){
		for(let m = 0; m < w; m++){
			//data.x.push(grid * (0.5 + m));
      data.x.push(0.5 + m);
		}
	}
	for(let k = 0; k < h; k++){
		for(let m = 0; m < w; m++){
			//data.y.push(grid * (0.5 + k));
      data.y.push(0.5 + k);
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

class Player{
  constructor(){
    this.currentEdge = undefined;
    this.progress = 0;
    this.from = createVector(0, 0);
    this.to = createVector(0, 0);
    this.currentEdgeDirection = 0;
    this.position = createVector();
    this.direction = 0;
    this.lastVertice = undefined; // 最後に訪れた頂点。edgeの乗り換えの際に更新される感じ。
    this.rotationSpeed = 0.01 * TAU;
    this.speed = 0.03;
  }
  setting(start){
    for(let edg of start.connected){
      if(edg.getState() === IS_PASSABLE){
        this.setEdge(edg);
        if(start.getIndex() === edg.connected[0].getIndex()){ this.progress = 0; }else{ this.progress = 1; }
        break;
      }
    }
  }
  setEdge(edg){
    this.currentEdge = edg;
    this.from = edg.connected[0].position;
    this.to = edg.connected[1].position;
    this.currentEdgeDirection = edg.getDirection();
  }
  update(){
    if(keyIsDown(LEFT_ARROW)){ this.direction += this.rotationSpeed; }
    else if(keyIsDown(RIGHT_ARROW)){ this.direction -= this.rotationSpeed; }
    else if(keyIsDown(UP_ARROW)){ this.advance(); }
    this.setPosition();
  }
  setLastVertice(vtc){
    // たとえば、このときにイベントフラグをONにして・・・
    this.lastVertice = vtc;
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
    const vtc = this.currentEdge.connected[index];
    this.lastVertice = vtc;
    const dir = this.direction;
    let edgeDir;
    let nextEdge = undefined;
    let criterion = -1;
    for(let edg of vtc.connected){
      if(edg.getState() !== IS_PASSABLE){ continue; }
      if(edg.getIndex() === this.currentEdge.getIndex()){ continue; }
      edgeDir = edg.getDirection();
      if(edg.connected[0].getIndex() !== vtc.getIndex()){ edgeDir += PI; }
      const newCriterion = cos(dir - edgeDir);
      if(criterion < newCriterion){ criterion = newCriterion; nextEdge = edg; }
    }
    if(nextEdge === undefined){
      this.progress = constrain(this.progress, 0, 1); return;
    }
    if(criterion > 0){
      this.setEdge(nextEdge);
      if(vtc.getIndex() === nextEdge.connected[0].getIndex()){ this.progress = 0; }else{ this.progress = 1; }
      return;
    }else{
      this.progress = constrain(this.progress, 0, 1); return;
    }
  }
  setPosition(){
    this.position.set(this.from.x * (1 - this.progress) + this.to.x * this.progress,
                      this.from.y * (1 - this.progress) + this.to.y * this.progress, 0.5);
  }
  getPosition(){
    return this.position;
  }
  getDirection(){
    return this.direction;
  }
}

function setup(){
	_gl = createCanvas(640, 480, WEBGL);
  gl = _gl.GL;
  myFillShader = createShader(vsFill, fsFill);
  noStroke();
  prepareImage();

	const data = createMazeData(8, 8, 100);
	master = new Maze(data);
	master.initialize();
	master.createMaze();
  gl.enable(gl.DEPTH_TEST);
}

function draw(){
  background(0);
  master.update();
	master.draw();
}

function prepareImage(){
  _IMAGE = createGraphics(400, 100);
  let gr = _IMAGE;
  gr.colorMode(HSB, 100);
  // まず床
  gr.noStroke();
  for(let i = 0; i < 50; i++){
		gr.fill(55, 100 - 2 * i, 100);
		gr.rect(i, i, 100 - 2 * i, 100 - 2 * i);
	}
  gr.textSize(60);
  gr.textAlign(CENTER, CENTER);
  // 次にスタート
  for(let i = 0; i < 50; i++){
		gr.fill(5, 100 - 2 * i, 100);
		gr.rect(100 + i, i, 100 - 2 * i, 100 - 2 * i);
	}
  gr.fill(0);
	gr.text("S", 150, 50);
  // 次にゴール
  for(let i = 0; i < 50; i++){
		gr.fill(75, 100 - 2 * i, 100);
		gr.rect(200 + i, i, 100 - 2 * i, 100 - 2 * i);
	}
  gr.fill(0);
	gr.text("G", 250, 50);
  // 最後に壁
  for(let i = 0; i < 50; i++){
		gr.fill(i * 2);
		gr.rect(300 + i, i, 100 - 2 * i, 100 - 2 * i);
	}
}

// とりあえずクリックで再生成できるようになってるけど暫定処理ね
