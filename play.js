function play(canvas, stageDataArray, canvasWraper) {
  const magnification = canvasWraper.offsetHeight,//倍率
        canvasWidth = canvasWraper.offsetWidth,
        canvasHeight = canvasWraper.offsetHeight;
  var context;//camvas
  var tmpCanvas;//裏
  var tmpCtx;//裏キャンバス
  var offsetCanvasX = 0;//キャンバスを移動/プレイヤー追従
  var background = new Image();//背景

  const imagePath = { twitter: 'images/twitter.png',//画像のpath
                    waraiotoko: 'images/nc73730.png',
                    stick: 'images/stick.png',
                    mikan: 'images/mikan.png',
                    block1: 'images/block1.png',
                    block2: 'images/block2.png',
                    block2_impact: 'images/block_impact.png',

                    warp: 'images/warp.png',
                    tag1: 'images/tag1.png',

                    player: 'images/hiphop.png',
                    goal: 'images/flag.png',
                    ringo: 'images/ringo.png',
                    money_5: 'images/money_5.png'};
  const Red = { stage: 30, // 赤色でシルエットのカテゴリーを指定
                warp:  60,
                tag:   90,
                coin:  120,
                enemy: 150,
                goal:  180,
                player: 210 };
  const Blue = {none: 0, // 青で能力を指定
                death: 0b00001,
                impact: 255,
                invisible: 0b0100 };

// 各オブジェクトを入れる
  var player;
  var goal;
  var stage = [];
  var enemy = [];
  var coin = [];
  var tag = [];
  var warp = [];

  var pixelData = null; // 画面上の色を保持

  var pushingJumpBtn = 0; // タッチ操作で上を押し続けているかどうか
  var axisPos = {x: null, y: null}; // 回転中心


  var canContinue = true; // このplay関数自体をでるか

  var score = 0; //スコア

  function convert(len) {//1/1000単位の長さを実際の画面サイズに対応した長さに変換
    return len * magnification;
  }

  function getPointColor(x, y) {//指定したピクセルの色を取得して返却
    var i = 4*(Math.floor(y)*canvasWidth + Math.floor(x));//場所を指定
    return {r: pixelData.data[ i ],
            g: pixelData.data[i+1],
            b: pixelData.data[i+2],
            a: pixelData.data[i+3] };
  }

  /** TODO: CLASS */

  class ObjInfo { // 全てのオブジェクトの基本設定
    constructor(obj) { //reactioning color //
      this.image = new Image();
      // set path and load image
      this.path = imagePath[obj.name];
      this.image.src = this.path;

      // transform
      this.width = obj.width;
      this.height = obj.height;
      this.angle = obj.angle;
      this._x = obj.x//stageDataArray.player[0].x;
      this._y = obj.y;
      this._lastX = 0;
      this._lastY = 0;
      this.color = obj.color;

      // silhouette
      this.silhouetteImage = new Image();
      if (this.color.B === Blue['none']) {
        this.silhouetteImage.src = this.getSilhouetteURL(this.image, this.color);
      }
      else if (this.color.B === Blue['impact']) {
        this.silhouetteImage.src = this.getSilhouetteURL_impact(obj.name);
      }

      this.value;
      if (obj.value !== undefined) {
        this.value = obj.value;
      }
    }
    draw() {
      DrawObj.draw(this);
    }

    putSilhouette() {
      DrawObj.putSilhouette(this);
    }

    getSilhouetteURL(image, color) {
      tmpCtx.drawImage(image, 0, 0, magnification, magnification);
      var silhouetteImageData = tmpCtx.getImageData(0, 0, magnification, magnification), //シルエット用の画像DATAを確保
          silhouetteData = silhouetteImageData.data, //変更後のdataを保存する場所
          dataURL;
      tmpCtx.clearRect(0, 0, magnification, magnification);

      //シルエット用のdataを作成
      for(var i = 0; i < silhouetteData.length; i += 4){
        silhouetteData[  i  ] = color.R; //Rチャンネル
        silhouetteData[i + 1] = color.G; //Gチャンネル
        silhouetteData[i + 2] = color.B; //Bチャンネル
        //不透明度以外を一定の値に変更
        if(silhouetteData[i + 3] > 100) //不透明度が100以上の場合は不透明に
            silhouetteData[i + 3] = 255;
        else //不透明度が100未満の場合は透明に
            silhouetteData[i + 3] = 0;
      }

      silhouetteImageData.data.set(silhouetteData);
      tmpCtx.putImageData(silhouetteImageData, 0, 0);
      dataURL = tmpCanvas.toDataURL('image/png');
      tmpCtx.clearRect(0, 0, magnification, magnification);
      return dataURL;
    }

    getSilhouetteURL_impact(name) {
      var impactImage = new Image();
      impactImage.src = imagePath[name+ '_impact'];
      var noneShil = new Image(),
          impactShil = new Image();
      noneShil.src = this.getSilhouetteURL(this.image, {R:this.color.R, G:this.color.G, B: 0}),
      impactShil.src = this.getSilhouetteURL(impactImage, this.color);
      tmpCtx.drawImage(noneShil, 0, 0, magnification, magnification);
      tmpCtx.drawImage(impactShil, 0, 0, magnification, magnification);
      var dataURL = tmpCanvas.toDataURL('image/png');
      tmpCtx.clearRect(0, 0, magnification, magnification);
      return dataURL;
    }

    get x() {
      return this._x;
    }
    set x(value) {
      this._x =  value;
    }

    get lastX() {
      return this._lastX;
    }
    set lastX(value) {
      this._lastX = value;
    }

    get y() {
      return this._y;
    }
    set y(value) {
      this._y = value;
    }

    get lastY() {
      return this._lastY;
    }
    set lastY(value) {
      this._lastY = value;
    }
  }


  class PlayerCollision { // TODO:
    constructor(move) {
      this.move = move;
    }
    correctVertical(obj, toY) {
      var fromY = obj.y;
      var moveAmount = obj.x;
      var tmp = moveAmount;//ずれを更新するためのtmp

      // 落下の時
      if (fromY < toY) {
        for (var y = fromY; y <= toY; y += 1/1000) {
          /** 乗り越える高さ */
          // 右端(右から判定)
          for (var x = obj.x + obj.width; obj.x + obj.width*0.7 <= x; x -= 2/1000) {
            var pointColor = getPointColor(convert(x), convert(y+obj.height*0.7));
            var r = pointColor.r;
            var num = Math.floor(pointColor.g/2);
            // stageだったら
            switch (r) {
              case Red['stage']:
                this.move.impactFlagX = 0;
                if (pointColor.b === Blue['impact']) {
                  if (this.onCollisionImpact(num, 4) === true) {
                    obj.y = y;
                    return;
                  }
                }
                tmp = x - obj.width;
                break;
              case Red['coin']:
                this.onCollisionCoin(num);
                break;
            }
          }
          moveAmount = tmp < moveAmount ? tmp : moveAmount;

          /** 乗り越える高さ */
          // 左端(左から判定)
          for (var x = obj.x; x <= obj.x + obj.width*0.3; x += 2/1000) {
            var pointColor = getPointColor(convert(x), convert(y+obj.height*0.7));
            var r = pointColor.r;
            var num = Math.floor(pointColor.g/2);
            // stageだったら
            switch (r) {
              case Red['stage']:
                this.move.impactFlagX = 0;
                if (pointColor.b === Blue['impact']) {
                  if (this.onCollisionImpact(num, 8) === true) {
                    obj.y = y;
                    return;
                  }
                }
                tmp = x;
                break;
              case Red['coin']:
                this.onCollisionCoin(num);
                break;
            }
          }
          // 手抜き（左優先）
          moveAmount = moveAmount < tmp ? tmp : moveAmount;

          // x方向をしらみつぶしに衝突を調べる（底面）
          for (var x = obj.x + obj.width*0.3; x <= obj.x + obj.width*0.7; x += 4/1000) {
            var pointColor = getPointColor(convert(x), convert(y+obj.height));
            var r = pointColor.r;
            var num = Math.floor(pointColor.g/2);
            // stageだったら座標を代入してreturn;
            switch (r) {
              case Red['stage']:// FIXME:
                this.move.jumpFlag = 0;
                this.move.jumpDownFlag = 0;
                this.move.impactFlagY = 0;

                if (pointColor.b === Blue['impact']) {
                  this.onCollisionImpact(num, 6);
                }
                obj.y = y;
                obj.x = moveAmount;//ずらす
                return;
              case Red['warp']:
                this.move.jumpFlag = 0;
                this.move.jumpDownFlag = 0;
                obj.x = tag[0].x;
                obj.y = tag[0].y;
                return;
              case Red['coin']:
                this.onCollisionCoin(num);
                break;
              case Red['enemy']:
                canContinue = false;
                return;
              case Red['goal']:
                canContinue = false;
                return;
              default:
            }
          }
        }

      }
      // 上昇時
      else if (toY < fromY) {
        for (var y = fromY; y >= toY; y = y - 1/1000) {
          /** 乗り越える高さ */
          // 右端(右から判定)
          for (var x = obj.x + obj.width; obj.x + obj.width*0.7 <= x; x -= 2/1000) {
            var pointColor = getPointColor(convert(x), convert(y+obj.height*0.3));
            var r = pointColor.r;
            var num = Math.floor(pointColor.g/2);
            // stageだったら
            switch (r) {
              case Red['stage']:
                // this.move.impactFlagX = 0;
                if (pointColor.b === Blue['impact']) {
                  if (this.onCollisionImpact(num, 2) === true) {
                    obj.y = y;
                    return;
                  }
                }
                tmp = x - obj.width;
                break;
              case Red['coin']:
                this.onCollisionCoin(num);
                break;
            }
          }
          moveAmount = tmp < moveAmount ? tmp : moveAmount;

          /** 乗り越える高さ */
          // 左端(左から判定)
          for (var x = obj.x; x <= obj.x + obj.width*0.3; x += 2/1000) {
            var pointColor = getPointColor(convert(x), convert(y+obj.height*0.3));
            var r = pointColor.r;
            var num = Math.floor(pointColor.g/2);
            // stageだったら
            switch (r) {
              case Red['stage']:
                // this.move.impactFlagX = 0;
                if (pointColor.b === Blue['impact']) {
                  if (this.onCollisionImpact(num, 10) === true) {
                    obj.y = y;
                    return;
                  }
                }
                tmp = x;
                break;
              case Red['coin']:
                this.onCollisionCoin(num);
                break;
            }
          }
          // 手抜き（左優先）
          moveAmount = moveAmount < tmp ? tmp : moveAmount;


          // x方向
          for (var x = obj.x + obj.width*0.3; x <= obj.x + obj.width*0.7; x = x + 4/1000) {
            var pointColor = getPointColor(convert(x), convert(y-3/1000));
            var r = pointColor.r;
            var num = Math.floor(pointColor.g/2);

            switch (r) {
              case Red['stage']:// FIXME:
                this.move.jumpFlag = 0;
                this.move.jumpDownFlag = 0;
                this.move.impactFlagY = 0;
                if (pointColor.b === Blue['impact']) {
                  this.onCollisionImpact(num, 0);
                }
                obj.y = y;
                obj.x = moveAmount;//ずらす
                return;
              case Red['warp']:
                this.move.jumpFlag = 0;
                this.move.jumpDownFlag = 0;
                obj.x = tag[0].x;
                obj.y = tag[0].y;
                return;
              case Red['coin']:
                this.onCollisionCoin(num);
                break;
              case Red['enemy']:
                canContinue = false;
                return;
              case Red['goal']:
                canContinue = false;
                return;
              default:
                console.log('default');
            }
          }
        }
      }
      // ぶつからなかったとき
      obj.y = toY;
      obj.x = moveAmount;
    }

    correctHorizontal(obj, toX) {
      var fromX = obj.x;
      var moveAmount = obj.y;

      // 右に行くとき
      if ( fromX < toX ) {
        for (var x = fromX; x <= toX; x += 1/1000) {
          // 乗り越える高さ
          var tmp = moveAmount;
          // 下(下から判定)
          for (var y = obj.y + obj.height; obj.y + obj.height*0.7 <= y; y -= 2/1000) {
            var pointColor = getPointColor(convert(x+obj.width), convert(y));
            var r = pointColor.r;
            var num = Math.floor(pointColor.g/2);
            // stageだったら
            switch (r) {
              case Red['stage']:
                // this.move.impactFlagX = 0;
                if (pointColor.b === Blue['impact']) {
                  if (this.onCollisionImpact(num, 5) === true) {
                    obj.x = x;
                    return;
                  }
                }
                tmp = y - obj.height;
                break;
              case Red['coin']:
                this.onCollisionCoin(num);
                break;
            }
          }
          // 移動量更新
          moveAmount = tmp < moveAmount ? tmp : moveAmount;

          // y方向の衝突判定 右面
          for (var y = obj.y + obj.height*0.3; y <= obj.y + obj.height*0.7; y += 2/1000) {
            var pointColor = getPointColor(convert(x + obj.width), convert(y));
            var r = pointColor.r;
            var num = Math.floor(pointColor.g/2);

            // stageだったら座標を代入してreturn;
            switch (r) {
              case Red['stage']:// FIXME:
                this.move.impactFlagX = 0;
                if (pointColor.b === Blue['impact']) {
                  this.onCollisionImpact(num, 3);
                }
                obj.x = x;
                obj.y = moveAmount;
                return;
              case Red['warp']:
                this.move.jumpFlag = 0;
                this.move.jumpDownFlag = 0;
                obj.x = tag[0].x;
                obj.y = tag[0].y;
                return;
              case Red['coin']:
                this.onCollisionCoin(num);
                break;
              case Red['enemy']:
                canContinue = false;
                return;
              case Red['goal']:
                canContinue = false;
                return;
            }
          }
        }
      }
      // 左に行くとき
      if ( toX < fromX ) {
        for (var x = fromX; x >= toX; x -= 1/1000) {
          //乗り越える高さ
          var tmp = moveAmount;
          // 下(下から判定)
          for (var y = obj.y + obj.height; obj.y + obj.height*0.7 <= y; y -= 2/1000) {
            var pointColor = getPointColor(convert(x), convert(y));
            var r = pointColor.r;
            var num = Math.floor(pointColor.g/2);
            // stageだったら
            switch (r) {
              case Red['stage']:
                // this.move.impactFlagX = 0;
                if (pointColor.b === Blue['impact']) {
                  if (this.onCollisionImpact(num, 7) === true) {
                    obj.x = x;
                    return;
                  }
                }
                tmp = y - obj.height;
                break;
              case Red['coin']:
                this.onCollisionCoin(num);
                break;
            }
          }
          // 移動量更新
          moveAmount = tmp < moveAmount ? tmp : moveAmount;

          // y方向の衝突判定　左面
          for (var y = obj.y + obj.height*0.3; y <= obj.y + obj.height*0.7; y += 2/1000) {
            var pointColor = getPointColor(convert(x), convert(y));
            var r = pointColor.r;
            var num = Math.floor(pointColor.g/2);
            // stageだったら座標を代入してreturn;
            switch (r) {
              case Red['stage']:// FIXME:
                this.move.impactFlagX = 0;
                if (pointColor.b === Blue['impact']) {
                  this.onCollisionImpact(num, 9)
                }
                obj.x = x;
                obj.y = moveAmount;
                return;
              case Red['warp']:
                this.move.jumpFlag = 0;
                this.move.jumpDownFlag = 0;
                obj.x = tag[0].x;
                obj.y = tag[0].y;
                return;
              case Red['coin']:
                this.onCollisionCoin(num);
                break;
              case Red['enemy']:
                canContinue = false;
                return;
              case Red['goal']:
                canContinue = false;
                return;
            }
          }
        }
      }
      obj.x = toX;
      obj.y = moveAmount;
    }

    onCollisionImpact(num, direction) {// direction = 0, 1, ... , 11
      direction = (direction + 6)%12;
      try {
        var objAngle = stage[num].angle;
      }
      catch(e) {
        return false;
      }
      var min, max;
      if ((direction%3) === 0) {
        if (direction === 0) {
          min = direction*30 - 45 + 360;
          max = direction*30 + 45 + 360;
          if (0 <= objAngle && objAngle <= 45)
            objAngle += 360;
        }
        else {
          min = direction*30 - 45;
          max = direction*30 + 45;
        }
      }
      else {
        min = (direction - Math.floor(direction/3) - 1) * 45;
        max = (direction - Math.floor(direction/3)) * 45;
      }

      if (min <= objAngle && objAngle <= max) {
        this.move.impactFlag = 1;
        this.move.gi = this.move.gImpact(90 + (objAngle % 360), 240/1000);
        return true;
      }
      else {
        return false;
      }
    }
    onCollisionCoin(num) {
      try {
        for (o of coin) {if (o.color.G/2 === num) score += o.value;}
        // $(function() {$('p').text(score)});
        coin = coin.filter(o => {return o.color.G/2 !== num});// 非破壊的
      }
      catch (e) {
      }
    }
  }
  class EnemyCollision { // TODO:
    constructor(move) {
      this.move = move;
    }
    correctVertical(obj, toY) {
      var fromY = obj.y;
      var moveAmount = obj.x;
      var tmp = moveAmount;//更新するためのtmp

      // 落下の時
      if (fromY < toY) {
        for (var y = fromY; y <= toY; y += 1/1000) {
          /** 乗り越える高さ */
          // 右端(右から判定)
          for (var x = obj.x + obj.width; obj.x + obj.width*0.7 <= x; x -= 2/1000) {
            var pointColor = getPointColor(convert(x), convert(y+obj.height*0.7));
            var r = pointColor.r;
            var num = Math.floor(pointColor.g/2);
            // stageだったら
            if (r === Red['stage']) {
              if (pointColor.b === Blue['impact']) {
                if (this.onCollisionImpact(num, 4) === true) {
                  obj.y = y;
                  return;
                }
              }
              tmp = x - obj.width;
            }
            else if (r === Red['player']) {
              canContinue = false;
              return;
            }
          }
          moveAmount = tmp < moveAmount ? tmp : moveAmount;

          /** 乗り越える高さ */
          // 左端(左から判定)
          for (var x = obj.x; x <= obj.x + obj.width*0.3; x += 2/1000) {
            var pointColor = getPointColor(convert(x), convert(y+obj.height*0.7));
            var r = pointColor.r;
            var num = Math.floor(pointColor.g/2);
            // stageだったら
            if (r === Red['stage']) {
              if (pointColor.b === Blue['impact']) {
                if (this.onCollisionImpact(num, 8) === true) {
                  obj.y = y;
                  return;
                }
              }
              tmp = x;
            }
            else if (r === Red['player']) {
              canContinue = false;
              return;
            }
          }
          // 手抜き（左優先）
          moveAmount = moveAmount < tmp ? tmp : moveAmount;

          // x方向をしらみつぶしに衝突を調べる（底面）
          for (var x = obj.x + obj.width*0.3; x <= obj.x + obj.width*0.7; x += 4/1000) {
            var pointColor = getPointColor(convert(x), convert(y+obj.height));
            var r = pointColor.r;
            var num = Math.floor(pointColor.g/2);
            // stageだったら座標を代入してreturn;
            switch (r) {
              case Red['stage']:// FIXME:
                this.move.jumpFlag = 0;
                this.move.jumpDownFlag = 0;

                if (pointColor.b === Blue['impact']) {
                  this.onCollisionImpact(num, 6);
                }
                obj.y = y;
                obj.x = moveAmount;//ずらす
                return;
              case Red['warp']:
                this.move.jumpFlag = 0;
                this.move.jumpDownFlag = 0;
                obj.x = tag[0].x;
                obj.y = tag[0].y;
                return;
              case Red['player']:
                canContinue = false;
                return;
            }
          }
        }

      }
      // 上昇時
      else if (toY < fromY) {
        for (var y = fromY; y >= toY; y = y - 1/1000) {
          /** 乗り越える高さ */
          // 右端(右から判定)
          for (var x = obj.x + obj.width; obj.x + obj.width*0.7 <= x; x -= 2/1000) {
            var pointColor = getPointColor(convert(x), convert(y+obj.height*0.3));
            var r = pointColor.r;
            var num = Math.floor(pointColor.g/2);
            // stageだったら
            if (r === Red['stage']) {
              if (pointColor.b === Blue['impact']) {
                if (this.onCollisionImpact(num, 2) === true) {
                  obj.y = y;
                  return;
                }
              }
              tmp = x - obj.width;
            }
            else if (r === Red['player']) {
              canContinue = false;
              return;
            }
          }
          moveAmount = tmp < moveAmount ? tmp : moveAmount;

          /** 乗り越える高さ */
          // 左端(左から判定)
          for (var x = obj.x; x <= obj.x + obj.width*0.3; x += 2/1000) {
            var pointColor = getPointColor(convert(x), convert(y+obj.height*0.3));
            var r = pointColor.r;
            var num = Math.floor(pointColor.g/2);
            // stageだったら
            if (r === Red['stage']) {
              if (pointColor.b === Blue['impact'] ) {
                if (this.onCollisionImpact(num, 10) === true) {
                  obj.y = y;
                  return;
                }
              }
              tmp = x;
            }
            else if (r === Red['player']) {
              canContinue = false;
              return;
            }
          }
          // 手抜き（左優先）
          moveAmount = moveAmount < tmp ? tmp : moveAmount;


          // x方向
          for (var x = obj.x + obj.width*0.3; x <= obj.x + obj.width*0.7; x = x + 4/1000) {
            var pointColor = getPointColor(convert(x), convert(y-3/1000));
            var r = pointColor.r;
            var num = Math.floor(pointColor.g/2);

            switch (r) {
              case Red['stage']:// FIXME:
                this.move.jumpFlag = 0;
                this.move.jumpDownFlag = 0;
                if (pointColor.b === Blue['impact']) {
                  this.onCollisionImpact(num, 0);
                }
                obj.y = y;
                obj.x = moveAmount;//ずらす
                return;
              case Red['warp']:
                this.move.jumpFlag = 0;
                this.move.jumpDownFlag = 0;
                obj.x = tag[0].x;
                obj.y = tag[0].y;
                return;
              case Red['player']:
                canContinue = false;
                return;
            }
          }
        }
      }
      // ぶつからなかったとき
      obj.y = toY;
      obj.x = moveAmount;
    }

    correctHorizontal(obj, toX) {
      var fromX = obj.x;
      var moveAmount = obj.y;

      // 右に行くとき
      if ( fromX < toX ) {
        for (var x = fromX; x <= toX; x += 1/1000) {
          //乗り越える高さ
          var tmp = moveAmount;
          // 下(下から判定)
          for (var y = obj.y + obj.height; obj.y + obj.height*0.7 <= y; y -= 2/1000) {
            var pointColor = getPointColor(convert(x+obj.width), convert(y));
            var r = pointColor.r;
            var num = Math.floor(pointColor.g/2);
            // stageだったら
            if (r === Red['stage']) {
              if (pointColor.b === Blue['impact']) {
                if (this.onCollisionImpact(num, 5) === true) {
                  obj.x = x;
                  return;
                }
              }
              // 移動量をためる
              tmp = y - obj.height;
            }
            else if (r === Red['player']) {
              canContinue = false;
              return;
            }
          }
          // 落下防止
          for (var y = obj.y + obj.height; y <= obj.y + obj.height*1.4 + this.move.hAmount;  y += 2/1000) {
            var pointColor = getPointColor(convert(x+obj.width*0.7), convert(y));
            var r = pointColor.r;
            this.move.hMoveFlag = -1;
            if (r  === Red['stage']) {
              this.move.hMoveFlag = 1;
              break;
            }
          }
          // 移動量更新
          moveAmount = tmp < moveAmount ? tmp : moveAmount;

          // y方向の衝突判定 右面
          for (var y = obj.y + obj.height*0.3; y <= obj.y + obj.height*0.7; y += 2/1000) {
            var pointColor = getPointColor(convert(x + obj.width), convert(y));
            var r = pointColor.r;
            var num = Math.floor(pointColor.g/2);

            // stageだったら座標を代入してreturn;
            switch (r) {
              case Red['stage']:// FIXME:
                if (pointColor.b === Blue['impact']) {
                  this.onCollisionImpact(num, 3);
                }
                this.move.hMoveFlag = -1;
                obj.x = x;
                obj.y = moveAmount;
                return;
              case Red['warp']:
                this.move.jumpFlag = 0;
                this.move.jumpDownFlag = 0;
                obj.x = tag[0].x;
                obj.y = tag[0].y;
                return;
              case Red['player']:
                canContinue = false;
                return;
            }
          }
        }
      }
      // 左に行くとき
      if ( toX < fromX ) {
        for (var x = fromX; x >= toX; x -= 1/1000) {
          //乗り越える高さ
          var tmp = moveAmount;
          // 下(下から判定)
          for (var y = obj.y + obj.height; obj.y + obj.height*0.7 <= y; y -= 2/1000) {
            var pointColor = getPointColor(convert(x), convert(y));
            var r = pointColor.r;
            var num = Math.floor(pointColor.g/2);
            // stageだったら
            if (r === Red['stage']) {
              if (pointColor.b === Blue['impact']) {
                if (this.onCollisionImpact(num, 7) === true) {
                  obj.x = x;
                  return;
                }
              }
              // 移動量をためる
              tmp = y - obj.height;
            }
            else if (r === Red['player']) {
              canContinue = false;
              return;
            }
          }
          // 落下防止
          for (var y = obj.y + obj.height; y <= obj.y + obj.height*1.4 + this.move.hAmount;  y += 2/1000) {
            var pointColor = getPointColor(convert(x+obj.width*0.3), convert(y));
            var r = pointColor.r;
            this.move.hMoveFlag = 1;
            if (r  === Red['stage']) {
              this.move.hMoveFlag = -1;
              break;
            }
          }
          // 移動量更新
          moveAmount = tmp < moveAmount ? tmp : moveAmount;

          // y方向の衝突判定　左面
          for (var y = obj.y + obj.height*0.3; y <= obj.y + obj.height*0.7; y += 2/1000) {
            var pointColor = getPointColor(convert(x), convert(y));
            var r = pointColor.r;
            var num = Math.floor(pointColor.g/2);
            // stageだったら座標を代入してreturn;
            switch (r) {
              case Red['stage']:// FIXME:
                if (pointColor.b === Blue['impact']) {
                  this.onCollisionImpact(num, 9)
                }
                this.move.hMoveFlag = 1;
                obj.x = x;
                obj.y = moveAmount;
                return;
              case Red['warp']:
                this.move.jumpFlag = 0;
                this.move.jumpDownFlag = 0;
                obj.x = tag[0].x;
                obj.y = tag[0].y;
                return;
              case Red['player']:
                canContinue = false;
                return;
            }
          }
        }
      }
      obj.x = toX;
      obj.y = moveAmount;
    }

    onCollisionImpact(num, direction) {// direction = 0, 1, ... , 11
      direction = (direction + 6)%12;
      try {
        var objAngle = stage[num].angle;
      }
      catch(e) {
        return false;
      }
      var min, max;
      if ((direction%3) === 0) {
        if (direction === 0) {
          min = direction*30 - 45 + 360;
          max = direction*30 + 45 + 360;
          if (0 <= objAngle && objAngle <= 45)
            objAngle += 360;
        }
        else {
          min = direction*30 - 45;
          max = direction*30 + 45;
        }
      }
      else {
        min = (direction - Math.floor(direction/3) - 1) * 45;
        max = (direction - Math.floor(direction/3)) * 45;
      }

      if (min <= objAngle && objAngle <= max) {
        this.move.impactFlag = 1;
        this.move.gi = this.move.gImpact(90 + (objAngle % 360), 240/1000);
        return true;
      }
      else {
        return false;
      }
    }
  }

  class DrawObj {
    static draw(obj) {
      context.save();
      /** offsetCanvasX で 描画するときにずらす */
      context.translate(convert(obj.x), convert(obj.y));
      context.rotate(obj.angle * Math.PI / 180);
      context.drawImage(obj.image, 0, 0, convert(obj.width), convert(obj.height));
      context.restore();
    }

    static putSilhouette(obj) {
      //描画
      context.save();
      /** offsetCanvasX で 描画するときにずらす */
      context.translate(convert(obj.x), convert(obj.y));
      context.rotate(obj.angle * Math.PI / 180);
      context.drawImage(obj.silhouetteImage, 0, 0, convert(obj.width), convert(obj.height))
      context.restore();

    }
  }

  class Structure {
    static draw(dataArray) {
      for (var o of dataArray) {
        o.draw();
      }
    }
    static putSilhouette(dataArray) {
      for (var o of dataArray) {
        o.putSilhouette();
      }
    }
  }


  class Move {//TODO:
    constructor() {
      this.gravity = 7/1000;
      this.hAmount = 8/1000
      this.jumpDownFlag = 1;
      this.jumpFlag = 0;
      this.hMoveFlag = 0;
      this.g;
      this.gi;
      this.impactFlag = 0;
      this.impactFlagX = 0;
      this.impactFlagY = 0;
      this.impactNum = null;
    }

    * gGravity(initV) {
      var frame = 0;
      var prev = 0;
      var curr = 0;
      var sub = 0
      while(1) {
        // 落ち始め
        if (this.jumpFlag > 0 && this.jumpDownFlag == 0 && this.sub > 0) {
          this.jumpDownFlag = 1;
          this.jumpFlag = 0;
        }
        if (curr-prev<30/1000) {
          prev = curr;
          curr = initV*frame + this.gravity*frame**2 / 2;
          sub = curr - prev;
          yield sub;
        }
        else {
          yield sub;
        }
        frame += 1/4;
      }
    }

    * gImpact(angle, power) {
      this.impactFlagX = 1;
      this.impactFlagY = 1;
      angle = angle * Math.PI / 180;
      var decay = -60/1000;// jumpDownのgravityが7/1000だからそれ以上じゃないと負ける
      power = {x:-1*power*Math.cos(angle), y:-1*power*Math.sin(angle)}; // 座標の上下反転 *-1
      decay = {x:-1*decay*Math.cos(angle)/2, y:-1*decay*Math.sin(angle)};
      var frame = 1/8;
      var prev = {x:0, y:0},
          curr = {x:0, y:0},
          sub = {x:0, y:0};

      while(1) {
        if ((power.y >= 0 && sub.y >= 0 || power.y <= 0 && sub.y <= 0) && this.impactFlagY === 1) { // 符号が同じとき
          prev.y = curr.y;
          curr.y = power.y*frame + decay.y*frame**2 / 2;
          sub.y = curr.y - prev.y;
          yield sub.y;
        }
        else {
          yield 0;
        }
        if ((power.x >= 0 && sub.x >= 0 || power.x <= 0 && sub.x <= 0) && this.impactFlagX === 1) { // 符号が同じとき
          prev.x = curr.x;
          curr.x = power.x*frame + decay.x*frame**2 / 2;
          sub.x = curr.x - prev.x;
          yield sub.x;
        }
        else {
          this.impactFlag = 0;
          this.impactNum = 0;
          yield 0;
        }
        frame += 1/8;
      }
    }

    right() {
      return this.hAmount;
    }

    left() {
      return -this.hAmount;
    }
  }

  class PlayerObj extends ObjInfo {
    constructor(obj) {
      super(obj);
      this.move = new Move();
      this.collision = new PlayerCollision(this.move);

    }
    update() {
      var toX = this.x,
          toY = this.y;
      // いつでも落ちるように
      if (this.move.jumpFlag === 0 && this.move.jumpDownFlag === 0) {
        this.move.jumpDownFlag = 1;
      }
      if (this.move.jumpFlag == 1 && this.move.jumpDownFlag == 0) {
        this.move.gravity = 5/1000;
        this.move.g = this.move.gGravity(-50/1000);
        this.move.jumpFlag++;
      }
      if (this.move.jumpDownFlag == 1) {
        this.move.gravity = 7/1000;
        this.move.g = this.move.gGravity(0);
        this.move.jumpDownFlag++;
      }
      if (this.move.jumpFlag > 0 || this.move.jumpDownFlag > 0) {
        toY += this.move.g.next().value;// 足す
      }

      if (this.move.hMoveFlag !== 0) {
        toX += (this.move.hMoveFlag > 0 ? this.move.right() : this.move.left());// 足す
      }


      if (this.move.impactFlag !== 0) {
        toY += this.move.gi.next().value;
        toX += this.move.gi.next().value;
      }


      // 座標を正す
      this.collision.correctHorizontal(this, toX);
      this.collision.correctVertical(this, toY);

      setOffset(this);
      // ここまでで座標は更新された
      [this.lastX, this.lastY] = [this.x, this.y];
    }
  }

  class EnemyObj extends ObjInfo {
    constructor(obj) {
      super(obj);
      this.move = new Move();
      this.collision = new EnemyCollision(this.move);
    }

    update() {
      var toX = this.x,
          toY = this.y;
      // いつでも落ちるように
      if (this.move.jumpFlag === 0 && this.move.jumpDownFlag === 0) {
        this.move.jumpDownFlag = 1;
        this.move.hMoveFlag = this.move.hMoveFlag || -1; // 最初だけ
      }
      if (this.move.jumpFlag == 1 && this.move.jumpDownFlag == 0) {
        this.move.gravity = 5/1000;
        this.move.g = this.move.gGravity(-50/1000);
        this.move.jumpFlag++;
      }
      if (this.move.jumpDownFlag == 1) {
        this.move.gravity = 7/1000;
        this.move.g = this.move.gGravity(0);
        this.move.jumpDownFlag++;
      }
      if (this.move.jumpFlag > 0 || this.move.jumpDownFlag > 0) {
        toY += this.move.g.next().value;// 足す
      }

      if (this.move.hMoveFlag !== 0) {
        toX += (this.move.hMoveFlag > 0 ? this.move.right() : this.move.left());// 足す
      }


      if (this.move.impactFlag !== 0) {
        toY += this.move.gi.next().value;
        toX += this.move.gi.next().value;
      }


      // 座標を正す
      this.collision.correctHorizontal(this, toX);
      this.collision.correctVertical(this, toY);

      // ここまでで座標は更新された
      [this.lastX, this.lastY] = [this.x, this.y];
    }
  }


  class MyTouch {
    constructor() {
      // 接地中の指の情報を保持するためのもの
      this._touches = [
        { id: null, lastX: null, lastY: null }, // 指のID
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
          x: touch.clientX - document.getElementById('playPanel').style.left,//touchはdisplay上だからdomオブジェクトの相対座標を計算する
          y: touch.clientY - document.getElementById('playPanel').style.top
      };
    }
  }

  // objに追従
  function setOffset(obj) {
    const rightBorder = 570/1000 - obj.width/2,
           leftBorder = 430/1000 - obj.width/2;
    // 現在の offset を追加した x が画面上の限界より右 かつ lastX が境界よりも左(右に進んでいる)
    if (offsetCanvasX + obj.lastX <= rightBorder && rightBorder < offsetCanvasX + obj.x) {
      //限界
      if ( -(1.0*2 - 1.0) <= rightBorder - obj.x) {
        offsetCanvasX = rightBorder - obj.x;
      }
      // 一発目で限界を超えたときにoffsetに何も入ってないから入れる。
      else {
        offsetCanvasX = -(1.0*2 - 1.0);
      }

    }
    // 左に進むとき
    if (offsetCanvasX + obj.x < leftBorder && leftBorder <= offsetCanvasX + obj.lastX) {
      if ( leftBorder - obj.x <= 0) {
        offsetCanvasX = leftBorder - obj.x;
      }
      else {
        offsetCanvasX = 0;
      }
    }
  }

  class Effect {
    static gameover() {
      context.fillStyle = "rgba(100, 0, 0, 0.4)";
      context.fillRect(0, 0, canvasWidth, canvasHeight);
    }
  }


  /** TODO: MAIN PROCESS */

  (function init () {
    context = canvas.getContext('2d');
    tmpCanvas = document.getElementById('tmpCanvas');
    tmpCanvas.width = magnification;
    tmpCanvas.height = magnification;
    tmpCtx = tmpCanvas.getContext('2d');

    background.src = 'images/background1.png';

    player = new PlayerObj(stageDataArray.player[0]);
    goal = new ObjInfo(stageDataArray.goal[0]);
    for ( var o of stageDataArray.stage) {
      stage.push(new ObjInfo(o));
    }
    for ( var o of stageDataArray.warp) {
      warp.push(new ObjInfo(o));
    }
    for ( var o of stageDataArray.tag) {
      tag.push(new ObjInfo(o));
    }
    for ( var o of stageDataArray.coin) {
      coin.push(new ObjInfo(o));
    }
    for ( var o of stageDataArray.enemy) {
      enemy.push(new EnemyObj(o));
    }

    // Start the first frame request
    window.requestAnimationFrame(gameLoop);

  })();

  /** TODO: UPDATE */
  function playerUpdate() {

  }

  function enemyUpdate() {

  }

  /** TODO: GAME LOOP */
  function gameLoop(timeStamp) {
    canvasWraper.style.left = convert(offsetCanvasX) + 'px';

    context.clearRect(0, 0, canvasWidth, canvasHeight);
    /** silhouette */
    Structure.putSilhouette(stage);
    Structure.putSilhouette(warp);
    Structure.putSilhouette(coin);
    Structure.putSilhouette(enemy);
    goal.putSilhouette();
    player.putSilhouette();
    /** Update */
    pixelData = context.getImageData(0, 0, canvasWidth, canvasHeight);
    for ( var o of enemy) {
      o.update();
    }
    pixelData = context.getImageData(0, 0, canvasWidth, canvasHeight);

    player.update();

    context.drawImage(background,0, 0, canvasWidth, canvasHeight);
    draw();
    // Keep requesting new frames
    if(canContinue == true)
      window.requestAnimationFrame(gameLoop);
  }

  /** TODO: DRAW */
  function draw() {
    Structure.draw(stage);
    Structure.draw(warp);
    Structure.draw(coin);
    Structure.draw(enemy);
    player.draw();
    goal.draw();

    if(convert(player.y) > canvasHeight) {
      Effect.gameover();
      canContinue = false;
    }
  }

  /** TODO: EVENT LISTENER */

  controllerInit();

  function controllerInit() {
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
    var playTouchZone = document.getElementById('playTouchZone');

    playTouchZone.addEventListener('touchstart', function(e) {
      for (var i = 0; i < e.changedTouches.length; ++i) {
        // 置かれた指の情報を1本ずつ登録し、登録できればその位置を保存
        var touch = e.changedTouches[i];
        var touchIndex = myTouch.storeTouch(touch);
        if (touchIndex !== false) {
          var coords = myTouch.getCoordsByTouch(touch);//位置取得
          axisPos = coords;
          myTouch.lastX = coords.x;
        }
      }
    });
    playTouchZone.addEventListener('touchmove', function(e) {
      e.preventDefault(); // スクロール防止
      for (var i = 0; i < e.changedTouches.length; ++i) {
        // 動いた指が登録済みならば if
        var touch = e.changedTouches[i];
        var touchIndex = myTouch.findTouch(touch.identifier);
        if (touchIndex !== false) {
          var coords = myTouch.getCoordsByTouch(touch);

          // vertical (jump)
          if ( -(coords.y- axisPos.y) > convert(70/1000)) {
            if (player.move.jumpFlag === 0 && player.move.jumpDownFlag === 0 && pushingJumpBtn === 0) {
              player.move.jumpFlag = 1;
              pushingJumpBtn = 1;
            }
            if (pushingJumpBtn === 1) {
              axisPos.y = coords.y + convert(70/1000);
            }
          }
          else {
            pushingJumpBtn = 0;
            if ( -(axisPos.y-coords.y) > convert(40/1000) ) {
              axisPos.y = coords.y - convert(40/1000);
            }
            if (player.move.jumpFlag > 0) {
              player.move.jumpFlag = 0;
              player.move.jumpDownFlag = 1;
            }
          }

          // horizontal (move)
          // Right
          if ((coords.x - axisPos.x) > convert(50/1000)) {
            player.move.hMoveFlag = 1;
            axisPos.x = coords.x - convert(50/1000);
          }
          else if ((axisPos.x - coords.x) > convert(50/1000)) {
            player.move.hMoveFlag = -1;
            axisPos.x = coords.x + convert(50/1000);
          }
          else {
            player.move.hMoveFlag = 0;
          }

          myTouch.lastX = coords.x;


        }
      }
    })

    playTouchZone.addEventListener('touchend', function(e) {
      for (var i = 0; i < e.changedTouches.length; ++i) {
          // 離れた指の情報を1本ずつ削除する
          var touch = e.changedTouches[i];
          myTouch.removeTouch(touch.identifier);
      }
      if (player.move.jumpFlag > 0) {
        player.move.jumpFlag = 0;
        player.move.jumpDownFlag = 1;
      }
      pushingJumpBtn = 0;

      player.move.hMoveFlag = 0;
    })
  }


}