$(function() {

  var  menuNum = 0;
  const materialMenuMag = 0.84;
  const playerScaleMag = 0.1;
  var color = { font: '#111111', hfBack: '#', trayBack: '#' };

  var categoryName = [ 'stage', 'warp', 'tag', 'coin', 'enemy', 'goal', 'player' ];
  var selectedCategory = null;
  var selectedObj = null;
  var imageName = { twitter: {path: 'images/twitter.png', category: 'stage', ability: 'none'},
                    waraiotoko: {path: 'images/nc73730.png', category: 'stage', ability: 'none'},
                    stick: {path: 'images/stick.png', category: 'stage', ability: 'none'},
                    mikan: {path: 'images/mikan.png', category: 'stage', ability: 'none'},
                    block1: {path: 'images/block1.png', category: 'stage', ability: 'none'},
                    block2: {path: 'images/block2.png', category: 'stage', ability: 'impact'},
                    warp: {path: 'images/warp.png', category: 'warp', ability: 'none'},
                    tag1: {path: 'images/tag1.png', category: 'tag', ability: 'none'},
                    money_5: {path: 'images/money_5.png', category: 'coin', ability: 'none', value: 100},
                    ringo: {path: 'images/ringo.png', category: 'enemy', ability: 'none', value: 0},
                    goal: {path: 'images/flag.png', category: 'goal', ability: 'none'},
                    player: {path: 'images/hiphop.png', category: 'player', ability: 'none'} };

  var Red = { stage: 30,
              warp:  60,
              tag:   90,
              coin:  120,
              enemy: 150,
              goal:  180,
              player: 210 };
  var Blue = {none: 0,
              death: 0b00001,
              impact: 255,
              invisible: 0b0100 };

  var isRotate = { stage: true,
                   warp: false,
                   tag: false,
                   coin: true,
                   enemy: false,
                   goal: false,
                   player: false };
  var isScalable = { stage: true,
                     warp: false,
                     tag: false,
                     coin: false,
                     enemy: true,
                     goal: false,
                     player: false };

  class Object {
    constructor(originalObj, num) {
      this.category = originalObj.category;
      this.sCategory = '#' + originalObj.category;
      this._id = this.category + '_' + num;
      this._sId = '#' + this.category + '_' + num;
      this._num = num;
      // this.class = '';

      this.ability = originalObj.ability;
      //death impact invisible

      this.value = undefined;
      if (originalObj.value !== undefined)
        this.value = originalObj.value;
    }

    get id() {
      return this._id;
    }
    get sId() {
      return this._sId;
    }
    get num() {
      return this._num;
    }
    set num(value) {
      this._num = value;
      this._id = this.category + '_' + this._num;
      this._sId = '#' + this.category + '_' + this._num;
    }
  }

  var object = { stage: [],
                warp: [],
                tag: [],
                enemy: [],
                coin: [],
                goal: [],
                player: [] };

  /** function */

  class MyTouch {
    constructor() {
      // 接地中の指の情報を保持するためのもの (2本まで)
      this._touches = [
        { id: null, lastX: null, lastY: null }, // 指のID
        { id: null, lastX: null, lastY: null }
      ];

      this.lastDistance = null;
      this.currentDistance = null;
      this.lastAngle = null;
      this.angleBuf = null;

    }
    storeTouch(newTouch) {
      // 同じIDの指がすでに登録済みなら、何もせずに指番号を返却する (※ありえないと思うが念のため)
      for (var touchIndex = 0; touchIndex < this._touches.length; ++touchIndex) {
          if (this._touches[touchIndex].id === newTouch.identifier) {
              return touchIndex;
          }
      }
      // 同じIDの指が登録されていなければ登録し、指番号を返却する
      // すでに指がいっぱいならfalseを返却する
      for (var touchIndex = 0; touchIndex < this._touches.length; ++touchIndex) {
          if (this._touches[touchIndex].id === null) {
              this._touches[touchIndex].id = newTouch.identifier;
              return touchIndex;
          }
      }
      return false;
    }

    findTouch(id) {
      for (var touchIndex = 0; touchIndex < this._touches.length; ++touchIndex) {
          if (this._touches[touchIndex].id === id) {
              return touchIndex;
          }
      }
      return false;
    }

    removeTouch(id) {
      var touchIndex = this.findTouch(id);
      if (touchIndex !== false) {
          this._touches[touchIndex].id = null;
          this._touches[touchIndex].lastX = null;
          this._touches[touchIndex].lastY = null;
      }
    }

    getCoordsByTouch(touch) {
      //var bounds = touch.target.getBoundingClientRect();
      return {
          x: touch.clientX - document.getElementById('editorTouchZone').style.left,//touchはdisplay上だからdomオブジェクトの相対座標を計算する
          y: touch.clientY - document.getElementById('editorTouchZone').style.top
      };
    }

    drag(touchIndex, length, x, y) {
      // 指情報取得
      var touch = this._touches[touchIndex];

      // 最終位置が存在するとき
      if (touch.lastX !== null) {
      // ステッカーが選択されているとき
        if ( selectedObj !== null) {
          //lengthで割るのは2本以上の時に([0]+[1])/2 = [0]/2 + [1]/2
          $(selectedObj.sId).css('left', parseInt($(selectedObj.sId).css('left')) + (x-touch.lastX)/length + 'px');
          $(selectedObj.sId).css('top',  parseInt($(selectedObj.sId).css('top' )) + (y-touch.lastY)/length + 'px');
        }
        else { // 選択されていないとき scrollBoxを移動 innerCanvasをクリックしたときに selectedObj.sId = null;
          //lengthで割るのは2本以上の時に([0]+[1])/2 = [0]/2 + [1]/2
          $('#scrollBox').css('left', parseInt($('#scrollBox').css('left')) + (x-touch.lastX)/length + 'px');
        }
      }

      // 最終位置をとっておく
      touch.lastX = x;
      touch.lastY = y;

      // 緑枠
      $('#frame')
        .css('left', parseInt($(selectedObj.sId).css('left')) + 'px')
        .css('top', parseInt($(selectedObj.sId).css('top')) + 'px');
    }

    scale() {
      // 拡大できるかどうか
      if (isScalable[selectedCategory] === false) {
        return false;
      }
      var lastImageWidth, lastImageHeight;
      for (var i = 0; i < this._touches.length; ++i) {
        if (this._touches[i].id == null) {
          this.lastDistance = null;
          return false;
        }
      }
      //一個遅れてんじゃーん
      this.currentDistance = Math.sqrt((this._touches[0].lastX - this._touches[1].lastX)*(this._touches[0].lastX - this._touches[1].lastX)
      + (this._touches[0].lastY - this._touches[1].lastY)*(this._touches[0].lastY - this._touches[1].lastY));

      lastImageWidth = parseInt($(selectedObj.sId).css('width'));
      lastImageHeight = parseInt($(selectedObj.sId).css('height'));

      if (this.lastDistance !== null) {
        var magnification = this.currentDistance / this.lastDistance;
        //スケール変更
        $(selectedObj.sId).css('width', lastImageWidth*magnification + 'px');
        $(selectedObj.sId).css('height', lastImageHeight*magnification + 'px');
      }

      //位置調整
        $(selectedObj.sId).css('left', parseInt($(selectedObj.sId).css('left')) + (lastImageWidth - parseInt($(selectedObj.sId).css('width')) )/2 + 'px');
        $(selectedObj.sId).css('top', parseInt($(selectedObj.sId).css('top')) + (lastImageHeight - parseInt($(selectedObj.sId).css('height')) )/2 + 'px');

      // 緑枠
      $('#frame')
        .css('width', parseInt($(selectedObj.sId).css('width')) + 'px')
        .css('height', parseInt($(selectedObj.sId).css('height')) + 'px');

      this.lastDistance = this.currentDistance;
    }

    rotate() {
      // 回転できるかどうか
      if (isRotate[selectedCategory] === false) {
        return false;
      }
      // 2本の指じゃないとき
      for (var i = 0; i < this._touches.length; ++i) {
        if (this._touches[i].id == null) {
          this.lastAngle = null;
          this.angleBuf = null;
          return false;
        }
      }

      //scale()の次に置く
      var angle = (180/Math.PI) * Math.acos((this._touches[1].lastX - this._touches[0].lastX) / this.currentDistance);
      var sin = (180/Math.PI) * Math.acos((this._touches[1].lastY - this._touches[0].lastY) / this.currentDistance);
      if (sin < 90) {
        angle = 360 - angle;
      }
      if (this.lastAngle !== null) {
        // 0度と360度の境界は360引いて同じくらいにする
        if (angle - this.lastAngle < -270) {
          this.lastAngle -= 360;
        }
        if (angle - this.lastAngle > 270) {
          this.lastAngle += 360;
        }
        this.angleBuf += this.lastAngle - angle;//そもそも回転がyが下

        if (this.angleBuf >= 0) {
          // floorで1を超えた値だけ動かしてその値を引く
          $(selectedObj.sId).css('transform', 'rotate(' + (getRotationDegrees($(selectedObj.sId)) + Math.floor(this.angleBuf)) +'deg)');
          this.angleBuf -= Math.floor(this.angleBuf);
        } else {
          // 負数は逆方向だからceil
          $(selectedObj.sId).css('transform', 'rotate(' + (getRotationDegrees($(selectedObj.sId)) + Math.ceil(this.angleBuf)) +'deg)');
          this.angleBuf -= Math.ceil(this.angleBuf);// Math.ceil(this.angleBuf)は負
        }
      }

      // angleを保存
      this.lastAngle = angle;

      // 緑枠
      $('#frame')
        .css('transform', 'rotate(' + getRotationDegrees($(selectedObj.sId)) +'deg)');

    }
  }

  class Menu {
    static show(menuId) {//FIXME: category
      $(menuId).fadeIn(200);
      $(menuId).css('display', 'flex');
    }
    static close(menuId) {//FIXME: category
      if($(menuId).css('display') !== 'none') {
        $(menuId).fadeOut(200);
      }
    }
  }
  class MaterialMenu extends Menu{

    static select (imageKey) {
      this.addObject(imageKey);
      this.close('#materialMenu');
    }

    static addObject(imageKey) {
      var category = imageName[imageKey].category;
      var num = object[category].length;
      object[category].push(new Object(imageName[imageKey], num))
      // <div>要素を作成
      var div = document.createElement('div');
      // <div>要素のclassを設定
      div.setAttribute('class', 'image');
      div.id = object[category][num].id;
      // 動かせるようにする
      selectedObj = object[category][num];
      selectedCategory = category;

      // 初期位置サイズを設定
      div.setAttribute('style' , 'width:' + scrollBox.offsetHeight*playerScaleMag + 'px;'
                               + 'height:'+ scrollBox.offsetHeight*playerScaleMag + 'px;'
                               + 'left:'  + (container.offsetWidth/2 - scrollBox.offsetLeft - scrollBox.offsetHeight*playerScaleMag/2) + 'px;'
                               + 'top:'   + (scrollBox.offsetHeight/2                       - scrollBox.offsetHeight*playerScaleMag/2) + 'px;');

      // <img>要素の作成
      var img = document.createElement('img');
      img.src = imageName[imageKey].path;
      img.id = imageKey;

      //追加
      div.appendChild(img);
      document.getElementById(category).appendChild(div);

      // ごみ箱
      if ( selectedCategory !== 'player' && selectedCategory !== 'goal') {
        $('#trashButton').css('display', 'block');
      }
      else {
        $('#trashButton').css('display', 'none');
      }
      //緑枠
      $('#frame')
        .css('display', 'block')
        .css('left', parseInt($(selectedObj.sId).css('left')) + 'px')
        .css('top', parseInt($(selectedObj.sId).css('top')) + 'px')
        .css('width', parseInt($(selectedObj.sId).css('width')) + 'px')
        .css('height', parseInt($(selectedObj.sId).css('height')) + 'px')
        .css('transform', 'rotate(' + getRotationDegrees($(selectedObj.sId)) +'deg)');

        //追加したらイベントリスナ―発動
      div.addEventListener('click', function () {
        var tmp;//object[selectedCategory][0] みたいな [0]があやしかったから
        for( var o of object[div.id.split('_')[0]]) { //もう手っ取り早く分類を取得したいからsplit
          if (o.id === div.id) {
            tmp = o;
          }
        }
        selectedCategory = tmp.category;
        selectedObj = tmp;
        sortSticker(selectedCategory, selectedObj.num);

        // ごみ箱
        if ( selectedCategory !== 'player' && selectedCategory !== 'goal') {
          $('#trashButton').css('display', 'block');
        }
        else {
          $('#trashButton').css('display', 'none');
        }
        //緑枠
        $('#frame')
          .css('display', 'block')
          .css('left', parseInt($(selectedObj.sId).css('left')) + 'px')
          .css('top', parseInt($(selectedObj.sId).css('top')) + 'px')
          .css('width', parseInt($(selectedObj.sId).css('width')) + 'px')
          .css('height', parseInt($(selectedObj.sId).css('height')) + 'px')
          .css('transform', 'rotate(' + getRotationDegrees($(selectedObj.sId)) +'deg)');
      });
    }
  }

  function sortSticker(category, from, to) {
    var stickers = document.querySelectorAll('#' + category + ' .image');
    to = to || stickers.length - 1;

    var frag = document.createDocumentFragment();
    // 並び替え用
    var tmp = [];

    // 場合分け
    if (from < to) {
      for (var i = 0; i < stickers.length; ++i) {
        if (i < from || to < i) {
          frag.appendChild(stickers[i]);
          tmp.push(object[selectedCategory][i]);
        }
        if (from <= i && i < to) {
          frag.appendChild(stickers[i+1]);
          tmp.push(object[selectedCategory][i+1]);
        }
        if (i == to) {
          frag.appendChild(stickers[from]);
          tmp.push(object[selectedCategory][from]);
        }

        tmp[i].num = i;
        // idをiに変える (毎回取得して最後の要素に適用)
        frag.querySelectorAll('.image')[i].id = category + '_' + i;
      }
    }
    else if (to < from) {
      for (var i = 0; i < stickers.length; ++i) {
        if (i < to || from < i) {
          frag.appendChild(stickers[i]);
          object[selectedCategory][i].num = i;
        }
        if (i == to) {
          frag.appendChild(stickers[from]);
          object[selectedCategory][from].num = i;
        }
        if (to < i && i <= from) {
          frag.appendChild(stickers[i-1]);
          object[selectedCategory][i-1].num = i;
        }

        // idをiに変える
        frag.querySelectorAll('.image')[i].id = category + '_' + i;
      }
    } else {
      return false;
    }

    document.getElementById(selectedCategory).appendChild(frag);
    object[selectedCategory] = tmp; // 配列を書き換えるから配列内もソートされる
  }

  class GetTransform {

    static getTransform(obj) {
      var w = parseInt($(obj.sId + ' img').css('width'));
      var h = parseInt($(obj.sId + ' img').css('height')); // 正方形なら不要
      var ang = getRotationDegrees($(obj.sId));

      var containerW = parseInt($(obj.sId).css('width'));
      var containerH = parseInt($(obj.sId).css('height'))

      var x = parseInt($(obj.sId).css('left'))
            + (containerW/2 - Math.sqrt((containerW/2)**2+(containerH/2)**2) * Math.cos((45+ang)*(Math.PI/180)) );
      var y = parseInt($(obj.sId).css('top'))
            + (containerH/2 - Math.sqrt((containerW/2)**2+(containerH/2)**2) * Math.sin((45+ang)*(Math.PI/180)) );

      var result = {//FIXME:
        name: $(obj.sId+' img').attr('id'),
        x: x /innerCanvas.height,
        y: y /innerCanvas.height,
        width: w /innerCanvas.height,
        height: h /innerCanvas.height,
        angle: ang,
        color: {R: Red[obj.category],
                G: obj.num * 2,
                B: Blue[obj.ability]}
      };
      if (obj.value !== undefined) {
        result.value = obj.value;
      }
      return result;
    }
  }

  function getRotationDegrees(obj) {
    var matrix = obj.css("-webkit-transform") ||
    obj.css("-moz-transform")    ||
    obj.css("-ms-transform")     ||
    obj.css("-o-transform")      ||
    obj.css("transform");
    if(matrix !== 'none' && matrix !== undefined) {
        var values = matrix.split('(')[1].split(')')[0].split(',');
        var a = values[0];
        var b = values[1];
        var angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
    } else { var angle = 0; }
    return (angle < 0) ? angle + 360 : angle;
  }


  // Initialize
  function viewInit() {
    //outerCanvas
    canvas = document.getElementById('canvas');
    //innerCanvas
    innerCanvas = document.getElementById('innerCanvas');
    // $('#innerCanvas').css('background', '#ffffff');

    // in order to fit outerCanvas size
    container = document.getElementById('container');
    scrollBox = document.getElementById('scrollBox');
    sizing();// Start the first frame

    MaterialMenu.addObject('player');
    MaterialMenu.addObject('goal');
    selectedObj = null
    $('#frame').css('display', 'none');
  }

  function sizing() {
    // the height of header & footer
    var barHeight = container.offsetHeight * 0.10;
    var border = barHeight*0.03;
    var borderBottom = barHeight*0.06;
    var borderRadius = barHeight*0.08
    var innerBorder = barHeight*0.08;
    // outerCanvas
    canvas.height = container.offsetHeight;
    canvas.width  = container.offsetWidth;

    // in order to fit square to their own aspects
    {$('#scrollBox').css('height', (container.offsetWidth < container.offsetHeight - 2*barHeight) //reguler
                                 ? container.offsetWidth
                                 : container.offsetHeight - 2*barHeight
                                  + 'px');}
    {$('#scrollBox').css('width',  (container.offsetWidth < container.offsetHeight - 2*barHeight) //regular
                                 ? (container.offsetWidth) * 2 // 横に2倍
                                 : (container.offsetHeight - 2*barHeight) * 2 // 横に2倍
                                  + 'px');}

    // copy scrollBox size to that of innerCanvas
    innerCanvas.height = scrollBox.offsetHeight;
    innerCanvas.width  = scrollBox.offsetWidth;
    // setting location of scrollBox
    $('#scrollBox').css('top', (container.offsetHeight-scrollBox.offsetHeight)/2 + 'px');
    $('#scrollBox').css('left', '10%');

    // sizing header & footer
    $('#header').css('height',        barHeight                          + 'px');
    $('#header').css('font-size',     barHeight*0.45                     + 'px');
    $('#header').css('border-bottom', border +'px'     +' solid'   + color.font);
    // footer
    $('#footer').css('height',        barHeight                          + 'px');
    $('#footer').css('top',           container.offsetHeight - barHeight + 'px');
    $('#footer').css('border-top',    border +'px'     +' solid'   + color.font);

    // trashButton
    $('#trashButton')
      .css('width', barHeight*0.5 + 'px')
      .css('height', barHeight*0.5 + 'px')
      .css('left', (container.offsetWidth - barHeight*0.5)/2 + 'px')
      .css('top', barHeight*1.2 + 'px');

    // button flex
    $('.hfFlex').css('width', scrollBox.offsetHeight*0.95    + 'px');
    // circleButton
    $('.circleButton')
      .css('width' ,        barHeight*0.65                   + 'px')
      .css('height',        barHeight*0.65                   + 'px')
      .css('border-radius', barHeight*0.36                   + 'px') // 円
      .css('border',        border        +'px solid'  + color.font)
      .css('border-bottom', borderBottom  +'px solid'  + color.font);
    // squareButton
    $('.squareButton')
      .css('width' ,        scrollBox.offsetHeight*0.26      + 'px')
      .css('height',        barHeight*0.65                   + 'px')
      .css('border-radius', borderRadius                     + 'px')
      .css('border',        border        +'px solid'  + color.font)
      .css('border-bottom', borderBottom  +'px solid'  + color.font)
      .css('font-size',     barHeight*0.40                   + 'px');
    // trayBorder
    $('.trayBorder')
      .css('border-radius', borderRadius                     + 'px')
      .css('border',        border        +'px solid'  + color.font)
      .css('border-bottom', borderBottom  +'px solid'  + color.font);
    // traySheet
    $('.traySheet')
      .css('width' , scrollBox.offsetHeight*materialMenuMag  - innerBorder*2 + 'px')
      .css('height', scrollBox.offsetHeight*0.9              - innerBorder*2 + 'px');

    // sizing materialScroll heightが基準
    $('.materialPos')
      .css('left', (container.offsetWidth-scrollBox.offsetHeight*materialMenuMag)/2      + 'px')
      .css('top' , (container.offsetHeight-(scrollBox.offsetHeight*0.9+barHeight*0.5))/2 + 'px');
    $('.trayTitle')
      .css('height'   , barHeight*0.5                        + 'px')
      .css('font-size', barHeight*0.4                        + 'px');
    $('.materialTray')
      .css('width' , scrollBox.offsetHeight*materialMenuMag  + 'px')
      .css('height', scrollBox.offsetHeight*0.9              + 'px');
    $('.imageM').each(function(i, element) {
      $(element).css('width' , (scrollBox.offsetHeight*materialMenuMag  - innerBorder*2) * 0.9 * 0.29 + 'px');
      $(element).css('margin', (scrollBox.offsetHeight*materialMenuMag  - innerBorder*2 )* 0.9 * 0.02 + 'px');// 0.33
    });
    //material < >
    $('#toLeft, #toRight')
      .css('width' , scrollBox.offsetHeight*0.18             + 'px')
      .css('height', barHeight*2                             + 'px')
      .css('top', (container.offsetHeight+barHeight*0.5 - barHeight*2)/2  + 'px')
      .css('font-size', barHeight*0.4                        + 'px');
    $('#toLeft')
      .css('left', (container.offsetWidth-scrollBox.offsetHeight*materialMenuMag)/2 - scrollBox.offsetHeight*(1-materialMenuMag)/4 - scrollBox.offsetHeight*0.18/2 +'px');
    $('#toRight')
      .css('left', (container.offsetWidth+scrollBox.offsetHeight*materialMenuMag)/2 + scrollBox.offsetHeight*(1-materialMenuMag)/4 - scrollBox.offsetHeight*0.18/2 + 'px');
    // hatenaMenu
    $('#hatenaTray')
      .css('width' , scrollBox.offsetHeight*materialMenuMag  + 'px')
      .css('height', scrollBox.offsetHeight*0.9              + 'px');
    // displayMenu
    $('#displayTray')
      .css('width' , barHeight*1.67 + innerBorder*4          + 'px')
      .css('height', (barHeight*0.52)*5 + innerBorder*4      + 'px')
      .css('left'  , (container.offsetWidth - scrollBox.offsetHeight*0.95)/2 + 'px') // hfFlexといっしょ
      .css('bottom', barHeight*0.9                           + 'px');
    $('#displayTray .traySheet')
      .css('width' , barHeight*1.67 + innerBorder*2          + 'px')
      .css('height', (barHeight*0.52)*5 + innerBorder*2      + 'px');
    $('#checkWrapper')
      .css('width' , barHeight*1.67 + 'px')// 0.51*0.55*6.8 - 0.08*3
      .css('height', (barHeight*0.52)*5                      + 'px');

    $('.displayLabel')
      .css('height',    barHeight*0.52                       + 'px')
      .css('font-size', barHeight*0.45                       + 'px');
  }

  function deleteObj(obj) {
    object[obj.category].pop();
    $(obj.sId).remove();
    selectedObj = null;
    selectedCategory = null;
    $('#frame').css('display', 'none');
    $('#trashButton').css('display', 'none');
  }

  function playSwitch() {
    if ($('#editorTouchZone').css('display') != 'none') {
      var transformData = {};
      for (c of categoryName) {
        transformData[c] = [];
        for (o of object[c]) {
          transformData[c].push(GetTransform.getTransform(o));
        }
      }

      console.log(transformData);

      $('#playTouchZone').css('display', 'block');
      var playCanvas = document.getElementById('playCanvas');
      // setting location of scrollBox
      var canvasWraper = document.getElementById('canvasWraper');
      canvasWraper.offsetWidth = scrollBox.offsetWidth;
      canvasWraper.offsetHeight = scrollBox.offsetHeight;
      playCanvas.width = scrollBox.offsetWidth;
      playCanvas.height = scrollBox.offsetHeight;

      $('#canvasWraper').css('left', (container.offsetWidth-scrollBox.offsetHeight)/2 + 'px');// 正方形
      $('#canvasWraper').css('top', (container.offsetHeight-scrollBox.offsetHeight)/2 + 'px');

      $('#editorTouchZone').css('display', 'none');

      $('#playCanvas').css('background', '#ffffff');
      play(playCanvas, transformData, canvasWraper);
    }
    else
    {
      $('#playTouchZone').css('display', 'none');
      $('#editorTouchZone').css('display', 'block');

    }

  }

  /** event listener */

  window.addEventListener('load', function () {
    viewInit();
    eventInit();
    touchInit();
    buttonInit();
  });

  function eventInit() {
    // resize
    window.addEventListener('resize', function() {
      (!window.requestAnimationFrame) ? setTimeout(sizing, 300): this.window.requestAnimationFrame(sizing);
    });
  }

  // event listener
  function touchInit() {
    {/** no zoom*/
    //function no_scaling() {
    document.addEventListener("touchstart", mobile_no_scroll, { passive: false });
    document.addEventListener("touchmove", mobile_no_scroll, { passive: false });
    //}
    function mobile_no_scroll(event) {
        // ２本指での操作の場合
        if (event.touches.length >= 2) {
            // デフォルトの動作をさせない
            event.preventDefault();
        }
      }
    }


    var myTouch = new MyTouch();

    var touchZone = document.getElementById('editorTouchZone');

    // 指が置かれたとき...
    touchZone.addEventListener('touchstart', function(e) {
      myTouch.scale();
      myTouch.rotate();
      for (var i = 0; i < e.changedTouches.length; ++i) {
        // 置かれた指の情報を1本ずつ登録し、登録できればその位置を保存
        var touch = e.changedTouches[i];
        var touchIndex = myTouch.storeTouch(touch);
        if (touchIndex !== false) {
          var coords = myTouch.getCoordsByTouch(touch);//位置取得
          myTouch.drag(touchIndex, e.changedTouches.length, coords.x, coords.y);
        }
      }
    });

    // 指が動いたとき...
    touchZone.addEventListener('touchmove', function(e) {
      e.preventDefault(); // スクロール防止
      myTouch.scale();
      myTouch.rotate();
      for (var i = 0; i < e.changedTouches.length; ++i) {
        // 動いた指が登録済みならば、元の位置から新しい位置に向かって線を引く
        var touch = e.changedTouches[i];
        var touchIndex = myTouch.findTouch(touch.identifier);
        if (touchIndex !== false) {
          var coords = myTouch.getCoordsByTouch(touch);
          myTouch.drag(touchIndex, e.changedTouches.length, coords.x, coords.y);
        }
      }
    });

    // 指が離れたとき...
    touchZone.addEventListener('touchend', function(e) {
        for (var i = 0; i < e.changedTouches.length; ++i) {
            // 離れた指の情報を1本ずつ削除する
            var touch = e.changedTouches[i];
            myTouch.removeTouch(touch.identifier);
        }
    });

    document.getElementById('innerCanvas').addEventListener('click', function() {
      selectedObj = null;
      selectedCategory = null;
      $('#frame').css('display', 'none'); // 緑枠削除
      $('#trashButton').css('display', 'none'); // ごみ箱削除
    });
  };//初期化終わり

  function buttonInit() {// TODO:
    $('#trashButton').click(function () {
      deleteObj(selectedObj);
    });

    $('#plusButton').click(function () {
      MaterialMenu.show('#materialMenu');
    });
    $('.menuBackGround').click(function() {
      MaterialMenu.close('#materialMenu');
      Menu.close('#hatenaMenu');
      Menu.close('#displayMenu');
    });

    // imageMってのはメニューの中のimage
    $('.imageM').each(function (i, element) {
      $(element).click(function () {
        MaterialMenu.select($(element).attr('id'));
      });
    });

    $('#hatenaButton').click(function () {
      Menu.show('#hatenaMenu');
    });
    $('#displayButton').click(function() {
      Menu.show('#displayMenu');
    });

    document.getElementById('checkStart').addEventListener('change', function() {
      if (this.checked) {
        document.getElementById('player').style.display = 'block';
        document.getElementById('goal').style.display = 'block';
      }
      else {
        document.getElementById('player').style.display = 'none';
        document.getElementById('goal').style.display = 'none';
        selectedObj = null;
        selectedCategory = null;
        $('#frame').css('display', 'none'); // 緑枠削除
        $('#trashButton').css('display', 'none'); // ごみ箱削除
      }
    });
    document.getElementById('checkStage').addEventListener('change', function() {
      if (this.checked) {
        document.getElementById('stage').style.display = 'block';
      }
      else {
        document.getElementById('stage').style.display = 'none';
        selectedObj = null;
        selectedCategory = null;
        $('#frame').css('display', 'none'); // 緑枠削除
        $('#trashButton').css('display', 'none'); // ごみ箱削除
      }
    });
    document.getElementById('checkCoin').addEventListener('change', function() {
      if (this.checked) {
        document.getElementById('coin').style.display = 'block';
      }
      else {
        document.getElementById('coin').style.display = 'none';
        selectedObj = null;
        selectedCategory = null;
        $('#frame').css('display', 'none'); // 緑枠削除
        $('#trashButton').css('display', 'none'); // ごみ箱削除
      }
    });
    document.getElementById('checkEnemy').addEventListener('change', function() {
      if (this.checked) {
        document.getElementById('enemy').style.display = 'block';
      }
      else {
        document.getElementById('enemy').style.display = 'none';
        selectedObj = null;
        selectedCategory = null;
        $('#frame').css('display', 'none'); // 緑枠削除
        $('#trashButton').css('display', 'none'); // ごみ箱削除
      }
    });
    document.getElementById('checkSpecial').addEventListener('change', function() {
      if (this.checked) {
        document.getElementById('warp').style.display = 'block';
        document.getElementById('tag').style.display = 'block';
      }
      else {
        document.getElementById('warp').style.display = 'none';
        document.getElementById('tag').style.display = 'none';
        selectedObj = null;
        selectedCategory = null;
        $('#frame').css('display', 'none'); // 緑枠削除
        $('#trashButton').css('display', 'none'); // ごみ箱削除
      }
    });



    $('#toLeft').click(function () {
      $('#material_' + menuNum).css('display', 'none');
      menuNum = (--menuNum + 5) % 5;
      $('#material_' + menuNum).css('display', 'block');
    });
    $('#toRight').click(function () {
      $('#material_' + menuNum).css('display', 'none');
      menuNum = (++menuNum) % 5;
      $('#material_' + menuNum).css('display', 'block');
    });


    // データ
    document.getElementById('playButton').addEventListener('click', function() {
      playSwitch();
    });
  }





});
