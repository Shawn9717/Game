// 0 = nothing, 1 = wall, 2 = box, 3 = dropzone, 4 = player
var level = [
    [0,0,1,1,0,0,0,0,0,0],
    [0,0,1,3,0,0,1,0,0,0],
    [0,0,1,1,0,0,0,0,2,0],
    [0,0,0,2,3,1,1,0,0,0],
    [0,0,0,1,1,1,0,4,0,0],
    [0,1,0,1,1,0,0,0,0,0],
    [0,1,3,1,1,3,0,2,1,1],
    [0,1,0,0,0,0,0,0,1,0],
    [0,1,1,1,2,0,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0]
  ];
  
  (function() {
    var direction = {
      left: [-1,0],
      up: [0,-1],
      right: [1,0],
      down: [0,1]
    }
    
    function Player(x, y, el) {
      this.element = el;
      this.pos = { x: x, y: y},
      this.ready = true;
      this.rotation = 0;
      this.dir = 'down';
    }
    
    var pieces = ["", "wall", "box", "dropzone", "player"];
    
    var state = {
      level: null,
      dropzones: null,
      player: null,
      board: document.getElementById("board"),
      rotation: 0,
      quality: true
    }
    
    function renderLevel() {
      var frag = document.createDocumentFragment(),
          level = state.level,
          pieceType,
          playerMarkup = document.getElementById('player-markup').innerHTML,
          boxMarkup = document.getElementById('box-markup').innerHTML;
      
      state.dropzones = [];
      
      for (y = 0; y < level.length; y++) {
        for(x = 0; x < level[y].length; x++) {
          pieceType = level[y][x];
          if(pieceType) {
            var piece = document.createElement("div");
            piece.className = "piece " + pieces[pieceType];
            piece.setAttribute('style','left:' + x + "0%; top:" + y + "0%");
            
            if(pieceType !== 3) {
                piece.innerHTML = pieceType == 4 ? playerMarkup : boxMarkup;
            }
            
            if(pieceType === 1) {
              piece.className += getWallClass(x, y);
            } else if (pieceType === 4) {
              state.player = new Player(x, y, piece);
            } else if (pieceType === 2) {
              piece.setAttribute('id', 'box-' + x + '-' + y);
            } else if (pieceType === 3) {
              state.dropzones.push({ x: x, y: y });
            }
            
            frag.appendChild(piece);
          }
        }
      }
      
      state.board.appendChild(frag);
    }
    
    function init(level) {
      if(!useHighQuality()) {
        document.body.className = 'low-quality low-quality--forced';
      }
      
      state.level = JSON.parse(JSON.stringify(level)); 
      renderLevel();
  
      state.player.element.addEventListener("transitionend", function() {
        if(isLevelComplete()) {
          document.getElementById('success-message').classList.remove('hidden');
        } else {
          state.player.ready = true;
        }
      });
      window.addEventListener("keydown", keyDown, false);
    }
    
    function getWallClass(x, y) {
      var classString = ' ',
          leftPos = { x: (x - 1), y: y },
          rightPos = { x: (x + 1), y: y },
          upPos = { x: x, y: (y - 1) },
          downPos = { x: x, y: (y + 1) };
      
      if(getPieceFromPos(leftPos) === 1)
        classString += 'ls ';
      if(getPieceFromPos(rightPos) === 1)
        classString += 'rs ';
      if(getPieceFromPos(upPos) === 1)
        classString += 'us ';
      if(getPieceFromPos(downPos) === 1)
        classString += 'ds ';
      
      return classString.slice(0,-1);
    }
    
    function isLevelComplete() {
      var isComplete = true;
      
      for (i = 0; i <= state.dropzones.length; i++) {
        if(state.dropzones[i] && state.level[state.dropzones[i].y][state.dropzones[i].x] !== 2) {
          isComplete = false;
          break;
        }
      }
      
      return isComplete;
    }
    
    function useHighQuality() {
      // аІ _аІ 
      return (/Chrome/gi).test(navigator.userAgent);
    }
    
    function move(dir, dirName) {
      if(state.player.ready) {
        var oldPos = { x: state.player.pos.x, y: state.player.pos.y },
            pos = newPos(oldPos, dir),
            piece = getPieceFromPos(pos),
            canPush = (piece === 2 && canMoveFromPos(pos, dir));
      
        if(piece === 0 || piece === 3 || canPush) {
          state.player.pos = pos;
          setPieceOnPos(0, oldPos);
          setPieceOnPos(4, pos);
          
          
          state.player.element.setAttribute('style', getStyleForPos(pos) + getPlayerRotation(dirName));
          state.player.element.className = "piece player";
        
          if(canPush) {
            var newBoxPos = newPos(pos, dir),
                box = document.getElementById('box-' + pos.x + '-' + pos.y);
            box.setAttribute('id', 'box-' + newBoxPos.x + '-' + newBoxPos.y);
            box.setAttribute('style', getStyleForPos(newBoxPos));
            setPieceOnPos(2, newBoxPos);
          }
          
          state.player.ready = false;
        }
      }
    }
    
    function getPlayerRotation(dirName) {
      var rotation = state.player.rotation,
          rotArray;
      
      switch(state.player.dir) {
        case "up":
          rotArray = [0, 1, 2, -1];
        break;
        case "right":
          rotArray = [-1, 0, 1, 2];
        break;
        case "down":
          rotArray = [2, -1, 0, 1];
        break;
        case "left":
          rotArray = [1, 2, -1, 0];
        break;
      }
      
      switch(dirName) {
        case "up":
          rotation += rotArray[0];
          break;
        case "right":
          rotation += rotArray[1];
          break;
        case "down":
          rotation += rotArray[2];
          break;
        case "left":
          rotation += rotArray[3];
          break;
      }
      
      state.player.rotation = rotation;
      state.player.dir = dirName;
      
      return "transform: rotate(" + ((rotation * 90) - state.rotation) + "deg);";
    }
    
    function getStyleForPos(pos) {
      return ('left:' + pos.x + '0%; top:' + pos.y + '0%;');
    }
    
    function canMoveFromPos(oldPos, dir) {
      var pos = newPos(oldPos, dir),
          piece = getPieceFromPos(pos);
      
      return (piece === 0 || piece === 3);
    }
    
    function setPieceOnPos(piece, pos) {
      state.level[pos.y][pos.x] = piece;
    }
    
    function getPieceFromPos(pos) {
      if(pos.y >= 0 && pos.x >= 0 && pos.y < 10 && pos.x < 10)
        return state.level[pos.y][pos.x];
      
      return null;
    }
    
    function newPos(pos, dir) {
      if(pos) {
        var pos = Object.create(pos);
        pos.x += dir[0];
        pos.y += dir[1];
      }
      return pos;
    }
    
    function keyDown(e) {
      if(e.keyCode >= 37 && e.keyCode <= 40) {
        e.preventDefault();
        
        if(e.keyCode === 37) {
          move(direction.left, "left");
        } else if(e.keyCode === 38) {
          move(direction.up, "up");
        } else if(e.keyCode === 39) {
          move(direction.right, "right");
        } else if(e.keyCode === 40) {
          move(direction.down, "down");
        }
      }
    }
    
    function rotate(clockwise) {
      var directions = [];
      state.rotation += clockwise ? 90 : -90;
      
      state.board.setAttribute('style', 'transform: rotateX(40deg) rotate(' + (state.rotation + 45) + 'deg)');
      
      for(key in direction) {
        directions.push(direction[key]);
      }
      
      if(!clockwise)
        directions.push(directions.shift());
      else
        directions.unshift(directions.pop());
      
      direction.left = directions[0];
      direction.up = directions[1];
      direction.right = directions[2];
      direction.down = directions[3];
    }
    
    function restart() {
      state.board.innerHTML = "";
      document.getElementById('success-message').classList.add('hidden');
      init(level);
    }
    
    function toggleQuality() {
      state.quality = !state.quality;
      document.body.className = state.quality ? '' : 'low-quality';
    }
  
    window.sokoban = {
          init: init,
      rotate: rotate,
      restart: restart,
      toggleQuality: toggleQuality
      }
  })();
  
  sokoban.init(level);