// Minimal prototype game logic using Three.js
// Updated: add pre-game character select (placeholder) and ensure selected character name appears in HUD and attack messages

(function(){
  const container = document.getElementById('container');
  const startBtn = document.getElementById('start-btn');
  const startScreen = document.getElementById('start-screen');
  const hud = document.getElementById('hud');
  const messageEl = document.getElementById('message');
  const selectedNameEl = document.getElementById('selected-character-name');

  let scene, camera, renderer, clock;
  let player, enemy; // objects with position and simple methods
  let punchCooldown = 0;
  let selectedCharacterName = 'placeholder';
  const stage = {minX:-6, maxX:6};

  function showMessage(txt, ms=1500){
    messageEl.textContent = txt;
    if(ms>0){
      setTimeout(()=>{ if(messageEl.textContent===txt) messageEl.textContent=''; }, ms);
    }
  }

  function initThree(){
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 100);
    camera.position.set(0,3,8);
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    clock = new THREE.Clock();

    const hemi = new THREE.HemisphereLight(0xffffff,0x444444,1.0);
    hemi.position.set(0,20,0);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff,0.8);
    dir.position.set(5,10,7);
    scene.add(dir);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30,12),
      new THREE.MeshPhongMaterial({color:0x2d5f2e})
    );
    floor.rotation.x = -Math.PI/2;
    floor.position.y = 0;
    scene.add(floor);

    window.addEventListener('resize', ()=>{
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  function createSimplePlayer(){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8,1.8,0.6), new THREE.MeshStandardMaterial({color:0x1e90ff}));
    body.position.y = 0.9;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.25,1.2,0.25), new THREE.MeshStandardMaterial({color:0x8b5a2b}));
    arm.position.set(0.6,1.0,0);
    arm.name = 'arm';
    g.add(body);
    g.add(arm);
    g.position.set(-2,0,0);
    scene.add(g);
    return g;
  }

  function createSimpleEnemy(){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9,1.9,0.7), new THREE.MeshStandardMaterial({color:0xff5555}));
    body.position.y = 0.95;
    g.add(body);
    g.position.set(3,0,0);
    scene.add(g);
    return g;
  }

  function loadModelOrFallback(cb){
    const loader = new THREE.GLTFLoader();
    // try to load the filename the user mentioned (spaces preserved)
    const modelPath = 'assets/models/work work smash fuh character noob.glb';
    loader.load(modelPath, (gltf)=>{
      const gl = gltf.scene;
      gl.traverse(c=>{ if(c.isMesh) c.castShadow = true; });
      gl.scale.setScalar(1.0);
      gl.position.set(-2,0,0);
      scene.add(gl);
      player = gl;
      cb();
    }, undefined, (e)=>{
      console.warn('Model not found or failed to load, using simple boxes.', e);
      player = createSimplePlayer();
      enemy = createSimpleEnemy();
      cb();
    });
  }

  function startGame(){
    // read selected character from the radio inputs
    const sel = document.querySelector('input[name="character"]:checked');
    if(sel) selectedCharacterName = sel.value || 'placeholder';
    selectedNameEl.textContent = selectedCharacterName;

    startScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    initThree();
    loadModelOrFallback(()=>{
      if(!enemy) enemy = createSimpleEnemy();
      if(!player) player = createSimplePlayer();
      animate();
    });
  }

  // Basic enemy state machine
  const enemyState = {action:'idle', stateTimer:0};

  function pickEnemyActionInRange(){
    // block 5%, punch 30%, special 25%, leftover walk opposite (2s)
    const r = Math.random();
    if(r < 0.05) return 'block';
    if(r < 0.35) return 'punch';
    if(r < 0.60) return 'special';
    return 'walkBack';
  }

  function enforceStageLimit(x){
    return Math.max(stage.minX, Math.min(stage.maxX, x));
  }

  function animate(){
    const dt = Math.min(0.05, clock.getDelta());
    const pPos = player.position;
    const ePos = enemy.position;
    const dx = pPos.x - ePos.x;
    const dist = Math.abs(dx);

    if(enemyState.stateTimer>0){
      enemyState.stateTimer -= dt;
      if(enemyState.action === 'walkBack'){
        const dir = ePos.x < pPos.x ? -1 : 1; // move opposite
        ePos.x += dir * 2 * dt; // speed 2
        ePos.x = enforceStageLimit(ePos.x);
      }
      if(enemyState.stateTimer<=0) enemyState.action = 'idle';
    } else {
      if(dist > 1.8){
        const dir = dx>0 ? 1 : -1;
        ePos.x += dir * 1.2 * dt; // walk speed
        ePos.x = enforceStageLimit(ePos.x);
        enemyState.action = 'walk';
      } else {
        const act = pickEnemyActionInRange();
        enemyState.action = act;
        if(act === 'walkBack'){
          enemyState.stateTimer = 2.0;
        } else if(act === 'punch'){
          enemyState.stateTimer = 0.6;
          const sign = dx>0 ? 1 : -1;
          ePos.x += sign * 0.8;
          ePos.x = enforceStageLimit(ePos.x);
          showMessage('Enemy punched!', 900);
        } else if(act === 'special'){
          enemyState.stateTimer = 1.0;
          showMessage('Enemy used SPECIAL!', 1200);
        } else if(act === 'block'){
          enemyState.stateTimer = 0.6;
          showMessage('Enemy blocked!', 600);
        }
      }
    }

    if(punchCooldown>0) punchCooldown -= dt;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  function playerPunch(){
    if(punchCooldown>0) return;
    punchCooldown = 0.6;
    showMessage(selectedCharacterName + ' punched!');
    const origX = player.position.x;
    const forward = 0.8;
    const sign = 1; // players face +x in our layout
    const duration = 0.18;
    const start = performance.now();
    function step(){
      const t = (performance.now()-start)/1000;
      if(t < duration){
        const s = Math.sin((t/duration)*Math.PI); // smooth
        player.position.x = origX + sign*forward*s;
        requestAnimationFrame(step);
      } else {
        player.position.x = origX;
      }
    }
    step();

    const dist = Math.abs(player.position.x - enemy.position.x);
    const hitRange = 1.6;
    if(dist < hitRange){
      if(enemyState.action === 'block'){
        showMessage('Enemy blocked your punch!', 1200);
      } else if(enemyState.action === 'special'){
        showMessage('Enemy interrupted with special!', 1200);
      } else {
        showMessage('Hit!', 1000);
        const dir = enemy.position.x < player.position.x ? -1 : 1;
        enemy.position.x += dir * 0.6;
        enemy.position.x = enforceStageLimit(enemy.position.x);
      }
    } else {
      showMessage('Miss!', 600);
    }
  }

  // input handlers
  window.addEventListener('click', (e)=>{
    if(!startScreen.classList.contains('hidden')) return;
    playerPunch();
  });

  startBtn.addEventListener('click', ()=>{
    startGame();
  });

  showMessage('Ready — choose a character and click Start');
})();
