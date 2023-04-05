let scene, camera, renderer, model, controls, mixer;

let clock = new THREE.Clock();

const mixers = [];

const DRACO_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';

const MODEL_PATH =
  [ { fileName: 'cicadaNew4-v1.glb' }]; 

let loadedModels = [];

      init();

      function init() {
        
        const container = document.getElementById("mainScene");
        
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xdddddd);

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.001, 500);
        camera.position.set(0, 0, 120);
        camera.lookAt(0,0,0);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.PCFSoftShadowMap = true;
        container.appendChild(renderer.domElement);
        
        window.addEventListener( 'resize', onWindowResize );

        const pmremGenerator = new THREE.PMREMGenerator( renderer );
        pmremGenerator.compileEquirectangularShader();
        
        const nightTexture = new THREE.RGBELoader()
				.setPath('skyBox/') /* <<<--- Change this path to your file path */
				.load('moonless_golf_1k.hdr', function(texture){
					nightTexture.mapping = THREE.EquirectangularReflectionMapping;
				   envMap = pmremGenerator.fromEquirectangular(texture).texture;
				  scene.environment = envMap;
});

        const directionalLight = new THREE.DirectionalLight( 0xffffff, 2.5 ); 
        scene.add(directionalLight);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 50;
        controls.maxDistance = 250;
        controls.maxPolarAngle = Math.PI / 2;
        
loadModelFile = (fileName, path) => {
  return new Promise((resolve) => {
    let loader = new THREE.GLTFLoader();
    let dracoLoader = new THREE.DRACOLoader();

    dracoLoader.setDecoderPath(DRACO_PATH);
    dracoLoader.setDecoderConfig({ type: "js" });

    loader.setDRACOLoader(dracoLoader);

    loader.load(`${path}${fileName}`, (gltf) => {
      console.info("GLTF file load complete");
      
      const colors = [ 0xB87333, 0xC0C0C0, 0xFFD700, 0x43464B, 0x6699CC ]
      const models = [];

      model = gltf.scene;      

  	for (let i = 0; i < 5; i++) {
    const clone = THREE.SkeletonUtils.clone(model);
    const x = Math.random() * (window.innerWidth - 100) - (window.innerWidth / 2 - 50);
		const y = Math.random() * (window.innerHeight - 100) - (window.innerHeight / 2 - 50);
		const z = Math.random() * 125 - 50;

		const max_x = window.innerWidth / 2 - 50;
		const min_x = -max_x;
		const max_y = window.innerHeight / 2 - 50;
		const min_y = -max_y;

		if (x > max_x) {
		  x = max_x;
		} else if (x < min_x) {
		  x = min_x;
		}
		if (y > max_y) {
		  y = max_y;
		} else if (y < min_y) {
		  y = min_y;
		}

		const position = new THREE.Vector3(x, y, z);
    
    const cameraZ = camera.position.z;
  	const near = camera.near;
  	const far = camera.far;

  	if (z < cameraZ - far) {
  	  z = cameraZ - far + 10;
  	} else if (z > cameraZ - near) {
  	  z = cameraZ - near - 10;
  	}

		clone.position.set(x, y, z);
   	const scale = Math.random() * 0.025 + 0.025;
		clone.scale.set(scale, scale, scale);
    clone.rotation.y = Math.random() * Math.PI * 2;
    const randomRotationX = THREE.MathUtils.degToRad(Math.random() * 30 - 15);
    clone.rotation.x = randomRotationX;
    
 	 // Check if the clone overlaps with any existing models
  	 let overlap = true;
  	 while (overlap) {
    overlap = false;
    const overlapX = Math.random() * 150 - 50;
    const overlapY = Math.random() * 150 - 75;
    const overlapZ = Math.random() * 30 - 10;
    clone.position.set(overlapX, overlapY, overlapZ);
    for (let j = 0; j < models.length; j++) {
      const distance = clone.position.distanceTo(models[j].position);
      if (distance < (clone.scale.x + models[j].scale.x) * 0.25) {
        overlap = true;
        break;
      }
    }
  }
      
    clone.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.material = new THREE.MeshPhysicalMaterial({
          color: colors[i],
          metalness: 1.0,
          roughness: 0.2,
          transparent: true,
          opacity: 0.5,
          transmission: 0.1,
          thickness: 5,
          side: THREE.DoubleSide,
          envMap: envMap,
          envMapIntensity: 1,
          clearcoat: 1.0,
          clearcoatRoughness: 0.39,
          depthTest: true,
          depthWrite: true,
        });
      }
    });
    models.push(clone);
    scene.add(clone);
  }

for (let i = 0; i < models.length; i++) {
  const mixer = new THREE.AnimationMixer(models[i]);
  const clip = mixer.clipAction(gltf.animations[0]);
  

  if (i === 0) {
    clip.play();
  } else {
    clip.clampWhenFinished = true;
    clip.time = getClipStartTime(i);
    clip.play();
  }

  mixers.push(mixer);
}

function getClipStartTime(index) {
  switch(index) {
    case 1:
      return 0.3;
    case 2:
      return 0.5;
    case 3:
      return 0.15;
    case 4:
      return 0.75;
    default:
      return 0;
  }
}
      
      resolve({ fileName: fileName, gltf: gltf, models: models, mixers: mixers });
    });
  });
};

 load3DModels = (list, destination, path = "models/") => { /*  <<<--- Change this file path to your models current path */
    let promises = [];

    for (let j in list) {
      let mt = list[j];

      promises.push(this.loadModelFile(mt.fileName, path));
    }

    return Promise.all(promises).then((result) => {
		
      return new Promise((resolve) => {
        resolve(destination);
      });
    });
  };

  load3DModels(MODEL_PATH, loadedModels).then((gltf) => {
    animate();
  });
      }

function onWindowResize() {

				const width = window.innerWidth;
				const height = window.innerHeight;

				camera.aspect = width / height;
				camera.updateProjectionMatrix();

				renderer.setSize( width, height );

			}

      function animate() {
        requestAnimationFrame(animate);
        delta = clock.getDelta();
  			for ( const mixer of mixers ) mixer.update( delta ); 
        renderer.render(scene, camera);
        controls.update();
}

